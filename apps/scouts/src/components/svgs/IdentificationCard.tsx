import React from 'react';

type IdentificationCardProps = {
    className?: string;
    color?: string;
};

const IdentificationCard: React.FC<IdentificationCardProps> = ({
    className = '',
    color = '#353E64',
}) => {
    return (
        <svg
            width="30"
            height="31"
            viewBox="0 0 20 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M11.875 9.25H15"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.875 11.75H15"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.19535 11.75C8.23088 11.75 9.07035 10.9105 9.07035 9.875C9.07035 8.83947 8.23088 8 7.19535 8C6.15981 8 5.32035 8.83947 5.32035 9.875C5.32035 10.9105 6.15981 11.75 7.19535 11.75Z"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.77412 13.625C4.91283 13.0883 5.22591 12.613 5.66415 12.2736C6.10239 11.9342 6.64097 11.75 7.19526 11.75C7.74955 11.75 8.28814 11.9341 8.72641 12.2735C9.16467 12.6128 9.47778 13.0882 9.61653 13.6248"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.875 4.25H3.125C2.77982 4.25 2.5 4.52982 2.5 4.875V16.125C2.5 16.4702 2.77982 16.75 3.125 16.75H16.875C17.2202 16.75 17.5 16.4702 17.5 16.125V4.875C17.5 4.52982 17.2202 4.25 16.875 4.25Z"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IdentificationCard;
