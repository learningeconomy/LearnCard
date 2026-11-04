import React from 'react';

/**
 * School Connect tile icon.
 * Designed to fill a square parent (root is `size-full`).
 */
const SchoolConnectTileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative size-full ${className ?? ''}`} aria-hidden="true">
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 size-full"
        >
            {/* Background Gradient */}
            <rect width="100" height="100" rx="20" fill="url(#schoolConnectGradient)" />

            {/* Graduation Cap */}
            <path
                d="M50 25L20 38L50 51L80 38L50 25Z"
                fill="white"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <path
                d="M30 42.5V60C30 65 50 70 50 70C50 70 70 65 70 60V42.5"
                fill="white"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M80 38V55"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="80" cy="58" r="3" fill="#18224E" />

            {/* Link Motif */}
            <path
                d="M42 75C38 75 35 72 35 68C35 64 38 61 42 61H48"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M58 61C62 61 65 64 65 68C65 72 62 75 58 75H52"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M44 68H56"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <defs>
                <linearGradient
                    id="schoolConnectGradient"
                    x1="0"
                    y1="0"
                    x2="100"
                    y2="100"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A7F3D0" />
                    <stop offset="1" stopColor="#059669" />
                </linearGradient>
            </defs>
        </svg>
    </div>
);

export default SchoolConnectTileIcon;
