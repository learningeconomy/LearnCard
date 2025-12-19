import React from 'react';

const QRCodeIcon: React.FC<{
    className?: string;
    strokeWidth?: number;
    height?: string;
    width?: string;
}> = ({ className, strokeWidth, height, width }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 30 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12.1875 6.05859H6.5625C6.04473 6.05859 5.625 6.47833 5.625 6.99609V12.6211C5.625 13.1389 6.04473 13.5586 6.5625 13.5586H12.1875C12.7053 13.5586 13.125 13.1389 13.125 12.6211V6.99609C13.125 6.47833 12.7053 6.05859 12.1875 6.05859Z"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.1875 17.3086H6.5625C6.04473 17.3086 5.625 17.7283 5.625 18.2461V23.8711C5.625 24.3889 6.04473 24.8086 6.5625 24.8086H12.1875C12.7053 24.8086 13.125 24.3889 13.125 23.8711V18.2461C13.125 17.7283 12.7053 17.3086 12.1875 17.3086Z"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23.4375 6.05859H17.8125C17.2947 6.05859 16.875 6.47833 16.875 6.99609V12.6211C16.875 13.1389 17.2947 13.5586 17.8125 13.5586H23.4375C23.9553 13.5586 24.375 13.1389 24.375 12.6211V6.99609C24.375 6.47833 23.9553 6.05859 23.4375 6.05859Z"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.875 17.3086V21.0586"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.875 24.8086H20.625V17.3086"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.625 19.1836H24.375"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M24.375 22.9336V24.8086"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default QRCodeIcon;
