'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { Standing } from '@/lib/types';
import { useT } from '@/lib/i18n';

export default function StandingsTable({ view = 'standings_group', heading }: { view?: string; heading?: string }) {
  const supabase = createBrowserSupabase();
  const { t } = useT();
  const [rows, setRows] = useState<Standing[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    setMyId(userData.user?.id ?? null);
    // Explicit ordering makes the rank (row position) deterministic.
    const { data, error } = await supabase
      .from(view)
      .select('*')
      .order('total_points', { ascending: false })
      .order('exact_scores', { ascending: false })
      .order('correct_outcomes', { ascending: false });
    if (error) setMessage(error.message);
    else setRows((data ?? []) as Standing[]);
  }

  // Rank is fixed from the full table; search only filters which rows are shown.
  const ranked = useMemo(() => rows.map((r, i) => ({ ...r, rank: i + 1 })), [rows]);
  const q = query.trim().toLowerCase();
  const visible = q ? ranked.filter(r => r.display_name.toLowerCase().includes(q)) : ranked;
  const meInTable = !!myId && rows.some(r => r.user_id === myId);

  function jumpToMe() {
    setQuery('');
    setTimeout(() => {
      document.getElementById(`standing-${myId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>{heading ?? t('st.title')}</h2>
        <button className="btn secondary" onClick={load}>{t('st.refresh')}</button>
      </div>

      {rows.length > 0 && (
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 160 }}
            placeholder={t('st.search')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {meInTable && <button className="btn secondary" onClick={jumpToMe}>{t('st.jumpToMe')}</button>}
        </div>
      )}

      {message && <div className="notice">{message}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>#</th><th>{t('st.colPlayer')}</th><th>{t('st.colExact')}</th><th>{t('st.colOutcome')}</th><th>{t('st.colTotal')}</th><th>{t('st.colPicks')}</th></tr>
          </thead>
          <tbody>
            {visible.map(row => {
              const isMe = row.user_id === myId;
              return (
                <tr key={row.user_id} id={`standing-${row.user_id}`} className={isMe ? 'me-row' : ''}>
                  <td><span className={`rank${row.rank <= 3 ? ` rank-${row.rank}` : ''}`}>{row.rank}</span></td>
                  <td>{row.display_name}{isMe && <span className="you-tag">{t('st.you')}</span>}</td>
                  <td>{row.exact_scores * 3}</td>
                  <td>{row.correct_outcomes}</td>
                  <td><strong>{row.total_points}</strong></td>
                  <td>{row.predictions_made}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6}>{t('st.empty')}</td></tr>}
            {rows.length > 0 && visible.length === 0 && <tr><td colSpan={6}>{t('st.noMatch')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
