import React, { useState, useEffect, useCallback } from 'react'
import { useLeads } from '../hooks/useLeads'
// import { LoadingSpinner } from './ui/LoadingSpinner'
import { Spinner } from './ui/LoadingStates'
import { ErrorMessage } from './ui/ErrorMessage'
import { Card, CardSection } from './ui/Card'
import { IconButton } from './ui/IconButton'
import { LeadStatusBadge, Badge } from './ui/Badge'
import { LeadForm } from './forms/LeadForm'
import { GeocodingButton } from './GeocodingButton'
import { Modal } from './ui/Modal'
import { AppointmentForm } from './AppointmentForm'
import { OfferWizard } from './OfferWizard'
import { AssignLeadDialog } from './AssignLeadDialog'
import { useAuthContext } from '../contexts/AuthContext'
import { useAppointments } from '../hooks/useAppointments'
import { getFileUrl } from '../lib/storage'
import { StatusHistory } from './status/StatusHistory'
import type { Lead } from '../types/leads'

interface LeadDetailProps {
  leadId: string
  onBack: () => void
}

export function LeadDetail({ leadId, onBack }: LeadDetailProps) {
  const { fetchLead, updateLead } = useLeads()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const { listAppointments } = useAppointments()
  const [appointments, setAppointments] = useState<any[]>([])
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showOfferWizard, setShowOfferWizard] = useState(false)
  const { tenants, activeTenantId } = useAuthContext()
  const currentRole = React.useMemo(() => tenants.find(t => t.id === activeTenantId)?.role, [tenants, activeTenantId])
  const canAssign = (currentRole === 'owner' || currentRole === 'admin' || currentRole === 'dispatcher') && tenants.length > 1

  const loadAppointments = useCallback(async () => {
    try {
      const items = await listAppointments(leadId)
      setAppointments(items)
    } catch {}
  }, [leadId, listAppointments])

  useEffect(() => {
    const loadLead = async () => {
      setLoading(true)
      setError(null)
      
      const { data, error } = await fetchLead(leadId)
      
      if (error) {
        setError(error.message)
      } else {
        setLead(data)
      }
      
      setLoading(false)
    }

    loadLead()
    loadAppointments()
  }, [leadId, fetchLead, loadAppointments])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spinner size={28} text="Lade Lead-Details..." />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Fehler beim Laden des Leads"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!lead) {
    return (
      <ErrorMessage 
        title="Lead nicht gefunden"
        message="Das angeforderte Lead konnte nicht gefunden werden."
        onRetry={onBack}
      />
    )
  }

  const handleSave = async (updateData: Partial<Lead>) => {
    if (!lead) return

    setIsSubmitting(true)
    setSaveMessage(null)
    
    try {
      const { data, error } = await updateLead({ 
        id: lead.id, 
        ...updateData 
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data) {
        setLead(data)
        setIsEditing(false)
        setSaveMessage('Lead erfolgreich gespeichert!')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Fehler beim Speichern:', error)
      setSaveMessage(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveMessage(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE')
  }

  const handleGeocodingSuccess = async () => {
    // Kurz warten, damit n8n das Update in Supabase schreiben kann
    await new Promise((r) => setTimeout(r, 500))
    const { data } = await fetchLead(leadId)
    if (data) setLead(data)
  }

  const handleAppointmentSuccess = async (result: any) => {
    setShowAppointmentModal(false)
    // Optional: Kalender-Link/Terminfelder in Lead schreiben, falls aus Webhook zurückgegeben
    if (result?.appointment) {
      const update: Partial<Lead> = {
        calendar_link: result.appointment.calendar_link,
      }
      await handleSave(update)
    }
    // Liste der Termine aktualisieren
    await loadAppointments()
  }

  return (
    <div className="space-y-6">
      {/* Header mit Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <IconButton
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
            onClick={onBack}
            variant="ghost"
          >
            Zurück
          </IconButton>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.name || 'Unbekannter Lead'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Lead bearbeiten' : 'Lead-Details'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditing && (
            <IconButton
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              onClick={() => setIsEditing(true)}
              variant="primary"
            >
              Bearbeiten
            </IconButton>
          )}
          {!isEditing && (
            <button
              onClick={() => setShowOfferWizard(true)}
              className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
            >
              Angebot erstellen
            </button>
          )}
          {!isEditing && canAssign && (
            <button
              onClick={() => setShowAssignDialog(true)}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Lead zuordnen
            </button>
          )}
          
          {lead.follow_up && (
            <Badge variant="warning">Follow-up erforderlich</Badge>
          )}
          <LeadStatusBadge status={lead.lead_status} />
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveMessage && (
        <div className={`p-4 rounded-md ${
          saveMessage.includes('Fehler') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <>
          {/* Debug Info */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Debug:</strong> Bearbeitungsmodus aktiv - LeadForm wird gerendert
            </p>
          </div>
          
          <LeadForm
            lead={lead}
            onSave={handleSave}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </>
      ) : (
        // Read-Only Content
        <div className="space-y-6">
          {/* Lead-Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Kontaktinformationen */}
            <Card title="Kontaktinformationen">
              <CardSection title="Persönliche Daten">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{lead.name || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">E-Mail</label>
                    <div className="mt-1">
                      {lead.email ? (
                        <a 
                          href={`mailto:${lead.email}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-900">-</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefon</label>
                    {lead.phone ? (
                      <div className="flex items-center space-x-2">
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {lead.phone}
                        </a>
                        <IconButton
                          icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          }
                          onClick={() => window.open(`tel:${lead.phone}`)}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">-</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Adresse</label>
                    <p className="text-sm text-gray-900">{lead.address || '-'}</p>
                    {lead.address && (!lead.lat || !lead.lng) && (
                      <div className="mt-2">
                        <GeocodingButton lead={lead} variant="primary" size="sm" onSuccess={handleGeocodingSuccess} />
                      </div>
                    )}
                  </div>
                </div>
              </CardSection>
            </Card>

            {/* Status & Termine */}
            <Card title="Status & Termine">
              <CardSection title="Lead-Status">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Aktueller Status</label>
                    <div className="mt-1">
                      <LeadStatusBadge status={lead.lead_status} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status seit</label>
                    <p className="text-sm text-gray-900">{formatDate(lead.status_since)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kontakttyp</label>
                    <div className="mt-1">
                      {lead.contact_type ? (
                        <Badge variant="contact" size="sm">{lead.contact_type}</Badge>
                      ) : (
                        <p className="text-sm text-gray-900">-</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefonstatus</label>
                    <p className="text-sm text-gray-900">{lead.phone_status || '-'}</p>
                  </div>
                </div>
              </CardSection>

              <CardSection title="Termine">
                <div className="space-y-2">
                  {appointments.length === 0 && (
                    <p className="text-sm text-gray-500">Keine Termine vorhanden.</p>
                  )}
                  {appointments.length > 0 && (
                    <ul className="divide-y divide-gray-100 border rounded">
                      {appointments.map((a) => (
                        <li key={a.id} className="p-2 text-sm flex items-center justify-between">
                          <span>
                            {new Date(a.starts_at).toLocaleString('de-DE')} {a.status ? `— ${a.status}` : ''}
                          </span>
                          {a.calendar_link && (
                            <a href={a.calendar_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">Kalender</a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardSection>

              <CardSection title="Termin vereinbaren">
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                >
                  📅 Termin vereinbaren
                </button>
              </CardSection>
            </Card>

            {/* Angebote & Leistungen */}
            <Card title="Angebote & Leistungen">
              <CardSection title="Übersicht">
                {/* Anzeige aller Offers aus JSON */}
                {lead.offers && lead.offers.length > 0 ? (
                  <div className="space-y-2">
                    {lead.offers.map((o, idx) => (
                      <OfferRow key={idx} offer={o} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Keine Angebote hinterlegt.</p>
                )}
              </CardSection>
            </Card>

            {/* Follow-up & Export */}
            <Card title="Follow-up & Export">
              <CardSection title="Nachbearbeitung">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-500">Follow-up erforderlich</label>
                    <Badge variant={lead.follow_up ? 'warning' : 'default'} size="sm">
                      {lead.follow_up ? 'Ja' : 'Nein'}
                    </Badge>
                  </div>
                  
                  {lead.follow_up_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Follow-up Datum</label>
                      <p className="text-sm text-gray-900">{formatDate(lead.follow_up_date)}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-500">SAP-Export</label>
                    <Badge variant={lead.exported_to_sap ? 'success' : 'default'} size="sm">
                      {lead.exported_to_sap ? 'Exportiert' : 'Nicht exportiert'}
                    </Badge>
                  </div>
                </div>
              </CardSection>
            </Card>
          </div>

          {/* Dokumentation */}
          {lead.documentation && (
            <Card title="Dokumentation">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{lead.documentation}</p>
              </div>
            </Card>
          )}

          {/* Links */}
          {(lead.doc_link || lead.calendar_link) && (
            <Card title="Links & Dokumente">
              <div className="grid grid-cols-1 gap-3">
                {lead.doc_link && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dokumenten-Link</label>
                    <a 
                      href={lead.doc_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      {lead.doc_link}
                    </a>
                  </div>
                )}
                
                {lead.calendar_link && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kalender-Link</label>
                    <a 
                      href={lead.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      {lead.calendar_link}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Status-Historie */}
          <StatusHistory leadId={lead.id} />

          {/* Meta-Informationen */}
          <Card title="Meta-Informationen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Erstellt am</label>
                <p className="text-sm text-gray-900">{formatDateTime(lead.created_at)}</p>
              </div>
              
              {lead.updated_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Letzte Änderung</label>
                  <p className="text-sm text-gray-900">{formatDateTime(lead.updated_at)}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Lead-ID</label>
                <p className="text-sm font-mono text-gray-900">{lead.id}</p>
              </div>
              
              {(lead.lat && lead.lng) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Koordinaten</label>
                  <p className="text-sm font-mono text-gray-900">
                    {lead.lat.toFixed(6)}, {lead.lng.toFixed(6)}
                  </p>
                </div>
              )}
              {(!lead.lat || !lead.lng) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Geocoding</label>
                  <p className="text-sm text-gray-900">
                    {lead.geocoding_status || '—'}
                    {lead.geocoding_error ? ` – ${lead.geocoding_error}` : ''}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Termin-Modal */}
      <Modal open={showAppointmentModal} onClose={() => setShowAppointmentModal(false)}>
        <AppointmentForm
          leadId={lead.id}
          leadName={lead.name || 'Unbekannt'}
          onSuccess={handleAppointmentSuccess}
          onCancel={() => setShowAppointmentModal(false)}
        />
      </Modal>

      <AssignLeadDialog
        leadId={lead.id}
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssigned={async () => {
          const { data } = await fetchLead(leadId)
          if (data) setLead(data)
        }}
      />

      <OfferWizard open={showOfferWizard} leadId={lead.id} onClose={() => setShowOfferWizard(false)} />
    </div>
  )
} 

function OfferRow({ offer }: { offer: any }) {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (offer?.bucket && offer?.storage_path) {
        const link = await getFileUrl({ bucket: offer.bucket, path: offer.storage_path })
        if (mounted) setUrl(link)
      }
    })()
    return () => {
      mounted = false
    }
  }, [offer?.bucket, offer?.storage_path])

  const label =
    offer?.type === 'pv' ? 'PV-Angebot' :
    offer?.type === 'storage' ? 'Speicher-Angebot' :
    offer?.type === 'emergency' ? 'Notstrom-Angebot' :
    offer?.type === 'tvp' ? 'TVP' : 'Angebot'

  return (
    <div className="flex items-center justify-between text-sm p-2 border rounded">
      <div className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        {offer?.date && <span className="text-gray-500">{new Date(offer.date).toLocaleDateString('de-DE')}</span>}
        {offer?.number && <span className="text-gray-500">#{offer.number}</span>}
      </div>
      <div className="flex items-center gap-3">
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">Ansehen</a>
        )}
      </div>
    </div>
  )
}