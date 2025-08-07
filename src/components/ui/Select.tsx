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
  console.log('=== SELECT RENDER DEBUG ===')
  console.log('Select component rendering')
  console.log('Value:', value)
  console.log('Options:', options)
  console.log('Options details:', options.map(opt => `${opt.value} -> ${opt.label}`))
  console.log('Disabled:', disabled)
  console.log('============================')
  return (
    <select
      value={value}
      onChange={(e) => {
        console.log('=== SELECT COMPONENT DEBUG ===')
        console.log('Select onChange triggered')
        console.log('Event target value:', e.target.value)
        console.log('Current value prop:', value)
        console.log('================================')
        onChange(e.target.value)
      }}
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