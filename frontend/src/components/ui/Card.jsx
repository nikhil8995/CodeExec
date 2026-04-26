import React from 'react'

export default function Card({ children, className = '', hover = false, gradient = false, glow = false }) {
  return (
    <div className={`
      bg-dark-800/80 backdrop-blur-sm border border-dark-500/50 rounded-2xl p-6
      ${hover ? 'hover:border-brand-500/50 hover:bg-dark-700/80 hover:shadow-xl hover:shadow-brand-500/10 hover:scale-[1.01] transition-all cursor-pointer' : ''}
      ${gradient ? 'bg-gradient-to-br from-dark-800 to-dark-700' : ''}
      ${glow ? 'hover:shadow-2xl hover:shadow-brand-500/10' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}