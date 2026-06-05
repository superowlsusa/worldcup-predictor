'use client';

import { useT } from '@/lib/i18n';

export default function RulesPage() {
  const { t } = useT();
  return (
    <main className="container">
      <section className="hero">
        <span className="badge">{t('rules.badge')}</span>
        <h1>{t('rules.title')}</h1>
      </section>
      <div className="grid">
        <div className="card span-4"><h2>{t('rules.exactTitle')}</h2><p>{t('rules.exactBody')} <strong>{t('rules.pts3')}</strong>.</p></div>
        <div className="card span-4"><h2>{t('rules.outcomeTitle')}</h2><p>{t('rules.outcomeBody')} <strong>{t('rules.pts1')}</strong>.</p></div>
        <div className="card span-4"><h2>{t('rules.lockTitle')}</h2><p>{t('rules.lockBody')} <strong>{t('rules.oneHour')}</strong>.</p></div>
        <div className="card span-6"><h2>{t('rules.koTitle')}</h2><p>{t('rules.koBody')}</p></div>
        <div className="card span-6"><h2>{t('rules.koScoreTitle')}</h2><p>{t('rules.koScoreBody')}</p></div>
        <div className="card span-4"><h2>{t('rules.joinTitle')}</h2><p>{t('rules.joinBody')}</p></div>
        <div className="card span-8">
          <h2>{t('rules.payoutTitle')}</h2>
          <div className="stack" style={{ gap: 10 }}>
            <div className="row" style={{ gap: 12 }}><span className="pill pill-good" style={{ fontSize: 15, fontWeight: 800 }}>25%</span><span>{t('rules.payout1')}</span></div>
            <div className="row" style={{ gap: 12 }}><span className="pill pill-good" style={{ fontSize: 15, fontWeight: 800 }}>25%</span><span>{t('rules.payout2')}</span></div>
            <div className="row" style={{ gap: 12 }}><span className="pill pill-good" style={{ fontSize: 15, fontWeight: 800 }}>50%</span><span>{t('rules.payout3')}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
