import React from 'react';

const Square: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="92"
            height="92"
            viewBox="0 0 92 92"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Square"
        >
            <path d="M92 46L46 0L0 46L46 92L92 46Z" fill="currentColor" />
        </svg>
    );
};

export default Square;
