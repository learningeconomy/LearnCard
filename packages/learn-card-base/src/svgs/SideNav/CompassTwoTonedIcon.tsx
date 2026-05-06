import React from 'react';

export const CompassTwoTonedIcon: React.FC<{
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
            <circle cx="16" cy="16" r="13" fill={shadeColor} />
            <circle
                cx="16"
                cy="16"
                r="13"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
            />
            <path d="M16 6 L19 16 L13 16 Z" fill="currentColor" />
            {/* South half is pinned mid-grayscale (not currentColor) so the
                two-toned needle still reads as two halves when the side
                menu's active state inverts the icon's text colour. */}
            <path d="M16 26 L13 16 L19 16 Z" fill="#6F7590" />
            <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
    );
};

export default CompassTwoTonedIcon;
