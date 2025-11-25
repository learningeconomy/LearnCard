import React from 'react';

export const Hexagon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="81"
            height="86"
            viewBox="0 0 81 86"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Hexagon"
        >
            <path
                d="M80.6334 64.5V21.5L40.5022 0L0.366699 21.5V64.5L40.5022 86L80.6334 64.5Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default Hexagon;
