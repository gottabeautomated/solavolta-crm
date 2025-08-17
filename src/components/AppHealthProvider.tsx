import React from 'react'
import { startupHealthCheck, type HealthReport } from '../lib/appHealth'

interface Props { children: React.ReactNode }

export function AppHealthProvider({ children }: Props) {
  const [loading, setLoading] = React.useState(true)
  const [report, setReport] = React.useState<HealthReport | null>(null)
  const [recovering, setRecovering] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const r = await startupHealthCheck({ autoRecover: false, devLogs: true })
      if (!mounted) return
      setReport(r)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const handleAutoRecover = async () => {
    setRecovering(true)
    const r = await startupHealthCheck({ autoRecover: true, devLogs: true })
    setReport(r)
    setRecovering(false)
    // Nach Recovery einmal neu laden
    window.location.href = window.location.origin + '?t=' + Date.now()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Prüfe App‑Gesundheit…</div>
      </div>
    )
  }

  const hasCritical = report?.issues.some(i => i.level === 'error')
  if (hasCritical) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-4 border rounded bg-white max-w-md w-full text-sm">
          <div className="font-semibold mb-2">App konnte nicht starten</div>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            {report?.issues.map((i, idx) => (
              <li key={idx} className={i.level==='error'?'text-red-700':'text-amber-700'}>
                [{i.level}] {i.message}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button disabled={recovering} onClick={handleAutoRecover} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">
              {recovering ? 'Behebe…' : 'Automatisch beheben'}
            </button>
            <button onClick={()=>window.location.reload()} className="px-3 py-1 rounded border">Neu laden</button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


