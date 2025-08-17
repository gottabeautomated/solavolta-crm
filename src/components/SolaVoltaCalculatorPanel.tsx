import React from 'react'
import { SolaVoltaCalculator, type RoofType } from '../lib/solavoltaCalculator'
import { Accordion } from './ui/Accordion'

export function SolaVoltaCalculatorPanel() {
  const [kWp, setKWp] = React.useState<number>(8)
  const [plz, setPlz] = React.useState<string>('3100')
  const [roofType, setRoofType] = React.useState<RoofType>('ziegel')
  const [result, setResult] = React.useState(() => new SolaVoltaCalculator({ kWp, plz, roofType }).calculateTotal())

  React.useEffect(() => {
    const calc = new SolaVoltaCalculator({ kWp, plz, roofType })
    setResult(calc.calculateTotal())
  }, [kWp, plz, roofType])

  return (
    <Accordion title="📐 SolaVolta Kalkulator" defaultOpen={false}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Anlagegröße (kWp)</label>
            <input type="number" step="0.1" min={1} value={kWp}
              onChange={(e)=>setKWp(parseFloat(e.target.value || '0'))}
              className="w-full border rounded px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">PLZ</label>
            <input value={plz} onChange={(e)=>setPlz(e.target.value)}
              className="w-full border rounded px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Dachtyp</label>
            <select value={roofType} onChange={(e)=>setRoofType(e.target.value as RoofType)}
              className="w-full border rounded px-2 py-2 text-sm">
              <option value="ziegel">Ziegel</option>
              <option value="blech">Blech</option>
              <option value="flach">Flachdach</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Module: <span className="font-medium">{result.modules}</span>
            </div>
          </div>
        </div>

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
              {result.positions.map((p) => (
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
          <div>Netto: <span className="font-semibold">{formatCurrency(result.totals.net)}</span></div>
          <div>USt: <span className="font-semibold">{formatCurrency(result.totals.vat)}</span></div>
          <div>Brutto: <span className="font-semibold">{formatCurrency(result.totals.gross)}</span></div>
        </div>
      </div>
    </Accordion>
  )
}

function formatCurrency(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}


