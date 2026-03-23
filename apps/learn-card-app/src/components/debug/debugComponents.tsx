import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, ScrollText, Trash2, Download } from 'lucide-react';

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

// ---------------------------------------------------------------------------
// Reusable Event Timeline component
// ---------------------------------------------------------------------------

export interface TimelineEvent {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    data?: Record<string, unknown>;
    level: 'info' | 'success' | 'warning' | 'error';
}

export const EventTimeline: React.FC<{
    events: TimelineEvent[];
    copied: string | null;
    onCopy: (key: string, value: unknown) => void;
    onClear: () => void;
    onExport: () => void;
    exportCopied?: boolean;
    title?: string;
    emptyMessage?: string;
}> = ({ events, copied, onCopy, onClear, onExport, exportCopied = false, title = 'Event Timeline', emptyMessage = 'Events appear as actions occur' }) => {
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    const toggleEventExpanded = useCallback((eventId: string) => {
        setExpandedEvents(prev => {
            const next = new Set(prev);

            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }

            return next;
        });
    }, []);

    return (
        <Section
            title={title}
            icon={<ScrollText className="w-3 h-3 text-gray-500" />}
            defaultOpen
            badge={events.length > 0 ? (
                <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded-full font-medium">
                    {events.length}
                </span>
            ) : undefined}
            actions={events.length > 0 ? (
                <div className="flex items-center gap-0.5">
                    <button onClick={onExport} className="p-1 rounded hover:bg-gray-600 transition-colors" title={exportCopied ? 'Copied!' : 'Export events'}>
                        {exportCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3 text-gray-500" />}
                    </button>

                    <button onClick={onClear} className="p-1 rounded hover:bg-gray-600 transition-colors" title="Clear events">
                        <Trash2 className="w-3 h-3 text-gray-500" />
                    </button>
                </div>
            ) : undefined}
        >
            <div className="max-h-48 overflow-y-auto -mx-1">
                {events.length === 0 ? (
                    <p className="text-[10px] text-gray-600 text-center py-3">
                        {emptyMessage}
                    </p>
                ) : (
                    <div className="space-y-0.5">
                        {events.map((event) => {
                            const isExpanded = expandedEvents.has(event.id);

                            return (
                                <div key={event.id} className="rounded bg-gray-900/50 hover:bg-gray-900/80 transition-colors overflow-hidden">
                                    <button
                                        onClick={() => toggleEventExpanded(event.id)}
                                        className="w-full flex items-start gap-1.5 py-1 px-2 text-left"
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${levelDot[event.level] ?? levelDot.info}`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[8px] text-gray-600 font-mono">{formatTime(event.timestamp)}</span>
                                                <span className={`text-[8px] font-semibold ${levelText[event.level] ?? levelText.info}`}>{event.type}</span>
                                            </div>

                                            <p className={`text-[9px] text-gray-400 ${isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
                                                {event.message}
                                            </p>
                                        </div>

                                        <ChevronRight className={`w-2.5 h-2.5 text-gray-600 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </button>

                                    {isExpanded && event.data && (
                                        <div className="px-2 pb-1.5 ml-4">
                                            <pre className="text-[8px] text-gray-500 bg-gray-950 rounded p-1.5 overflow-x-auto whitespace-pre-wrap break-words">
                                                {JSON.stringify(event.data, null, 2)}
                                            </pre>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onCopy(event.id, JSON.stringify(event.data, null, 2)); }}
                                                className="text-[8px] text-gray-600 hover:text-gray-400 mt-0.5"
                                            >
                                                {copied === event.id ? 'Copied!' : 'Copy data'}
                                            </button>
                                        </div>
                                    )}

                                    {isExpanded && !event.data && (
                                        <p className="text-[8px] text-gray-600 italic px-2 pb-1.5 ml-4">No additional data</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Section>
    );
};
