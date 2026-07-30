import React from 'react';

const TwoToneProfile: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle
                opacity="0.4"
                cx="16.886"
                cy="9.88398"
                r="6.96796"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.83336 26.5429C5.83148 26.053 5.94103 25.5692 6.15372 25.1279C6.82115 23.7931 8.7033 23.0856 10.2651 22.7652C11.3914 22.5249 12.5334 22.3643 13.6823 22.2847C15.8096 22.0978 17.9491 22.0978 20.0763 22.2847C21.2252 22.3652 22.367 22.5258 23.4935 22.7652C25.0553 23.0856 26.9375 23.7263 27.6049 25.1279C28.0326 26.0274 28.0326 27.0717 27.6049 27.9712C26.9375 29.3728 25.0553 30.0135 23.4935 30.3205C22.3685 30.5708 21.2262 30.7359 20.0763 30.8144C18.3449 30.9612 16.6054 30.988 14.8704 30.8945C14.4699 30.8945 14.0828 30.8945 13.6823 30.8144C12.5368 30.7369 11.3988 30.5718 10.2784 30.3205C8.7033 30.0135 6.8345 29.3728 6.15372 27.9712C5.94212 27.5248 5.83268 27.0369 5.83336 26.5429Z"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default TwoToneProfile;
