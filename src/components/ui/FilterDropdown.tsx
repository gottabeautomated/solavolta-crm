import React, { useState, useRef, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Alle",
  disabled = false
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm 
          pl-3 pr-10 py-2 text-left cursor-default focus:outline-none 
          focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${isOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                     <button
             type="button"
             onClick={() => {
               onChange(null)
               setIsOpen(false)
             }}
             className={`
               w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
               ${!value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
             `}
           >
             {placeholder}
           </button>
          
                     {options.map((option) => (
             <button
               key={option.value}
               type="button"
               onClick={() => {
                 onChange(option.value)
                 setIsOpen(false)
               }}
               className={`
                 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
                 ${value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
               `}
             >
               {option.label}
             </button>
           ))}
        </div>
      )}
    </div>
  )
}
