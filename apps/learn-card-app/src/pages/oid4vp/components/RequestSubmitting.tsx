import React from 'react';
import { Loader2 } from 'lucide-react';

export interface RequestSubmittingProps {
    /**
     * Optional contextual progress text. Defaults to a generic
     * "Sharing credentials..." message.
     */
    message?: string;
}

/**
 * Indeterminate spinner shown while the wallet is signing the
 * Verifiable Presentation and POSTing it to the verifier's
 * `response_uri`. Mirrors the visual language of OfferStoring on the
 * VCI page.
 */
const RequestSubmitting: React.FC<RequestSubmittingProps> = ({
    message = 'Sharing your credentials...',
}) => (
    <div
        className="min-h-full flex items-center justify-center font-poppins"
        style={{
            paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
        }}
    >
        <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>

            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-grayscale-900">
                    Almost there
                </h1>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {message}
                </p>
            </div>
        </div>
    </div>
);

export default RequestSubmitting;
