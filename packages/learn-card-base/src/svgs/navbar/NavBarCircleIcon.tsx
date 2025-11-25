import React from 'react';

export const NavBarCircleIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            width="57"
            height="56"
            viewBox="0 0 57 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g filter="url(#filter0_d_696_274)">
                <path
                    d="M12.2659 6.95609C16.2828 7.43479 18.6971 6.14439 20.258 2.54373C20.9241 1.00357 22.8389 0.524872 24.1709 1.5239C27.1888 3.83414 29.8112 3.83414 32.8291 1.5239C34.1403 0.524872 36.0759 1.00357 36.742 2.54373C38.2821 6.12357 40.6964 7.43479 44.7341 6.95609C46.3576 6.76878 47.7312 8.16325 47.5439 9.76585C47.0652 13.7828 48.3556 16.1971 51.9563 17.758C53.4964 18.4241 53.9751 20.3389 52.9761 21.6709C50.6659 24.6888 50.6659 27.3112 52.9761 30.3291C53.9751 31.6403 53.4964 33.5759 51.9563 34.242C48.3764 35.7821 47.0652 38.1964 47.5439 42.2341C47.7312 43.8576 46.3368 45.2312 44.7341 45.0439C40.7172 44.5652 38.3029 45.8556 36.742 49.4563C36.0759 50.9964 34.1611 51.4751 32.8291 50.4761C29.8112 48.1659 27.1888 48.1659 24.1709 50.4761C22.8597 51.4751 20.9241 50.9964 20.258 49.4563C18.7179 45.8764 16.3036 44.5652 12.2659 45.0439C10.6424 45.2312 9.26878 43.8368 9.45609 42.2341C9.93479 38.2172 8.64439 35.8029 5.04373 34.242C3.50357 33.5759 3.02487 31.6611 4.0239 30.3291C6.33414 27.3112 6.33414 24.6888 4.0239 21.6709C3.02487 20.3597 3.50357 18.4241 5.04373 17.758C8.62357 16.2179 9.93479 13.8036 9.45609 9.76585C9.26878 8.14244 10.6632 6.76878 12.2659 6.95609Z"
                    fill="white"
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_696_274"
                    x="0.5"
                    y="0"
                    width="56"
                    height="56"
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
                        result="effect1_dropShadow_696_274"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_696_274"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default NavBarCircleIcon;
