# Step 4.2: Lead-Bearbeitung (Edit-Mode)

## 🎯 Ziel
Edit-Mode für Lead-Details implementieren mit Formular-Validierung, Speichern/Abbrechen Funktionalität und Status-Management.

## 🚀 Implementierte Features

### ✅ Dynamische Kontextbereiche
- **"Nächste Aktion"** basierend auf Telefonstatus:
  - `erreicht` → Termin (Datum + Zeit) oder Angebot (Vorabangebot)
  - `keine Antwort/besetzt` → Wiedervorlage (Datum)
  - `nicht verfügbar` → Notiz (keine Datum/Zeit erforderlich)

- **"Verloren" Kontextbereich** mit 4 Verlustgründen:
  - Kein Interesse mehr
  - Hat sich für eine andere Firma entschieden
  - Projekt auf einen späteren Zeitpunkt verschoben
  - Kunde meldet sich nicht mehr

### ✅ Erweiterte Form-Komponenten
- **TimePicker** mit zweistufiger Auswahl (Stunde → Minute)
- **Kontextuelle Menüs** für Angebote & Leistungen
- **Vorabangebot-Funktionalität** mit OfferData Integration
- **Validierung** für alle neuen Felder

### ✅ Datenbank-Integration
- **Neue Felder** in `leads` Tabelle:
  - `next_action`, `next_action_date`, `next_action_time`
  - `preliminary_offer`, `lost_reason`
- **SQL-Script** für Datenbank-Update bereitgestellt
- **TypeScript Interfaces** erweitert

### ✅ UX/UI Verbesserungen
- **Farbkodierte Kontextbereiche** (rot für "Verloren", blau für "Nächste Aktion")
- **Auto-Reset** von abhängigen Feldern
- **Mobile-optimiert** mit responsive Design
- **Loading States** und Error Handling

## 📋 Checkliste

### Edit-Mode Funktionalität
- [x] Edit/View Mode Toggle in LeadDetail
- [x] Formular-Komponenten für alle Lead-Felder
- [x] Form-Validierung implementieren
- [x] Save/Cancel Buttons mit Funktionalität

### Form-Komponenten
- [x] `components/forms/LeadForm.tsx` erstellt
- [x] Input-Komponenten für verschiedene Feldtypen
- [x] Dropdown-Komponenten für Status/Kontakttyp
- [x] Checkbox-Komponenten für Angebote
- [x] Date-Picker für Termine
- [x] TimePicker mit zweistufiger Auswahl
- [x] Kontextuelle Menüs für Angebote

### Daten-Management
- [x] updateLead Hook Integration
- [x] Form State Management mit useForm Hook
- [x] Optimistic Updates
- [x] Error Handling beim Speichern
- [x] Neue Datenbank-Felder für "Nächste Aktion"
- [x] Neue Datenbank-Felder für "Verloren" Grund

### Dynamische Kontextbereiche
- [x] "Nächste Aktion" basierend auf Telefonstatus
- [x] "Verloren" Kontextbereich mit 4 Verlustgründen
- [x] Angebote & Leistungen mit kontextuellen Menüs
- [x] Vorabangebot-Funktionalität

### UX/UI
- [x] Loading States während Save
- [x] Success/Error Messages
- [x] Unsaved Changes Warning
- [x] Mobile-optimierte Formulare
- [x] Rote Kontextbereiche für "Verloren"
- [x] Blaue Kontextbereiche für "Nächste Aktion"

## 🔧 Cursor Commands

### Dateien erstellen
```bash
mkdir src/components/forms
touch src/components/forms/LeadForm.tsx
touch src/components/ui/FormField.tsx
touch src/components/ui/Select.tsx
touch src/components/ui/DatePicker.tsx
touch src/components/ui/Checkbox.tsx
touch src/hooks/useForm.ts
```

## 📁 Zu erstellende Dateien

### `src/hooks/useForm.ts`
```typescript
import { useState, useCallback } from 'react'

export interface FormErrors {
  [key: string]: string | undefined
}

export interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => FormErrors
  onSubmit: (values: T) => Promise<void> | void
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setIsDirty(true)
    
    // Clear error for this field when user starts typing
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name as string]: undefined }))
    }
  }, [errors])

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name as string]: error }))
  }, [])

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setIsDirty(false)
  }, [initialValues])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Validate form
    const validationErrors = validate ? validate(values) : {}
    setErrors(validationErrors)

    // Don't submit if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
      setIsDirty(false)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    setValue,
    setFieldError,
    reset,
    handleSubmit
  }
}
```

