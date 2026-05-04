import React, { useState } from 'react';
import {
    AlertCircle,
    RefreshCw,
    Home,
    ShieldAlert,
    Sparkles,
    WifiOff,
    Wrench,
    Send,
    Check,
} from 'lucide-react';

import {
    ExchangeErrorKind,
    FriendlyErrorInfo,
    getFriendlyOpenID4VCError,
} from '../../helpers/openid4vcErrors';
import { IssuerHeader, IssuerHeaderProps } from './IssuerHeader';
import { VerifierHeader, VerifierHeaderProps } from './VerifierHeader';

export interface ExchangeErrorDisplayProps {
    /**
     * The raw error caught from the OpenID4VC plugin (or any other shape).
     * If an instance of `Error` (or a plugin error class) is passed, the
     * component will translate it into friendly copy via
     * `getFriendlyOpenID4VCError`. If a fully-formed `FriendlyErrorInfo` is
     * passed via `friendly`, it will be used directly.
     */
    error?: unknown;

    /**
     * Pre-translated friendly copy. Takes precedence over `error`.
     */
    friendly?: FriendlyErrorInfo;

    /**
     * Optional retry handler. If omitted, the retry button is hidden.
     */
    onRetry?: () => void;

    /**
     * Optional cancel/back handler. If omitted, the cancel button is hidden.
     */
    onCancel?: () => void;

    /**
     * Override the cancel button label. Defaults to "Go Back Home".
     */
    cancelLabel?: string;

    /**
     * Override the retry button label. Defaults to "Try Again".
     */
    retryLabel?: string;

    /**
     * When supplied, render a {@link VerifierHeader} above the friendly
     * copy. Use for OID4VP error states so the user retains brand context
     * — they should always see *who* tried to talk to them, even when the
     * exchange failed.
     */
    verifierInfo?: VerifierHeaderProps;

    /**
     * Mutually exclusive with `verifierInfo`. Renders an {@link IssuerHeader}
     * for OID4VCI error states.
     */
    issuerInfo?: IssuerHeaderProps;

    /**
     * Slice B — "Tell LearnCard about this" feedback hook. When supplied,
     * the component renders a report CTA (with an optional free-text note
     * input). On click it invokes `onReport(note)` and shows a thanks
     * confirmation. The component is provider-agnostic; the call site
     * decides where the report fans out (Sentry, analytics, brain-service,
     * …) via its own hook.
     */
    onReport?: (userNote?: string) => void | Promise<void>;
}

/**
 * Visual treatment per error kind. We deliberately avoid the red
 * "something is broken" header for `format_gap` and `trust_gap` — those
 * moments are wins for the wallet (we're either working on a feature, or
 * we're protecting the user). Painting them red would teach users to
 * distrust LearnCard for behaving correctly.
 */
const KIND_THEME: Record<ExchangeErrorKind, {
    headerClass: string;
    Icon: React.ComponentType<{ className?: string }>;
    subtitle: string;
}> = {
    format_gap: {
        headerClass: 'bg-gradient-to-r from-indigo-500 to-violet-600',
        Icon: Sparkles,
        subtitle: 'A new format we’re working on.',
    },
    trust_gap: {
        headerClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
        Icon: ShieldAlert,
        subtitle: 'LearnCard kept your credentials safe.',
    },
    transport: {
        headerClass: 'bg-gradient-to-r from-slate-500 to-slate-700',
        Icon: WifiOff,
        subtitle: 'We couldn’t reach the other side.',
    },
    request_invalid: {
        headerClass: 'bg-gradient-to-r from-rose-500 to-orange-500',
        Icon: AlertCircle,
        subtitle: 'The request had a problem.',
    },
    wallet: {
        headerClass: 'bg-gradient-to-r from-rose-500 to-orange-500',
        Icon: Wrench,
        subtitle: 'Something on our end didn’t work.',
    },
    unknown: {
        headerClass: 'bg-gradient-to-r from-red-500 to-red-600',
        Icon: AlertCircle,
        subtitle: 'We couldn’t complete your request.',
    },
};

/**
 * Themed error display for OpenID4VC and OpenID4VP exchange flows. Maps
 * plugin errors with stable `code` fields to friendly copy and selects a
 * visual treatment per `kind` (so a format gap doesn’t look the same as
 * a genuine crash).
 *
 * Optionally renders a counterparty header (`verifierInfo` or
 * `issuerInfo`) so the user keeps brand context even when the exchange
 * fails, plus a provider-agnostic `onReport` hook for telemetry / user
 * feedback fan-out. Falls back gracefully for unknown errors.
 */
