'use client';

import { useState } from 'react';
import StandingsTable from '@/components/StandingsTable';
import { useT } from '@/lib/i18n';

export default function StandingsPage() {
  const { t } = useT();
  const [tab, setTab] = useState<'group' | 'knockout'>('group');

  return (
    <main className="container">
      <section className="hero">
        <span className="badge">{t('stp.badge')}</span>
        <h1>{t('stp.title')}</h1>
        <p>{t('stp.subtitle')}</p>
      </section>

      <div className="row" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <button className={tab === 'group' ? 'btn' : 'btn secondary'} onClick={() => setTab('group')}>{t('st.tabGroup')}</button>
        <button className={tab === 'knockout' ? 'btn' : 'btn secondary'} onClick={() => setTab('knockout')}>{t('st.tabKnockout')}</button>
      </div>

      <div className="notice" style={{ marginBottom: 14 }}>
        🏆 {tab === 'group' ? t('rules.payoutGroup') : t('rules.payoutKnockout')}
      </div>

      {tab === 'group'
        ? <StandingsTable key="group" view="standings_group" heading={t('st.groupTitle')} />
        : <StandingsTable key="knockout" view="standings_knockout" heading={t('st.knockoutTitle')} />}
    </main>
  );
}
