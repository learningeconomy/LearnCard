import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

import {
    FriendlyErrorInfo,
    getFriendlyOpenID4VCError,
} from '../../helpers/openid4vcErrors';

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
}

/**
 * Generic error display for OpenID4VC and OpenID4VP exchange flows. Maps
 * plugin errors with stable `code` fields to friendly copy with a title,
 * description, and suggestion. Falls back gracefully for unknown errors.
 *
 * Mirrors the layout of the existing VC-API `ExchangeErrorDisplay` so the
 * three exchange flows feel consistent.
 */
export const ExchangeErrorDisplay: React.FC<ExchangeErrorDisplayProps> = ({
    error,
    friendly,
    onRetry,
    onCancel,
    cancelLabel = 'Go Back Home',
    retryLabel = 'Try Again',
}) => {
    const friendlyError = friendly ?? getFriendlyOpenID4VCError(error);

    const rawErrorMessage = (() => {
        if (typeof error === 'string') return error;
        if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as { message?: unknown }).message;
            if (typeof message === 'string') return message;
        }
        return undefined;
    })();

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden animate-fade-in-up">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-7 text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-9 h-9 text-white" />
                    </div>

                    <h1 className="text-xl font-semibold text-white mb-1 leading-snug">
                        {friendlyError.title}
                    </h1>

                    <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
                        We couldn&apos;t complete your request.
                    </p>
                </div>

                <div className="p-6 space-y-5">
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

                    <div className="space-y-3 pt-1">
                        {onRetry && (
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

export default ExchangeErrorDisplay;
