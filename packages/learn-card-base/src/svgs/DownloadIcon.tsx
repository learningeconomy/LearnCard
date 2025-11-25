import React from 'react';

type DownloadIconProps = {
    className?: string;
};

const DownloadIcon: React.FC<DownloadIconProps> = ({ className = '' }) => {
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
                d="M12.6276 16.0779L12.6276 3.53516"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.666 13.0273L12.6285 16.0773L9.59102 13.0273"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.4543 8.46484H18.4262C20.546 8.46484 22.2637 10.1826 22.2637 12.3034V17.3909C22.2637 19.5055 20.5501 21.219 18.4355 21.219L6.83138 21.219C4.71159 21.219 2.99284 19.5003 2.99284 17.3805V12.2919C2.99284 10.1784 4.70742 8.46484 6.82096 8.46484L7.80221 8.46484"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default DownloadIcon;
