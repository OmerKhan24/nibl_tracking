import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-400 font-medium">{label}</label>}
      <select
        {...props}
        className={`
          bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-white
          text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand
          transition-colors ${className}
        `}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
