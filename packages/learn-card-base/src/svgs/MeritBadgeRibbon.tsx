import React from 'react';

type MeritBadgeRibbonProps = {
    className?: string;
    image: string;
};

const MeritBadgeRibbon: React.FC<MeritBadgeRibbonProps> = ({ className = '', image }) => {
    return (
        <svg
            width="138"
            height="110"
            viewBox="0 0 138 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="69.0591" cy="55" r="52.5" fill="white" stroke="white" strokeWidth="5" />
            <path
                d="M23.5298 3.13397C23.225 2.958 22.8501 2.95521 22.5427 3.12662C22.2354 3.29804 22.0407 3.61842 22.0302 3.97021L21.3394 27.149L1.61135 39.3367C1.31193 39.5217 1.1318 39.8505 1.13704 40.2024C1.14228 40.5543 1.33213 40.8775 1.63693 41.0535L114.22 106.054C114.525 106.229 114.9 106.232 115.207 106.061C115.515 105.889 115.709 105.569 115.72 105.217L116.411 82.0385L136.139 69.8507C136.438 69.6658 136.618 69.337 136.613 68.9851C136.608 68.6332 136.418 68.3099 136.113 68.134L23.5298 3.13397Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <rect x="17.5591" y="3.5" width="103" height="103" rx="51.5" fill="white" />
            <rect
                x="17.5591"
                y="3.5"
                width="103"
                height="103"
                rx="51.5"
                stroke="currentColor"
                strokeWidth="3"
            />

            <clipPath id="circleClip1">
                <circle cx="69.0591" cy="55" r="48" />
            </clipPath>
            <image
                xlinkHref={image}
                x="21.0591"
                y="7"
                width="96"
                height="96"
                clipPath="url(#circleClip1)"
                preserveAspectRatio="xMidYMid slice"
            />
        </svg>
    );
};

export default MeritBadgeRibbon;
