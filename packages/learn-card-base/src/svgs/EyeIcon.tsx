import React from 'react';

const EyeIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="21"
            height="17"
            viewBox="0 0 21 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.7932 8.55547C13.7932 10.3742 12.3182 11.8482 10.4995 11.8482C8.68075 11.8482 7.20679 10.3742 7.20679 8.55547C7.20679 6.73568 8.68075 5.26172 10.4995 5.26172C12.3182 5.26172 13.7932 6.73568 13.7932 8.55547Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.4979 16.1617C14.4646 16.1617 18.0927 13.3096 20.1354 8.55547C18.0927 3.8013 14.4646 0.949219 10.4979 0.949219H10.5021C6.5354 0.949219 2.90727 3.8013 0.864563 8.55547C2.90727 13.3096 6.5354 16.1617 10.5021 16.1617H10.4979Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default EyeIcon;
