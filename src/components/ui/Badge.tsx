import React from 'react'
import type { LeadStatus, ContactType, PhoneStatus } from '../../types/leads'

interface BadgeProps {
  variant: 'status' | 'contact' | 'phone' | 'success' | 'warning' | 'error' | 'default'
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ variant, children, size = 'sm', className = '' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  const variantClasses = {
    status: 'bg-blue-100 text-blue-800',
    contact: 'bg-purple-100 text-purple-800',
    phone: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Helper für Lead Status Badge
export function LeadStatusBadge({ status }: { status: LeadStatus | null }) {
  if (!status) return <Badge variant="default">-</Badge>

  const statusVariants: Record<LeadStatus, 'success' | 'warning' | 'error' | 'status'> = {
    'Neu': 'status',
    'Offen': 'warning', 
    'Gewonnen': 'success',
    'Verloren': 'error'
  }

  return (
    <Badge variant={statusVariants[status]}>
      {status}
    </Badge>
  )
} 