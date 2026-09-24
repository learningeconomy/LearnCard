import React from 'react';
import './ShareCredentialsIllustration.css';

/** Decorative credential bundle, matching Passport's outlined category artwork. */
export const ShareCredentialsIllustration = ({ complete = false }: { complete?: boolean }) => (
    <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 80 80"
        className="h-20 w-20 overflow-visible text-grayscale-900"
    >
        <path d="M40 3 69 17 77 47 56 72 24 75 4 51 9 21Z" className="fill-emerald-100" />
        <g
            className="share-credentials-cards"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="15"
                y="17"
                width="38"
                height="47"
                rx="7"
                transform="rotate(-14 34 40)"
                className="fill-emerald-300"
            />
            <rect
                x="26"
                y="15"
                width="38"
                height="47"
                rx="7"
                transform="rotate(12 45 38)"
                className="fill-amber-200"
            />
            <rect x="20" y="20" width="38" height="47" rx="7" fill="white" />
            <path d="m39 28 3 5 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1Z" className="fill-emerald-200" />
            <path d="M29 53h20M29 58h13" className="stroke-grayscale-400" />
        </g>
        <g
            key={String(complete)}
            className="share-credentials-arrow"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="61" cy="58" r="15" className="fill-emerald-400" />
            {complete ? (
                <path d="m54 58 5 5 9-10" fill="none" />
            ) : (
                <path d="M53 64v-4a7 7 0 0 1 7-7h8m-5-5 5 5-5 5" fill="none" />
            )}
        </g>
        <path
            className="share-credentials-sparkle stroke-emerald-600"
            d="M68 9v8m-4-4h8"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);
