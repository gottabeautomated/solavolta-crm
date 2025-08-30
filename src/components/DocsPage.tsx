import React from 'react'
// Vite: Markdown als Rohtext importieren
// Hinweis: Wir rendern das Markdown roh (lesbar), ohne zusätzliche Abhängigkeiten
import handbook from '../../docs/solavolta_crm_handbuch.md?raw'

export function DocsPage() {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="mb-3">
        <h2 className="text-xl font-semibold">SolaVolta CRM – Handbuch</h2>
        <p className="text-sm text-gray-600">Stand: {new Date().toLocaleDateString('de-DE')}</p>
      </div>
      <div className="overflow-auto max-h-[75vh]">
        <pre className="whitespace-pre-wrap text-sm text-gray-800">{handbook}</pre>
      </div>
    </div>
  )
}


