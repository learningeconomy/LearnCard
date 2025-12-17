import React from 'react';

const ExperiencesIconThin: React.FC<{ className?: string; shadeColor?: string }> = ({
    className,
    shadeColor = '#E2E3E9',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="31"
            height="21"
            viewBox="0 0 31 21"
            fill="none"
            className={className}
        >
            <path
                d="M12.4019 0.941895L1.55542 20.0581H14.4332L18.8408 12.2946L12.4019 0.941895Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.2483 20.0581H29.4444L21.9324 6.83276L18.8407 12.2945L14.4331 20.0581H23.2483Z"
                fill={shadeColor}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ExperiencesIconThin;
