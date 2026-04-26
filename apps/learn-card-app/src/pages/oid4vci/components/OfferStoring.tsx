import React from 'react';
import { Loader2 } from 'lucide-react';

export interface OfferStoringProps {
    /**
     * Optional contextual progress text. Defaults to a generic
     * "Saving credentials..." message.
     */
    message?: string;
}

/**
 * Indeterminate spinner shown while the wallet is exchanging the offer
 * for a real credential and persisting it. The phase covers token
 * request \u2192 credential request \u2192 store + index, which can take a
 * couple of seconds.
 */
const OfferStoring: React.FC<OfferStoringProps> = ({
    message = 'Saving your credential...',
}) => (
    <div className="min-h-full flex items-center justify-center p-6 font-poppins">
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

export default OfferStoring;
