import React, { useState, useEffect } from 'react'
import { Card, CardSection } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ErrorMessage } from '../ui/ErrorMessage'
import { useStatusTracking } from '../../hooks/status/useStatusTracking'
import { useLeads } from '../../hooks/useLeads'
import type { StatusStatistics } from '../../types/status'

export function StatusOverview() {
  const { leads } = useLeads()
  const { getStatusHistory } = useStatusTracking()
  const [statistics, setStatistics] = useState<StatusStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true)
        setError(null)

        // Berechne Statistiken aus den Leads
        const totalLeads = leads.length
        const pendingFollowUps = leads.filter(lead => lead.follow_up).length
        const upcomingAppointments = leads.filter(lead => 
          lead.appointment_date && new Date(lead.appointment_date) >= new Date()
        ).length

        // Status-Verteilung
        const byStatus: Record<string, number> = {}
        leads.forEach(lead => {
          const status = lead.lead_status || 'Unbekannt'
          byStatus[status] = (byStatus[status] || 0) + 1
        })

        // Kontakttyp-Verteilung
        const byContactType: Record<string, number> = {}
        leads.forEach(lead => {
          const type = lead.contact_type || 'Unbekannt'
          byContactType[type] = (byContactType[type] || 0) + 1
        })

        // Letzte Aktivitäten (vereinfacht - nur aus Leads)
        const recentActivity = leads
          .filter(lead => lead.updated_at)
          .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
          .slice(0, 5)
          .map(lead => ({
            id: lead.id,
            old_status: null,
            new_status: lead.lead_status || 'Unbekannt',
            changed_by: 'System',
            changed_at: lead.updated_at || lead.created_at
          }))

        const stats: StatusStatistics = {
          total_leads: totalLeads,
          pending_follow_ups: pendingFollowUps,
          upcoming_appointments: upcomingAppointments,
          by_status: byStatus,
          by_contact_type: byContactType,
          recent_activity: recentActivity
        }

        setStatistics(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Statistiken')
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [leads])

  if (loading) {
    return <LoadingSpinner text="Lade Status-Übersicht..." />
  }

  if (error) {
    return <ErrorMessage title="Fehler beim Laden der Übersicht" message={error} />
  }

  if (!statistics) {
    return <ErrorMessage title="Keine Daten verfügbar" message="Status-Übersicht konnte nicht geladen werden." />
  }

  const totalLeads = statistics.total_leads

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Status-Übersicht</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardSection>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalLeads}</p>
              <p className="text-sm text-gray-500">Gesamt Leads</p>
            </div>
          </CardSection>
        </Card>
        
        <Card>
          <CardSection>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {statistics.pending_follow_ups}
              </p>
              <p className="text-sm text-gray-500">Offene Follow-ups</p>
            </div>
          </CardSection>
        </Card>
        
        <Card>
          <CardSection>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {statistics.upcoming_appointments}
              </p>
              <p className="text-sm text-gray-500">Anstehende Termine</p>
            </div>
          </CardSection>
        </Card>
        
        <Card>
          <CardSection>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {statistics.recent_activity.length}
              </p>
              <p className="text-sm text-gray-500">Aktivitäten heute</p>
            </div>
          </CardSection>
        </Card>
      </div>
      
      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardSection>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leads nach Status</h3>
            <div className="space-y-3">
              {Object.entries(statistics.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">{status}</Badge>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {count} ({((count / totalLeads) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardSection>
        </Card>
        
        <Card>
          <CardSection>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leads nach Kontakttyp</h3>
            <div className="space-y-3">
              {Object.entries(statistics.by_contact_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{type}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count} ({((count / totalLeads) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardSection>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardSection>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Letzte Aktivitäten</h3>
          <div className="space-y-3">
            {statistics.recent_activity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm text-gray-900">
                    Status geändert: {activity.old_status || 'Kein Status'} → {activity.new_status}
                  </p>
                  <p className="text-xs text-gray-500">
                    von {activity.changed_by} • {new Date(activity.changed_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardSection>
      </Card>
    </div>
  )
} 