import React from 'react';
import { CheckCircle2, AlertCircle, ArrowUpRight, Share2, Sparkles } from 'lucide-react';

import type { VciError } from '@learncard/openid4vc-plugin';
import type { VC } from '@learncard/types';

import { BoostPageViewMode } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';

import {
    humanizeFormat,
    prettifyConfigurationId,
} from '../displayHelpers';
import CredentialPreviewCard, {
    type CredentialPreviewClaim,
} from './CredentialPreviewCard';
import FlowSteps from './FlowSteps';

export interface FinishedCredential {
    /** Credential configuration id from the offer that produced this credential. */
    configurationId: string;
    /** Format the issuer used (e.g. `jwt_vc_json`, `ldp_vc`). */
    format: string;
    /** Optional title for display. */
    title?: string;
    /** Optional one-line description (from issuer metadata or the credential body). */
    description?: string;
    /**
     * Optional populated claim list (label + value) extracted from the
     * issued VC. When present, the success card mirrors the post-
     * issuance shape of the real credential. Only used on the fallback
     * render path for non-VCDM formats (SD-JWT, mdoc).
     */
    claims?: CredentialPreviewClaim[];
    /**
     * The raw issued credential body. For VCDM-shaped credentials
     * (`jwt_vc_json`, `ldp_vc`) we pass this straight to
     * `BoostEarnedCard` so the success screen shows the *exact* card
     * the user will see in their wallet, including verification badge
     * and issuer image. For non-VCDM formats we fall back to the
     * `CredentialPreviewCard` stub, which reads `title`/`description`
     * instead.
     */
    vc?: VC;
}

export interface FinishedFailure {
    configurationId: string;
    format: string;
    error: VciError;
}

