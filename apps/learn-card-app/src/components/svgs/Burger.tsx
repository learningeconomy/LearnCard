import React from 'react';

const Burger: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" className={className}>
            <path d="M4 7.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 17.5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};

export default Burger;
