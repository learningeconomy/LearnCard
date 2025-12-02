import React from 'react';

const ArrowCircle: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className={className}
        >
            <path
                d="M21 2V8H15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M21 13.0001C20.7877 15.0061 19.9077 16.8825 18.5011 18.3284C17.0946 19.7742 15.2431 20.7057 13.2438 20.9732C11.2445 21.2408 9.21321 20.8289 7.476 19.8037C5.73879 18.7786 4.39634 17.1995 3.66405 15.32C2.93177 13.4405 2.85212 11.3694 3.43788 9.43922C4.02364 7.509 5.24085 5.83152 6.89418 4.67595C8.54752 3.52038 10.5411 2.95373 12.5551 3.06692C14.5691 3.18012 16.4866 3.96659 18 5.30015L21 8.00014"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default ArrowCircle;
