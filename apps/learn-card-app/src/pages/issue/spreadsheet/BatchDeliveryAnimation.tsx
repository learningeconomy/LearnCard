import React from 'react';
import './batch-delivery-animation.scss';

/** Decorative motion only; the adjacent status text reports actual progress. */
export const BatchDeliveryAnimation: React.FC<{ active: boolean }> = ({ active }) => (
    <div
        aria-hidden="true"
        className={`batch-delivery-illustration flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-emerald-50 text-grayscale-900 ${active ? 'batch-delivery-illustration--active' : ''}`}
    >
        <svg
            viewBox="0 0 72 64"
            className="h-14 w-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
        >
            <path d="M9 45h7M7 38h7M12 51h7" className="stroke-grayscale-300" />
            <circle
                cx="55"
                cy="16"
                r="1.5"
                className="batch-delivery-spark fill-emerald-500 stroke-none"
            />
            <circle
                cx="60"
                cy="27"
                r="1"
                className="batch-delivery-spark fill-grayscale-400 stroke-none"
            />
            <g className="batch-delivery-card">
                <path
                    d="M23 29c-5-8-12-9-13-5-1 4 7 11 14 12M47 29c5-8 12-9 13-5 1 4-7 11-14 12"
                    className="fill-emerald-100 stroke-emerald-600"
                />
                <path
                    d="M28 11h12l9 9v28a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Z"
                    className="fill-white"
                />
                <path d="M40 11v9h9" className="fill-emerald-100" />
                <path d="M30 24h8M30 29h12" className="stroke-grayscale-400" />
                <circle cx="36" cy="40" r="6" className="fill-emerald-100 stroke-emerald-600" />
                <path d="m33 40 2 2 4-4" className="stroke-emerald-700" />
            </g>
        </svg>
    </div>
);
