import React from 'react'
import { cn } from '../../lib/utils'

export function Alert({ variant = 'default', className = '', children, ...props }) {
  const variantClasses = {
    default: 'border bg-muted text-muted-foreground',
    destructive: 'border-red-500 bg-red-100 text-red-800',
    warning: 'border-yellow-500 bg-yellow-100 text-yellow-800',
    success: 'border-green-500 bg-green-100 text-green-800',
    info: 'border-blue-500 bg-blue-100 text-blue-800'
  }

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-md border p-4 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertDescription({ className = '', children, ...props }) {
  return (
    <div className={cn('text-sm leading-snug', className)} {...props}>
      {children}
    </div>
  )
}
