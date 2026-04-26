import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

import { IssuerHeader } from 'learn-card-base';

import type { CredentialOffer } from '@learncard/openid4vc-plugin';

export interface OfferAuthRedirectProps {
    offer: CredentialOffer;

    /**
     * Authorization URL the wallet should hand off to. Once the user
     * confirms (or after a short auto-redirect grace period) we
     * `window.location.assign` here.
     */
    authorizationUrl: string;

    /**
     * Optional grace period in ms before automatically redirecting.
     * Set to 0 to require an explicit click. Defaults to 1500ms so the
     * user has a moment to read the explainer.
     */
    autoRedirectMs?: number;

    onCancel: () => void;
}

/**
 * Bridge UI shown between the wallet's "Continue to issuer" click and
 * the actual top-level navigation to the authorization endpoint. Gives
 * the user one last chance to bail and one clear affordance to
 * re-trigger the redirect if it gets blocked by a popup blocker or
 * iOS limitation.
 */
const OfferAuthRedirect: React.FC<OfferAuthRedirectProps> = ({
    offer,
    authorizationUrl,
    autoRedirectMs = 1500,
    onCancel,
}) => {
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (autoRedirectMs <= 0) return;
        const handle = window.setTimeout(() => {
            doRedirect();
        }, autoRedirectMs);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authorizationUrl, autoRedirectMs]);

    const doRedirect = () => {
        setRedirecting(true);
        // Top-level redirect so the issuer's auth endpoint can later
        // call back to /oid4vci?code=&state= without losing the wallet
        // tab.
        window.location.assign(authorizationUrl);
    };

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full p-6 space-y-5">
                <div className="text-center space-y-1">
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        Sign in with the issuer
                    </h1>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        We&apos;re sending you to the issuer&apos;s sign-in page. We&apos;ll bring you right back here when they&apos;re done.
                    </p>
                </div>

                <IssuerHeader issuerUrl={offer.credential_issuer} />

                <div className="space-y-3">
                    <button
                        onClick={doRedirect}
                        disabled={redirecting}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {redirecting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Redirecting...
                            </>
                        ) : (
                            <>
                                <ExternalLink className="w-4 h-4" />
                                Continue to issuer
                            </>
                        )}
                    </button>

                    <button
                        onClick={onCancel}
                        disabled={redirecting}
                        className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferAuthRedirect;
