import React from 'react';

type CornerDownRightArrowProps = {
    className?: string;
};

const CornerDownRightArrow: React.FC<CornerDownRightArrowProps> = ({ className = '' }) => {
    return (
        <svg
            width="25"
            height="26"
            viewBox="0 0 25 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M15.625 10.918L20.8333 16.1263L15.625 21.3346"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.16699 4.66797V11.9596C4.16699 13.0647 4.60598 14.1245 5.38738 14.9059C6.16878 15.6873 7.22859 16.1263 8.33366 16.1263H20.8337"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CornerDownRightArrow;
