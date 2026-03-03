import React from 'react';

const Pencil: React.FC<{ className?: string; version?: number; strokeWidth?: string }> = ({
    className = '',
    version = 1, // 3 = PencilSimple
    strokeWidth,
}) => {
    if (version === 2) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                className={className}
            >
                <path
                    d="M18.4167 3.24903C18.7013 2.96449 19.0391 2.73879 19.4108 2.58481C19.7826 2.43082 20.181 2.35156 20.5834 2.35156C20.9858 2.35156 21.3842 2.43082 21.756 2.58481C22.1278 2.73879 22.4656 2.96449 22.7501 3.24903C23.0346 3.53356 23.2603 3.87134 23.4143 4.2431C23.5683 4.61486 23.6475 5.0133 23.6475 5.41569C23.6475 5.81808 23.5683 6.21653 23.4143 6.58828C23.2603 6.96004 23.0346 7.29783 22.7501 7.58236L8.12508 22.2074L2.16675 23.8324L3.79175 17.874L18.4167 3.24903Z"
                    stroke="currentColor"
                    strokeWidth={strokeWidth ?? '2'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    } else if (version === 3) {
        return (
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M15 33.7518H7.5C7.16848 33.7518 6.85054 33.6201 6.61612 33.3856C6.3817 33.1512 6.25 32.8333 6.25 32.5018V25.5195C6.25 25.3554 6.28233 25.1928 6.34515 25.0412C6.40797 24.8895 6.50004 24.7517 6.61612 24.6356L25.3661 5.88565C25.6005 5.65123 25.9185 5.51953 26.25 5.51953C26.5815 5.51953 26.8995 5.65123 27.1339 5.88565L34.1161 12.8679C34.3505 13.1023 34.4822 13.4202 34.4822 13.7518C34.4822 14.0833 34.3505 14.4012 34.1161 14.6356L15 33.7518Z"
                    stroke="currentColor"
                    strokeWidth={strokeWidth ?? '2.5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M21.25 10L30 18.75"
                    stroke="currentColor"
                    strokeWidth={strokeWidth ?? '2.5'}
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
                d="M15.9375 7.50035L22.5 14.0628L25.5871 10.9758C25.7629 10.7999 25.8617 10.5615 25.8617 10.3128C25.8617 10.0642 25.7629 9.82575 25.5871 9.64993L20.3504 4.41326C20.1746 4.23744 19.9361 4.13867 19.6875 4.13867C19.4389 4.13867 19.2004 4.23744 19.0246 4.41326L15.9375 7.50035Z"
                fill="currentColor"
                fillOpacity="0.1"
            />
            <path
                d="M11.19 25.2535L4.74707 18.8105"
                stroke="currentColor"
                strokeWidth={strokeWidth ?? '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.8617 25.3128H5.625C5.37636 25.3128 5.1379 25.2141 4.96209 25.0383C4.78627 24.8624 4.6875 24.624 4.6875 24.3753V19.1387C4.6875 19.0156 4.71175 18.8936 4.75886 18.7799C4.80598 18.6662 4.87503 18.5628 4.96209 18.4758L19.0246 4.41326C19.2004 4.23744 19.4389 4.13867 19.6875 4.13867C19.9361 4.13867 20.1746 4.23744 20.3504 4.41326L25.5871 9.64993C25.7629 9.82575 25.8617 10.0642 25.8617 10.3128C25.8617 10.5615 25.7629 10.7999 25.5871 10.9758L11.5246 25.0383C11.4375 25.1253 11.3342 25.1944 11.2204 25.2415C11.1067 25.2886 10.9848 25.3128 10.8617 25.3128Z"
                stroke="currentColor"
                strokeWidth={strokeWidth ?? '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.9375 7.5L22.5 14.0625"
                stroke="currentColor"
                strokeWidth={strokeWidth ?? '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Pencil;
