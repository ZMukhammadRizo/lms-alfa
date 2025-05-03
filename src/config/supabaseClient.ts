import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Use import.meta.env for Vite or process.env for Create React App
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Key is present' : 'Key is missing')
console.log('Supabase Service Key:', supabaseServiceKey ? 'Service key is present' : 'Service key is missing')

// Create the regular client with anon key for normal operations
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Create an admin client with service role key for admin operations
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default supabase
