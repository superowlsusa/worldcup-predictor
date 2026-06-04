'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { Fixture, Prediction } from '@/lib/types';
import { isPredictionLocked } from '@/lib/scoring';
import { ensureProfile } from '@/lib/ensure-profile';
import { useT, translateStage, translateTeam, localeFor, type Lang } from '@/lib/i18n';
import Flag from '@/components/Flag';

function prettyDate(utc: string, lang: Lang) {
  return new Intl.DateTimeFormat(localeFor(lang), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(utc));
}

export default function FixtureList() {
  const supabase = createBrowserSupabase();
  const { t, lang } = useT();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    load();
  }, []);

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
      window.location.href = '/signin';
      return;
    }
    if (isPredictionLocked(fixture.kickoff_utc)) {
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
          {t('fx.guestPrefix')} <a href="/signin" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('fx.guestLink')}</a> {t('fx.guestSuffix')}
        </div>
      )}
      {message && <div className="notice">{message}</div>}
      {visibleFixtures.map(fixture => (
        <PredictionCard
          key={fixture.id}
          fixture={fixture}
          prediction={predictions[fixture.id]}
          disabled={isPredictionLocked(fixture.kickoff_utc)}
          signedIn={!!userId}
          onSave={savePrediction}
        />
      ))}
    </div>
  );
}

function PredictionCard({ fixture, prediction, disabled, signedIn, onSave }: {
  fixture: Fixture;
  prediction?: Prediction;
  disabled: boolean;
  signedIn: boolean;
  onSave: (fixture: Fixture, home: number, away: number) => void;
}) {
  const { t, lang } = useT();
  const [home, setHome] = useState(prediction?.predicted_home_score ?? 0);
  const [away, setAway] = useState(prediction?.predicted_away_score ?? 0);

  useEffect(() => {
    setHome(prediction?.predicted_home_score ?? 0);
    setAway(prediction?.predicted_away_score ?? 0);
  }, [prediction?.predicted_home_score, prediction?.predicted_away_score]);

  const locked = isPredictionLocked(fixture.kickoff_utc);
  const actual = fixture.status === 'final' ? `${fixture.home_score}-${fixture.away_score}` : null;
  const homeName = translateTeam(fixture.home_team, lang);
  const awayName = translateTeam(fixture.away_team, lang);

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
          <input className="input score-input" type="number" min="0" inputMode="numeric" value={home} onFocus={e => e.target.select()} onChange={e => setHome(Math.max(0, Number(e.target.value) || 0))} disabled={disabled} aria-label={`${homeName} score`} />
        </div>
        <div className="vs">vs</div>
        <div className="team team-away">
          <span className="team-name">{awayName}</span>
          <Flag team={fixture.away_team} />
          <input className="input score-input" type="number" min="0" inputMode="numeric" value={away} onFocus={e => e.target.select()} onChange={e => setAway(Math.max(0, Number(e.target.value) || 0))} disabled={disabled} aria-label={`${awayName} score`} />
        </div>
      </div>
      <div className="save-row">
        <button className={`btn ${!signedIn ? 'secondary' : prediction ? 'saved' : 'save'}`} onClick={() => onSave(fixture, home, away)} disabled={disabled}>
          {!signedIn ? t('fx.btnSignInToSave') : prediction ? t('fx.btnSaved') : t('fx.btnSave')}
        </button>
      </div>
      <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {prediction && <span className="pill">{t('fx.yourPick')}: {prediction.predicted_home_score}-{prediction.predicted_away_score}</span>}
        {actual && <span className="pill pill-good">{t('fx.final')}: {actual}</span>}
        {fixture.status === 'final' && prediction && <span className={`pill ${prediction.points > 0 ? 'pill-good' : ''}`}>{t('fx.points')}: {prediction.points}</span>}
        {locked && fixture.status !== 'final' && <span className="pill pill-warn">🔒 {t('fx.locked')}</span>}
      </div>
      <p>{fixture.venue_city}, {translateTeam(fixture.venue_country ?? '', lang)}. {t('fx.lockNote')}</p>
    </div>
  );
}
