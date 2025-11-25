import React from 'react';

type WandProps = {
    size?: string;
    className?: string;
    color?: string;
    opacity?: string;
    type?: 'normal' | 'thick';
};
const Wand: React.FC<WandProps> = ({
    size = '30',
    className = '',
    color = '#FBFBFC',
    opacity = '0.7',
    type = 'normal',
}) => {
    if (type === 'normal') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 30 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <g opacity={opacity} clipPath="url(#clip0_367_8917)">
                    <path
                        d="M21.1701 8.66824C21.7951 8.41871 22.4199 9.02556 22.163 9.63272L20.7428 12.9894C20.6401 13.232 20.6776 13.5094 20.8412 13.7181L23.1798 16.7008C23.583 17.2152 23.16 17.949 22.4978 17.8839L18.7218 17.5123C18.4333 17.4839 18.1532 17.6173 17.9997 17.8563L15.7937 21.2895C15.4242 21.8645 14.5193 21.6933 14.3989 21.0257L13.752 17.4388C13.6967 17.1322 13.4495 16.8921 13.1338 16.8384L9.44119 16.21C8.75387 16.0931 8.57768 15.2141 9.16962 14.8552L12.704 12.7122C12.95 12.5631 13.0874 12.2911 13.0581 12.0108L12.6757 8.34297C12.6086 7.69976 13.3641 7.28885 13.8936 7.68056L16.9643 9.95218C17.1791 10.1111 17.4646 10.1475 17.7144 10.0478L21.1701 8.66824Z"
                        stroke={color}
                        strokeWidth="2"
                        strokeMiterlimit="3.3292"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M13.125 17.5576L1.54889e-06 30.3067"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M25.875 5.17383L24.686 6.32876"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="1"
                        y1="-1"
                        x2="2.13675"
                        y2="-1"
                        transform="matrix(0.717302 0.696762 -0.717302 0.696762 6.375 4.14258)"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="1"
                        y1="-1"
                        x2="2.13675"
                        y2="-1"
                        transform="matrix(0.717302 0.696762 -0.717302 0.696762 23.625 20.8984)"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="27.625"
                        y1="13.3418"
                        x2="28.807"
                        y2="13.3418"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="15.875"
                        y1="2.59082"
                        x2="15.875"
                        y2="1.49996"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_367_8917">
                        <rect width="30" height="30" fill="white" transform="translate(0 0.5)" />
                    </clipPath>
                </defs>
            </svg>
        );
    } else {
        // if (type === 'thick') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <g opacity={opacity} clipPath="url(#clip0_1296_48058)">
                    <path
                        d="M15.5751 6.66934C16.2001 6.4198 16.8249 7.02666 16.568 7.63382L15.7554 9.55425C15.6528 9.7969 15.6902 10.0742 15.8539 10.2829L17.2151 12.0192C17.6184 12.5335 17.1954 13.2674 16.5332 13.2022L14.3549 12.9879C14.0663 12.9595 13.7863 13.0929 13.6328 13.3318L12.3624 15.3089C11.993 15.8839 11.088 15.7127 10.9676 15.0451L10.6092 13.0579C10.5539 12.7513 10.3068 12.5112 9.9911 12.4575L7.94526 12.1093C7.25794 11.9924 7.08175 11.1134 7.6737 10.7545L9.70901 9.52044C9.95501 9.37129 10.0923 9.09928 10.0631 8.81903L9.84247 6.7031C9.77539 6.05989 10.5309 5.64898 11.0604 6.04069L12.8478 7.363C13.0627 7.52195 13.3482 7.55834 13.598 7.45861L15.5751 6.66934Z"
                        stroke={color}
                        strokeWidth="2"
                        strokeMiterlimit="3.3292"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M10.125 13.009L0.499999 22.3584"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M19.4746 3.92725L18.6027 4.77419"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="1"
                        y1="-1"
                        x2="1.30029"
                        y2="-1"
                        transform="matrix(0.717302 0.696762 -0.717302 0.696762 5.1748 3.17114)"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="1"
                        y1="-1"
                        x2="1.30029"
                        y2="-1"
                        transform="matrix(0.717302 0.696762 -0.717302 0.696762 17.8252 15.459)"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="21.0254"
                        y1="9.65063"
                        x2="21.3588"
                        y2="9.65063"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="11.875"
                        y1="1.7666"
                        x2="11.875"
                        y2="1.49997"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_1296_48058">
                        <rect width="22" height="22" fill="white" transform="translate(0.5 0.5)" />
                    </clipPath>
                </defs>
            </svg>
        );
    }
};

export default Wand;
