'use client';

import StandingsTable from '@/components/StandingsTable';
import { useT } from '@/lib/i18n';

export default function StandingsPage() {
  const { t } = useT();
  return (
    <main className="container">
      <section className="hero">
        <span className="badge">{t('stp.badge')}</span>
        <h1>{t('stp.title')}</h1>
        <p>{t('stp.subtitle')}</p>
      </section>
      <StandingsTable />
    </main>
  );
}
