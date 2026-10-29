import React from 'react';

export const inputClass =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
export const buttonClass =
    'py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
export const primaryClass = `${buttonClass} bg-grayscale-900 text-white hover:opacity-90`;
export const panelClass = 'p-6 bg-white border border-grayscale-200 rounded-[20px] space-y-4';
export const Field: React.FC<React.PropsWithChildren<{ label: string; htmlFor: string }>> = ({
    label,
    htmlFor,
    children,
}) => (
    <div className="space-y-1.5">
        <label htmlFor={htmlFor} className="block text-xs font-medium text-grayscale-700">
            {label}
        </label>
        {children}
    </div>
);
export const Notice: React.FC<React.PropsWithChildren<{ error?: boolean }>> = ({
    error,
    children,
}) => (
    <div
        role={error ? 'alert' : 'status'}
        className={`p-3 border rounded-2xl text-sm leading-relaxed ${error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}
    >
        {children}
    </div>
);
export const Busy: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center gap-2">
        <span
            aria-hidden="true"
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
        {children}
    </span>
);
export const DeferredFeatures = () => (
    <aside className="p-4 rounded-2xl bg-amber-50 text-grayscale-700 text-sm space-y-2">
        <h2 className="font-semibold">Not supported yet</h2>
        <p>
            Email controls and emailed metrics are unavailable. Full-audience sending needs exact
            eligible counts for each selected channel.
        </p>
        <button type="button" disabled className={buttonClass}>
            Send Notifications — unavailable
        </button>
        <p>
            Audience totals are stored membership, not exact send counts. Imports report eligible
            matches, not newly added members or per-row not-found results.
        </p>
    </aside>
);
