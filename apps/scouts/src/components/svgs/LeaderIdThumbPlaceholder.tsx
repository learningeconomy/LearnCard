import React from 'react';

type LeaderIdThumbPlaceholderProps = {
    className?: string;
};

const LeaderIdThumbPlaceholder: React.FC<LeaderIdThumbPlaceholderProps> = ({ className = '' }) => {
    return (
        <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="80" height="80" transform="translate(0 0.5)" fill="#82E6DE" />
            <path
                d="M65 32.5C65 46.308 53.807 57.5011 39.9989 57.5011C26.1909 57.5011 15 46.308 15 32.5H65Z"
                fill="#0094B4"
            />
        </svg>
    );
};

export default LeaderIdThumbPlaceholder;
