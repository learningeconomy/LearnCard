import React from 'react'

const RightArrow: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 26 26" fill="none" className={className}>
      <path
        d="M9.875 5.1875L17.6875 13L9.875 20.8125"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default RightArrow