export const ExchangeErrorDisplay: React.FC<ExchangeErrorDisplayProps> = ({
    error,
    friendly,
    onRetry,
    onCancel,
    cancelLabel = 'Go Back Home',
    retryLabel = 'Try Again',
    verifierInfo,
    issuerInfo,
    onReport,
}) => {
    const friendlyError = friendly ?? getFriendlyOpenID4VCError(error);
    const theme = KIND_THEME[friendlyError.kind] ?? KIND_THEME.unknown;
    const HeaderIcon = theme.Icon;

    const rawErrorMessage = (() => {
        if (typeof error === 'string') return error;
        if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as { message?: unknown }).message;
            if (typeof message === 'string') return message;
        }
        return undefined;
    })();

    // ----- Slice B: report state machine -----
    // `idle` → `composing` (textarea visible) → `sending` → `sent`.
    // The component never knows what `onReport` does under the hood; it
    // just trusts the call to settle, and renders confirmation UI either
    // way (a thrown rejection is logged but doesn’t break the screen).
    type ReportState = 'idle' | 'composing' | 'sending' | 'sent';
    const [reportState, setReportState] = useState<ReportState>('idle');
    const [reportNote, setReportNote] = useState('');

    const handleReport = async () => {
        if (!onReport) return;
        setReportState('sending');
        try {
            await onReport(reportNote.trim() || undefined);
        } catch (reportError) {
            // Telemetry fan-out failed; this is a Slice B feature, not a
            // critical path — swallow + log so the user still sees the
            // "thanks" state. (We can add a retry affordance later if
            // we observe drops in practice.)
            // eslint-disable-next-line no-console
            console.error('[ExchangeErrorDisplay] onReport threw', reportError);
        }
        setReportState('sent');
    };

    // Format-gap is the one kind where "Tell LearnCard" is *the* primary
    // action — retry won't help, the wallet doesn't speak the format yet.
    const isFormatGap = friendlyError.kind === 'format_gap';

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden animate-fade-in-up">
                <div className={`${theme.headerClass} px-6 py-7 text-center`}>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <HeaderIcon className="w-9 h-9 text-white" />
                    </div>

                    <h1 className="text-xl font-semibold text-white mb-1 leading-snug">
                        {friendlyError.title}
                    </h1>

                    <p className="text-sm text-white/85 leading-relaxed max-w-xs mx-auto">
                        {theme.subtitle}
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {verifierInfo && <VerifierHeader {...verifierInfo} />}
                    {issuerInfo && <IssuerHeader {...issuerInfo} />}

                    <p className="text-sm text-grayscale-600 leading-relaxed text-center">
                        {friendlyError.description}
                    </p>

                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1.5">
                            What to do
                        </p>

                        <p className="text-sm text-amber-800 leading-relaxed">
                            {friendlyError.suggestion}
                        </p>
                    </div>

                    {rawErrorMessage && rawErrorMessage !== friendlyError.description && (
                        <details className="group">
                            <summary className="text-xs text-grayscale-400 cursor-pointer hover:text-grayscale-600 transition-colors">
                                Technical details
                            </summary>

                            <div className="mt-2 rounded-xl bg-grayscale-10 border border-grayscale-200 p-3">
                                <p className="text-xs text-grayscale-600 font-mono break-words leading-relaxed">
                                    {rawErrorMessage}
                                </p>
                            </div>
                        </details>
                    )}

                    {onReport && (
                        <ReportSection
                            state={reportState}
                            note={reportNote}
                            onNoteChange={setReportNote}
                            onStart={() => setReportState('composing')}
                            onSubmit={handleReport}
                            primary={isFormatGap}
                        />
                    )}

                    <div className="space-y-3 pt-1">
                        {onRetry && !isFormatGap && (
                            <button
                                onClick={onRetry}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {retryLabel}
                            </button>
                        )}

                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                {cancelLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------
// Report section — collapsible "Tell LearnCard about this" affordance.
// Lives in this file because it has no other consumer; if we ever want
// to reuse it elsewhere we can lift it out cleanly.
// -----------------------------------------------------------------

interface ReportSectionProps {
    state: 'idle' | 'composing' | 'sending' | 'sent';
    note: string;
    onNoteChange: (next: string) => void;
    onStart: () => void;
    onSubmit: () => void;
    /**
     * When `true`, render the entry button as a filled primary CTA
     * (used for `format_gap` where "Tell LearnCard" is THE action).
     * Otherwise the entry point is a low-emphasis ghost link.
     */
    primary: boolean;
}

const ReportSection: React.FC<ReportSectionProps> = ({
    state,
    note,
    onNoteChange,
    onStart,
    onSubmit,
    primary,
}) => {
    if (state === 'sent') {
        return (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 flex items-start gap-2.5">
                <Check className="text-emerald-500 w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm text-emerald-700 leading-relaxed">
                    Thanks — we got it. Your report helps us prioritize what to build next.
                </span>
            </div>
        );
    }

    if (state === 'idle') {
        if (primary) {
            return (
                <button
                    onClick={onStart}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Tell LearnCard about this
                </button>
            );
        }

        return (
            <button
                onClick={onStart}
                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors w-full text-center"
            >
                Tell LearnCard about this
            </button>
        );
    }

    // composing | sending
    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-grayscale-700">
                Anything to add? (optional)
            </label>

            <textarea
                value={note}
                onChange={e => onNoteChange(e.target.value)}
                placeholder="What were you trying to do? Any extra context?"
                rows={3}
                disabled={state === 'sending'}
                className="w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-none disabled:opacity-50"
            />

            <button
                onClick={onSubmit}
                disabled={state === 'sending'}
                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {state === 'sending' ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Send report
                    </>
                )}
            </button>
        </div>
    );
};

export default ExchangeErrorDisplay;
