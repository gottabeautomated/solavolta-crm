import React from 'react'

interface IconButtonProps {
  icon: React.ReactNode
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children?: React.ReactNode
  className?: string
  title?: string
}

export function IconButton({
  icon,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  children,
  className = ''
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={typeof title === 'string' ? title : undefined}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  )
} 