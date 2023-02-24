import React from 'react';

type GenericDocumentIconProps = {
    className?: string;
};

const GenericDocumentIcon: React.FC<GenericDocumentIconProps> = ({ className = '' }) => {
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
                d="M5.5 4.66675C5.5 3.0099 6.84315 1.66675 8.5 1.66675H18.6813C21.3361 1.66675 23.8555 2.83885 25.5655 4.86953L33.3842 14.1542C34.7507 15.7769 35.5 17.8301 35.5 19.9515V35.3334C35.5 36.9903 34.1569 38.3334 32.5 38.3334H8.5C6.84315 38.3334 5.5 36.9903 5.5 35.3334V4.66675Z"
                fill="#FF3636"
            />
            <path d="M22 13V2.5C26 3.5 34.5 14 35.5 18H27C23 18 22 16 22 13Z" fill="#FF7A7A" />
        </svg>
    );
};

export default GenericDocumentIcon;
