import React from 'react';
import { Loader2 } from 'lucide-react';

import FlowSteps from './FlowSteps';

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
 * request → credential request → store + index, which can take a
 * couple of seconds.
 *
 * The `message` prop differentiates the auth-code "we just got back
 * from the issuer" case from the pre-auth "saving" case so the user
 * sees relevant copy at each transition.
 */
const OfferStoring: React.FC<OfferStoringProps> = ({
    message = 'Saving your credential...',
}) => {
    // Tell apart the auth-code-return case so we can use a "Welcome
    // back" headline that acknowledges the redirect roundtrip rather
    // than a generic "Almost there".
    const isReturningFromIssuer =
        message.toLowerCase().includes('finishing sign-in')
        || message.toLowerCase().includes('signing in');

    const headline = isReturningFromIssuer
        ? 'Welcome back'
        : 'Almost there';

    const subhead = isReturningFromIssuer
        ? 'Finalizing your credential — this usually takes just a second.'
        : message;

    return (
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
                <FlowSteps current={2} />

                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>

                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        {headline}
                    </h1>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {subhead}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OfferStoring;
