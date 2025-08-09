import React from 'react'

type ConsentState = 'unknown' | 'accepted' | 'rejected'

const LS_KEY = 'cookie_consent_v1'

function getStoredConsent(): ConsentState {
  const v = localStorage.getItem(LS_KEY)
  if (v === 'accepted' || v === 'rejected') return v
  return 'unknown'
}

export function CookieConsent() {
  const [state, setState] = React.useState<ConsentState>('unknown')

  React.useEffect(() => {
    setState(getStoredConsent())
  }, [])

  const accept = () => {
    localStorage.setItem(LS_KEY, 'accepted')
    setState('accepted')
  }
  const reject = () => {
    localStorage.setItem(LS_KEY, 'rejected')
    setState('rejected')
  }

  if (state !== 'unknown') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2000]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
        <div className="rounded-lg bg-white shadow-lg border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-700">
            Wir verwenden technisch notwendige Cookies, um diese Anwendung bereitzustellen. Weitere Informationen finden
            Sie in unserer <a href="#/datenschutz" className="text-blue-600 hover:text-blue-700 underline">Datenschutzerklärung</a>.
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reject} className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">
              Ablehnen
            </button>
            <button onClick={accept} className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white">
              Akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



