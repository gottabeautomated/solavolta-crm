import { createClient } from '@supabase/supabase-js'

// Nur in der Entwicklung Umgebungsvariablen loggen
// Dev-Logs auskommentiert, um Konsole sauber zu halten

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  if (import.meta.env.DEV) {
    console.error('Missing environment variables:')
    console.error('supabaseUrl:', supabaseUrl)
    console.error('supabaseKey:', supabaseKey)
  }
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey) 

// 🔧 Für Debugging global verfügbar machen (nur in Development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).supabase = supabase
  console.log('🔧 Supabase global verfügbar als window.supabase')
}