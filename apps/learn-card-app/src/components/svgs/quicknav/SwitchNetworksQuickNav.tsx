import React from 'react';

const SwitchNetworksQuickNav: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M7.99096 35.0832L36.3613 35.0832"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M16.5254 43.5786L7.99067 35.0833L16.5254 26.5879"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M42.0156 14.3996L13.6453 14.3996"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M33.4809 5.9043L42.0156 14.3997L33.4809 22.895"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default SwitchNetworksQuickNav;
