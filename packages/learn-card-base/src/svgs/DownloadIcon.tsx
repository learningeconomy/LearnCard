import React from 'react';

type DownloadIconProps = {
    className?: string;
};

const DownloadIcon: React.FC<DownloadIconProps> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            className={className}
        >
            <path
                d="M8.33325 17.7085L12.4999 21.8752L16.6666 17.7085"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.5 12.5V21.875"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21.7499 18.8437C22.6555 18.2068 23.3347 17.298 23.6887 16.249C24.0428 15.2001 24.0535 14.0656 23.7191 13.0102C23.3847 11.9548 22.7227 11.0334 21.8291 10.3797C20.9356 9.72601 19.857 9.37406 18.7499 9.37493H17.4374C17.1241 8.15396 16.5379 7.01998 15.7229 6.05835C14.908 5.09671 13.8855 4.33249 12.7324 3.82322C11.5793 3.31394 10.3258 3.07288 9.06607 3.11818C7.80637 3.16348 6.57335 3.49396 5.45985 4.08475C4.34635 4.67554 3.38138 5.51123 2.6376 6.52892C1.89381 7.54661 1.39058 8.71977 1.1658 9.96009C0.941014 11.2004 1.00054 12.4756 1.33988 13.6895C1.67922 14.9035 2.28954 16.0247 3.1249 16.9687"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default DownloadIcon;
