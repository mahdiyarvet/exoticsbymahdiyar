// Minimal client for the public booking_* database functions.
// The booking page only needs plain RPC calls, so it talks to the REST endpoint directly
// instead of loading the ~215 KB supabase-js bundle (the site is slow to load in Iran).
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

export async function rpc(fn, body) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { data: null, error: { message: 'network_error' } };
  }
  let json = null;
  try { json = await res.json(); } catch { /* empty or non-JSON body */ }
  if (!res.ok) return { data: null, error: { message: json?.message ?? `http_${res.status}` } };
  return { data: json, error: null };
}
