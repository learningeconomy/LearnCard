import React from 'react';

type RefreshIconProps = {
    className?: string;
};

const RefreshIcon: React.FC<RefreshIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="28"
            height="25"
            viewBox="0 0 28 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M5.33158 9.90409C5.87972 7.99252 7.01894 6.30355 8.58599 5.07924C10.153 3.85493 12.0674 3.15815 14.0548 3.08874C16.0422 3.01934 18.0006 3.58089 19.6492 4.69291C21.2978 5.80492 22.5521 7.41031 23.2322 9.27899"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.0591 16.1611C22.3507 17.8399 21.1705 19.2772 19.6615 20.2986C18.1524 21.32 16.3795 21.8816 14.5576 21.9154C12.7357 21.9491 10.9432 21.4536 9.39736 20.4888C7.85153 19.524 6.61883 18.1314 5.84874 16.48"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.95117 15.5566L5.27727 15.9532L3.99013 18.3302"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.8896 10.1357L23.5636 9.73923L24.8507 7.36219"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default RefreshIcon;
