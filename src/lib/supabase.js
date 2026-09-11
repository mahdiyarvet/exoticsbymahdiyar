import { createClient } from '@supabase/supabase-js';

// This key is a "publishable" key, meant to be public — it only works together with
// the Row Level Security policies configured on the database, which are what actually
// restrict each client to their own data. See supabase.com/dashboard project client-portal.
const SUPABASE_URL = 'https://vyqubahucjzinpwgptxi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bt41LUX5rcpk3BYsDzLmxg_GvIt6aD6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
