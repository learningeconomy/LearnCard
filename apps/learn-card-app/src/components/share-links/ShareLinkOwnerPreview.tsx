import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';
import type { ShareLink, SharePayload } from '@learncard/types';
import { useWallet } from 'learn-card-base';
import { decryptSharePayload, validateShareManifest } from 'learn-card-base/helpers/share-links';

import * as m from '../../paraglide/messages.js';
import { readShareRecovery, shareWallet } from './shareLinkFlow';
import { ShareLinkPreview } from './ShareLinkPreview';

type ShareLinkOwnerPreviewProps = {
    share: ShareLink;
    onDismiss: () => void;
};

export const ShareLinkOwnerPreview = ({ share, onDismiss }: ShareLinkOwnerPreviewProps) => {
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;
    const [payload, setPayload] = useState<SharePayload>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(false);
            setPayload(undefined);
            try {
                const wallet = shareWallet(await initWalletRef.current());
                const [content, recovery] = await Promise.all([
                    wallet.invoke.getShareLinkOwnerContent(share.id),
                    readShareRecovery(wallet, share),
                ]);
                if (
                    content.id !== share.id ||
                    content.contentVersion !== share.contentVersion ||
                    recovery.latest.contentVersion !== content.contentVersion
                ) {
                    throw new Error('version');
                }

                const plaintext = await decryptSharePayload({
                    shareId: share.id,
                    contentVersion: content.contentVersion,
                    key: recovery.latest.key,
                    envelope: content.envelope,
                });
                const validated = validateShareManifest(plaintext, {
                    shareId: share.id,
                    contentVersion: content.contentVersion,
                });
                if (!validated.ok || validated.manifest.selection.length !== share.selectedCount) {
                    throw new Error('manifest');
                }

                if (!cancelled) setPayload(validated.manifest);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [attempt, share.contentVersion, share.id, share.selectedCount]);

    return (
        <div className="flex h-full min-h-0 flex-col bg-grayscale-100 font-poppins">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-grayscale-200 bg-white px-5 py-4 md:px-8">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-grayscale-500">
                        {m['dataShareCenter.shared.previewEyebrow']()}
                    </p>
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        {m['dataShareCenter.shared.previewTitle']()}
                    </h1>
                </div>
                <button
                    type="button"
                    aria-label={m['common.close']()}
                    onClick={onDismiss}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-grayscale-300 bg-white text-xl text-grayscale-700 transition-colors hover:bg-grayscale-10"
                >
                    <IonIcon icon={closeOutline} />
                </button>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
                <div className="mx-auto w-full max-w-4xl">
                    {loading && (
                        <div
                            role="status"
                            className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-grayscale-600"
                        >
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-grayscale-300 border-t-grayscale-900" />
                            {m['dataShareCenter.shared.previewLoading']()}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-[20px] border border-red-100 bg-white p-6">
                            <div className="flex items-start gap-2.5">
                                <IonIcon
                                    icon={alertCircleOutline}
                                    className="mt-0.5 shrink-0 text-lg text-red-400"
                                />
                                <p className="text-sm leading-relaxed text-red-700">
                                    {m['dataShareCenter.shared.previewError']()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAttempt(value => value + 1)}
                                className="mt-5 w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                            >
                                {m['shareLinks.retry']()}
                            </button>
                        </div>
                    )}

                    {!loading && payload && (
                        <ShareLinkPreview
                            payload={payload}
                            title={share.title}
                            note={share.note}
                            sharerName={payload.sharer.displayName}
                            sharedAt={share.createdAt}
                            expiresAt={share.expiresAt}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default ShareLinkOwnerPreview;
