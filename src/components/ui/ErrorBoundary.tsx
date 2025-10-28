import React from 'react'

interface State { hasError: boolean; message?: string }

interface Props { children?: React.ReactNode; fallback?: React.ReactNode }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || String(error) }
  }

  componentDidCatch(error: any) {
    if (import.meta.env.DEV) console.error('Task widget error:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-3 text-sm bg-red-50 border border-red-100 rounded text-red-700">
          <div className="font-semibold mb-1">Fehler beim Rendern</div>
          <div className="mb-2">{this.state.message || 'Unbekannter Fehler'}</div>
          <button className="px-3 py-1 bg-white border rounded mr-2" onClick={()=>window.location.reload()}>Neu laden</button>
          <button className="px-3 py-1 bg-white border rounded" onClick={()=>{
            import('../../lib/cacheBuster').then(m=>m.clearAppCaches({ clearAuth: false, reload: true }))
          }}>Cache leeren & neu laden</button>
        </div>
      )
    }
    return this.props.children as any
  }
}


