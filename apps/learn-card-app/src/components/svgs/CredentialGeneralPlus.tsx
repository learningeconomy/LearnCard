import React from 'react';

type CredentialGeneralPlusProps = {
    className?: string;
    plusColor?: string;
};

const CredentialGeneralPlus: React.FC<CredentialGeneralPlusProps> = ({
    className = '',
    plusColor = '#353E64',
}) => {
    return (
        <svg
            width="46"
            height="47"
            viewBox="0 0 46 47"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g filter="url(#filter0_d_4168_156847)">
                <path
                    d="M11.0949 8.46741C14.0407 8.81846 15.8111 7.87216 16.9559 5.23168C17.4443 4.10223 18.8485 3.75118 19.8253 4.4838C22.0384 6.17798 23.9615 6.17798 26.1746 4.4838C27.1362 3.75118 28.5556 4.10223 29.0441 5.23168C30.1735 7.8569 31.944 8.81846 34.905 8.46741C36.0955 8.33004 37.1029 9.35266 36.9655 10.5279C36.6144 13.4736 37.5607 15.2441 40.2012 16.3888C41.3307 16.8773 41.6817 18.2814 40.9491 19.2583C39.2549 21.4714 39.2549 23.3945 40.9491 25.6076C41.6817 26.5692 41.3307 27.9886 40.2012 28.477C37.576 29.6065 36.6144 31.377 36.9655 34.338C37.1029 35.5285 36.0802 36.5358 34.905 36.3985C31.9593 36.0474 30.1888 36.9937 29.0441 39.6342C28.5556 40.7637 27.1515 41.1147 26.1746 40.3821C23.9615 38.6879 22.0384 38.6879 19.8253 40.3821C18.8637 41.1147 17.4443 40.7637 16.9559 39.6342C15.8264 37.009 14.0559 36.0474 11.0949 36.3985C9.90441 36.5358 8.89706 35.5132 9.03443 34.338C9.38547 31.3922 8.43918 29.6218 5.7987 28.477C4.66925 27.9886 4.3182 26.5844 5.05082 25.6076C6.745 23.3945 6.745 21.4714 5.05082 19.2583C4.3182 18.2967 4.66925 16.8773 5.7987 16.3888C8.42391 15.2594 9.38547 13.4889 9.03443 10.5279C8.89706 9.33739 9.91967 8.33004 11.0949 8.46741Z"
                    fill="white"
                />
            </g>
            <path
                d="M16.4458 22.4336H29.5541"
                stroke={plusColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23 15.8789V28.9872"
                stroke={plusColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <filter
                    id="filter0_d_4168_156847"
                    x="0.666626"
                    y="2.09961"
                    width="44.6666"
                    height="44.666"
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
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_4168_156847"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_4168_156847"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default CredentialGeneralPlus;
