import React, { useState, useEffect } from 'react'
import { FormField } from '../ui/FormField'
import { Select } from '../ui/Select'
import { DatePicker } from '../ui/DatePicker'
import { TimePicker } from '../ui/TimePicker'
import { Checkbox } from '../ui/Checkbox'
import { useForm } from '../../hooks/useForm'
import type { Lead, LeadStatus, ContactType, PhoneStatus, OfferData, LostReason } from '../../types/leads'
import { LEAD_STATUS_OPTIONS, CONTACT_TYPE_OPTIONS, PHONE_STATUS_OPTIONS, LOST_REASON_OPTIONS } from '../../types/leads'
import { useStatusTracking } from '../../hooks/status/useStatusTracking'
import { supabase } from '../../lib/supabase'

interface LeadFormData {
  name: string
  phone: string
  email: string
  address: string
  lead_status: LeadStatus | ''
  contact_type: ContactType | ''
  phone_status: PhoneStatus | ''
  appointment_date: string
  appointment_time: string
  offer_pv: boolean
  offer_storage: boolean
  offer_backup: boolean
  tvp: boolean
  documentation: string
  doc_link: string
  calendar_link: string
  follow_up: boolean
  follow_up_date: string
  follow_up_time: string
  exported_to_sap: boolean
  offers: OfferData[]
  // New dynamic fields
  next_action: string
  next_action_date: string
  next_action_time: string
  preliminary_offer: boolean
  // New field for lost reason
  lost_reason: LostReason | ''
}

