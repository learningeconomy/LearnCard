import React from 'react';

type SignOutIconProps = {
    className?: string;
};

const SignOutIcon: React.FC<SignOutIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="41"
            height="40"
            viewBox="0 0 41 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M27.6919 13.4375L34.2544 20L27.6919 26.5625"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.75 20H34.25"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19.25 33.75H8C7.66848 33.75 7.35054 33.6183 7.11612 33.3839C6.8817 33.1495 6.75 32.8315 6.75 32.5V7.5C6.75 7.16848 6.8817 6.85054 7.11612 6.61612C7.35054 6.3817 7.66848 6.25 8 6.25H19.25"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SignOutIcon;
