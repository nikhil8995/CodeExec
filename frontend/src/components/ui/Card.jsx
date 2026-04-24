import React from 'react'

export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-dark-800/80 border border-dark-500/90 rounded-2xl p-5 shadow-[0_12px_30px_rgba(3,8,20,0.35)] backdrop-blur-sm ${hover ? 'hover:border-brand-500/50 hover:bg-dark-700/80 transition-all cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}>
      {children}
    </div>
  )
}
