import { supabase } from './supabase'

export async function debugAuthState() {
  if (import.meta.env.DEV) console.log('=== AUTH DEBUG ===')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (import.meta.env.DEV) console.log('Session:', { user: session?.user?.email || 'NOT_LOGGED_IN', error: sessionError?.message })
  if (!session?.user) return
  const { data: memberships, error: membError } = await supabase
    .from('memberships')
    .select('tenant_id, role')
    .eq('user_id', session.user.id)
  if (import.meta.env.DEV) console.log('Memberships:', { count: memberships?.length || 0, data: memberships, error: membError?.message })
  if (memberships && memberships.length > 0) {
    const ids = memberships.map((m: any)=>m.tenant_id)
    const { data: tenants, error: tErr } = await supabase.from('tenants').select('id,name').in('id', ids)
    if (import.meta.env.DEV) console.log('Tenants:', { count: tenants?.length || 0, data: tenants, error: tErr?.message })
  }
  if (import.meta.env.DEV) console.log('localStorage:', { activeTenantId: localStorage.getItem('activeTenantId') })
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState
  console.log('🔧 Debug-Funktion verfügbar: debugAuthState()')
}


