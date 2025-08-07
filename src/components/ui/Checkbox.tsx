import React, { useState, useRef, useEffect } from 'react'
import type { OfferData } from '../../types/leads'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  error?: boolean
  showOfferMenu?: boolean
  offerType?: 'pv' | 'storage' | 'emergency' | 'tvp'
  onOfferChange?: (offers: OfferData[]) => void
  currentOffers?: OfferData[]
}

const OFFER_TYPES = [
  { id: 'pv', label: 'PV-Angebot', icon: '☀️' },
  { id: 'storage', label: 'Speicher-Angebot', icon: '🔋' },
  { id: 'emergency', label: 'Notstrom', icon: '⚡' },
  { id: 'tvp', label: 'TVP', icon: '📋' }
] as const

export function Checkbox({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  error = false,
  showOfferMenu = false,
  offerType,
  onOfferChange,
  currentOffers = []
}: CheckboxProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [offers, setOffers] = useState<OfferData[]>(currentOffers)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setSelectedType(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleCheckboxChange = (newChecked: boolean) => {
    onChange(newChecked)
    if (newChecked && showOfferMenu && offerType) {
      // Auto-open menu when checkbox is checked
      setShowMenu(true)
      setSelectedType(offerType)
    } else if (!newChecked) {
      setOffers([])
      onOfferChange?.([])
    }
  }

  const handleOfferTypeClick = (type: string) => {
    setSelectedType(type)
  }

  const handleAddOffer = (offerData: Omit<OfferData, 'type'>) => {
    const newOffer: OfferData = {
      type: selectedType as OfferData['type'],
      ...offerData
    }
    
    const updatedOffers = [...offers, newOffer]
    setOffers(updatedOffers)
    onOfferChange?.(updatedOffers)
    setSelectedType(null)
  }

  const handleRemoveOffer = (index: number) => {
    const updatedOffers = offers.filter((_, i) => i !== index)
    setOffers(updatedOffers)
    onOfferChange?.(updatedOffers)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const offerData = {
        date: new Date().toISOString().split('T')[0],
        file,
        fileName: file.name
      }
      handleAddOffer(offerData)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
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
        
        {checked && showOfferMenu && (
          <button
            type="button"
            onClick={() => {
              if (offerType) {
                setSelectedType(offerType)
              }
              setShowMenu(!showMenu)
            }}
            className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Bearbeiten
          </button>
        )}
      </div>

      {/* Offer Management Menu */}
      {checked && showOfferMenu && showMenu && (
        <div ref={menuRef} className="absolute z-50 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Angebote und Leistungen</h3>
            
                         {selectedType === null ? (
               // Offer Type Selection (should not happen with auto-open)
               <div className="space-y-2">
                 <p className="text-xs text-gray-600 mb-2">Angebotstyp auswählen:</p>
                 {OFFER_TYPES.map((type) => (
                   <button
                     key={type.id}
                     type="button"
                     onClick={() => handleOfferTypeClick(type.id)}
                     className="w-full flex items-center p-2 text-sm text-left rounded hover:bg-gray-50"
                   >
                     <span className="mr-2">{type.icon}</span>
                     {type.label}
                   </button>
                 ))}
               </div>
             ) : (
              // Offer Input Form
              <OfferInputForm
                type={selectedType}
                onAdd={handleAddOffer}
                onCancel={() => setSelectedType(null)}
                onFileChange={handleFileChange}
              />
            )}

            {/* Current Offers List */}
            {offers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-900 mb-2">Aktuelle Angebote:</h4>
                <div className="space-y-1">
                  {offers.map((offer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center">
                        <span className="mr-1">
                          {OFFER_TYPES.find(t => t.id === offer.type)?.icon}
                        </span>
                        <span className="font-medium">
                          {OFFER_TYPES.find(t => t.id === offer.type)?.label}
                        </span>
                        {offer.date && (
                          <span className="ml-2 text-gray-600">
                            {new Date(offer.date).toLocaleDateString('de-DE')}
                          </span>
                        )}
                        {offer.number && (
                          <span className="ml-2 text-gray-600">#{offer.number}</span>
                        )}
                        {offer.fileName && (
                          <span className="ml-2 text-gray-600">📎 {offer.fileName}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOffer(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface OfferInputFormProps {
  type: string
  onAdd: (data: Omit<OfferData, 'type'>) => void
  onCancel: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function OfferInputForm({ type, onAdd, onCancel, onFileChange }: OfferInputFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [number, setNumber] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
         if (type === 'tvp') {
       // For TVP, trigger file input
       const fileInput = document.createElement('input')
       fileInput.type = 'file'
       fileInput.accept = '.pdf,.doc,.docx'
       fileInput.onchange = (e) => onFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
       fileInput.click()
     } else {
      // For other types, add with date and number
      onAdd({ date, number: number || undefined })
    }
  }

  const getFormTitle = () => {
    switch (type) {
      case 'pv': return 'PV-Angebot erstellen'
      case 'storage': return 'Speicher-Angebot erstellen'
      case 'emergency': return 'Notstrom-Angebot erstellen'
      case 'tvp': return 'TVP-Datei hochladen'
      default: return 'Angebot erstellen'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">{getFormTitle()}</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Zurück
        </button>
      </div>

      {type !== 'tvp' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Datum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Angebotsnummer (optional)
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="z.B. AN-2024-001"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {type === 'tvp' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            TVP-Datei auswählen
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onFileChange}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
      )}

      <div className="flex space-x-2 pt-2">
        <button
          type="submit"
          className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {type === 'tvp' ? 'Datei hochladen' : 'Angebot erstellen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
} 