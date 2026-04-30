import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';

import {
    BoostPageViewMode,
    VerifierHeader,
    type VerifierDisplayInfo,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import type { VC } from '@learncard/types';

import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';

export interface RequestFinishedProps {
    /**
     * Optional URL the requesting app asked the wallet to deep-link to
     * after a successful submission (OID4VP §8.2). When present, we
     * render an extra “Continue” button that performs a top-level
     * navigation back to the requesting app.
     */
    redirectUri?: string;

    /**
     * Branded identity of the requesting app (parsed from
     * `client_metadata` and the request's `client_id`). Surfaced via
     * the same `VerifierHeader` we use on the consent screen so the
     * trust affordance is consistent across the flow.
     */
    clientId?: string;
    clientIdScheme?: string;
    clientDisplay?: VerifierDisplayInfo;

    /**
     * The credentials the user just shared. Rendered as centered
     * `BoostEarnedCard`s so the success screen actually shows what was
     * sent — mirrors the hero treatment on the OID4VCI OfferFinished
     * card. May be empty when the underlying VPs aren't W3C VCs we can
     * render (e.g. SD-JWT VCs); we fall back gracefully in that case.
     */
    sharedCredentials?: VC[];

    /** Optional override for the under-headline summary. */
    summary?: string;

    onDone: () => void;
}

/**
 * Success card shown after the requesting app accepts the wallet’s
 * Verifiable Presentation. Mirrors the post-claim layout of the
 * OID4VCI OfferFinished card so the two paths feel like the same
 * product:
 *
 *   - Branded “Shared with {clientName}” header (or a graceful
 *     unbranded fallback when `client_metadata` is empty).
 *   - Hero strip of `BoostEarnedCard`s showing exactly what was
 *     shared, so the user can verify visually before dismissing.
 *   - Optional “Continue at app” deep link back to the requesting
 *     app, when the request supplied a `response.redirect_uri`.
 */
const RequestFinished: React.FC<RequestFinishedProps> = ({
    redirectUri,
    clientId,
    clientIdScheme,
    clientDisplay,
    sharedCredentials,
    summary,
    onDone,
}) => {
    const clientName = clientDisplay?.name?.trim();
    const headlineSummary =
        summary
        ?? (clientName
            ? `Your credentials were shared with ${clientName}.`
            : 'Your credentials were shared successfully.');

    const credentialsToShow = sharedCredentials?.filter(Boolean) ?? [];
    const hasCredentials = credentialsToShow.length > 0;

    return (
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

                    <p className="text-sm text-white/85 leading-relaxed px-2">
                        {headlineSummary}
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {clientId && (
                        <VerifierHeader
                            clientId={clientId}
                            clientIdScheme={clientIdScheme}
                            display={clientDisplay}
                            caption="Shared with"
                        />
                    )}

                    {hasCredentials && (
                        <div>
                            <p className="text-xs font-medium text-grayscale-700 mb-3 uppercase tracking-wide">
                                What you shared
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">
                                {credentialsToShow.map((vc, index) => (
                                    <div
                                        key={index}
                                        className="w-[150px] shrink-0"
                                    >
                                        <BoostEarnedCard
                                            credential={vc}
                                            categoryType={
                                                getDefaultCategoryForCredential(vc)
                                                || 'Achievement'
                                            }
                                            boostPageViewMode={BoostPageViewMode.Card}
                                            useWrapper={false}
                                            hideOptionsMenu
                                            className="shadow-md"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-1">
                        {redirectUri && (
                            <button
                                onClick={() => {
                                    window.location.assign(redirectUri);
                                }}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {clientName ? `Continue to ${clientName}` : 'Continue'}
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
        </div>
    );
};

export default RequestFinished;
