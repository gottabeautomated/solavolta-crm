import React from 'react'

export function Spinner({ size = 24, className = '', text }: { size?: number; className?: string; text?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className="animate-spin text-blue-600" width={size} height={size} viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  )
}

export function LeadListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b bg-gray-50" />
        <ul>
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="px-6 py-4 border-b">
              <div className="flex items-center gap-4">
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Fehler', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        {message && <p className="text-gray-600 mb-4 text-sm">{message}</p>}
        {onRetry && (
          <button onClick={onRetry} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Erneut versuchen</button>
        )}
      </div>
    </div>
  )
}


