import React from 'react';

export const DashboardTwoTonedIcon: React.FC<{
    className?: string;
    shadeColor?: string;
}> = ({ className = '', shadeColor = '#E2E3E9' }) => {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="5" y="5" width="9" height="13" rx="2" fill={shadeColor} />
            <rect x="5" y="5" width="9" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="18" y="5" width="9" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="5" y="22" width="9" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="18" y="17" width="9" height="10" rx="2" fill={shadeColor} />
            <rect x="18" y="17" width="9" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
};

export default DashboardTwoTonedIcon;
