import React from 'react'
import { supabase } from '../lib/supabase'
import { clearAppCaches } from '../lib/cacheBuster'
import { useAuthContext } from '../contexts/AuthContext'

interface Row { [k: string]: any }

export function DiagnosticPanel({ inline = false }: { inline?: boolean }) {
  const { user, session, tenants, activeTenantId, membershipsLoaded, setActiveTenantId, reloadMemberships, createDefaultTenant, signOut } = useAuthContext() as any
  const [running, setRunning] = React.useState(false)
  const [info, setInfo] = React.useState<{ title: string; data?: any; error?: any }[]>([])
  const [showRaw, setShowRaw] = React.useState(false)
  const isDev = import.meta.env?.MODE === 'development'
  const envOk = Boolean((import.meta as any)?.env?.VITE_SUPABASE_URL) && Boolean((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY)
  const [visible, setVisible] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState(false)

  const run = async () => {
    setRunning(true)
    const items: { title: string; data?: any; error?: any }[] = []
    try {
      const sess = await supabase.auth.getSession()
      items.push({ title: 'Session', data: sess.data })
      const me = await supabase.from<Row>('memberships').select('tenant_id,role')
      items.push({ title: 'Memberships', data: me.data, error: me.error })
      const ts = await supabase.from<Row>('tenants').select('id,name')
      items.push({ title: 'Tenants', data: ts.data, error: ts.error })
      const viewToday = await supabase.from<Row>('v_today_tasks').select('*').limit(1)
      items.push({ title: 'View v_today_tasks', data: viewToday.data, error: viewToday.error })
      const existsTenants = await supabase.from<Row>('information_schema.tables').select('table_name').eq('table_schema', 'public').in('table_name', ['tenants','memberships','invitations','leads','appointments']).limit(10)
      items.push({ title: 'Tables exist', data: existsTenants.data, error: existsTenants.error })
      try {
        const who = await (supabase as any).rpc('noop')
        items.push({ title: 'RPC noop (optional)', data: who })
      } catch (e) {
        items.push({ title: 'RPC noop (optional)', error: e })
      }
    } catch (e) {
      items.push({ title: 'Diagnostics error', error: e })
    } finally {
      setInfo(items)
      setRunning(false)
    }
  }

  const forceReauth = async () => {
    try { await clearAppCaches({ clearAuth: true, reload: false }) } catch {}
    await signOut()
  }

  const setFirstTenant = async () => {
    const { data } = await supabase.from('memberships').select('tenant_id').limit(1)
    const id = data?.[0]?.tenant_id as string | undefined
    if (id) setActiveTenantId(id)
  }

  const createTenant = async () => {
    await createDefaultTenant()
    await reloadMemberships()
  }

  // Global Toggle via Alt+D (DEV)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isDev) return
      if ((e.altKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        setVisible(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDev])

  if (!visible && !inline) {
    return (
      <div className="fixed bottom-4 right-4 z-[2000] pointer-events-none">
        <button className="pointer-events-auto px-2 py-1 rounded bg-white/90 border shadow" onClick={()=>setVisible(true)}>Diagnostics</button>
      </div>
    )
  }

  const Wrap = ({ children }: { children: React.ReactNode }) => inline ? (
    <div className="border rounded p-3 bg-white">{children}</div>
  ) : (
    <div className="fixed bottom-4 right-4 z-[2000] pointer-events-none">
      <div className="pointer-events-auto w-[360px] max-h-[70vh] overflow-auto border rounded-lg bg-white/90 shadow-lg p-3">
        {children}
      </div>
    </div>
  )

  return (
    <Wrap>
      <div className="text-sm">
        <div className="font-semibold mb-2">Multi-Tenant Diagnostic{isDev ? ' (DEV)' : ''}</div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">Alt+D: Toggle</div>
          {!inline && (
            <div className="flex gap-2">
              <button className="px-2 py-0.5 text-xs border rounded" onClick={()=>setCollapsed(c=>!c)}>{collapsed?'Maximieren':'Minimieren'}</button>
              <button className="px-2 py-0.5 text-xs border rounded" onClick={()=>setVisible(false)}>Schließen</button>
            </div>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <KV k="User" v={user ? `${user.email}` : 'none'} />
              <KV k="Session" v={session ? 'ok' : 'none'} />
              <KV k="MembersLoaded" v={String(membershipsLoaded)} />
              <KV k="Tenants" v={(tenants?.length ?? 0).toString()} />
              <KV k="activeTenantId" v={activeTenantId || 'unset'} />
              <KV k="LS activeTenantId" v={typeof window !== 'undefined' ? (localStorage.getItem('activeTenantId') || 'unset') : 'n/a'} />
              <KV k="ENV URL" v={envOk ? 'ok' : 'missing'} />
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <button className="px-2 py-1 border rounded" onClick={run} disabled={running}>🔍 Full Diagnostic</button>
              <button className="px-2 py-1 border rounded" onClick={()=>clearAppCaches({ clearAuth: false, reload: true })}>🚨 Clear Caches</button>
              <button className="px-2 py-1 border rounded" onClick={createTenant}>👤 Create Default Tenant</button>
              <button className="px-2 py-1 border rounded" onClick={reloadMemberships}>🔄 Reload Memberships</button>
              <button className="px-2 py-1 border rounded" onClick={setFirstTenant}>Set First Tenant</button>
              <button className="px-2 py-1 border rounded" onClick={forceReauth}>Force Re-Auth</button>
              <button className="px-2 py-1 border rounded" onClick={()=>window.location.reload()}>Force Reload</button>
              <button className="px-2 py-1 border rounded" onClick={()=>setShowRaw(!showRaw)}>{showRaw?'Hide':'📊 Show Raw'}</button>
            </div>
            {info.length>0 && (
              <ul className="space-y-1 max-h-40 overflow-auto mb-2">
                {info.map((i,idx)=>(
                  <li key={idx} className={`p-2 rounded border ${i.error?'border-red-200 bg-red-50':'border-gray-200'}`}>
                    <div className="font-medium">{i.title}</div>
                    {i.error && <div className="text-red-700 break-all">{String((i.error as any)?.message || i.error)}</div>}
                    {!i.error && <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(i.data)?.slice(0,400)}</pre>}
                  </li>
                ))}
              </ul>
            )}
            {showRaw && (
              <pre className="text-[11px] whitespace-pre-wrap break-all border rounded p-2 bg-gray-50 max-h-40 overflow-auto">
                {JSON.stringify({ user, session, tenants, activeTenantId, membershipsLoaded }, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
    </Wrap>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border rounded px-2 py-1"><span className="text-gray-600">{k}</span><span className="font-medium text-gray-900 truncate max-w-[160px]" title={v}>{v}</span></div>
  )
}


