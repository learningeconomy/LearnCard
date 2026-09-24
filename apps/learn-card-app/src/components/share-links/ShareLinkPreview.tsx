import { ShareCredentialThumbnail } from './ShareCredentialThumbnail';
import { ShareCredentialMetadata } from './ShareCredentialMetadata';
import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import type { SharePayload } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import { credentialText, type ProofState } from './shareLinkFlow';

/**
 * Display-only projection of the exact manifest that will be encrypted and
 * published. Explicit props keep it reusable by the recipient viewer without
 * coupling either surface to the other.
 *
 * `proofs` is optional and keyed by `credentialIndex`. A credential with no
 * entry never renders a badge, so the preview can never claim "verified".
 */
export interface ShareLinkPreviewProps {
    payload: Pick<SharePayload, 'presentation' | 'selection' | 'endorsements'>;
    title: string;
    note?: string;
    sharerName?: string;
    expiresAt?: string | null;
    proofs?: Readonly<Record<number, ProofState>>;
    /** Rendered above the collection when the host wants an explicit heading. */
    heading?: string;
    /** Extra summary content (for example the collection proof) below the metadata. */
    summaryExtra?: React.ReactNode;
    /** Opt in to the raw original credential disclosure for each selected member. */
    showOriginal?: boolean;
    className?: string;
}

export const proofLabel = (state: ProofState): string =>
    ({
        checking: m['shareLinks.checking'](),
        verified: m['shareLinks.verified'](),
        failed: m['shareLinks.failed'](),
        unavailable: m['shareLinks.unavailable'](),
    })[state];

export const ProofBadge = ({ state }: { state: ProofState }) => (
    <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            state === 'verified'
                ? 'text-emerald-700'
                : state === 'failed'
                  ? 'text-red-700'
                  : 'text-grayscale-600'
        }`}
    >
        {state === 'checking' ? (
            <span
                aria-hidden
                className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"
            />
        ) : (
            <IonIcon icon={state === 'verified' ? checkmarkCircleOutline : alertCircleOutline} />
        )}
        {proofLabel(state)}
    </span>
);

export const ShareLinkPreview = ({
    payload,
    title,
    note,
    sharerName,
    expiresAt,
    proofs,
    heading,
    summaryExtra,
    showOriginal = false,
    className = '',
}: ShareLinkPreviewProps) => (
    <div className={`space-y-5 ${className}`} data-testid="share-link-preview">
        {heading && (
            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                {heading}
            </p>
        )}
        <section className="bg-white rounded-[20px] p-6 md:p-8 space-y-4 border border-grayscale-200">
            {sharerName && (
                <p className="text-xs text-grayscale-500">
                    {m['shareLinks.sharedBy']({ name: sharerName })}
                </p>
            )}
            <h1 className="text-2xl md:text-3xl font-semibold break-words">{title}</h1>
            {note && (
                <p className="text-sm text-grayscale-600 leading-relaxed whitespace-pre-wrap break-words">
                    {note}
                </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-grayscale-500">
                <span>
                    {m['shareLinks.selected']({
                        count: String(payload.selection.length),
                    })}
                </span>
                {expiresAt ? (
                    <span>
                        {m['shareLinks.expires']({
                            date: new Date(expiresAt).toLocaleDateString(),
                        })}
                    </span>
                ) : (
                    <span>{m['shareLinks.neverExpires']()}</span>
                )}
            </div>
            {summaryExtra}
        </section>
        <div className="space-y-4">
            {payload.selection.map(({ credentialIndex }, order) => {
                const credential = payload.presentation.verifiableCredential[credentialIndex];
                const text = credentialText(credential);
                const endorsements = payload.endorsements.filter(
                    item => item.targetCredentialIndex === credentialIndex
                );
                const proof = proofs?.[credentialIndex];
                return (
                    <article
                        key={credentialIndex}
                        className="bg-white rounded-[20px] p-6 md:p-8 space-y-4 border border-grayscale-200"
                    >
                        <div className="flex items-start gap-4">
                            <ShareCredentialThumbnail credential={credential} />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-grayscale-500 mb-1">
                                    {String(order + 1).padStart(2, '0')}
                                </p>
                                <h2 className="text-lg font-semibold break-words">
                                    {text.name || m['shareLinks.credential']()}
                                </h2>
                                <ShareCredentialMetadata credential={credential} />
                            </div>
                        </div>
                        {text.description && (
                            <p className="text-sm text-grayscale-600 leading-relaxed whitespace-pre-wrap break-words">
                                {text.description}
                            </p>
                        )}
                        {proof && (
                            <div aria-live="polite">
                                <ProofBadge state={proof} />
                            </div>
                        )}
                        {endorsements.length > 0 && (
                            <div className="pt-4 border-t border-grayscale-100 space-y-2">
                                <h3 className="text-xs font-medium text-grayscale-700">
                                    {m['shareLinks.endorsements']()}
                                </h3>
                                {endorsements.map(item => {
                                    const endorsementText = credentialText(
                                        payload.presentation.verifiableCredential[
                                            item.credentialIndex
                                        ]
                                    );
                                    const endorsementProof = proofs?.[item.credentialIndex];
                                    return (
                                        <div key={item.credentialIndex} className="space-y-1">
                                            {endorsementText.name && (
                                                <p className="text-sm text-grayscale-700 break-words">
                                                    {endorsementText.name}
                                                </p>
                                            )}
                                            {endorsementProof && (
                                                <ProofBadge state={endorsementProof} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {showOriginal && (
                            <details className="text-xs text-grayscale-600">
                                <summary className="cursor-pointer py-2">
                                    {m['shareLinks.original']()}
                                </summary>
                                <pre className="mt-2 p-4 bg-grayscale-100 rounded-xl overflow-auto max-h-80 text-xs whitespace-pre-wrap break-all">
                                    {JSON.stringify(credential, null, 2)}
                                </pre>
                            </details>
                        )}
                    </article>
                );
            })}
        </div>
    </div>
);

export default ShareLinkPreview;
