'use client';

import AdminScores from '@/components/AdminScores';
import { useT } from '@/lib/i18n';

export default function AdminPage() {
  const { t } = useT();
  return (
    <main className="container">
      <section className="hero">
        <span className="badge">{t('admin.badge')}</span>
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.subtitle')}</p>
      </section>
      <AdminScores />
    </main>
  );
}
