import React from 'react';
import './batch-delivery-animation.scss';

/** A decorative delivery scene; the adjacent text is the source of progress information. */
export const BatchDeliveryAnimation: React.FC<{ active: boolean }> = ({ active }) => (
    <div
        aria-hidden="true"
        className={`batch-delivery-illustration relative h-24 sm:h-28 w-full overflow-hidden rounded-2xl text-grayscale-900 ${active ? 'batch-delivery-illustration--active' : ''}`}
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
                viewBox="0 0 128 96"
                className="batch-delivery-bird h-24 w-32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                focusable="false"
            >
                <g className="batch-delivery-drop">
                    <path d="M53 58h14l7 7v19H53Z" className="fill-white stroke-emerald-600" />
                    <path d="M67 58v7h7M58 69h5" className="stroke-emerald-600" />
                    <circle cx="63" cy="77" r="4" className="fill-emerald-100 stroke-emerald-600" />
                    <path d="m61 77 1.5 1.5 3-3" className="stroke-emerald-700" />
                </g>
                {/* Long trailing legs and a curved neck give our courier a crane silhouette. */}
                <path d="m37 48-24 6-7-2m33 0-24 9-7-1" className="stroke-grayscale-700" />
                <path
                    d="m27 37-13-7 8 17 16 6c13 5 25 0 31-9l8-15c2-4 8-5 12-2l5-3c-7-9-20-8-25 2L56 39c-8-8-20-9-29-2Z"
                    className="fill-white stroke-grayscale-700"
                />
                <path d="m94 24 18 6-19 1" className="fill-emerald-300 stroke-emerald-700" />
                <circle cx="87" cy="24" r="1.5" className="fill-grayscale-900 stroke-none" />
                <path
                    d="M76 19v-7c5-5 14-5 20 0l-1 8Z"
                    className="fill-grayscale-900 stroke-grayscale-900"
                />
                <path d="M75 19h25" className="stroke-grayscale-900" strokeWidth="3" />
                <path d="M82 12h8v5h-8Zm0 0 4 3 4-3" className="stroke-white" strokeWidth=".9" />
                <g className="batch-delivery-wing">
                    <path
                        d="M56 43C47 26 37 14 24 12c1 10 5 15 10 20l-10-3c5 10 15 17 27 19"
                        className="fill-white stroke-grayscale-700"
                    />
                    <path d="m33 23 14 17m-11-7 10 9" className="stroke-grayscale-300" />
                </g>
                <path d="m54 51 7 7 7-3" className="stroke-grayscale-700" />
            </svg>
        </div>
    </div>
);
