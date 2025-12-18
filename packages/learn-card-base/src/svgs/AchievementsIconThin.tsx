import React from 'react';

const AchievementsIconThin: React.FC<{ className?: string; shadeColor?: string }> = ({
    className,
    shadeColor = '#E2E3E9',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="29"
            height="30"
            viewBox="0 0 29 30"
            fill="none"
            className={className}
        >
            <path
                d="M7.20337 1.5293H23.2083V9.53175C23.2083 13.9435 19.6176 17.5342 15.2058 17.5342C10.7941 17.5342 7.20337 13.9435 7.20337 9.53175V1.5293Z"
                fill={shadeColor}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinejoin="round"
            />
            <path
                d="M23.2083 4.92383V9.53167C23.2083 11.3944 22.5711 13.0978 21.5049 14.4581H24.0294C26.7132 14.4581 28.8823 12.289 28.8823 9.6052V4.92383H23.2083Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinejoin="round"
            />
            <path
                d="M7.20332 9.53167V4.92383H1.5293V9.6052C1.5293 12.289 3.69841 14.4581 6.38224 14.4581H8.90675C7.84057 13.0978 7.20332 11.3944 7.20332 9.53167Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinejoin="round"
            />
            <path
                d="M12.473 23.4043H17.9387C19.7769 23.4043 21.272 24.8994 21.272 26.7376V29.4705H9.13965V26.7376C9.13965 24.8994 10.6347 23.4043 12.473 23.4043Z"
                fill={shadeColor}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinejoin="round"
            />
            <path
                d="M15.2058 17.5342V23.4043"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default AchievementsIconThin;
