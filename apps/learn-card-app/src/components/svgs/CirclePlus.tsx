import React from 'react';

export const CirclePlus: React.FC<{ className?: string }> = ({ className }) => {
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
                d="M32.0835 16.0418V17.5002C32.0687 20.4436 31.1637 23.3136 29.4873 25.733C27.8108 28.1523 25.4416 30.0078 22.6909 31.0554C19.9402 32.1031 16.9369 32.2938 14.0758 31.6026C11.2147 30.9114 8.62968 29.3707 6.66063 27.1828C4.69159 24.995 3.43066 22.2625 3.04363 19.3447C2.65659 16.4268 3.16156 13.4601 4.49215 10.8346C5.82274 8.20912 7.91666 6.0477 10.4986 4.63452C13.0806 3.22134 16.0298 2.62254 18.9585 2.91684"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.333 7.29199H32.083"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M27.708 2.91699V11.667"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CirclePlus;