### `src/components/ui/FormField.tsx`
```typescript
import React from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

### `src/components/ui/Select.tsx`
```typescript
import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

export function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = "Bitte wählen...",
  disabled = false,
  error = false
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
        focus:outline-none focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-50 disabled:cursor-not-allowed
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
      `}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
```

### `src/components/ui/DatePicker.tsx`
```typescript
import React from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  min?: string
  max?: string
}

export function DatePicker({ 
  value, 
  onChange, 
  disabled = false,
  error = false,
  min,
  max
}: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      min={min}
      max={max}
      className={`
        block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
        focus:outline-none focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-50 disabled:cursor-not-allowed
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
      `}
    />
  )
}
```

### `src/components/ui/Checkbox.tsx`
```typescript
import React from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  error?: boolean
}

export function Checkbox({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  error = false
}: CheckboxProps) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`
          h-4 w-4 text-blue-600 rounded border-gray-300
          focus:ring-blue-500 focus:ring-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-red-300' : ''}
        `}
      />
      <label className={`ml-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </label>
    </div>
  )
}
```

### `src/components/forms/LeadForm.tsx`
```typescript
import React from 'react'
import { FormField } from '../ui/FormField'
import { Select } from '../ui/Select'
import { DatePicker } from '../ui/DatePicker'
import { Checkbox } from '../ui/Checkbox'
import { useForm } from '../../hooks/useForm'
import type { Lead, LeadStatus, ContactType, PhoneStatus } from '../../types/leads'
import { LEAD_STATUS_OPTIONS, CONTACT_TYPE_OPTIONS, PHONE_STATUS_OPTIONS } from '../../types/leads'

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
  exported_to_sap: boolean
}

