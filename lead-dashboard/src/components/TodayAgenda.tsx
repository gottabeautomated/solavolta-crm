import React, { useState } from 'react'
import { ActionCard, type ActionTask } from './ui/ActionCard'

export function TodayAgenda({ tasks, onOpenLead }: { tasks: ActionTask[]; onOpenLead?: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false)
  const list = tasks || []

  if (list.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Perfekt! Keine Aufgaben für heute</h3>
        <p className="text-green-700">Du kannst dich anderen Dingen widmen oder proaktiv neue Leads bearbeiten.</p>
      </div>
    )
  }

  const toShow = showAll ? list : list.slice(0, 5)

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">📋 Heute geplant ({list.length})</h2>
      </div>
      <div className="p-4 space-y-3">
        {toShow.map((t) => (
          <ActionCard key={t.id} task={t} onOpenLead={onOpenLead} />
        ))}
        {!showAll && list.length > 5 && (
          <button onClick={() => setShowAll(true)} className="w-full text-blue-600 font-medium py-3 text-sm hover:bg-blue-50 rounded">+{list.length - 5} weitere Aufgaben anzeigen</button>
        )}
      </div>
    </div>
  )
}


