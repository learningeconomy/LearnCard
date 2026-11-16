import React from 'react';

const NAVY = '#18224E';
const SHAPE = '#D1FAE5';
const ACCENT = '#10B981';

/**
 * School Connect tile icon: a graduation cap on a soft shape, in the same outlined style as the
 * other tile icons. Fills a square parent; the tile supplies the gradient background.
 */
const SchoolConnectTileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ width: '100%', height: '100%' }}
        aria-hidden="true"
    >
        <circle cx="50" cy="52" r="42" fill={SHAPE} />
        <path
            d="M27 47V63C27 63 35 72 50 72C65 72 73 63 73 63V47"
            fill="white"
            stroke={NAVY}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M50 23L90 40L50 57L10 40L50 23Z"
            fill="white"
            stroke={NAVY}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M50 40L80 46V62"
            stroke={NAVY}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="50" cy="40" r="3.5" fill={NAVY} />
        <path
            d="M76 62H84L86 74C86 75.5 84.5 77 83 77H77C75.5 77 74 75.5 74 74L76 62Z"
            fill={ACCENT}
            stroke={NAVY}
            strokeWidth="3"
            strokeLinejoin="round"
        />
    </svg>
);

export default SchoolConnectTileIcon;
