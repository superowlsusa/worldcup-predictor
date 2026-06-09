'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { Fixture, Prediction } from '@/lib/types';
import { ensureProfile } from '@/lib/ensure-profile';
import { useT, translateStage, translateTeam, localeFor, type Lang } from '@/lib/i18n';
import Flag from '@/components/Flag';

function prettyDate(utc: string, lang: Lang) {
  // Always show kickoff in US Eastern time (auto-adjusts for daylight saving),
  // labelled ET, so every player sees the same time regardless of their location.
  const s = new Intl.DateTimeFormat(localeFor(lang), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(utc));
  return `${s} ET`;
}

// Human-friendly time remaining until the prediction lock (1h before kick-off).
function formatCountdown(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${mins}m`;
  if (mins >= 1) return `${mins}m`;
  return '<1m';
}

export default function FixtureList() {
  const supabase = createBrowserSupabase();
  const { t, lang } = useT();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('All');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    load();
  }, []);

  // Tick every 30s so the "Locks in …" countdowns stay current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Each stage locks 1 hour before the kickoff of its FIRST match — so every
  // match in a stage shares one deadline (and one countdown).
  const stageLockMs = useMemo(() => {
    const first: Record<string, number> = {};
    for (const f of fixtures) {
      const k = new Date(f.kickoff_utc).getTime();
      if (first[f.stage] === undefined || k < first[f.stage]) first[f.stage] = k;
    }
    const lock: Record<string, number> = {};
    for (const s in first) lock[s] = first[s] - 60 * 60 * 1000;
    return lock;
  }, [fixtures]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);
    if (uid) await ensureProfile(supabase);

    const { data: fixtureRows, error: fixtureError } = await supabase
      .from('fixtures')
      .select('*')
      .order('match_no', { ascending: true });
    if (fixtureError) setMessage(fixtureError.message);
    setFixtures((fixtureRows ?? []) as Fixture[]);

    if (uid) {
      const { data: predictionRows } = await supabase.from('predictions').select('*').eq('user_id', uid);
      const map: Record<string, Prediction> = {};
      (predictionRows ?? []).forEach((p: any) => (map[p.fixture_id] = p));
      setPredictions(map);
    }
  }

  async function savePrediction(fixture: Fixture, home: number, away: number) {
    if (!userId) {
      setMessage(t('fx.signInToSaveMsg'));
      window.location.href = '/signin?join=1';
      return;
    }
    if (Date.now() >= (stageLockMs[fixture.stage] ?? Infinity)) {
      setMessage(t('fx.lockedMsg'));
      return;
    }
    const { error } = await supabase.from('predictions').upsert({
      fixture_id: fixture.id,
      user_id: userId,
      predicted_home_score: home,
      predicted_away_score: away,
    }, { onConflict: 'fixture_id,user_id' });
    if (error) setMessage(error.message);
    else {
      setMessage(`${t('fx.saved')}: ${translateTeam(fixture.home_team, lang)} ${home}-${away} ${translateTeam(fixture.away_team, lang)}`);
      await load();
    }
  }

  const stages = useMemo(() => ['All', ...Array.from(new Set(fixtures.map(f => f.stage)))], [fixtures]);
  const visibleFixtures = filter === 'All' ? fixtures : fixtures.filter(f => f.stage === filter);

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {stages.map(stage => (
          <button key={stage} className={filter === stage ? 'btn' : 'btn secondary'} onClick={() => setFilter(stage)}>
            {stage === 'All' ? t('fx.all') : translateStage(stage, lang)}
          </button>
        ))}
      </div>
      {!userId && (
        <div className="notice">
          {t('fx.guestPrefix')} <a href="/signin?join=1" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('fx.guestLink')}</a> {t('fx.guestSuffix')}
        </div>
      )}
      {message && <div className="notice">{message}</div>}
      {visibleFixtures.map(fixture => (
        <PredictionCard
          key={fixture.id}
          fixture={fixture}
          prediction={predictions[fixture.id]}
          lockAt={stageLockMs[fixture.stage] ?? new Date(fixture.kickoff_utc).getTime() - 60 * 60 * 1000}
          signedIn={!!userId}
          now={now}
          myId={userId}
          onSave={savePrediction}
        />
      ))}
    </div>
  );
}

function PredictionCard({ fixture, prediction, lockAt, signedIn, now, myId, onSave }: {
  fixture: Fixture;
  prediction?: Prediction;
  lockAt: number;
  signedIn: boolean;
  now: number;
  myId: string | null;
  onSave: (fixture: Fixture, home: number, away: number) => void;
}) {
  const { t, lang } = useT();
  const supabase = createBrowserSupabase();
  const kickedOff = now >= new Date(fixture.kickoff_utc).getTime();
  const [picksOpen, setPicksOpen] = useState(false);
  const [picks, setPicks] = useState<any[] | null>(null);
  const [picksLoading, setPicksLoading] = useState(false);

  async function togglePicks() {
    const next = !picksOpen;
    setPicksOpen(next);
    if (next) {
      setPicksLoading(true);
      const { data } = await supabase.from('revealed_predictions').select('*').eq('fixture_id', fixture.id);
      const sorted = (data ?? []).slice().sort((a: any, b: any) => b.points - a.points || a.display_name.localeCompare(b.display_name));
      setPicks(sorted);
      setPicksLoading(false);
    }
  }
  const [home, setHome] = useState(prediction?.predicted_home_score ?? 0);
  const [away, setAway] = useState(prediction?.predicted_away_score ?? 0);

  useEffect(() => {
    setHome(prediction?.predicted_home_score ?? 0);
    setAway(prediction?.predicted_away_score ?? 0);
  }, [prediction?.predicted_home_score, prediction?.predicted_away_score]);

  const msToLock = lockAt - now;
  const locked = msToLock <= 0;
  const actual = fixture.status === 'final' ? `${fixture.home_score}-${fixture.away_score}` : null;
  const homeName = translateTeam(fixture.home_team, lang);
  const awayName = translateTeam(fixture.away_team, lang);

  // "Dirty" = the boxes differ from the saved pick, so the button invites an update.
  const isDirty = !!prediction && (home !== prediction.predicted_home_score || away !== prediction.predicted_away_score);
  const btnClass = !signedIn ? 'secondary' : (!prediction || isDirty) ? 'save' : 'saved';
  const btnLabel = !signedIn ? t('fx.btnSignInToSave') : !prediction ? t('fx.btnSave') : isDirty ? t('fx.btnUpdate') : t('fx.btnSaved');

  return (
    <div className="card fixture">
      <div className="fixture-head">
        <span>{t('fx.match')} {fixture.match_no} · {translateStage(fixture.stage, lang)}{fixture.group_name ? ` · ${t('fx.group')} ${fixture.group_name}` : ''}</span>
        <span>{prettyDate(fixture.kickoff_utc, lang)}</span>
      </div>
      <div className="teams">
        <div className="team">
          <span className="team-name">{homeName}</span>
          <Flag team={fixture.home_team} />
          <input className="input score-input" type="number" min="0" inputMode="numeric" value={home} onFocus={e => e.target.select()} onChange={e => setHome(Math.max(0, Number(e.target.value) || 0))} disabled={locked} aria-label={`${homeName} score`} />
        </div>
        <div className="vs">vs</div>
        <div className="team team-away">
          <span className="team-name">{awayName}</span>
          <Flag team={fixture.away_team} />
          <input className="input score-input" type="number" min="0" inputMode="numeric" value={away} onFocus={e => e.target.select()} onChange={e => setAway(Math.max(0, Number(e.target.value) || 0))} disabled={locked} aria-label={`${awayName} score`} />
        </div>
      </div>
      <div className="save-row">
        <button className={`btn ${btnClass}`} onClick={() => onSave(fixture, home, away)} disabled={locked}>
          {btnLabel}
        </button>
      </div>
      {signedIn && !locked && fixture.status !== 'final' && (
        <p style={{ textAlign: 'center', fontSize: 12.5, margin: 0 }}>{t('fx.changeHint')}</p>
      )}
      <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {prediction && <span className="pill">{t('fx.yourPick')}: {prediction.predicted_home_score}-{prediction.predicted_away_score}</span>}
        {actual && <span className="pill pill-good">{t('fx.final')}: {actual}</span>}
        {fixture.status === 'final' && prediction && <span className={`pill ${prediction.points > 0 ? 'pill-good' : ''}`}>{t('fx.points')}: {prediction.points}</span>}
        {!locked && fixture.status !== 'final' && <span className="pill">⏳ {t('fx.locksIn')} {formatCountdown(msToLock)}</span>}
        {locked && fixture.status !== 'final' && <span className="pill pill-warn">🔒 {t('fx.locked')}</span>}
      </div>
      <p>{fixture.venue_city}, {translateTeam(fixture.venue_country ?? '', lang)}. {t('fx.lockNote')}</p>
      {kickedOff && (
        <div className="stack" style={{ gap: 8 }}>
          <button className="btn secondary" onClick={togglePicks}>
            {picksOpen ? t('fx.hidePicks') : t('fx.seePicks')}{picks ? ` (${picks.length})` : ''}
          </button>
          {picksOpen && picksLoading && <p style={{ textAlign: 'center', margin: 0 }}>…</p>}
          {picksOpen && !picksLoading && picks && picks.length === 0 && <p style={{ textAlign: 'center', margin: 0 }}>{t('fx.noPicks')}</p>}
          {picksOpen && picks && picks.length > 0 && (
            <div className="picks">
              {picks.map((pk: any) => (
                <div className="picks-row" key={pk.user_id}>
                  <span className="picks-name">{pk.display_name}{pk.user_id === myId && <span className="you-tag">{t('st.you')}</span>}</span>
                  <span className="pill">{pk.predicted_home_score}-{pk.predicted_away_score}</span>
                  {fixture.status === 'final' && <span className={`pill ${pk.points > 0 ? 'pill-good' : ''}`}>{pk.points}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
