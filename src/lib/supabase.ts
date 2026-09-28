import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lljzumduvnzenydiopnc.supabase.co';
const supabaseKey = 'sb_publishable_vVNBi3PqvKVaHLSQ7d_zZQ_78l_mBGx';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