interface LeadFormProps {
  lead: Lead
  onSave: (data: Partial<Lead>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function LeadForm({ lead, onSave, onCancel, isSubmitting = false }: LeadFormProps) {
  const [offers, setOffers] = useState<OfferData[]>([])

  // Bestehende Offers des Leads in den lokalen State laden
  useEffect(() => {
    if (Array.isArray(lead.offers) && lead.offers.length > 0) {
      setOffers(lead.offers as OfferData[])
    }
  }, [lead.offers])
  const { trackStatusChange } = useStatusTracking()
  
  const validateForm = (values: LeadFormData) => {
    const errors: Record<string, string> = {}

    if (!values.name?.trim()) {
      errors.name = 'Name ist erforderlich'
    }

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Ungültige E-Mail-Adresse'
    }

    if (values.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(values.phone)) {
      errors.phone = 'Ungültige Telefonnummer'
    }

    if (values.follow_up && !values.follow_up_date) {
      errors.follow_up_date = 'Follow-up Datum ist erforderlich wenn Follow-up aktiviert ist'
    }

    // Validate next action fields
    if (values.next_action && values.next_action !== 'note' && !values.next_action_date) {
      errors.next_action_date = 'Datum ist erforderlich für die nächste Aktion'
    }

         if (values.next_action === 'appointment' && !values.next_action_time) {
       errors.next_action_time = 'Zeit ist erforderlich für einen Termin'
     }

     // Validate lost reason when lead status is "Verloren"
     if (values.lead_status === 'Verloren' && !values.lost_reason) {
       errors.lost_reason = 'Verlustgrund ist erforderlich wenn Lead-Status "Verloren" ist'
     }

     return errors
  }

  const form = useForm<LeadFormData>({
    initialValues: {
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      lead_status: lead.lead_status || '',
      contact_type: lead.contact_type || '',
      phone_status: lead.phone_status || '',
      appointment_date: lead.appointment_date || '',
      appointment_time: lead.appointment_time || '',
      offer_pv: lead.offer_pv || false,
      offer_storage: lead.offer_storage || false,
      offer_backup: lead.offer_backup || false,
      tvp: lead.tvp || false,
      documentation: lead.documentation || '',
      doc_link: lead.doc_link || '',
      calendar_link: lead.calendar_link || '',
      follow_up: lead.follow_up || false,
      follow_up_date: lead.follow_up_date || '',
      follow_up_time: lead.next_action_time || '',
      exported_to_sap: lead.exported_to_sap || false,
      offers: [],
      next_action: lead.next_action || '',
       next_action_date: lead.next_action_date || '',
       next_action_time: lead.next_action_time || '',
       preliminary_offer: lead.preliminary_offer || false,
       lost_reason: lead.lost_reason || ''
    },
    validate: validateForm,
    onSubmit: async (values) => {
             // Convert form data to Lead update data
       const updateData: Partial<Lead> = {
         ...values,
         lead_status: values.lead_status || null,
         contact_type: values.contact_type || null,
         phone_status: values.phone_status || null,
         appointment_date: values.appointment_date || null,
         appointment_time: values.appointment_time || null,
         documentation: values.documentation || null,
         doc_link: values.doc_link || null,
         calendar_link: values.calendar_link || null,
         follow_up_date: values.follow_up_date || null,
          follow_up_time: values.follow_up_time || null,
                   offers: offers,
         // Neue Felder für "Nächste Aktion"
         next_action: values.next_action || null,
         next_action_date: values.next_action_date || null,
         next_action_time: values.next_action_time || null,
         preliminary_offer: values.preliminary_offer || false,
         // Neues Feld für "Verloren" Grund
         lost_reason: values.lost_reason || null
       }

      // Status-Änderung tracken wenn sich relevante Felder geändert haben
      const hasStatusChange = 
        lead.lead_status !== values.lead_status ||
        lead.phone_status !== values.phone_status ||
        lead.follow_up !== values.follow_up ||
        lead.appointment_date !== values.appointment_date

      if (hasStatusChange) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await trackStatusChange(
            lead.id,
            lead,
            { ...lead, ...updateData },
            user.id,
            'Manuelle Bearbeitung'
          )
        }
      }

      await onSave(updateData)
    }
  })

  const statusOptions = LEAD_STATUS_OPTIONS.map(status => ({ value: status, label: status }))
  const contactTypeOptions = CONTACT_TYPE_OPTIONS.map(type => ({ value: type, label: type }))
  const phoneStatusOptions = PHONE_STATUS_OPTIONS.map(status => ({ value: status, label: status }))
  const lostReasonOptions = LOST_REASON_OPTIONS

  // Dynamic options based on phone status
  const getNextActionOptions = () => {
    if (form.values.phone_status === 'erreicht') {
      return [
        { value: 'appointment', label: 'Termin' },
        { value: 'offer', label: 'Angebot' }
      ]
    } else if (form.values.phone_status === 'keine Antwort' || form.values.phone_status === 'besetzt') {
      return [
        { value: 'follow_up', label: 'Wiedervorlage' }
      ]
    } else if (form.values.phone_status === 'nicht verfügbar') {
      return [
        { value: 'note', label: 'Notiz: Daten unvollständig oder falsch' }
      ]
    }
    return []
  }

  const nextActionOptions = getNextActionOptions()
  
  // Debug logging
  console.log('=== LEAD FORM DEBUG ===')
  console.log('Current phone_status:', form.values.phone_status)
  console.log('Phone status type:', typeof form.values.phone_status)
  console.log('Is phone_status === "erreicht":', form.values.phone_status === 'erreicht')
  console.log('Next action options:', nextActionOptions)
  console.log('Should show next action section:', nextActionOptions.length > 0)
  console.log('========================')

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {/* Kontaktinformationen */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformationen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Name"
            required
            error={form.errors.name}
          >
            <input
              type="text"
              value={form.values.name}
              onChange={(e) => form.setValue('name', e.target.value)}
              disabled={isSubmitting}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="Vollständiger Name"
            />
          </FormField>

          <FormField
            label="Telefon"
            error={form.errors.phone}
          >
            <input
              type="tel"
              value={form.values.phone}
              onChange={(e) => form.setValue('phone', e.target.value)}
              disabled={isSubmitting}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="+43 664 123 4567"
            />
          </FormField>

          <FormField
            label="E-Mail"
            error={form.errors.email}
          >
            <input
              type="email"
              value={form.values.email}
              onChange={(e) => form.setValue('email', e.target.value)}
              disabled={isSubmitting}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="email@beispiel.com"
            />
          </FormField>

          <FormField
            label="Adresse"
            error={form.errors.address}
            className="md:col-span-2"
          >
            <textarea
              value={form.values.address}
              onChange={(e) => form.setValue('address', e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="Straße, PLZ Ort"
            />
          </FormField>
        </div>
      </div>

      {/* Status & Kontakt */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Kontakt</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Lead-Status"
            error={form.errors.lead_status}
          >
                         <Select
               value={form.values.lead_status}
               onChange={(value) => {
                 form.setValue('lead_status', value as LeadStatus)
                 // Reset lost reason when lead status changes
                 if (value !== 'Verloren') {
                   form.setValue('lost_reason', '')
                 }
               }}
               options={statusOptions}
               disabled={isSubmitting}
               error={!!form.errors.lead_status}
               placeholder="Status wählen"
             />
          </FormField>

          <FormField
            label="Kontakttyp"
            error={form.errors.contact_type}
          >
            <Select
              value={form.values.contact_type}
              onChange={(value) => form.setValue('contact_type', value as ContactType)}
              options={contactTypeOptions}
              disabled={isSubmitting}
              error={!!form.errors.contact_type}
              placeholder="Typ wählen"
            />
          </FormField>

          <FormField
            label="Telefonstatus"
            error={form.errors.phone_status}
          >
                         <Select
               value={form.values.phone_status}
               onChange={(value) => {
                 console.log('=== PHONE STATUS ONCHANGE DEBUG ===')
                 console.log('Selected phone_status:', value)
                 
                 form.setValue('phone_status', value as PhoneStatus)
                 
                 // Reset next action when phone status changes
                 form.setValue('next_action', '')
                 form.setValue('next_action_date', '')
                 form.setValue('next_action_time', '')
                 
                 console.log('================================')
               }}
               options={phoneStatusOptions}
               disabled={isSubmitting}
               error={!!form.errors.phone_status}
               placeholder="Status wählen"
             />
          </FormField>
        </div>

        {/* Dynamic Next Action Section */}
        {nextActionOptions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">Nächste Aktion</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Aktion auswählen"
                error={form.errors.next_action}
              >
                <Select
                  value={form.values.next_action}
                  onChange={(value) => form.setValue('next_action', value)}
                  options={nextActionOptions}
                  disabled={isSubmitting}
                  error={!!form.errors.next_action}
                  placeholder="Aktion wählen"
                />
              </FormField>

                             {form.values.next_action && form.values.next_action !== 'note' && (
                 <FormField
                   label="Datum"
                   required
                   error={form.errors.next_action_date}
                 >
                   <DatePicker
                     value={form.values.next_action_date}
                     onChange={(value) => form.setValue('next_action_date', value)}
                     disabled={isSubmitting}
                     error={!!form.errors.next_action_date}
                     min={new Date().toISOString().split('T')[0]}
                   />
                 </FormField>
               )}

              {form.values.next_action === 'appointment' && (
                <FormField
                  label="Zeit"
                  required
                  error={form.errors.next_action_time}
                >
                  <TimePicker
                    value={form.values.next_action_time}
                    onChange={(value) => form.setValue('next_action_time', value)}
                    disabled={isSubmitting}
                    error={!!form.errors.next_action_time}
                    placeholder="Zeit wählen"
                  />
                </FormField>
              )}
            </div>

            {/* Preliminary Offer Section for "Angebot" action */}
            {form.values.next_action === 'offer' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Vorabangebot</h5>
                
                <div className="space-y-4">
                  <Checkbox
                    checked={form.values.preliminary_offer}
                    onChange={(checked) => form.setValue('preliminary_offer', checked)}
                    label="Vorabangebot erstellt"
                    disabled={isSubmitting}
                    showOfferMenu={true}
                    offerType="pv"
                    onOfferChange={setOffers}
                    currentOffers={offers}
                  />
                </div>
              </div>
            )}
          </div>
                 )}
       </div>

       {/* Verloren Kontextbereich */}
       {form.values.lead_status === 'Verloren' && (
         <div className="bg-red-50 p-4 rounded-lg border border-red-200">
           <h3 className="text-lg font-medium text-red-900 mb-4">Grund für Verlust</h3>
           
           <FormField
             label="Verlustgrund auswählen"
             required
             error={form.errors.lost_reason}
           >
             <Select
               value={form.values.lost_reason}
               onChange={(value) => form.setValue('lost_reason', value as LostReason)}
               options={lostReasonOptions}
               disabled={isSubmitting}
               error={!!form.errors.lost_reason}
               placeholder="Grund wählen"
             />
           </FormField>
         </div>
       )}

       {/* Termine */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Termine</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Termindatum"
            error={form.errors.appointment_date}
          >
            <DatePicker
              value={form.values.appointment_date}
              onChange={(value) => form.setValue('appointment_date', value)}
              disabled={isSubmitting}
              error={!!form.errors.appointment_date}
              min={new Date().toISOString().split('T')[0]}
            />
          </FormField>

          <FormField
            label="Terminzeit"
            error={form.errors.appointment_time}
          >
            <TimePicker
              value={form.values.appointment_time}
              onChange={(value) => form.setValue('appointment_time', value)}
              disabled={isSubmitting}
              error={!!form.errors.appointment_time}
              placeholder="Zeit wählen"
            />
          </FormField>
        </div>
      </div>

      {/* Angebote */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Angebote & Leistungen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            checked={form.values.offer_pv}
            onChange={(checked) => form.setValue('offer_pv', checked)}
            label="PV-Angebot erstellt"
            disabled={isSubmitting}
            showOfferMenu={true}
            offerType="pv"
            onOfferChange={setOffers}
            currentOffers={offers}
            leadId={lead.id}
          />

          <Checkbox
            checked={form.values.offer_storage}
            onChange={(checked) => form.setValue('offer_storage', checked)}
            label="Speicher-Angebot erstellt"
            disabled={isSubmitting}
            showOfferMenu={true}
            offerType="storage"
            onOfferChange={setOffers}
            currentOffers={offers}
            leadId={lead.id}
          />

          <Checkbox
            checked={form.values.offer_backup}
            onChange={(checked) => form.setValue('offer_backup', checked)}
            label="Notstrom-Angebot erstellt"
            disabled={isSubmitting}
            showOfferMenu={true}
            offerType="emergency"
            onOfferChange={setOffers}
            currentOffers={offers}
            leadId={lead.id}
          />

          <Checkbox
            checked={form.values.tvp}
            onChange={(checked) => form.setValue('tvp', checked)}
            label="TVP erstellt"
            disabled={isSubmitting}
            showOfferMenu={true}
            offerType="tvp"
            onOfferChange={setOffers}
            currentOffers={offers}
            leadId={lead.id}
          />
        </div>
      </div>

      {/* Follow-up & Export */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-up & Export</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              checked={form.values.follow_up}
              onChange={(checked) => form.setValue('follow_up', checked)}
              label="Follow-up erforderlich"
              disabled={isSubmitting}
            />

            <Checkbox
              checked={form.values.exported_to_sap}
              onChange={(checked) => form.setValue('exported_to_sap', checked)}
              label="Nach SAP exportiert"
              disabled={isSubmitting}
            />
          </div>

          {form.values.follow_up && (
            <FormField
              label="Follow-up Datum"
              required
              error={form.errors.follow_up_date}
            >
              <DatePicker
                value={form.values.follow_up_date}
                onChange={(value) => form.setValue('follow_up_date', value)}
                disabled={isSubmitting}
                error={!!form.errors.follow_up_date}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormField>
          )}

          {form.values.follow_up && (
            <FormField
              label="Follow-up Zeit"
              error={form.errors.follow_up_time}
            >
              <TimePicker
                value={form.values.follow_up_time}
                onChange={(value) => form.setValue('follow_up_time', value)}
                disabled={isSubmitting}
                error={!!form.errors.follow_up_time}
                placeholder="Zeit wählen"
              />
            </FormField>
          )}
        </div>
      </div>

      {/* Links & Dokumentation */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Links & Dokumentation</h3>
        
        <div className="space-y-4">
          <FormField
            label="Dokumenten-Link"
            error={form.errors.doc_link}
          >
            <input
              type="url"
              value={form.values.doc_link}
              onChange={(e) => form.setValue('doc_link', e.target.value)}
              disabled={isSubmitting}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.doc_link ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="https://..."
            />
          </FormField>

          <FormField
            label="Kalender-Link"
            error={form.errors.calendar_link}
          >
            <input
              type="url"
              value={form.values.calendar_link}
              onChange={(e) => form.setValue('calendar_link', e.target.value)}
              disabled={isSubmitting}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.calendar_link ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="https://..."
            />
          </FormField>

          <FormField
            label="Dokumentation"
            error={form.errors.documentation}
          >
            <textarea
              value={form.values.documentation}
              onChange={(e) => form.setValue('documentation', e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.documentation ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="Notizen, Gesprächsverläufe, weitere Informationen..."
            />
          </FormField>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {form.isDirty && (
            <span className="text-sm text-amber-600">
              ⚠️ Ungespeicherte Änderungen
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Abbrechen
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !form.isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Speichert...
              </div>
            ) : (
              'Speichern'
            )}
          </button>
        </div>
      </div>
    </form>
  )
} 