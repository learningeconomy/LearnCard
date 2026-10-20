import React from 'react';
import './batch-delivery-animation.scss';

// LearnCardBrandmark colors, confined to this decorative scene.
const CREDENTIAL_COLORS = ['#40CBA6', '#59D4F4', '#60A5FA', '#8B5CF6', '#F472B6', '#FCD34D'];

/** Decorative motion only; the adjacent status text supplies actual delivery progress. */
export const BatchDeliveryAnimation: React.FC<{ active: boolean }> = ({ active }) => (
    <div
        aria-hidden="true"
        className={`batch-delivery-illustration relative h-24 sm:h-28 w-full overflow-hidden rounded-2xl text-grayscale-900 ${active ? 'batch-delivery-illustration--active' : ''}`}
    >
        {[0, 1, 2].map(cloud => (
            <svg
                key={cloud}
                viewBox="0 -8 150 60"
                fill="currentColor"
                focusable="false"
                className={`batch-delivery-cloud batch-delivery-cloud--${cloud} absolute h-14 w-36 text-white`}
            >
                <path d="M22 42a17 17 0 0 1-1-34 24 24 0 0 1 43 3 18 18 0 0 1 30 7 12 12 0 0 1 0 24Z" />
            </svg>
        ))}
        {CREDENTIAL_COLORS.map((color, index) => (
            <div
                key={color}
                className="batch-delivery-flight absolute inset-0"
                style={
                    {
                        color,
                        '--delivery-delay': `${-index * 2}s`,
                        '--delivery-position': `${8 + index * 17}%`,
                        '--delivery-rest-y': `${index % 2 ? 28 : 10}px`,
                    } as React.CSSProperties
                }
            >
                <svg
                    viewBox="0 0 40 52"
                    className="batch-delivery-credential"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                >
                    <path
                        d="M7 3h18l9 9v33a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                        fill="currentColor"
                        fillOpacity=".3"
                        strokeOpacity=".75"
                    />
                    <path d="M25 3v9h9" fill="white" fillOpacity=".7" strokeOpacity=".75" />
                    <path d="M11 17h12M11 22h8" strokeOpacity=".65" />
                    <circle cx="20" cy="35" r="8" fill="white" fillOpacity=".9" stroke="none" />
                    <path d="m16 35 3 3 5-6" className="stroke-grayscale-700" strokeWidth="1.8" />
                </svg>
            </div>
        ))}
    </div>
);
