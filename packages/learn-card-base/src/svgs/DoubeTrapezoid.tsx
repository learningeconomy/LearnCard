import React from 'react';

export const DoubleTrapezoid: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="652"
            height="700"
            viewBox="0 0 652 700"
            fill="none"
            className={className}
        >
            <path d="M651.724 350L3.08505e-05 700L6.60158e-05 0L651.724 350Z" fill="#20C397" />
            <path d="M0 350L651.724 1.32579e-05V350L651.724 700L0 350Z" fill="#20C397" />
        </svg>
    );
};

export default DoubleTrapezoid;
