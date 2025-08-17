import React from 'react'
import { Modal } from './ui/Modal'
import { SolaVoltaCalculator, type RoofType } from '../lib/solavoltaCalculator'
import { supabase } from '../lib/supabase'

interface Props {
  open: boolean
  leadId: string
  onClose: () => void
}

type Step = 1 | 2 | 3 | 4

export function OfferWizard({ open, leadId, onClose }: Props) {
  const [step, setStep] = React.useState<Step>(1)
  const [kWp, setKWp] = React.useState<number>(8)
  const [plz, setPlz] = React.useState<string>('3100')
  const [roofType, setRoofType] = React.useState<RoofType>('ziegel')
  const [cableLen, setCableLen] = React.useState<number>(10)
  const [modulesModel, setModulesModel] = React.useState('Trina TSM-455')
  const [inverterModel, setInverterModel] = React.useState('SolaX X3 hybrid')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => { if (!open) setStep(1) }, [open])

  const calc = React.useMemo(() => new SolaVoltaCalculator({ kWp, plz, roofType }).calculateTotal(), [kWp, plz, roofType])

  const persistKey = `offer_calc_${leadId}`
  const saveLocal = () => {
    const data = { kWp, plz, roofType, cableLen, modulesModel, inverterModel }
    localStorage.setItem(persistKey, JSON.stringify(data))
  }
  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(persistKey)
      if (raw) {
        const d = JSON.parse(raw)
        setKWp(d.kWp)
        setPlz(d.plz)
        setRoofType(d.roofType)
        setCableLen(d.cableLen)
        setModulesModel(d.modulesModel)
        setInverterModel(d.inverterModel)
      }
    } catch {}
  }

  const next = () => setStep((s) => (Math.min(4, (s + 1)) as Step))
  const prev = () => setStep((s) => (Math.max(1, (s - 1)) as Step))

  const canNext = () => {
    if (step === 1) return kWp > 0 && plz.length >= 4
    if (step === 2) return modulesModel.length > 0 && inverterModel.length > 0
    return true
  }

  const exportCSV = () => {
    const rows = [['SAP','Position','Menge','Einzelpreis','Gesamt']]
    calc.positions.forEach(p => rows.push([p.sapCode, p.name, String(p.quantity), String(p.unitPrice), String(p.total)]))
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `angebot_${leadId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveToLead = async () => {
    setSaving(true)
    try {
      // Speichere als JSON in documentation und setze offer_pv=true
      const stamp = new Date().toISOString()
      const { data: lead } = await supabase.from('leads').select('documentation').eq('id', leadId).single()
      const prev = lead?.documentation || ''
      const payload = { meta: { createdAt: stamp }, input: { kWp, plz, roofType, cableLen, modulesModel, inverterModel }, result: calc }
      const marker = `\n\n--- Angebot ${new Date(stamp).toLocaleString('de-DE')} ---\n${JSON.stringify(payload)}`
      await supabase.from('leads').update({ documentation: prev + marker, offer_pv: true }).eq('id', leadId)
      setStep(4)
    } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={()=>!saving && onClose()}>
      <div className="bg-white rounded shadow-lg w-full max-w-3xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Angebots-Wizard</div>
          <div className="text-xs text-gray-500">Schritt {step} / 4</div>
        </div>
        <div className="p-4 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">1) Projekt-Basics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Anlagegröße (kWp)</label>
                  <input type="number" step="0.1" min={1} value={kWp} onChange={(e)=>setKWp(parseFloat(e.target.value||'0'))} className="w-full border rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">PLZ</label>
                  <input value={plz} onChange={(e)=>setPlz(e.target.value)} className="w-full border rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Kabellänge (m)</label>
                  <input type="number" min={0} value={cableLen} onChange={(e)=>setCableLen(parseInt(e.target.value||'0',10))} className="w-full border rounded px-2 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Dachtyp</label>
                  <select value={roofType} onChange={(e)=>setRoofType(e.target.value as RoofType)} className="w-full border rounded px-2 py-2 text-sm">
                    <option value="ziegel">Ziegel</option>
                    <option value="blech">Blech</option>
                    <option value="flach">Flachdach</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">2) Komponenten-Auswahl</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Module</label>
                  <input value={modulesModel} onChange={(e)=>setModulesModel(e.target.value)} className="w-full border rounded px-2 py-2 text-sm" />
                  <p className="text-xs text-gray-500 mt-1">Standard: Trina TSM-455</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Wechselrichter</label>
                  <input value={inverterModel} onChange={(e)=>setInverterModel(e.target.value)} className="w-full border rounded px-2 py-2 text-sm" />
                  <p className="text-xs text-gray-500 mt-1">Standard: SolaX X3 hybrid</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">3) Kalkulations-Übersicht</h3>
              <div className="text-sm text-gray-700">Module: <span className="font-medium">{calc.modules}</span></div>
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">SAP</th>
                      <th className="px-3 py-2 text-left">Position</th>
                      <th className="px-3 py-2 text-right">Menge</th>
                      <th className="px-3 py-2 text-right">Einzelpreis</th>
                      <th className="px-3 py-2 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.positions.map((p) => (
                      <tr key={p.sapCode + p.name} className="border-t">
                        <td className="px-3 py-2">{p.sapCode}</td>
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2 text-right">{p.quantity.toLocaleString('de-DE')}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(p.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-6 text-sm">
                <div>Netto: <span className="font-semibold">{formatCurrency(calc.totals.net)}</span></div>
                <div>USt: <span className="font-semibold">{formatCurrency(calc.totals.vat)}</span></div>
                <div>Brutto: <span className="font-semibold">{formatCurrency(calc.totals.gross)}</span></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">4) Export</h3>
              <p className="text-sm text-gray-600">Exportiere die SAP‑Positionen und speichere die Kalkulation beim Lead.</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 bg-gray-100 rounded text-sm" onClick={exportCSV}>CSV Export</button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" disabled={saving} onClick={saveToLead}>{saving ? 'Speichere…' : 'Beim Lead speichern'}</button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button className="underline" onClick={saveLocal}>Zwischenspeichern</button>
              <button className="underline" onClick={loadLocal}>Laden</button>
            </div>
            <div className="flex items-center gap-2">
              {step > 1 && <button className="px-3 py-2 border rounded text-sm" onClick={prev}>Zurück</button>}
              {step < 4 && <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50" disabled={!canNext()} onClick={next}>Weiter</button>}
              {step === 4 && <button className="px-3 py-2 border rounded text-sm" onClick={onClose}>Schließen</button>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function formatCurrency(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) }


