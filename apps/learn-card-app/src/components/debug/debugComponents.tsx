import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WIDGET_ENABLED =
    import.meta.env.VITE_ENABLE_AUTH_DEBUG_WIDGET === 'true' || import.meta.env.DEV;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const truncate = (s: string, len: number): string =>
    s.length > len ? s.slice(0, len) + '...' : s;

export const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + date.getMilliseconds().toString().padStart(3, '0');

/** Short fingerprint for a share/key: first4…last4 */
export const fingerprint = (s: string | null | undefined): string => {
    if (!s || s.length < 12) return s ?? '—';

    return `${s.slice(0, 4)}…${s.slice(-4)}`;
};

export const levelDot: Record<string, string> = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-sky-400',
};

export const levelText: Record<string, string> = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-sky-400',
};

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

export const KVRow: React.FC<{
    label: string;
    value: unknown;
    mono?: boolean;
    copied: string | null;
    onCopy: (key: string, value: unknown) => void;
}> = ({ label, value, mono = true, copied, onCopy }) => {
    const display = typeof value === 'boolean'
        ? (value ? 'true' : 'false')
        : (value === null || value === undefined ? '—' : String(value));

    const color = typeof value === 'boolean'
        ? (value ? 'text-emerald-400' : 'text-red-400')
        : (display === '—' ? 'text-gray-600' : 'text-cyan-400');

    return (
        <div className="flex items-center justify-between text-[11px] py-[3px] border-t border-gray-700/40 group">
            <span className="text-gray-500 shrink-0">{label}</span>

            <div className="flex items-center gap-1 min-w-0 ml-2">
                <span className={`${color} ${mono ? 'font-mono' : ''} text-[10px] truncate max-w-[160px]`}>
                    {display}
                </span>

                <button
                    onClick={() => onCopy(label, value)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-600 transition-all shrink-0"
                    title="Copy"
                >
                    {copied === label
                        ? <Check className="w-2.5 h-2.5 text-emerald-400" />
                        : <Copy className="w-2.5 h-2.5 text-gray-500" />}
                </button>
            </div>
        </div>
    );
};

export const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, badge, actions, children }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="bg-gray-800/80 rounded-lg overflow-hidden">
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen(!open)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[11px] font-semibold text-gray-200">{title}</span>
                    {badge}
                </div>

                <div className="flex items-center gap-1">
                    {actions && open && (
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                            {actions}
                        </div>
                    )}
                    {open
                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                </div>
            </div>

            {open && <div className="px-3 pb-2">{children}</div>}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Copy-to-clipboard hook
// ---------------------------------------------------------------------------

export const useCopyToClipboard = (): [string | null, (key: string, value: unknown) => void] => {
    const [copied, setCopied] = React.useState<string | null>(null);

    const copyToClipboard = React.useCallback(async (key: string, value: unknown) => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        } catch { /* ignore */ }
    }, []);

    return [copied, copyToClipboard];
};
