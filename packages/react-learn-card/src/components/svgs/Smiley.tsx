import React from 'react';

type SmileyProps = {
    className?: string;
};

const Smiley: React.FC<SmileyProps> = ({ className = '' }) => {
    return (
        <svg
            width="35"
            height="36"
            viewBox="0 0 35 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M17.5 30.7008C24.7487 30.7008 30.625 24.8245 30.625 17.5758C30.625 10.3271 24.7487 4.45081 17.5 4.45081C10.2513 4.45081 4.375 10.3271 4.375 17.5758C4.375 24.8245 10.2513 30.7008 17.5 30.7008Z"
                stroke="#FBFBFC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.1846 20.8566C22.608 21.8538 21.7792 22.6818 20.7815 23.2575C19.7837 23.8332 18.652 24.1362 17.5001 24.1362C16.3482 24.1363 15.2165 23.8332 14.2187 23.2576C13.2209 22.6819 12.3921 21.8539 11.8156 20.8567"
                stroke="#FBFBFC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.5781 16.2086C13.3332 16.2086 13.9453 15.5965 13.9453 14.8414C13.9453 14.0864 13.3332 13.4742 12.5781 13.4742C11.823 13.4742 11.2109 14.0864 11.2109 14.8414C11.2109 15.5965 11.823 16.2086 12.5781 16.2086Z"
                fill="#FBFBFC"
            />
            <path
                d="M22.4219 16.2086C23.177 16.2086 23.7891 15.5965 23.7891 14.8414C23.7891 14.0864 23.177 13.4742 22.4219 13.4742C21.6668 13.4742 21.0547 14.0864 21.0547 14.8414C21.0547 15.5965 21.6668 16.2086 22.4219 16.2086Z"
                fill="#FBFBFC"
            />
        </svg>
    );
};

export default Smiley;
