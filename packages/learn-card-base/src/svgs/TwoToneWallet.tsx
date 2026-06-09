import React from 'react';

const TwoToneWallet: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M31.5568 20.9941H25.653C23.4853 20.9928 21.7282 19.237 21.7269 17.0693C21.7269 14.9016 23.4853 13.1459 25.653 13.1445H31.5568"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M26.3209 16.979H25.8663"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.2987 4.375H23.9037C28.1301 4.375 31.5565 7.80137 31.5565 12.0278V22.4944C31.5565 26.7208 28.1301 30.1472 23.9037 30.1472H11.2987C7.0722 30.1472 3.64583 26.7208 3.64583 22.4944V12.0278C3.64583 7.80137 7.0722 4.375 11.2987 4.375Z"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                opacity="0.4"
                d="M10.2603 10.9927H18.1337"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default TwoToneWallet;
