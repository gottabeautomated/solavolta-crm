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