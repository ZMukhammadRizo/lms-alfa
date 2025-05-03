declare module '../../config/supabaseClient' {
  import { SupabaseClient } from '@supabase/supabase-js';
  const supabase: SupabaseClient;
  export default supabase;
} 