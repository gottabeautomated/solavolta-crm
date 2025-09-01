import React, { useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'
import type { Lead } from '../types/leads'

interface ImportLeadsModalProps {
  open: boolean
  onClose: () => void
  onImported?: (count: number) => void
}

type CsvRow = Record<string, string>

const leadFields = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Telefon' },
  { key: 'email', label: 'E-Mail' },
  { key: 'address', label: 'Adresse' },
  { key: 'sap_id', label: 'SAP ID' },
  { key: 'notes', label: 'Notizen (→ documentation)' },
]

export function ImportLeadsModal({ open, onClose, onImported }: ImportLeadsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  void file
  const [rows, setRows] = useState<CsvRow[]>([])
  const [header, setHeader] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => rows.slice(0, 10), [rows])

  const parseFile = (f: File) => {
    setError(null)
    Papa.parse<CsvRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const hdr = result.meta.fields || []
        setHeader(hdr)
        setRows(result.data.filter(Boolean))
        // Auto-map simple headers
        const auto: Record<string, string> = {}
        hdr.forEach((h) => {
          const lower = h.toLowerCase()
          if (lower.includes('name')) auto['name'] = h
          if (lower.includes('phone') || lower.includes('telefon')) auto['phone'] = h
          if (lower.includes('mail')) auto['email'] = h
          if (lower.includes('adresse') || lower.includes('street') || lower.includes('straße')) auto['address'] = h
          if (lower === 'sap_id' || lower.includes('sap')) auto['sap_id'] = h
          if (lower.includes('notiz') || lower.includes('note')) auto['notes'] = h
        })
        setMapping(auto)
      },
      error: (e) => setError(e.message),
    })
  }

  const handleImport = async () => {
    if (rows.length === 0) return
    setIsImporting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht eingeloggt')
      const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
      if (!tenantId) throw new Error('Kein aktiver Mandant gewählt')

      let success = 0
      const batch: Partial<Lead>[] = []
      for (const r of rows) {
        const lead: Partial<Lead> = {
          name: r[mapping['name']] || null,
          phone: r[mapping['phone']] || null,
          email: r[mapping['email']] || null,
          address: r[mapping['address']] || null,
          documentation: r[mapping['notes']] || null,
          sap_id: r[mapping['sap_id']] || null,
          source: 'manual',
          user_id: user.id,
          tenant_id: tenantId as any,
        } as any
        // Skips leere Zeilen
        if (!lead.name && !lead.phone && !lead.email && !lead.address) continue
        batch.push(lead)
        if (batch.length >= 500) {
          const { error } = await supabase.from('leads').upsert(batch, { onConflict: 'sap_id' })
          if (error) throw error
          success += batch.length
          batch.length = 0
        }
      }
      if (batch.length > 0) {
        const { error } = await supabase.from('leads').upsert(batch, { onConflict: 'sap_id' })
        if (error) throw error
        success += batch.length
      }
      onImported?.(success)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setIsImporting(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Leads importieren (CSV)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && (setFile(e.target.files[0]), parseFile(e.target.files[0]))}
            />
          </div>

          {header.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Feld‑Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leadFields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-2">
                    <label className="text-sm text-gray-700 w-40">{f.label}</label>
                    <select
                      value={mapping[f.key] || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    >
                      <option value="">—</option>
                      {header.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Vorschau (erste 10 Zeilen)</h4>
              <div className="overflow-auto max-h-64 border rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {header.map((h) => (
                        <th key={h} className="px-2 py-1 text-left font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        {header.map((h) => (
                          <td key={h} className="px-2 py-1 whitespace-nowrap">{r[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-600">❌ {error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Abbrechen</button>
            <button
              onClick={handleImport}
              disabled={isImporting || rows.length === 0}
              className={`px-4 py-2 text-white rounded ${isImporting || rows.length === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isImporting ? 'Import läuft…' : 'Import starten'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


