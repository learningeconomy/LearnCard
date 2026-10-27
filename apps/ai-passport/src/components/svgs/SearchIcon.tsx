import React from 'react';

type SearchIconProps = {
    className?: string;
};

const SearchIcon: React.FC<SearchIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M11.458 20.833C16.6357 20.833 20.833 16.6357 20.833 11.458C20.833 6.28034 16.6357 2.08301 11.458 2.08301C6.28034 2.08301 2.08301 6.28034 2.08301 11.458C2.08301 16.6357 6.28034 20.833 11.458 20.833Z"
                stroke="#353E64"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M22.9167 22.9167L18.75 18.75"
                stroke="#353E64"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SearchIcon;
