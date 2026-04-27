import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export interface RequestFinishedProps {
    /**
     * Optional URL the verifier asked the wallet to deep-link to after
     * a successful submission (OID4VP \u00a78.2). When present, we render an
     * extra "Continue at verifier" button that performs a top-level
     * navigation.
     */
    redirectUri?: string;

    /** Caption summarizing the outcome. */
    summary?: string;

    onDone: () => void;
}

/**
 * Success card shown after the verifier accepts the wallet\u2019s
 * Verifiable Presentation. Mirrors the post-claim layout of the VC-API
 * flow so the two paths feel like the same product.
 */
const RequestFinished: React.FC<RequestFinishedProps> = ({
    redirectUri,
    summary,
    onDone,
}) => (
    <div
        className="min-h-full flex items-center justify-center font-poppins"
        style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
    >
        <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-7 text-center bg-gradient-to-r from-emerald-500 to-emerald-600">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-9 h-9 text-white" />
                </div>

                <h1 className="text-xl font-semibold text-white mb-1">
                    Credentials shared
                </h1>

                <p className="text-sm text-white/80">
                    {summary ?? 'The verifier accepted your credentials.'}
                </p>
            </div>

            <div className="p-6 space-y-3">
                {redirectUri && (
                    <button
                        onClick={() => {
                            window.location.assign(redirectUri);
                        }}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Continue at verifier
                    </button>
                )}

                <button
                    onClick={onDone}
                    className={
                        redirectUri
                            ? 'w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors'
                            : 'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity'
                    }
                >
                    Done
                </button>
            </div>
        </div>
    </div>
);

export default RequestFinished;
