import React from 'react';

const LearnCardIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 41 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clipPath="url(#clip0_2105_143753)">
                <rect x="0.5" width="40" height="40" rx="6" fill="white" />
                <rect x="13.8333" width="13.3333" height="13.3333" fill="#40CBA6" />
                <rect x="27.1667" width="13.3333" height="13.3333" fill="#59D4F4" />
                <rect x="27.1667" y="13.333" width="13.3333" height="13.3333" fill="#60A5FA" />
                <rect x="27.1667" y="26.667" width="13.3333" height="13.3333" fill="#8B5CF6" />
                <rect x="13.8333" y="26.667" width="13.3333" height="13.3333" fill="#F472B6" />
                <rect x="0.5" y="26.667" width="13.3333" height="13.3333" fill="#FCD34D" />
                <rect x="0.5" y="13.333" width="13.3333" height="13.3333" fill="#BEF264" />
                <rect x="0.5" width="13.3333" height="13.3333" fill="#5EEAD4" />
                <path
                    d="M16.6904 14.8301H19.0964V23.11H24.3095V25.0342H16.6904V14.8301Z"
                    fill="#18224E"
                />
            </g>
            <defs>
                <clipPath id="clip0_2105_143753">
                    <rect x="0.5" width="40" height="40" rx="20" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default LearnCardIcon;
