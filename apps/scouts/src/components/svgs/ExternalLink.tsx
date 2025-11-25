import React from 'react';

const ExternalLink: React.FC<{ className?: string; size?: string | number; color?: string }> = ({
    className = '',
    size = 24,
    color = '#4a5568',
}) => {
    return (
        <svg
            fill="none"
            className={className}
            height={size}
            viewBox="0 0 24 24"
            width={size}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="m10 6h-4c-1.10457 0-2 .89543-2 2v10c0 1.1046.89543 2 2 2h10c1.1046 0 2-.8954 2-2v-4m-4-10h6m0 0v6m0-6-10 10"
                stroke={color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
        </svg>
    );
};

export default ExternalLink;
c;
