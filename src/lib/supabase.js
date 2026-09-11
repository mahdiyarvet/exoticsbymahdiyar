import { createClient } from '@supabase/supabase-js';

// This key is a "publishable" key, meant to be public — it only works together with
// the Row Level Security policies configured on the database, which are what actually
// restrict each client to their own data. See supabase.com/dashboard project client-portal.
const SUPABASE_URL = 'https://vyqubahucjzinpwgptxi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bt41LUX5rcpk3BYsDzLmxg_GvIt6aD6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Supabase Auth needs an email-shaped identifier internally, but the admin/client
// only ever see a plain username -- this appends a fixed, non-routable-looking
// domain so nobody has to think about "email" at all.
const USERNAME_DOMAIN = 'clients.exoticsbymahdiyar.ir';

export function usernameToEmail(username) {
  const clean = String(username || '').trim().toLowerCase().replace(/\s+/g, '');
  // Admin accounts still sign in with a real email -- pass those through unchanged.
  if (clean.includes('@')) return clean;
  return `${clean}@${USERNAME_DOMAIN}`;
}
