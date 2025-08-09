import { createClient } from '@supabase/supabase-js'

// Nur in der Entwicklung Umgebungsvariablen loggen
if (import.meta && (import.meta as any).env && (import.meta as any).env.DEV) {
  // Vorsicht: keine geheimen Keys im Log ausgeben
  console.log('VITE_SUPABASE_URL:', (import.meta as any).env.VITE_SUPABASE_URL)
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:')
  console.error('supabaseUrl:', supabaseUrl)
  console.error('supabaseKey:', supabaseKey)
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey) 