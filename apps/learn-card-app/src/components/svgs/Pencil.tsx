import React from 'react';

const Pencil: React.FC<{ className?: string; version?: number; strokeWidth?: string }> = ({
    className = '',
    version = 1,
    strokeWidth = '2',
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
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className={className}
        >
            <path
                d="M9 20.2518H4.5C4.30109 20.2518 4.11032 20.1728 3.96967 20.0322C3.82902 19.8915 3.75 19.7008 3.75 19.5018V15.3125C3.75 15.214 3.7694 15.1165 3.80709 15.0255C3.84478 14.9345 3.90003 14.8518 3.96967 14.7822L15.2197 3.53217C15.3603 3.39152 15.5511 3.3125 15.75 3.3125C15.9489 3.3125 16.1397 3.39152 16.2803 3.53217L20.4697 7.72151C20.6103 7.86216 20.6893 8.05293 20.6893 8.25184C20.6893 8.45075 20.6103 8.64152 20.4697 8.78217L9 20.2518Z"
                stroke="#18224E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.75 6L18 11.25"
                stroke="black"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Pencil;
