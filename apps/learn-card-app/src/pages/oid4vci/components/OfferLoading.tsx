import React from 'react';
import { Loader2 } from 'lucide-react';

import FlowSteps from './FlowSteps';

/**
 * Indeterminate spinner shown while we resolve the credential offer URI
 * (and, optionally, fetch issuer metadata for the consent screen).
 */
const OfferLoading: React.FC = () => (
    <div
        className="min-h-full flex items-center justify-center font-poppins"
        style={{
            paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
        }}
    >
        <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full p-8 text-center space-y-5 animate-fade-in-up">
            <FlowSteps current={1} />

            <div className="w-16 h-16 mx-auto rounded-2xl bg-grayscale-10 border border-grayscale-200 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-grayscale-600 animate-spin" />
            </div>

            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-grayscale-900">
                    Looking up your credential
                </h1>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    We&apos;re checking with the issuer — one moment.
                </p>
            </div>
        </div>
    </div>
);

export default OfferLoading;
