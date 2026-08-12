import React from 'react';

export const AwardDisplayIcon: React.FC<{ className?: string; version?: string }> = ({
    className = '',
    version,
}) => {
    if (version === '2') {
        return (
            <svg
                width="26"
                height="25"
                viewBox="0 0 26 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <g clip-path="url(#clip0_2799_154595)">
                    <path
                        d="M4.66309 2.85742L25.7499 15.0319L21.9691 17.3676L21.8366 21.8098L0.749867 9.63532L4.53068 7.29957L4.66309 2.85742Z"
                        fill="#353E64"
                    />
                    <rect
                        x="3.91406"
                        y="3.04492"
                        width="18.7299"
                        height="18.7299"
                        rx="9.36497"
                        fill="#353E64"
                    />
                    <circle cx="13.2793" cy="12.4102" r="7.5" fill="#8B91A7" />
                </g>
                <defs>
                    <clipPath id="clip0_2799_154595">
                        <rect width="25" height="25" fill="#353E64" transform="translate(0.75)" />
                    </clipPath>
                </defs>
            </svg>
        );
    }

    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clip-path="url(#clip0_1980_73362)">
                <path
                    d="M0.260498 6.73633L19.7396 6.73633L18.0545 9.8669L19.7396 12.9975L0.260498 12.9975L1.94563 9.8669L0.260498 6.73633Z"
                    fill="#353E64"
                />
                <rect
                    x="-0.183716"
                    y="7.16602"
                    width="14.9839"
                    height="14.9839"
                    rx="7.49197"
                    transform="rotate(-30 -0.183716 7.16602)"
                    fill="#353E64"
                />
                <circle cx="10.0232" cy="9.92773" r="6" fill="#8B91A7" />
            </g>
        </svg>
    );
};

export default AwardDisplayIcon;
