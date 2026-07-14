import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-400 font-medium">{label}</label>}
      <input
        {...props}
        className={`
          bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-white
          text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50
          focus:border-brand transition-colors ${error ? 'border-red-500' : ''} ${className}
        `}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
