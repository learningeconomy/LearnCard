import React from 'react';
import './batch-delivery-animation.scss';

/** A decorative delivery scene; the adjacent text is the source of progress information. */
export const BatchDeliveryAnimation: React.FC<{ active: boolean }> = ({ active }) => (
    <div
        aria-hidden="true"
        className={`batch-delivery-illustration relative h-36 w-full overflow-hidden rounded-2xl bg-emerald-50 text-grayscale-900 ${active ? 'batch-delivery-illustration--active' : ''}`}
    >
        {[0, 1, 2].map(cloud => (
            <svg
                key={cloud}
                viewBox="0 0 150 50"
                fill="currentColor"
                focusable="false"
                className={`batch-delivery-cloud batch-delivery-cloud--${cloud} absolute h-12 w-36 text-white`}
            >
                <path d="M22 42a17 17 0 0 1-1-34 24 24 0 0 1 43 3 18 18 0 0 1 30 7 12 12 0 0 1 0 24Z" />
            </svg>
        ))}
        <div className="batch-delivery-flight absolute inset-0">
            <svg
                viewBox="0 0 112 128"
                className="batch-delivery-ufo h-32 w-28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                focusable="false"
            >
                <g className="batch-delivery-drop">
                    <path
                        d="M44 76h16l9 9v23a3 3 0 0 1-3 3H44a3 3 0 0 1-3-3V79a3 3 0 0 1 3-3Z"
                        className="fill-white stroke-emerald-600"
                    />
                    <path d="M60 76v9h9M47 89h8" className="stroke-emerald-600" />
                    <circle
                        cx="55"
                        cy="100"
                        r="6"
                        className="fill-emerald-100 stroke-emerald-600"
                    />
                    <path d="m52 100 2 2 4-4" className="stroke-emerald-700" />
                </g>
                <path
                    d="m42 55-13 47h54L70 55Z"
                    className="batch-delivery-beam fill-emerald-200 stroke-none"
                    opacity=".35"
                />
                <path
                    d="M24 34c-16 8-10 18 32 21 42-3 48-13 32-21-15-9-49-9-64 0Z"
                    className="fill-grayscale-900"
                />
                <ellipse
                    cx="56"
                    cy="35"
                    rx="35"
                    ry="7"
                    className="fill-white stroke-grayscale-900"
                />
                <path d="M34 35a22 22 0 0 1 44 0" className="fill-emerald-100 stroke-emerald-700" />
                <path d="M43 25c2-5 7-8 12-8" className="stroke-white" strokeWidth="3" />
                <g className="fill-emerald-300 stroke-none">
                    <circle cx="30" cy="44" r="2" />
                    <circle cx="47" cy="48" r="2" />
                    <circle cx="65" cy="48" r="2" />
                    <circle cx="82" cy="44" r="2" />
                </g>
            </svg>
        </div>
    </div>
);
