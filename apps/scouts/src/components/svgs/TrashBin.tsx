import React from 'react';

const TrashBin: React.FC<{ className?: string; version?: 1 | 2 }> = ({
    className = '',
    version = 1,
}) => {
    if (version === 1) {
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
                    fill="#18224E"
                    fillOpacity="0.1"
                />
                <path
                    d="M25.3125 6.5625L4.6875 6.56251"
                    stroke="#18224E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M12.1875 12.1875V19.6875"
                    stroke="#18224E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M17.8125 12.1875V19.6875"
                    stroke="#18224E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M23.4375 6.56251V24.375C23.4375 24.6236 23.3387 24.8621 23.1629 25.0379C22.9871 25.2137 22.7486 25.3125 22.5 25.3125H7.5C7.25136 25.3125 7.0129 25.2137 6.83709 25.0379C6.66127 24.8621 6.5625 24.6236 6.5625 24.375V6.5625"
                    stroke="#18224E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M19.6875 6.5625V4.6875C19.6875 4.19022 19.49 3.71331 19.1383 3.36167C18.7867 3.01004 18.3098 2.8125 17.8125 2.8125H12.1875C11.6902 2.8125 11.2133 3.01004 10.8617 3.36167C10.51 3.71331 10.3125 4.19022 10.3125 4.6875V6.5625"
                    stroke="#18224E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    } else if (version === 2) {
        return (
            <svg
                width="61"
                height="61"
                viewBox="0 0 61 61"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M8 15.4336H13H53"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M20.5 15.4336V10.4336C20.5 9.10751 21.0268 7.83574 21.9645 6.89806C22.9021 5.96038 24.1739 5.43359 25.5 5.43359H35.5C36.8261 5.43359 38.0979 5.96038 39.0355 6.89806C39.9732 7.83574 40.5 9.10751 40.5 10.4336V15.4336M48 15.4336V50.4336C48 51.7597 47.4732 53.0314 46.5355 53.9691C45.5979 54.9068 44.3261 55.4336 43 55.4336H18C16.6739 55.4336 15.4021 54.9068 14.4645 53.9691C13.5268 53.0314 13 51.7597 13 50.4336V15.4336H48Z"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M35.5 27.9336V42.9336"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M25.5 27.9336V42.9336"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
};

export default TrashBin;
