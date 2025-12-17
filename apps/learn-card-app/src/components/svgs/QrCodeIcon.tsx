import React from 'react';

export const QrCodeIcon: React.FC<{
    className?: string;
    strokeWidth?: number;
    shadeColor?: string;
}> = ({ className, strokeWidth, shadeColor = '#E2E3E9' }) => {
    return (
        <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M0.99292 19.1094V23.6945C0.99292 25.2146 2.21644 26.4381 3.73656 26.4381H8.32166"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.32166 1.42578H3.73656C2.21644 1.42578 0.99292 2.6493 0.99292 4.16943V8.75452"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M26.007 8.75452V4.16943C26.007 2.6493 24.7834 1.42578 23.2633 1.42578H18.6782"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M18.6907 26.4381H23.2758C24.7959 26.4381 26.0194 25.2146 26.0194 23.6945V19.1094"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.0282 5.90234H6.08473C5.74346 5.90234 5.4668 6.179 5.4668 6.52028V11.4638C5.4668 11.8051 5.74346 12.0817 6.08473 12.0817H11.0282C11.3695 12.0817 11.6462 11.8051 11.6462 11.4638V6.52028C11.6462 6.179 11.3695 5.90234 11.0282 5.90234Z"
                fill="#E2E3E9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.0282 15.7891H6.08473C5.74346 15.7891 5.4668 16.0657 5.4668 16.407V21.3505C5.4668 21.6918 5.74346 21.9684 6.08473 21.9684H11.0282C11.3695 21.9684 11.6462 21.6918 11.6462 21.3505V16.407C11.6462 16.0657 11.3695 15.7891 11.0282 15.7891Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.3538 17.7524V16.4663C15.3538 16.0938 15.5318 15.7891 15.7495 15.7891H17.8255"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21.533 15.7891V21.3505C21.533 21.6904 21.3806 21.9684 21.1944 21.9684H20.2971"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.9152 5.90234H15.9717C15.6304 5.90234 15.3538 6.179 15.3538 6.52028V11.4638C15.3538 11.8051 15.6304 12.0817 15.9717 12.0817H20.9152C21.2565 12.0817 21.5331 11.8051 21.5331 11.4638V6.52028C21.5331 6.179 21.2565 5.90234 20.9152 5.90234Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.9717 21.9663C16.313 21.9663 16.5896 21.6897 16.5896 21.3484C16.5896 21.0071 16.313 20.7305 15.9717 20.7305C15.6304 20.7305 15.3538 21.0071 15.3538 21.3484C15.3538 21.6897 15.6304 21.9663 15.9717 21.9663Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default QrCodeIcon;
