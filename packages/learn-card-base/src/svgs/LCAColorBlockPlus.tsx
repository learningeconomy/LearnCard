import React from 'react';

export const LCAColorBlockPlus: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="127"
            height="127"
            viewBox="0 0 127 127"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clip-path="url(#clip0_5311_220238)">
                <rect width="127" height="127" rx="6" fill="white" />
                <rect x="42.3335" width="42.3333" height="42.3333" fill="#40CBA6" />
                <rect x="84.6665" width="42.3333" height="42.3333" fill="#59D4F4" />
                <rect x="84.6665" y="42.332" width="42.3333" height="42.3333" fill="#60A5FA" />
                <rect x="84.6665" y="84.668" width="42.3333" height="42.3333" fill="#8B5CF6" />
                <rect x="42.3335" y="84.668" width="42.3333" height="42.3333" fill="#F472B6" />
                <rect y="84.668" width="42.3333" height="42.3333" fill="#FCD34D" />
                <rect y="42.332" width="42.3333" height="42.3333" fill="#BEF264" />
                <rect width="42.3333" height="42.3333" fill="#5EEAD4" />
                <path
                    d="M51.4048 47.0859H59.0439V73.3746H75.5953V79.4839H51.4048V47.0859Z"
                    fill="#18224E"
                />
            </g>
            <rect
                x="1.5"
                y="1.5"
                width="124"
                height="124"
                rx="18.5"
                stroke="white"
                stroke-width="3"
            />
            <g filter="url(#filter0_d_5311_220238)">
                <path
                    d="M41.7462 37.4812C47.1289 38.1226 50.3641 36.3935 52.4558 31.5686C53.3482 29.5048 55.9141 28.8633 57.699 30.202C61.743 33.2977 65.257 33.2977 69.301 30.202C71.058 28.8633 73.6518 29.5048 74.5442 31.5686C76.608 36.3656 79.8432 38.1226 85.2538 37.4812C87.4291 37.2302 89.2698 39.0988 89.0188 41.2462C88.3774 46.6289 90.1065 49.8641 94.9314 51.9558C96.9952 52.8482 97.6367 55.4141 96.298 57.199C93.2023 61.243 93.2023 64.757 96.298 68.801C97.6367 70.558 96.9952 73.1518 94.9314 74.0442C90.1344 76.108 88.3774 79.3432 89.0188 84.7538C89.2698 86.9291 87.4012 88.7698 85.2538 88.5188C79.8711 87.8774 76.6359 89.6065 74.5442 94.4314C73.6518 96.4952 71.0859 97.1367 69.301 95.798C65.257 92.7023 61.743 92.7023 57.699 95.798C55.942 97.1367 53.3482 96.4952 52.4558 94.4314C50.392 89.6344 47.1568 87.8774 41.7462 88.5188C39.5709 88.7698 37.7302 86.9012 37.9812 84.7538C38.6226 79.3711 36.8935 76.1359 32.0686 74.0442C30.0048 73.1518 29.3633 70.5859 30.702 68.801C33.7977 64.757 33.7977 61.243 30.702 57.199C29.3633 55.442 30.0048 52.8482 32.0686 51.9558C36.8656 49.892 38.6226 46.6568 37.9812 41.2462C37.7302 39.0709 39.5988 37.2302 41.7462 37.4812Z"
                    fill="white"
                />
            </g>
            <path
                d="M53.6191 63H72.0441"
                stroke="#18224E"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M62.8315 53.7891V72.2141"
                stroke="#18224E"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <defs>
                <filter
                    id="filter0_d_5311_220238"
                    x="27"
                    y="28.5"
                    width="73"
                    height="73"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
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
                        result="effect1_dropShadow_5311_220238"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_5311_220238"
                        result="shape"
                    />
                </filter>
                <clipPath id="clip0_5311_220238">
                    <rect width="127" height="127" rx="20" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default LCAColorBlockPlus;
