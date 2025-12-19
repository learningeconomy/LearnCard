import React from 'react';

type LearnCardBrandmarkProps = {
    className?: string;
};

const LearnCardBrandmark: React.FC<LearnCardBrandmarkProps> = ({ className = '' }) => {
    return (
        <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clipPath="url(#clip0_13141_30473)">
                <rect width="50" height="50" rx="6" fill="white" />
                <rect x="16.6665" width="16.6667" height="16.6667" fill="#40CBA6" />
                <rect x="33.3335" width="16.6667" height="16.6667" fill="#59D4F4" />
                <rect x="33.3335" y="16.6665" width="16.6667" height="16.6667" fill="#60A5FA" />
                <rect x="33.3335" y="33.3335" width="16.6667" height="16.6667" fill="#8B5CF6" />
                <rect x="16.6665" y="33.3335" width="16.6667" height="16.6667" fill="#F472B6" />
                <rect y="33.3335" width="16.6667" height="16.6667" fill="#FCD34D" />
                <rect y="16.6665" width="16.6667" height="16.6667" fill="#BEF264" />
                <rect width="16.6667" height="16.6667" fill="#5EEAD4" />
                <path
                    d="M20.2383 18.5376H23.2458V28.8875H29.7621V31.2927H20.2383V18.5376Z"
                    fill="#18224E"
                />
            </g>
            <defs>
                <clipPath id="clip0_13141_30473">
                    <rect width="50" height="50" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default LearnCardBrandmark;
