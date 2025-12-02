import React from 'react';

export const ScanIcon: React.FC<{
    className?: string;
    strokeWidth?: number;
    shadeColor?: string;
}> = ({ className, strokeWidth, shadeColor = '#E2E3E9' }) => {
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
                d="M4.99292 23.1094V27.6945C4.99292 29.2146 6.21644 30.4381 7.73656 30.4381H12.3217"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.3217 5.42578H7.73656C6.21644 5.42578 4.99292 6.6493 4.99292 8.16943V12.7545"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M30.007 12.7545V8.16943C30.007 6.6493 28.7834 5.42578 27.2633 5.42578H22.6782"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M22.6907 30.4381H27.2758C28.7959 30.4381 30.0194 29.2146 30.0194 27.6945V23.1094"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.0282 9.90234H10.0847C9.74346 9.90234 9.4668 10.179 9.4668 10.5203V15.4638C9.4668 15.8051 9.74346 16.0817 10.0847 16.0817H15.0282C15.3695 16.0817 15.6462 15.8051 15.6462 15.4638V10.5203C15.6462 10.179 15.3695 9.90234 15.0282 9.90234Z"
                fill={shadeColor}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.0282 19.7891H10.0847C9.74346 19.7891 9.4668 20.0657 9.4668 20.407V25.3505C9.4668 25.6918 9.74346 25.9684 10.0847 25.9684H15.0282C15.3695 25.9684 15.6462 25.6918 15.6462 25.3505V20.407C15.6462 20.0657 15.3695 19.7891 15.0282 19.7891Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19.3538 21.7524V20.4663C19.3538 20.0938 19.5318 19.7891 19.7495 19.7891H21.8255"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M25.533 19.7891V25.3505C25.533 25.6904 25.3806 25.9684 25.1944 25.9684H24.2971"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M24.9152 9.90234H19.9717C19.6304 9.90234 19.3538 10.179 19.3538 10.5203V15.4638C19.3538 15.8051 19.6304 16.0817 19.9717 16.0817H24.9152C25.2565 16.0817 25.5331 15.8051 25.5331 15.4638V10.5203C25.5331 10.179 25.2565 9.90234 24.9152 9.90234Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19.9717 25.9663C20.313 25.9663 20.5896 25.6897 20.5896 25.3484C20.5896 25.0071 20.313 24.7305 19.9717 24.7305C19.6304 24.7305 19.3538 25.0071 19.3538 25.3484C19.3538 25.6897 19.6304 25.9663 19.9717 25.9663Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ScanIcon;
