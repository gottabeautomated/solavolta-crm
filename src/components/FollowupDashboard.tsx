import React, { useMemo } from 'react'
import { useLeads } from '../hooks/useLeads'
import { followupService } from '../lib/followupService'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'

interface FollowupDashboardProps {
  onLeadClick?: (leadId: string) => void
}

export function FollowupDashboard({ onLeadClick }: FollowupDashboardProps) {
  const { leads, loading, error } = useLeads()

  const { reminders, stats } = useMemo(() => {
    const reminders = followupService.processLeadsForFollowup(leads)
    const stats = followupService.calculateStats(reminders)
    return { reminders, stats }
  }, [leads])

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    }
    return colors[priority] || 'bg-gray-500'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Kritisch',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    }
    return labels[priority] || priority
  }

  const formatDaysOverdue = (days: number) => {
    if (days === 0) return 'Heute fällig'
    if (days > 0) return `${days} Tag${days > 1 ? 'e' : ''} überfällig`
    return `In ${Math.abs(days)} Tag${Math.abs(days) > 1 ? 'en' : ''} fällig`
  }

  if (loading) return <div className="p-6">Lade Follow-ups...</div>
  if (error) return <div className="p-6 text-red-600">Fehler: {error}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Gesamt</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Überfällig</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.today}</div>
          <div className="text-sm text-gray-600">Heute</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.this_week}</div>
          <div className="text-sm text-gray-600">Diese Woche</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.next_week}</div>
          <div className="text-sm text-gray-600">Nächste Woche</div>
        </div>
      </div>

      <Card title="Prioritäten-Übersicht">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.by_priority).map(([priority, count]) => (
            <div key={priority} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
              <span className="text-sm font-medium">{getPriorityLabel(priority)}</span>
              <span className="text-sm text-gray-600">({count})</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={`Follow-up Liste (${reminders.length})`}>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Keine Follow-ups erforderlich</div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(r.priority)}`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{r.lead_name}</h4>
                      <p className="text-sm text-gray-600">
                        {r.lead_phone && `📞 ${r.lead_phone} • `}💼 {r.lead_status}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={r.priority === 'critical' ? 'error' : r.priority === 'high' ? 'warning' : r.priority === 'medium' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {getPriorityLabel(r.priority)}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">{formatDaysOverdue(r.days_overdue)}</div>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => onLeadClick?.(r.lead_id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}


