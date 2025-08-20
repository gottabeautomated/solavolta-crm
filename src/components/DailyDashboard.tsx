import React from 'react'
import { useTodayTasks, useOverdueTasks, useWeekOverview, usePriorities, useDashboardRealtime } from '../hooks/useDashboardSWR'
import { TaskListLite } from './TaskListLite'

interface Props {
  onOpenLead?: (leadId: string) => void
}

export function DailyDashboard({ onOpenLead }: Props) {
  useDashboardRealtime()
  const { items: today, loading: loadingToday, error: errorToday, revalidate: rToday } = useTodayTasks()
  const { items: overdue, loading: loadingOverdue, error: errorOverdue, revalidate: rOverdue } = useOverdueTasks()
  const { items: week, loading: loadingWeek, error: errorWeek, revalidate: rWeek } = useWeekOverview()
  const { items: priorities, loading: loadingPrio, error: errorPrio, revalidate: rPrio } = usePriorities()

  const loading = loadingToday || loadingOverdue || loadingWeek || loadingPrio
  const error = errorToday || errorOverdue || errorWeek || errorPrio

  if (loading) return <div className="p-4">Lade Dashboard…</div>
  if (error) return <div className="p-4 text-red-600">{String(error)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daily Dashboard</h2>
        <button className="text-sm text-blue-600" onClick={() => { rToday(); rOverdue(); rWeek(); rPrio(); }}>Aktualisieren</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title={`Heute (${today.length})`}>
          {today.length === 0 ? (
            <div className="text-gray-500">Heute keine Aufgaben</div>
          ) : (
            <TaskListLite tasks={today} onOpenLead={onOpenLead} />
          )}
        </Card>
        <Card title={`Überfällig (${overdue.length})`}>
          {overdue.length === 0 ? (
            <div className="text-gray-500">Keine Überfälligen</div>
          ) : (
            <TaskListLite tasks={overdue} onOpenLead={onOpenLead} />
          )}
        </Card>
        <Card title="Woche (Anzahl je Tag)">
          <div className="grid grid-cols-7 gap-2 text-sm">
            {week.map((d) => {
              const dt = new Date(d.dayDate)
              const label = dt.toLocaleDateString('de-DE', { weekday: 'short' })
              const day = dt.getDate().toString().padStart(2, '0')
              return (
                <div key={d.dayDate} className="p-2 bg-white rounded border text-center">
                  <div className="text-xs text-gray-600">{label} · {day}.{(dt.getMonth()+1).toString().padStart(2,'0')}</div>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span title="Follow-ups" className={`px-2 py-0.5 rounded-full text-xs ${d.efuCount>0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>FU {d.efuCount}</span>
                    <span title="Termine" className={`px-2 py-0.5 rounded-full text-xs ${d.appointmentCount>0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>TA {d.appointmentCount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card title="Top Leads">
        <ul className="divide-y">
          {priorities.map((p) => (
            <li key={p.leadId} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name || p.email || p.phone || p.leadId}</div>
                <div className="text-xs text-gray-600">Priorität: {p.topPriority} {p.nextDue ? `• Nächste Fälligkeit: ${new Date(p.nextDue).toLocaleDateString('de-DE')}` : ''}</div>
              </div>
              <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(p.leadId)}>Öffnen</button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded border">
      <div className="px-4 py-2 border-b font-semibold">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// Legacy simple list removed; TaskListLite used instead


