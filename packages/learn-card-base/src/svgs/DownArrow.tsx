import React from 'react'

const DownArrow: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 25 25" fill="none" className={className}>
      <path
        d="M20.3125 9.375L12.5 17.1875L4.6875 9.375"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default DownArrow
