import React from 'react';

type GenericDocumentIconProps = {
    className?: string;
};

const GenericDocumentIcon: React.FC<GenericDocumentIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="31"
            height="38"
            viewBox="0 0 31 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M0.5 3.66675C0.5 2.0099 1.84315 0.666748 3.5 0.666748H13.6813C16.3361 0.666748 18.8555 1.83885 20.5655 3.86953L28.3842 13.1542C29.7507 14.7769 30.5 16.8301 30.5 18.9515V34.3334C30.5 35.9903 29.1569 37.3334 27.5 37.3334H3.5C1.84315 37.3334 0.5 35.9903 0.5 34.3334V3.66675Z"
                fill="#FF3636"
            />
        </svg>
    );
};

export default GenericDocumentIcon;
