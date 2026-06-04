'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { ensureProfile } from '@/lib/ensure-profile';

// Email-confirmation / magic links redirect here. Because this app uses
// client-side auth (sessions live in the browser, not cookies), the code
// exchange must happen on the client where the PKCE verifier is stored.
export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Finishing sign-in...');

  useEffect(() => {
    const supabase = createBrowserSupabase();

    async function finish() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // If there was no code, detectSessionInUrl already handled any token hash.
        await ensureProfile(supabase);
        window.location.replace('/');
      } catch (e: any) {
        setMessage(e.message ?? 'Could not complete sign-in. Please return to the app and sign in again.');
      }
    }

    finish();
  }, []);

  return (
    <main className="container">
      <div className="card stack" style={{ marginTop: 40 }}>
        <h2>Signing you in</h2>
        <div className="notice">{message}</div>
      </div>
    </main>
  );
}
