'use client';

import Image from 'next/image';
import { useT } from '@/lib/i18n';

export default function HomeHero() {
  const { t } = useT();
  return (
    <section className="hero hero-with-logo">
      <div className="hero-copy">
        <span className="badge">{t('home.badge')}</span>
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
      </div>
      <Image src="/lwr-logo.png" alt="Lakewood Ranch Adult Soccer Club logo" width={170} height={170} className="hero-logo" priority />
    </section>
  );
}
