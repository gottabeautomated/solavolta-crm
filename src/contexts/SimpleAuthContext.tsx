import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// API-gleiche Typen wie im bestehenden AuthContext
interface Tenant { id: string; name: string; role: string }
interface AuthContextType {
  user: User | null
  session: Session | null
  tenants: Tenant[]
  activeTenantId: string | null
  loading: boolean
  tenantLoading: boolean
  error: string | null
  membershipsLoaded: boolean
  signOut: () => Promise<void>
  setActiveTenantId: (tenantId: string) => void
  createDefaultTenant: () => Promise<void>
  retryLoadTenants: () => void
}

const TENANT_KEY = 'activeTenantId'

const SimpleAuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const ctx = useContext(SimpleAuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tenantLoading, setTenantLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [membershipsLoaded, setMembershipsLoaded] = useState(false)
  const isLoadingRef = useRef(false)
  const lastLoadUserIdRef = useRef<string | null>(null)
  const lastLoadAtRef = useRef<number>(0)
  const tenantLoadWatchdogRef = useRef<number | null>(null)

  // Debug helper
  const dbg = (...args: unknown[]) => { if (import.meta.env.DEV) console.log('[Auth]', ...args) }
  const dberr = (label: string, err: unknown) => { if (import.meta.env.DEV) console.error(`[Auth] ${label}:`, err) }

  const applyActiveTenant = (incomingTenants: Tenant[]) => {
    const stored = localStorage.getItem(TENANT_KEY)
    if (stored && incomingTenants.some(t => t.id === stored)) {
      setActiveTenantIdState(stored)
      return
    }
    if (incomingTenants.length > 0) {
      const firstId = incomingTenants[0].id
      setActiveTenantIdState(firstId)
      localStorage.setItem(TENANT_KEY, firstId)
      return
    }
    setActiveTenantIdState(null)
    localStorage.removeItem(TENANT_KEY)
  }

  const loadTenants = async (currentUser: User) => {
    // Debounce: Wenn bereits ein Load läuft und derselbe User innerhalb kurzer Zeit → überspringen
    const now = Date.now()
    if (isLoadingRef.current && lastLoadUserIdRef.current === currentUser.id && (now - lastLoadAtRef.current) < 3000) {
      dbg('Skip duplicate loadTenants for', currentUser.id)
      return
    }
    isLoadingRef.current = true
    lastLoadUserIdRef.current = currentUser.id
    lastLoadAtRef.current = now

    setTenantLoading(true)
    setError(null)
    try {
      // Sicherstellen, dass ein gültiges Session-Token vorhanden ist
      let s = (await supabase.auth.getSession()).data.session
      if (!s) {
        await new Promise(r => setTimeout(r, 300))
        s = (await supabase.auth.getSession()).data.session
      }
      // Eingehende Einladungen automatisch annehmen (essentieller Onboarding-Schritt)
      try {
        await supabase.rpc('accept_invitations_for_current_user')
        dbg('Einladungen geprüft/akzeptiert')
      } catch (inviteErr) {
        // still: kein harter Fehler – falls RPC (noch) nicht existiert
        dberr('accept_invitations_for_current_user', inviteErr)
      }
      dbg('Lade Tenants für', currentUser.id)
      // Schritt 1: Memberships ohne Join (robust gegen fehlende/mehrdeutige FK-Constraints)
      let { data: memberships, error: membErr } = await supabase
        .from('tenant_memberships')
        .select('tenant_id, role')
        .eq('user_id', currentUser.id)
      if (membErr) {
        // Einmaliges Refresh+Retry bei 401/403
        const msg0 = (membErr as any)?.message || ''
        const details0 = (membErr as any)?.details || ''
        const isAuth0 = /jwt|expired|invalid|permission|rls|401|403/i.test(msg0 + ' ' + details0)
        if (isAuth0) {
          try { await supabase.auth.refreshSession() } catch {}
          await new Promise(r => setTimeout(r, 250))
          const retry = await supabase
            .from('tenant_memberships')
            .select('tenant_id, role')
            .eq('user_id', currentUser.id)
          memberships = retry.data as any
          membErr = retry.error as any
        }
      }
      if (membErr) {
        // Häufige Fälle: 401/403 (Session abgelaufen / RLS), niemals hängen bleiben
        const msg = (membErr as any)?.message || ''
        const details = (membErr as any)?.details || ''
        const isAuthProblem = /jwt|expired|invalid|permission|rls|401|403/i.test(msg + ' ' + details)
        if (isAuthProblem) {
          dberr('memberships unauthorized/forbidden', membErr)
          // Lokalen Zustand bereinigen; signOut triggert zusätzlich serverseitig
          try { await supabase.auth.signOut() } catch {}
          setSession(null)
          setUser(null)
          setTenants([])
          setActiveTenantIdState(null)
          localStorage.removeItem(TENANT_KEY)
          setMembershipsLoaded(true)
          setTenantLoading(false)
          return
        }
        throw membErr
      }
      const tenantIds = (memberships || []).map((m: any) => m.tenant_id).filter(Boolean)
      // Schritt 2: Tenants separat laden
      const { data: tenantsRows, error: tenErr } = tenantIds.length > 0
        ? await supabase.from('tenants').select('id,name').in('id', tenantIds)
        : { data: [], error: null } as any
      if (tenErr) throw tenErr
      const nameById = new Map((tenantsRows || []).map((t: any) => [t.id, t.name]))
      const mapped: Tenant[] = (memberships || []).map((m: any) => ({
        id: m.tenant_id as string,
        name: (nameById.get(m.tenant_id) as string) || 'Unbekannt',
        role: m.role as string,
      }))
      setTenants(mapped)
      dbg('Tenants geladen:', mapped.length)
      applyActiveTenant(mapped)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      setError(msg)
      setTenants([])
      setActiveTenantIdState(null)
      dberr('loadTenants', e)
    } finally {
      setTenantLoading(false)
      setMembershipsLoaded(true)
      isLoadingRef.current = false
    }
  }

  const setActiveTenantId = (tenantId: string) => {
    setActiveTenantIdState(tenantId)
    localStorage.setItem(TENANT_KEY, tenantId)
    dbg('Active tenant gesetzt:', tenantId)
  }

  const createDefaultTenant = async () => {
    if (!user) return
    setTenantLoading(true)
    setError(null)
    try {
      const name = `${user.email?.split('@')[0] || 'User'} Workspace`
      const { data: t, error: te } = await supabase
        .rpc('create_tenant_with_membership', { p_name: name })
        .single()
      if (te) throw te

      const tenantId = (t as any).id as string
      const tenantName = (t as any).name as string

      const newTenant: Tenant = { id: tenantId, name: tenantName, role: 'owner' }
      setTenants([newTenant])
      setActiveTenantId(newTenant.id)
      dbg('Default Tenant erstellt:', newTenant)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tenant erstellen fehlgeschlagen'
      setError(msg)
      dberr('createDefaultTenant', e)
    } finally {
      setTenantLoading(false)
    }
  }

  const retryLoadTenants = () => {
    if (user) void loadTenants(user)
  }

  // Initial session + tenants laden
  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          // Nicht blockieren: Tenants im Hintergrund laden
          void loadTenants(session.user)
        } else {
          setMembershipsLoaded(true)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Auth-Initialisierung fehlgeschlagen'
        setError(msg)
        dberr('getSession', e)
      } finally {
        setLoading(false)
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          // Wenn gleicher User und bereits geladen, nicht erneut triggern
          if (!(lastLoadUserIdRef.current === s.user.id && membershipsLoaded)) {
            void loadTenants(s.user)
          }
        } else {
          setTenants([])
          setActiveTenantIdState(null)
          localStorage.removeItem(TENANT_KEY)
          setMembershipsLoaded(true)
        }
        setLoading(false)
      })
      unsub = () => subscription.unsubscribe()
    })()
    return () => { if (unsub) unsub() }
  }, [])

  // Watchdog: verhindert endlosen Spinner bei Netzwerk-/CORS-/Realtime-Issues
  useEffect(() => {
    if (tenantLoading) {
      // Sichtbarkeitsbewusst: in Hintergrund-Tabs nicht aggressiv abbrechen
      const timeoutMs = 25000
      const schedule = () => window.setTimeout(() => {
        if (!tenantLoading) return
        if (document.visibilityState === 'hidden') {
          // Im Hintergrund erneut warten
          if (tenantLoadWatchdogRef.current) window.clearTimeout(tenantLoadWatchdogRef.current)
          tenantLoadWatchdogRef.current = schedule()
          return
        }
        setTenantLoading(false)
        setMembershipsLoaded(true)
        if (!error) setError('Zeitüberschreitung beim Laden der Mandanten. Bitte erneut versuchen.')
        dbg('Watchdog: tenant loading timed out (visible)')
      }, timeoutMs)

      tenantLoadWatchdogRef.current = schedule()
      const onVis = () => {
        if (document.visibilityState === 'visible' && tenantLoading) {
          // Bei Rückkehr in den Tab einmal sanft neu versuchen
          retryLoadTenants()
        }
      }
      document.addEventListener('visibilitychange', onVis)
      return () => {
        if (tenantLoadWatchdogRef.current) window.clearTimeout(tenantLoadWatchdogRef.current)
        tenantLoadWatchdogRef.current = null
        document.removeEventListener('visibilitychange', onVis)
      }
    } else if (tenantLoadWatchdogRef.current) {
      window.clearTimeout(tenantLoadWatchdogRef.current)
      tenantLoadWatchdogRef.current = null
    }
  }, [tenantLoading])

  // Netzwerk-Recovery: bei Online-Rückkehr sanft neu versuchen
  useEffect(() => {
    const onOnline = () => {
      if (user) {
        dbg('Network online: retry tenant load')
        retryLoadTenants()
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [user])

  const signOut = async () => {
    // Zuerst lokal abmelden, dann global versuchen – Fehler ignorieren
    try { await supabase.auth.signOut({ scope: 'local' } as any) } catch {}
    try { await supabase.auth.signOut({ scope: 'global' } as any) } catch {}
    // Lokalen State sofort zurücksetzen, nicht auf onAuthStateChange warten
    setSession(null)
    setUser(null)
    setTenants([])
    setActiveTenantIdState(null)
    localStorage.removeItem(TENANT_KEY)
    dbg('Abgemeldet')
  }

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    tenants,
    activeTenantId,
    loading,
    tenantLoading,
    error,
    membershipsLoaded,
    signOut,
    setActiveTenantId,
    createDefaultTenant,
    retryLoadTenants,
  }), [user, session, tenants, activeTenantId, loading, tenantLoading, error])

  return (
    <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>
  )
}


