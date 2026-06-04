'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { Standing } from '@/lib/types';
import { useT } from '@/lib/i18n';

export default function StandingsTable() {
  const supabase = createBrowserSupabase();
  const { t } = useT();
  const [rows, setRows] = useState<Standing[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase.from('standings').select('*');
    if (error) setMessage(error.message);
    else setRows((data ?? []) as Standing[]);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>{t('st.title')}</h2>
        <button className="btn secondary" onClick={load}>{t('st.refresh')}</button>
      </div>
      {message && <div className="notice">{message}</div>}
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>#</th><th>{t('st.colPlayer')}</th><th>{t('st.colExact')}</th><th>{t('st.colOutcome')}</th><th>{t('st.colTotal')}</th><th>{t('st.colPicks')}</th></tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.user_id}>
              <td><span className={`rank${i < 3 ? ` rank-${i + 1}` : ''}`}>{i + 1}</span></td>
              <td>{row.display_name}</td>
              <td>{row.exact_scores * 3}</td>
              <td>{row.correct_outcomes}</td>
              <td><strong>{row.total_points}</strong></td>
              <td>{row.predictions_made}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6}>{t('st.empty')}</td></tr>}
        </tbody>
      </table>
      </div>
    </div>
  );
}
