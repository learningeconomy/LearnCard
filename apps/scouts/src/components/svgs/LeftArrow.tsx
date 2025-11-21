import React from 'react'

const LeftArrow: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 30 31" fill="none" className={className}>
      <path
        d="M18.75 24.394L9.375 15.019L18.75 5.64401"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default LeftArrow