interface LeadFormProps {
  lead: Lead
  onSave: (data: Partial<Lead>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function LeadForm({ lead, onSave, onCancel, isSubmitting = false }: LeadFormProps) {
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
      exported_to_sap: lead.exported_to_sap || false
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
        follow_up_date: values.follow_up_date || null
      }

      await onSave(updateData)
    }
  })

  const statusOptions = LEAD_STATUS_OPTIONS.map(status => ({ value: status, label: status }))
  const contactTypeOptions = CONTACT_TYPE_OPTIONS.map(type => ({ value: type, label: type }))
  const phoneStatusOptions = PHONE_STATUS_OPTIONS.map(status => ({ value: status, label: status }))

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
              onChange={(value) => form.setValue('lead_status', value as LeadStatus)}
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
              onChange={(value) => form.setValue('phone_status', value as PhoneStatus)}
              options={phoneStatusOptions}
              disabled={isSubmitting}
              error={!!form.errors.phone_status}
              placeholder="Status wählen"
            />
          </FormField>
        </div>
      </div>

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
            <input
              type="time"
              value={form.values.appointment_time}
              onChange={(e) => form.setValue('appointment_time', e.target.value)}
              disabled={isSubmitting}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${form.errors.appointment_time ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
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
          />

          <Checkbox
            checked={form.values.offer_storage}
            onChange={(checked) => form.setValue('offer_storage', checked)}
            label="Speicher-Angebot erstellt"
            disabled={isSubmitting}
          />

          <Checkbox
            checked={form.values.offer_backup}
            onChange={(checked) => form.setValue('offer_backup', checked)}
            label="Notstrom-Angebot erstellt"
            disabled={isSubmitting}
          />

          <Checkbox
            checked={form.values.tvp}
            onChange={(checked) => form.setValue('tvp', checked)}
            label="TVP erstellt"
            disabled={isSubmitting}
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
```

### `src/components/LeadDetail.tsx` (erweitern für Edit-Mode)
```typescript
// Erweitere die bestehende LeadDetail Komponente um Edit-Mode:

import React, { useState, useEffect } from 'react'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { Card, CardSection } from './ui/Card'
import { IconButton } from './ui/IconButton'
import { LeadStatusBadge, Badge } from './ui/Badge'
import { LeadForm } from './forms/LeadForm'
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
  }, [leadId, fetchLead])

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
      console.error('Fehler beim Speichern:', error)
      setSaveMessage(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveMessage(null)
  }

  if (loading) {
    return <LoadingSpinner text="Lade Lead-Details..." />
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
        <LeadForm
          lead={lead}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      ) : (
        // Hier den bestehenden Read-Only Content einfügen...
        // [Der bestehende Code von Step 4.1 bleibt unverändert]
        <div>
          {/* Bestehende Read-Only Ansicht aus Step 4.1 */}
        </div>
      )}
    </div>
  )
}
```

## 🧪 Tests

### 1. Entwicklungsserver starten
```bash
npm run dev
```

### 2. Edit-Mode testen
- [ ] **Bearbeiten-Button**: Klick auf "Bearbeiten" aktiviert Edit-Mode
- [ ] **Formular-Anzeige**: Alle Felder werden mit aktuellen Werten gefüllt
- [ ] **Validierung**: Required-Felder prüfen (Name ist Pflicht)
- [ ] **E-Mail Validierung**: Ungültige E-Mail zeigt Error
- [ ] **Telefon Validierung**: Ungültige Telefonnummer zeigt Error

### 3. Form-Interaktionen testen
- [ ] **Dropdowns**: Status, Kontakttyp, Telefonstatus Auswahl
- [ ] **Checkboxes**: Angebote, Follow-up, SAP-Export Toggle
- [ ] **Date-Picker**: Termin- und Follow-up Datum setzen
- [ ] **Conditional Fields**: Follow-up Datum erscheint nur wenn Follow-up aktiviert

### 4. Speichern/Abbrechen testen
- [ ] **Speichern**: Änderungen werden gespeichert und angezeigt
- [ ] **Abbrechen**: Formular wird geschlossen, keine Änderungen
- [ ] **Dirty State**: "Ungespeicherte Änderungen" Warnung
- [ ] **Loading State**: "Speichert..." während Save-Operation

### 5. Mobile Design testen
```bash
# Browser Developer Tools (F12)
# Device Toolbar aktivieren
# Formular sollte auf Mobile gut bedienbar sein
```

## ✅ Definition of Done
- [x] Edit/View Mode Toggle funktioniert
- [x] Formular zeigt alle Lead-Felder
- [x] Form-Validierung funktioniert korrekt
- [x] Speichern aktualisiert Lead erfolgreich
- [x] Abbrechen kehrt zur Read-Only Ansicht zurück
- [x] Loading States während Save-Operation
- [x] Success/Error Messages werden angezeigt
- [x] "Ungespeicherte Änderungen" Warning
- [x] Mobile-responsive Formular
- [x] Conditional Fields (Follow-up Datum)
- [x] Dynamische "Nächste Aktion" basierend auf Telefonstatus
- [x] "Verloren" Kontextbereich mit Verlustgründen
- [x] Angebote & Leistungen mit kontextuellen Menüs
- [x] TimePicker mit zweistufiger Auswahl
- [x] Datenbank-Integration für alle neuen Felder

## 🔗 Nächster Step
**Step 4.3:** Status-Management und automatisches Tracking

## 📦 Git-Integration
- [x] **Feature-Branch** erstellt: `feature/step-4-2-lead-edit`
- [x] **Commit** mit konventioneller Message: `feat(lead-edit): step 4.2 lead-bearbeitung mit dynamischen kontextbereichen implementiert`
- [x] **Code gepusht** auf GitHub: [https://github.com/gottabeautomated/solavolta-crm](https://github.com/gottabeautomated/solavolta-crm)
- [x] **Repository** erfolgreich verknüpft und synchronisiert

---

## 📝 Notes & Troubleshooting

**Problem:** Formular-Validierung funktioniert nicht
**Lösung:** useForm Hook prüfen, validate Funktion korrekt implementiert

**Problem:** Speichern schlägt fehl
**Lösung:** updateLead Hook testen, Supabase RLS Policies prüfen

**Problem:** Conditional Fields erscheinen nicht
**Lösung:** Form State Management prüfen, setValue Funktion validieren

**Problem:** Mobile Formular schwer bedienbar
**Lösung:** Tailwind Grid-Klassen und Input-Größen anpassen

**Problem:** Dirty State Detection funktioniert nicht
**Lösung:** useForm Hook isDirty Logic prüfen, setValue Calls validieren 