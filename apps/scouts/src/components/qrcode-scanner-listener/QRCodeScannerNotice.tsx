import React from 'react';
import * as m from '../../paraglide/messages.js';

export const QRCodeScannerNotice: React.FC<{
    incompatible: boolean;
    onScanAgain: () => void;
    onDismiss: () => void;
}> = ({ incompatible, onScanAgain, onDismiss }) => (
    <div className="flex flex-col items-center p-6 text-center font-poppins">
        <div className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-700">
            <svg
                className="h-8 w-8"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M10 3H5a2 2 0 0 0-2 2v5m19-7h5a2 2 0 0 1 2 2v5M3 22v5a2 2 0 0 0 2 2h5m12 0h5a2 2 0 0 0 2-2v-5" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
                <rect x="18" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="18" width="5" height="5" rx="1" />
                <path d="M18 18h2v2m3-2v5h-5" />
            </svg>
        </div>

        <h2 className="m-0 text-xl font-semibold leading-snug text-grayscale-900">
            {incompatible ? m['scanner.incompatibleTitle']() : m['boost.somethingWentWrong']()}
        </h2>
        <p className="mb-0 mt-2 max-w-[28ch] text-sm leading-relaxed text-grayscale-600">
            {incompatible ? m['scanner.incompatible']() : m['error.generic']()}
        </p>

        <div className="mt-6 flex w-full flex-col gap-2">
            <button
                type="button"
                onClick={onScanAgain}
                className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
                {m['scanner.scanAnother']()}
            </button>
            <button
                type="button"
                onClick={onDismiss}
                className="w-full rounded-[20px] px-4 py-3 text-sm font-medium text-grayscale-600 transition-colors hover:bg-grayscale-100 hover:text-grayscale-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                {m['common.done']()}
            </button>
        </div>
    </div>
);
