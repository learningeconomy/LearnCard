import React from 'react';

export const GearPlusIcon: React.FC<{ className?: string; fill?: string }> = ({
    className,
    fill = 'white',
}) => {
    return (
        <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g filter="url(#filter0_d_1350_17786)">
                <path
                    d="M8.25951 4.57366C10.6697 4.86088 12.1182 4.08663 13.0548 1.92624C13.4544 1.00214 14.6033 0.714923 15.4025 1.31434C17.2133 2.70048 18.7867 2.70048 20.5975 1.31434C21.3842 0.714923 22.5456 1.00214 22.9452 1.92624C23.8693 4.07414 25.3179 4.86088 27.7405 4.57366C28.7145 4.46127 29.5387 5.29795 29.4263 6.25951C29.1391 8.66966 29.9134 10.1182 32.0738 11.0548C32.9979 11.4544 33.2851 12.6033 32.6857 13.4025C31.2995 15.2133 31.2995 16.7867 32.6857 18.5975C33.2851 19.3842 32.9979 20.5456 32.0738 20.9452C29.9259 21.8693 29.1391 23.3179 29.4263 25.7405C29.5387 26.7145 28.7021 27.5387 27.7405 27.4263C25.3303 27.1391 23.8818 27.9134 22.9452 30.0738C22.5456 30.9979 21.3967 31.2851 20.5975 30.6857C18.7867 29.2995 17.2133 29.2995 15.4025 30.6857C14.6158 31.2851 13.4544 30.9979 13.0548 30.0738C12.1307 27.9259 10.6821 27.1391 8.25951 27.4263C7.28546 27.5387 6.46127 26.7021 6.57366 25.7405C6.86088 23.3303 6.08663 21.8818 3.92624 20.9452C3.00214 20.5456 2.71492 19.3967 3.31434 18.5975C4.70048 16.7867 4.70048 15.2133 3.31434 13.4025C2.71492 12.6158 3.00214 11.4544 3.92624 11.0548C6.07414 10.1307 6.86088 8.68214 6.57366 6.25951C6.46127 5.28546 7.29795 4.46127 8.25951 4.57366Z"
                    fill={fill}
                />
            </g>
            <path
                d="M12.1069 15.572H23.8926"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M18 9.67896V21.4647"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <filter
                    id="filter0_d_1350_17786"
                    x="0"
                    y="0"
                    width="36"
                    height="36"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1.5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_1350_17786"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_1350_17786"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default GearPlusIcon;
