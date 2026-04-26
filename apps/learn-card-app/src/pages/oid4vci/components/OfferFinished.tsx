import React from 'react';
import { CheckCircle2, AlertCircle, Award } from 'lucide-react';

import type { VciError } from '@learncard/openid4vc-plugin';

export interface FinishedCredential {
    /** Credential configuration id from the offer that produced this credential. */
    configurationId: string;
    /** Format the issuer used (e.g. `jwt_vc_json`, `ldp_vc`). */
    format: string;
    /** Optional title for display. */
    title?: string;
}

export interface FinishedFailure {
    configurationId: string;
    format: string;
    error: VciError;
}

export interface OfferFinishedProps {
    stored: FinishedCredential[];
    failures: FinishedFailure[];
    onViewWallet: () => void;
    onDone: () => void;
}

/**
 * Final success/partial-success screen for an OID4VCI flow. Renders a
 * positive header with the count of accepted credentials, plus a
 * gracefully-degraded warning when one or more credentials in the
 * batch failed to store.
 */
const OfferFinished: React.FC<OfferFinishedProps> = ({
    stored,
    failures,
    onViewWallet,
    onDone,
}) => {
    const totalAttempted = stored.length + failures.length;
    const partialSuccess = stored.length > 0 && failures.length > 0;
    const fullFailure = stored.length === 0 && failures.length > 0;

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden">
                <div
                    className={`px-6 py-7 text-center ${
                        fullFailure
                            ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    }`}
                >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                        {fullFailure ? (
                            <AlertCircle className="w-9 h-9 text-white" />
                        ) : (
                            <CheckCircle2 className="w-9 h-9 text-white" />
                        )}
                    </div>

                    <h1 className="text-xl font-semibold text-white mb-1">
                        {fullFailure
                            ? 'Couldn\u2019t save credentials'
                            : partialSuccess
                            ? 'Saved with some warnings'
                            : 'Credentials added'}
                    </h1>

                    <p className="text-sm text-white/80">
                        {fullFailure
                            ? 'No credentials were successfully stored.'
                            : `${stored.length} of ${totalAttempted} credential${
                                  totalAttempted === 1 ? '' : 's'
                              } saved to your wallet`}
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {stored.length > 0 && (
                        <ul className="space-y-2">
                            {stored.map((entry) => (
                                <li
                                    key={`${entry.configurationId}-${entry.format}`}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-grayscale-200 bg-white"
                                >
                                    <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-emerald-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-grayscale-900 truncate">
                                            {entry.title || entry.configurationId}
                                        </p>

                                        <p className="text-[10px] text-grayscale-400 font-mono mt-0.5">
                                            {entry.format}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {failures.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl space-y-1.5">
                            <p className="text-xs font-medium text-amber-700">
                                {failures.length === 1
                                    ? '1 credential could not be saved'
                                    : `${failures.length} credentials could not be saved`}
                            </p>

                            <ul className="text-xs text-amber-800 space-y-0.5">
                                {failures.map((entry, i) => (
                                    <li key={i} className="leading-relaxed">
                                        <span className="font-mono">
                                            {entry.configurationId}
                                        </span>
                                        {' \u2014 '}
                                        {entry.error.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-3 pt-1">
                        {!fullFailure && (
                            <button
                                onClick={onViewWallet}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                View in wallet
                            </button>
                        )}

                        <button
                            onClick={onDone}
                            className={
                                fullFailure
                                    ? 'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity'
                                    : 'w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors'
                            }
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferFinished;
