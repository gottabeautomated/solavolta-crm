import React from 'react'

interface FilterToggleProps {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  disabled?: boolean
}

export function FilterToggle({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}: FilterToggleProps) {
  const options = [
    { value: null, label: 'Alle', color: 'bg-gray-100 text-gray-700' },
    { value: true, label: 'Ja', color: 'bg-green-100 text-green-700' },
    { value: false, label: 'Nein', color: 'bg-red-100 text-red-700' }
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              flex-1 px-3 py-1 text-xs font-medium rounded transition-all duration-200
              disabled:cursor-not-allowed disabled:opacity-50
              ${value === option.value ? option.color : 'text-gray-600 hover:text-gray-900'}
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
