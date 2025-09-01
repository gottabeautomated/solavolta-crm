import React from 'react'

interface KeepAliveProps {
  active: boolean
  className?: string
  children: React.ReactNode
}

export function KeepAlive({ active, className, children }: KeepAliveProps) {
  return (
    <div
      className={className}
      style={{ display: active ? 'block' : 'none' }}
      aria-hidden={!active}
    >
      {children}
    </div>
  )
}



