import React from 'react';

const TwoToneWork: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                opacity="0.4"
                d="M4.08931 22.5703C4.08931 22.5703 4.2964 25.1049 4.34452 25.9041C4.40869 26.9759 4.82286 28.1732 5.51411 29.0045C6.48973 30.1828 7.6389 30.5984 9.17306 30.6014C10.977 30.6043 24.0947 30.6043 25.8987 30.6014C27.4329 30.5984 28.582 30.1828 29.5576 29.0045C30.2489 28.1732 30.6631 26.9759 30.7287 25.9041C30.7754 25.1049 30.9824 22.5703 30.9824 22.5703"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.39 7.77081V7.22977C12.39 5.4506 13.8308 4.00977 15.61 4.00977H19.3754C21.1531 4.00977 22.5954 5.4506 22.5954 7.22977L22.5969 7.77081"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.4927 24.3226V22.4355"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.01027 12.233V17.2891C6.80736 19.1339 10.1586 20.4259 13.8365 20.9378C14.2769 19.3322 15.7251 18.1553 17.4853 18.1553C19.2178 18.1553 20.6951 19.3322 21.1063 20.9524C24.7988 20.4405 28.1632 19.1484 30.9749 17.2891V12.233C30.9749 9.7626 28.9871 7.77344 26.5167 7.77344H8.48298C6.01256 7.77344 4.01027 9.7626 4.01027 12.233Z"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default TwoToneWork;
