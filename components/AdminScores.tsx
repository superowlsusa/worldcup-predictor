'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { Fixture } from '@/lib/types';
import { useT, translateStage, translateTeam, localeFor, type Lang } from '@/lib/i18n';
import Flag from '@/components/Flag';

function prettyDate(utc: string, lang: Lang) {
  return new Intl.DateTimeFormat(localeFor(lang), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(utc));
}

export default function AdminScores() {
  const supabase = createBrowserSupabase();
  const { t, lang } = useT();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState<Record<string, { h: number; a: number }>>({});
  const [filter, setFilter] = useState('needs');

  useEffect(() => { load(); }, []);

  async function load() {
    setMessage(t('admin.checking'));
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setMessage(t('admin.signInFirst'));
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', uid).single();
    if (!profile?.is_admin) {
      setIsAdmin(false);
      setMessage(t('admin.notAdmin'));
      return;
    }
    setIsAdmin(true);
    setMessage('');
    const { data } = await supabase.from('fixtures').select('*').order('match_no', { ascending: true });
    const fixtureRows = (data ?? []) as Fixture[];
    setFixtures(fixtureRows);
    const scoreMap: Record<string, { h: number; a: number }> = {};
    fixtureRows.forEach(f => { scoreMap[f.id] = { h: f.home_score ?? 0, a: f.away_score ?? 0 }; });
    setScores(scoreMap);
  }

  async function finalize(fixture: Fixture) {
    const score = scores[fixture.id] ?? { h: 0, a: 0 };
    const { error } = await supabase.rpc('finalize_fixture_score', {
      p_fixture_id: fixture.id,
      p_home_score: score.h,
      p_away_score: score.a,
    });
    setMessage(error ? error.message : `${t('fx.match')} ${fixture.match_no}: ${score.h}-${score.a} ✓`);
    await load();
  }

  async function clearResult(fixture: Fixture) {
    if (!window.confirm(t('admin.confirmClear'))) return;
    const { error } = await supabase.rpc('clear_fixture_score', { p_fixture_id: fixture.id });
    setMessage(error ? error.message : `${t('fx.match')} ${fixture.match_no} ${t('admin.cleared')} ✓`);
    setScores(s => ({ ...s, [fixture.id]: { h: 0, a: 0 } }));
    await load();
  }

  async function updateKnockoutName(fixture: Fixture, home_team: string, away_team: string) {
    const { error } = await supabase.from('fixtures').update({ home_team, away_team }).eq('id', fixture.id);
    setMessage(error ? error.message : `${t('fx.match')} ${fixture.match_no} ✓`);
    await load();
  }

  const stages = useMemo(() => Array.from(new Set(fixtures.map(f => f.stage))), [fixtures]);
  const now = Date.now();
  const visible = useMemo(() => {
    if (filter === 'needs') return fixtures.filter(f => new Date(f.kickoff_utc).getTime() <= now && f.status !== 'final');
    if (filter === 'all') return fixtures;
    return fixtures.filter(f => f.stage === filter);
  }, [fixtures, filter, now]);

  if (!isAdmin) return <div className="card"><h2>{t('admin.heading')}</h2>{message && <div className="notice">{message}</div>}</div>;

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className={filter === 'needs' ? 'btn' : 'btn secondary'} onClick={() => setFilter('needs')}>{t('admin.filterNeeds')}</button>
        <button className={filter === 'all' ? 'btn' : 'btn secondary'} onClick={() => setFilter('all')}>{t('fx.all')}</button>
        {stages.map(s => (
          <button key={s} className={filter === s ? 'btn' : 'btn secondary'} onClick={() => setFilter(s)}>{translateStage(s, lang)}</button>
        ))}
      </div>
      {message && <div className="notice">{message}</div>}
      {filter === 'needs' && visible.length === 0 && <div className="notice">{t('admin.noneToScore')}</div>}
      {visible.map(f => (
        <AdminCard key={f.id} fixture={f} score={scores[f.id] ?? { h: 0, a: 0 }} setScores={setScores} finalize={finalize} clearResult={clearResult} updateKnockoutName={updateKnockoutName} />
      ))}
    </div>
  );
}

function AdminCard({ fixture, score, setScores, finalize, clearResult, updateKnockoutName }: any) {
  const { t, lang } = useT();
  const [homeName, setHomeName] = useState(fixture.home_team);
  const [awayName, setAwayName] = useState(fixture.away_team);
  const isPlaceholder = fixture.home_team.includes('Winner') || fixture.home_team.includes('Runner') || fixture.home_team.includes('TBD') || fixture.away_team.includes('Winner') || fixture.away_team.includes('Runner') || fixture.away_team.includes('TBD');
  const kickedOff = new Date(fixture.kickoff_utc).getTime() <= Date.now();

  let status;
  if (fixture.status === 'final') status = <span className="pill pill-good">{t('fx.final')}: {fixture.home_score}-{fixture.away_score}</span>;
  else if (kickedOff) status = <span className="pill pill-warn">{t('admin.awaiting')}</span>;
  else status = <span className="pill">{prettyDate(fixture.kickoff_utc, lang)}</span>;

  return (
    <div className="card fixture">
      <div className="fixture-head"><span>{t('fx.match')} {fixture.match_no} · {translateStage(fixture.stage, lang)}</span>{status}</div>
      <div className="teams">
        <div className="team"><span className="team-name">{translateTeam(fixture.home_team, lang)}</span><Flag team={fixture.home_team} /></div>
        <div className="vs">vs</div>
        <div className="team team-away"><span className="team-name">{translateTeam(fixture.away_team, lang)}</span><Flag team={fixture.away_team} /></div>
      </div>
      {isPlaceholder && (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <input className="input" style={{ maxWidth: 230 }} value={homeName} onChange={e => setHomeName(e.target.value)} />
          <input className="input" style={{ maxWidth: 230 }} value={awayName} onChange={e => setAwayName(e.target.value)} />
          <button className="btn secondary" onClick={() => updateKnockoutName(fixture, homeName, awayName)}>{t('admin.updateTeams')}</button>
        </div>
      )}
      <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        <input className="input score-input" type="number" min="0" inputMode="numeric" value={score.h} onFocus={e => e.target.select()} onChange={e => setScores((s: any) => ({ ...s, [fixture.id]: { ...score, h: Math.max(0, Number(e.target.value) || 0) } }))} />
        <span>-</span>
        <input className="input score-input" type="number" min="0" inputMode="numeric" value={score.a} onFocus={e => e.target.select()} onChange={e => setScores((s: any) => ({ ...s, [fixture.id]: { ...score, a: Math.max(0, Number(e.target.value) || 0) } }))} />
        <button className="btn save" onClick={() => finalize(fixture)}>{t('admin.saveFinal')}</button>
        {fixture.status === 'final' && <button className="btn danger" onClick={() => clearResult(fixture)}>{t('admin.clearResult')}</button>}
      </div>
    </div>
  );
}
