import React, { useState, useRef, useEffect } from 'react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  placeholder?: string
}

// Generate hours from 8 to 18 (business hours)
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8)
// Generate minutes in 15-minute intervals
const MINUTES = [0, 15, 30, 45]

export function TimePicker({ 
  value, 
  onChange, 
  disabled = false,
  error = false,
  placeholder = "Zeit wählen"
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [showNativeInput, setShowNativeInput] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse current value
  const currentHour = value ? parseInt(value.split(':')[0]) : null
  const currentMinute = value ? parseInt(value.split(':')[1]) : null

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedHour(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleContainerClick = (e: React.MouseEvent) => {
    if (disabled) return
    
    // Check if click is on the input field itself (not on the button)
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT') {
      // Show native input for direct editing
      setShowNativeInput(true)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.showPicker?.()
      }, 100)
    } else {
      // Show custom dropdown
      setIsOpen(!isOpen)
      setShowNativeInput(false)
    }
  }

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour)
  }

  const handleMinuteClick = (minute: number) => {
    if (selectedHour !== null) {
      const timeString = `${selectedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      onChange(timeString)
      setSelectedHour(null)
      setIsOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowNativeInput(false)
  }

  const handleInputBlur = () => {
    setShowNativeInput(false)
  }

  const formatDisplayTime = () => {
    if (!value) return placeholder
    return value
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Time Input Field */}
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          ${showNativeInput ? 'z-20' : ''}
        `}
        placeholder={placeholder}
        onClick={handleContainerClick}
        readOnly={!showNativeInput}
      />

      {/* Quick Time Picker Button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setShowNativeInput(false)
          }
        }}
        disabled={disabled}
        className={`
          absolute right-2 top-1/2 transform -translate-y-1/2
          p-1 text-gray-400 hover:text-gray-600
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'text-red-400 hover:text-red-600' : ''}
        `}
        title="Schnellauswahl"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Two-Stage Time Picker Dropdown */}
      {isOpen && !showNativeInput && (
        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
          {selectedHour === null ? (
            // Stage 1: Hour Selection
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Stunde wählen</h3>
              <div className="grid grid-cols-3 gap-1">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourClick(hour)}
                    className={`
                      px-2 py-1 text-sm rounded hover:bg-blue-50 hover:text-blue-700
                      ${currentHour === hour ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'}
                    `}
                  >
                    {hour}:00
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Stage 2: Minute Selection
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Minute wählen</h3>
                <button
                  type="button"
                  onClick={() => setSelectedHour(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ← Zurück
                </button>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Für {selectedHour}:00</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {MINUTES.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteClick(minute)}
                    className={`
                      px-2 py-1 text-sm rounded hover:bg-blue-50 hover:text-blue-700
                      ${currentHour === selectedHour && currentMinute === minute ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'}
                    `}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 