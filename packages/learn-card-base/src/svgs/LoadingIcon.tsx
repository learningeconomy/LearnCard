import React from 'react';

type LoadingIconProps = {
    className?: string;
};

const LoadingIcon: React.FC<LoadingIconProps> = ({ className = '' }) => {
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
                d="M12.5 2.5C10.5222 2.5 8.58879 3.08649 6.9443 4.1853C5.29981 5.28412 4.01808 6.8459 3.2612 8.67317C2.50433 10.5004 2.30629 12.5111 2.69215 14.4509C3.078 16.3907 4.03041 18.1725 5.42893 19.5711C6.82746 20.9696 8.60929 21.922 10.5491 22.3079C12.4889 22.6937 14.4996 22.4957 16.3268 21.7388C18.1541 20.9819 19.7159 19.7002 20.8147 18.0557C21.9135 16.4112 22.5 14.4778 22.5 12.5"
                stroke="#05B65D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default LoadingIcon;
