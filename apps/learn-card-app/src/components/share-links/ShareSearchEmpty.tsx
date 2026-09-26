import React from 'react';
import * as m from '../../paraglide/messages.js';

/** Friendly, decorative search artwork; the adjacent text carries its meaning. */
export const ShareSearchEmpty = ({
    searching,
    onClear,
}: {
    searching: boolean;
    onClear: () => void;
}) => (
    <div className="flex flex-col items-center rounded-[20px] bg-grayscale-10 px-6 py-8 text-center">
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 120 96"
            className="mb-4 h-24 w-32 text-grayscale-900"
        >
            <path d="M24 12 76 6 105 37 94 78 42 89 13 60Z" className="fill-emerald-50" />
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect
                    x="26"
                    y="19"
                    width="43"
                    height="53"
                    rx="8"
                    transform="rotate(-12 47 45)"
                    className="fill-amber-100"
                />
                <rect x="35" y="18" width="43" height="55" rx="8" fill="white" />
                <path
                    d="m55 27 3 5 6 1-4 5 1 6-6-3-5 3 1-6-4-5 6-1Z"
                    className="fill-emerald-200"
                />
                <path d="M44 53h23M44 59h14" className="stroke-grayscale-300" />
                {searching ? (
                    <g>
                        <path d="m84 68 12 13" strokeWidth="8" className="stroke-emerald-300" />
                        <path d="m84 68 12 13" />
                        <circle cx="74" cy="57" r="18" className="fill-emerald-50" />
                        <path d="M64 55a10 10 0 0 1 10-8" className="stroke-emerald-400" />
                        <path d="M70 61h8" className="stroke-grayscale-400" />
                    </g>
                ) : (
                    <path d="M44 65h12" className="stroke-grayscale-300" />
                )}
                <path d="M91 17v8m-4-4h8" className="stroke-emerald-500" />
                <circle cx="18" cy="37" r="2" className="fill-amber-200 stroke-amber-300" />
            </g>
        </svg>
        <p className="max-w-xs text-sm leading-relaxed text-grayscale-600">
            {searching ? m['shareLinks.noSearchResults']() : m['shareLinks.empty']()}
        </p>
        {searching && (
            <button
                type="button"
                onClick={onClear}
                className="mt-4 rounded-[20px] border border-grayscale-300 bg-white px-4 py-2.5 text-sm font-medium text-grayscale-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                {m['shareLinks.clearSearch']()}
            </button>
        )}
    </div>
);
