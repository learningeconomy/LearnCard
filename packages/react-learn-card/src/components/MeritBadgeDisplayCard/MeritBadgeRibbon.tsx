import React from 'react';

type MeritBadgeRibbonProps = {
    className?: string;
};

const MeritBadgeRibbon: React.FC<MeritBadgeRibbonProps> = ({ className = '' }) => {
    return (
        <svg
            width="167"
            height="131"
            viewBox="0 0 167 131"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="83.1426" cy="65.5" r="64" fill="white" stroke="white" strokeWidth="3" />
            <path
                d="M29.3926 3.70096C28.9354 3.437 28.3731 3.43281 27.912 3.68993C27.4509 3.94705 27.159 4.42762 27.1432 4.95531L26.3214 32.5274L2.85421 47.0252C2.40508 47.3026 2.13488 47.7958 2.14274 48.3236C2.15061 48.8515 2.43538 49.3363 2.89258 49.6003L137.608 127.378C138.065 127.642 138.627 127.646 139.088 127.389C139.549 127.132 139.841 126.651 139.857 126.124L140.679 98.5517L164.146 84.0539C164.595 83.7764 164.865 83.2833 164.857 82.7554C164.85 82.2276 164.565 81.7427 164.108 81.4787L29.3926 3.70096Z"
                fill="#622599"
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <rect x="22.1426" y="4.5" width="123" height="123" rx="61.5" fill="white" />
            <rect
                x="22.1426"
                y="4.5"
                width="123"
                height="123"
                rx="61.5"
                stroke="#622599"
                strokeWidth="3"
            />
            <rect
                x="28.6426"
                y="11"
                width="110"
                height="110"
                rx="55"
                stroke="#622599"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5 5"
            />
            <rect x="33.6426" y="16" width="100" height="100" fill="url(#pattern0_10101_43072)" />
            <defs>
                <pattern
                    id="pattern0_10101_43072"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                >
                    <use xlinkHref="#image0_10101_43072" transform="scale(0.00416667)" />
                </pattern>
            </defs>
        </svg>
    );
};

export default MeritBadgeRibbon;
