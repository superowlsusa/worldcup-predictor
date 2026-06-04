import type { SupabaseClient } from '@supabase/supabase-js';

// Makes sure the signed-in user has a profiles row. Runs whenever we have a
// real session (after sign-in, after email confirmation, or on app load), so a
// player's prediction never fails the profiles foreign key. Uses ignoreDuplicates
// so it never overwrites an existing row (e.g. an admin's is_admin flag).
export async function ensureProfile(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const display_name =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    'Player';

  await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name }, { onConflict: 'id', ignoreDuplicates: true });
}
