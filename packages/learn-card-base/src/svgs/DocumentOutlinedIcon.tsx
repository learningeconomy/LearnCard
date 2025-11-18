import React from 'react';

export const DocumentOutlinedIcon: React.FC<{ className?: string; fill?: string }> = ({
    className,
    fill = 'white',
}) => {
    return (
        <svg
            width="41"
            height="41"
            viewBox="0 0 41 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M8.75 3.09961H19.1182C20.775 3.09961 22.1182 4.44276 22.1182 6.09961V13.9326C22.1182 15.3132 23.2376 16.4325 24.6182 16.4326H31.75C33.4067 16.4326 34.7498 17.7759 34.75 19.4326V35.7666C34.7498 36.871 33.8545 37.7666 32.75 37.7666H8.75C7.64554 37.7666 6.75018 36.871 6.75 35.7666V5.09961L6.76074 4.89551C6.86301 3.88683 7.71435 3.09961 8.75 3.09961Z"
                fill={fill}
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M8.75 3.09961H18.9316C21.2913 3.09971 23.5308 4.14135 25.0508 5.94629L32.8691 15.2314C34.0837 16.6738 34.75 18.4991 34.75 20.3848V35.7666C34.7498 36.871 33.8545 37.7666 32.75 37.7666H8.75C7.64554 37.7666 6.75018 36.871 6.75 35.7666V5.09961L6.76074 4.89551C6.86301 3.88683 7.71435 3.09961 8.75 3.09961Z"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
};

export default DocumentOutlinedIcon;
