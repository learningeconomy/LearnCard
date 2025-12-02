import React from 'react';

type ChartIconProps = {
    className?: string;
};

const ChartIcon: React.FC<ChartIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M7.67853 11.125V18.271"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.5397 7.70703V18.2724"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.3215 14.9023V18.2722"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.381 2.58203H7.61909C4.21631 2.58203 2.08337 4.99045 2.08337 8.3999V17.5975C2.08337 21.0069 4.20639 23.4154 7.61909 23.4154H17.381C20.7937 23.4154 22.9167 21.0069 22.9167 17.5975V8.3999C22.9167 4.99045 20.7937 2.58203 17.381 2.58203Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ChartIcon;
