'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useT } from '@/lib/i18n';
import type { User } from '@supabase/supabase-js';

export default function Nav() {
  const supabase = createBrowserSupabase();
  const { t, lang, setLang } = useT();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo"><Image src="/lwr-logo.png" alt="Lakewood Ranch Adult Soccer Club logo" width={42} height={42} className="nav-logo" /> <span>LWR World Cup Predictor</span></Link>
        <div className="nav-links">
          <Link href="/">{t('nav.predictions')}</Link>
          <Link href="/standings">{t('nav.standings')}</Link>
          <Link href="/rules">{t('nav.rules')}</Link>
          <Link href="/admin">{t('nav.admin')}</Link>
          {user ? <button className="link-btn" onClick={signOut}>{t('nav.signOut')}</button> : <Link href="/signin">{t('nav.signIn')}</Link>}
          <button className="link-btn lang-toggle" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} title={t('lang.label')} aria-label={t('lang.label')}>
            🌐 {lang === 'en' ? 'ES' : 'EN'}
          </button>
        </div>
      </div>
    </div>
  );
}
