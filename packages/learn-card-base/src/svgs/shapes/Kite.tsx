import React from 'react';

export const Kite: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="80"
            height="86"
            viewBox="0 0 80 86"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Kite"
        >
            <path d="M80 43L0 86L4.31659e-06 0L80 43Z" fill="currentColor" />
            <path d="M5.74981e-06 43L80 0L80 86L5.74981e-06 43Z" fill="currentColor" />
        </svg>
    );
};

export default Kite;
