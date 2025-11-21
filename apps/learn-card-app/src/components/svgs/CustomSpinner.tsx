import React from 'react';

const CustomSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`w-6 h-6 ${className}`}>
            <svg
                className="w-full h-full animate-spin-custom"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M9 1.5C7.51664 1.5 6.06659 1.93987 4.83322 2.76398C3.59985 3.58809 2.63856 4.75943 2.0709 6.12987C1.50325 7.50032 1.35472 9.00832 1.64411 10.4632C1.9335 11.918 2.6478 13.2544 3.6967 14.3033C4.74559 15.3522 6.08196 16.0665 7.53682 16.3559C8.99168 16.6453 10.4997 16.4968 11.8701 15.9291C13.2406 15.3614 14.4119 14.4001 15.236 13.1668C16.0601 11.9334 16.5 10.4834 16.5 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default CustomSpinner;
