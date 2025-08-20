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