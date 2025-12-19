import React from 'react'

const Share: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 30 31" fill="none" className={className}>
      <path
        d="M5 15.981V25.981C5 26.644 5.26339 27.2799 5.73223 27.7488C6.20107 28.2176 6.83696 28.481 7.5 28.481H22.5C23.163 28.481 23.7989 28.2176 24.2678 27.7488C24.7366 27.2799 25 26.644 25 25.981V15.981"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 8.48099L15 3.48099L10 8.48099"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 3.48099V19.731"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Share
