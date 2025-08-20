import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}

interface CardSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function CardSection({ title, children, className = '' }: CardSectionProps) {
  return (
    <div className={`mb-6 last:mb-0 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        {title}
      </h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
} 