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
        <div className="min-h-full bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-8 text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        {friendlyError.title}
                    </h1>

                    <p className="text-rose-100 text-sm">
                        We couldn&apos;t complete your request
                    </p>
                </div>

                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <p className="text-gray-600 text-center text-sm">
                            {friendlyError.description}
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
                                What to do
                            </p>

                            <p className="text-sm text-amber-800">
                                {friendlyError.suggestion}
                            </p>
                        </div>

                        {rawErrorMessage && rawErrorMessage !== friendlyError.description && (
                            <details className="group">
                                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                                    Show technical details
                                </summary>

                                <div className="mt-2 bg-gray-100 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 font-mono break-words">
                                        {rawErrorMessage}
                                    </p>
                                </div>
                            </details>
                        )}
                    </div>

                    <div className="space-y-3">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
                            >
                                <RefreshCw className="w-5 h-5" />
                                {retryLabel}
                            </button>
                        )}

                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="w-full py-3 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
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
