import React from 'react';

type CrownProps = {
    className?: string;
};

const Crown: React.FC<CrownProps> = ({ className = '' }) => {
    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M3.3335 6.66602L8.3335 26.666H31.6668L36.6668 6.66602L26.6668 18.3327L20.0002 6.66602L13.3335 18.3327L3.3335 6.66602ZM8.3335 33.3327H31.6668H8.3335Z"
                fill="#9FED8F"
            />
            <path
                d="M8.3335 33.3327H31.6668M3.3335 6.66602L8.3335 26.666H31.6668L36.6668 6.66602L26.6668 18.3327L20.0002 6.66602L13.3335 18.3327L3.3335 6.66602Z"
                stroke="#248737"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Crown;