export interface OfferFinishedProps {
    stored: FinishedCredential[];
    failures: FinishedFailure[];
    /** Issuer URL, used to brand the success card via the avatar chain. */
    issuerUrl: string;
    /** Issuer display name from metadata, falls back to URL host. */
    issuerName?: string;
    /** Branded issuer logo URI from metadata, when available. */
    issuerLogoUri?: string;
    onViewWallet: () => void;
    /**
     * Optional callback to start a sharing flow with this credential.
     * When omitted, the "Share now" affordance is hidden \u2014 some hosts
     * (e.g. embedded wallets) might not surface presentation flows.
     */
    onShare?: () => void;
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
    issuerUrl,
    issuerName,
    issuerLogoUri,
    onViewWallet,
    onShare,
    onDone,
}) => {
    const totalAttempted = stored.length + failures.length;
    const partialSuccess = stored.length > 0 && failures.length > 0;
    const fullFailure = stored.length === 0 && failures.length > 0;

    // For single-credential issuance, the success card shows the
    // credential preview as the hero. For batch (rare in practice),
    // we list them more compactly below the headline.
    const isSingleCredential = stored.length === 1;
    const featuredCredential = isSingleCredential ? stored[0] : undefined;
    const featuredTitle = featuredCredential
        ? prettifyConfigurationId(featuredCredential.configurationId, {
              displayName: featuredCredential.title,
          })
        : undefined;

    const headline = fullFailure
        ? "Couldn\u2019t save credentials"
        : partialSuccess
        ? 'Saved with some warnings'
        : isSingleCredential
        ? `Your ${featuredTitle ?? 'credential'} is in your wallet`
        : `${stored.length} credentials saved`;

    const subhead = fullFailure
        ? 'No credentials were successfully stored.'
        : partialSuccess
        ? `${stored.length} of ${totalAttempted} saved \u2014 the rest had problems.`
        : isSingleCredential
        ? "It's yours to keep. Share it whenever you need to prove what it says."
        : 'All set \u2014 your wallet is up to date.';

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
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden animate-fade-in-up">
                <div
                    className={`px-6 py-7 text-center ${
                        fullFailure
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
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

                    <h1 className="text-xl font-semibold text-white mb-1 leading-snug">
                        {headline}
                    </h1>

                    <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
                        {subhead}
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {!fullFailure && <FlowSteps current={3} />}

                    {/* Single-credential success: render the *actual*
                        wallet card as the hero, so the claim screen and
                        the user's wallet show the exact same artifact
                        \u2014 no surprises post-claim.

                        We only do this for VCDM-shaped credentials
                        (jwt_vc_json / ldp_vc, where `credentialSubject`
                        is present). For SD-JWT / mdoc the parsed body
                        doesn't satisfy the VC shape BoostEarnedCard
                        expects, so we fall back to the metadata-only
                        preview. */}
                    {isSingleCredential && featuredCredential && (
                        isVcdmShape(featuredCredential.vc) ? (
                            // BoostEarnedCard with useWrapper={false} skips
                            // the IonCol wrapper it normally uses to center
                            // itself within a grid cell, so we replicate
                            // that centering here. The card has its own
                            // intrinsic width via `earned-small-card`, so
                            // we don't force a width on the parent.
                            <div className="flex justify-center items-center w-full">
                                <BoostEarnedCard
                                    credential={featuredCredential.vc}
                                    categoryType={
                                        getDefaultCategoryForCredential(
                                            featuredCredential.vc
                                        ) || 'achievement'
                                    }
                                    boostPageViewMode={BoostPageViewMode.Card}
                                    useWrapper={false}
                                    hideOptionsMenu
                                    className="shadow-md"
                                />
                            </div>
                        ) : (
                            <CredentialPreviewCard
                                title={
                                    featuredTitle ?? featuredCredential.configurationId
                                }
                                description={featuredCredential.description}
                                claims={featuredCredential.claims}
                                issuerUrl={issuerUrl}
                                issuerName={issuerName}
                                issuerLogoUri={issuerLogoUri}
                                showSaved
                            />
                        )
                    )}

                    {!isSingleCredential && stored.length > 0 && (
                        <ul className="space-y-2">
                            {stored.map(entry => {
                                const title = prettifyConfigurationId(
                                    entry.configurationId,
                                    { displayName: entry.title }
                                );
                                return (
                                    <li
                                        key={`${entry.configurationId}-${entry.format}`}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-grayscale-200 bg-white"
                                    >
                                        <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-grayscale-900 truncate">
                                                {title}
                                            </p>

                                            {entry.description && (
                                                <p className="text-xs text-grayscale-500 line-clamp-1 mt-0.5">
                                                    {entry.description}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
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
                                {failures.map((entry, i) => {
                                    const title = prettifyConfigurationId(
                                        entry.configurationId
                                    );
                                    return (
                                        <li key={i} className="leading-relaxed">
                                            <span className="font-medium">{title}</span>
                                            {' \u2014 '}
                                            {entry.error.message}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* What you can do \u2014 only on the happy path; mostly
                        useful for first-time recipients of a credential.
                        Three concrete next steps that respect momentum. */}
                    {!fullFailure && (
                        <div className="rounded-2xl bg-grayscale-10 border border-grayscale-200 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-grayscale-700 flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                What you can do
                            </p>

                            <ul className="space-y-1.5 text-xs text-grayscale-600 leading-relaxed">
                                <li className="flex gap-2">
                                    <span className="text-grayscale-400 shrink-0">•</span>
                                    Share it with anyone who asks for proof.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-grayscale-400 shrink-0">•</span>
                                    Bundle it with other credentials in your wallet.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-grayscale-400 shrink-0">•</span>
                                    Revoke or delete it any time — you stay in control.
                                </li>
                            </ul>
                        </div>
                    )}

                    {stored.some(s => s.format) && (
                        <details className="group">
                            <summary className="text-xs text-grayscale-400 cursor-pointer hover:text-grayscale-600 transition-colors">
                                Technical details
                            </summary>

                            <ul className="mt-2 space-y-1 text-xs text-grayscale-500">
                                {stored.map(entry => (
                                    <li
                                        key={`fmt-${entry.configurationId}`}
                                        className="flex items-baseline gap-2"
                                    >
                                        <span className="font-medium text-grayscale-700">
                                            {prettifyConfigurationId(entry.configurationId, {
                                                displayName: entry.title,
                                            })}
                                        </span>
                                        {entry.format && (
                                            <span className="text-grayscale-400">
                                                · {humanizeFormat(entry.format) ?? entry.format}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}

                    <div className="space-y-3 pt-1">
                        {!fullFailure && (
                            <button
                                onClick={onViewWallet}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                {isSingleCredential
                                    ? `Open my ${featuredTitle ?? 'credential'}`
                                    : 'Open my wallet'}
                            </button>
                        )}

                        {!fullFailure && onShare && (
                            <button
                                onClick={onShare}
                                className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share now
                            </button>
                        )}

                        <button
                            onClick={onDone}
                            className={
                                fullFailure
                                    ? 'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity'
                                    : 'w-full py-3 px-4 rounded-[20px] text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors'
                            }
                        >
                            {fullFailure ? 'Try again' : 'Done'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Cheap structural check that an issued credential body looks like a
 * VCDM 1.1/2.0 VC \u2014 the shape `BoostEarnedCard` (and the wallet's other
 * surfaces) expect. We don't try to validate the proof or context here,
 * we just sniff for the load-bearing fields the card reads
 * (`credentialSubject`, plus an `@context` or `type` marker). Anything
 * that fails this check (SD-JWT body, mdoc parsed claims) falls through
 * to the metadata-only preview card.
 */
const isVcdmShape = (vc: VC | undefined): vc is VC => {
    if (!vc || typeof vc !== 'object') return false;
    const v = vc as Record<string, unknown>;
    if (!('credentialSubject' in v)) return false;
    return '@context' in v || 'type' in v;
};

export default OfferFinished;
