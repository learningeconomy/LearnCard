import React from 'react';

const TrashBin: React.FC<{ className?: string; version?: string; strokeWidth?: string }> = ({
    className = '',
    version,
    strokeWidth = '1.5',
}) => {
    if (version === '2') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="31"
                viewBox="0 0 30 31"
                fill="none"
                className={className}
            >
                <path
                    d="M25.312 6.99512L4.68701 6.99512"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M12.1875 12.6201V20.1201"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M17.8125 12.6201V20.1201"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M23.437 6.99512V24.8076C23.437 25.0563 23.3382 25.2947 23.1624 25.4705C22.9866 25.6463 22.7482 25.7451 22.4995 25.7451H7.49951C7.25087 25.7451 7.01241 25.6463 6.8366 25.4705C6.66078 25.2947 6.56201 25.0563 6.56201 24.8076V6.99512"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M19.6875 6.99512V5.12012C19.6875 4.62284 19.49 4.14592 19.1383 3.79429C18.7867 3.44266 18.3098 3.24512 17.8125 3.24512H12.1875C11.6902 3.24512 11.2133 3.44266 10.8617 3.79429C10.51 4.14592 10.3125 4.62284 10.3125 5.12012V6.99512"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            className={className}
        >
            <path
                d="M23.4375 6.56251V24.375C23.4375 24.6236 23.3387 24.8621 23.1629 25.0379C22.9871 25.2137 22.7486 25.3125 22.5 25.3125H7.5C7.25136 25.3125 7.0129 25.2137 6.83709 25.0379C6.66127 24.8621 6.5625 24.6236 6.5625 24.375V6.5625L23.4375 6.56251Z"
                fill="currentColor"
                fillOpacity="0.1"
            />
            <path
                d="M25.3125 6.5625L4.6875 6.56251"
                stroke="#18224E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.1875 12.1875V19.6875"
                stroke="#18224E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.8125 12.1875V19.6875"
                stroke="#18224E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.4375 6.56251V24.375C23.4375 24.6236 23.3387 24.8621 23.1629 25.0379C22.9871 25.2137 22.7486 25.3125 22.5 25.3125H7.5C7.25136 25.3125 7.0129 25.2137 6.83709 25.0379C6.66127 24.8621 6.5625 24.6236 6.5625 24.375V6.5625"
                stroke="#18224E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19.6875 6.5625V4.6875C19.6875 4.19022 19.49 3.71331 19.1383 3.36167C18.7867 3.01004 18.3098 2.8125 17.8125 2.8125H12.1875C11.6902 2.8125 11.2133 3.01004 10.8617 3.36167C10.51 3.71331 10.3125 4.19022 10.3125 4.6875V6.5625"
                stroke="#18224E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default TrashBin;
