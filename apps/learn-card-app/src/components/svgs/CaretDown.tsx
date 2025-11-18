import React from 'react';

const CaretDown: React.FC<{ className?: string; version?: '1' | '2' }> = ({
    className = '',
    version = '1',
}) => {
    if (version === '2') {
        return (
            <svg
                width="24"
                height="24"
                viewBox="0 0 25 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M20 9L12.5 16.5L5 9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="16"
            viewBox="0 0 15 16"
            fill="none"
            className={className}
        >
            <path
                d="M12.6206 5.94561C12.5851 5.85996 12.525 5.78675 12.4479 5.73525C12.3708 5.68374 12.2802 5.65625 12.1875 5.65625H2.8125C2.71979 5.65625 2.62916 5.68374 2.55208 5.73525C2.47499 5.78676 2.41491 5.85997 2.37943 5.94562C2.34395 6.03128 2.33467 6.12553 2.35276 6.21646C2.37085 6.30739 2.41549 6.39091 2.48105 6.45646L7.16855 11.144C7.21208 11.1875 7.26375 11.222 7.32062 11.2456C7.37749 11.2691 7.43845 11.2813 7.5 11.2813C7.56156 11.2813 7.62251 11.2691 7.67938 11.2456C7.73625 11.222 7.78793 11.1875 7.83145 11.144L12.519 6.45646C12.5845 6.39091 12.6292 6.30738 12.6472 6.21645C12.6653 6.12552 12.6561 6.03127 12.6206 5.94561Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default CaretDown;
