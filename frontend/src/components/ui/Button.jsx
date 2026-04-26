import React from 'react'

const variants = {
  primary: 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-600/25',
  secondary: 'bg-dark-600 hover:bg-dark-500 text-slate-200 border-dark-400',
  danger: 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border-red-700/50',
  ghost: 'bg-transparent hover:bg-dark-600 text-slate-400 border-transparent hover:border-dark-500',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled, 
  loading, 
  icon,
  ...props 
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 
        font-medium border transition-all duration-200 rounded-xl
        ${variants[variant]} 
        ${sizes[size]}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        hover:scale-[1.02] active:scale-[0.98]
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  )
}