import React from 'react'
import { useStatusTracking } from '../../hooks/status/useStatusTracking'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ErrorMessage } from '../ui/ErrorMessage'
import type { StatusChange } from '../../types/status'

interface StatusHistoryProps {
  leadId: string
}

export function StatusHistory({ leadId }: StatusHistoryProps) {
  const { getStatusHistory, loading, error } = useStatusTracking()
  const [history, setHistory] = React.useState<StatusChange[]>([])

  React.useEffect(() => {
    const loadHistory = async () => {
      const { data } = await getStatusHistory(leadId)
      if (data) {
        setHistory(data)
      }
    }

    loadHistory()
  }, [leadId, getStatusHistory])

  if (loading) {
    return <LoadingSpinner text="Lade Status-Historie..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Fehler beim Laden der Status-Historie"
        message={error}
      />
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Keine Status-Änderungen vorhanden</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Status-Historie</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {history.map((change, index) => (
            <li key={change.id}>
              <div className="relative pb-8">
                {index !== history.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Status geändert von{' '}
                        <span className="font-medium text-gray-900">
                          {change.old_status || 'Kein Status'}
                        </span>
                        {' '}zu{' '}
                        <span className="font-medium text-gray-900">
                          {change.new_status}
                        </span>
                      </p>
                      
                      {change.reason && (
                        <p className="text-sm text-gray-500 mt-1">
                          Grund: {change.reason}
                        </p>
                      )}
                      
                      {change.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {change.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={change.changed_at}>
                        {new Date(change.changed_at).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 