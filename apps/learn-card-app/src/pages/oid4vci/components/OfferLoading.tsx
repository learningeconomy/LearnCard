import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Indeterminate spinner shown while we resolve the credential offer URI
 * (and, optionally, fetch issuer metadata for the consent screen).
 */
const OfferLoading: React.FC = () => (
    <div className="min-h-full flex items-center justify-center p-6 font-poppins">
        <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-grayscale-10 border border-grayscale-200 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-grayscale-600 animate-spin" />
            </div>

            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-grayscale-900">
                    Looking up offer
                </h1>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    We&apos;re reaching out to the issuer to load the credentials they have for you.
                </p>
            </div>
        </div>
    </div>
);

export default OfferLoading;
