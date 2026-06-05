'use client';

import AuthPanel from '@/components/AuthPanel';
import { useT } from '@/lib/i18n';

export default function SignInPage() {
  const { t } = useT();
  return (
    <main className="container">
      <section className="hero">
        <span className="badge">{t('home.badge')}</span>
        <h1>{t('auth.pageTitle')}</h1>
      </section>
      <div style={{ maxWidth: 460 }}>
        <AuthPanel />
      </div>
    </main>
  );
}
