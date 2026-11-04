import React from 'react';

type PencilProps = {
    className?: string;
};

const Pencil: React.FC<PencilProps> = ({ className = '' }) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 25 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.3905 5.66176C14.1582 4.68364 15.3988 4.73468 16.378 5.50239L17.8259 6.63781C18.8051 7.40551 19.1519 8.59614 18.3842 9.57635L9.74987 20.592C9.46132 20.9607 9.0207 21.1784 8.55195 21.1836L5.22174 21.2263L4.46757 17.9816C4.36132 17.5263 4.46757 17.0472 4.75612 16.6774L13.3905 5.66176Z"
                stroke="#6F7590"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.7737 7.72461L16.7674 11.6392"
                stroke="#6F7590"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Pencil;
