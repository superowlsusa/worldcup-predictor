'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { ensureProfile } from '@/lib/ensure-profile';
import { useT } from '@/lib/i18n';
import type { User } from '@supabase/supabase-js';

export default function AuthPanel() {
  const supabase = createBrowserSupabase();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // undefined = still checking, null = signed out, User = signed in
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // New-player entry points link with a "join" flag (e.g. /signin?join=1) so they
  // land on the sign-up form; the plain "Sign in" link defaults to sign-in.
  useEffect(() => {
    if (typeof window !== 'undefined' && /join/i.test(window.location.search + window.location.hash)) {
      setMode('signup');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function submit() {
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split('@')[0] } },
        });
        if (error) throw error;
        if (data.session) {
          // Email confirmation is off: the player is signed in immediately.
          await ensureProfile(supabase);
          window.location.href = '/';
        } else {
          setMessage(t('auth.created'));
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await ensureProfile(supabase);
        window.location.href = '/';
      }
    } catch (e: any) {
      setMessage(e.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  // Still checking session: render nothing to avoid a flash of the form.
  if (user === undefined) return null;

  // Already signed in: show a confirmation instead of the form.
  if (user) {
    return (
      <div className="card stack">
        <h2>{t('auth.signIn')}</h2>
        <div className="notice">{t('auth.alreadyIn')}</div>
        <a className="btn" href="/">{t('auth.goPredict')}</a>
      </div>
    );
  }

  return (
    <div id="signin" className="card stack">
      <h2>{mode === 'signup' ? t('auth.join') : t('auth.signIn')}</h2>
      <p>{t('auth.blurb')}</p>
      {mode === 'signup' && <input className="input" placeholder={t('auth.displayName')} value={displayName} onChange={e => setDisplayName(e.target.value)} />}
      <input className="input" placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} />
      <button className="btn" onClick={submit} disabled={busy || !email || !password || (mode === 'signup' && !displayName)}>
        {busy ? t('auth.pleaseWait') : mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')}
      </button>
      <button className="btn secondary" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
        {mode === 'signup' ? t('auth.toggleToSignIn') : t('auth.toggleToJoin')}
      </button>
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
