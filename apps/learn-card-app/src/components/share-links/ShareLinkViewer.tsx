import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { IonIcon, IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import {
    checkmarkOutline,
    copyOutline,
    documentTextOutline,
    downloadOutline,
    lockClosedOutline,
} from 'ionicons/icons';
import { Clipboard } from '@capacitor/clipboard';
import type { ShareLinkPublicState, SharePayload } from '@learncard/types';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import {
    buildShareLinkUrl,
    decryptSharePayload,
    validateShareManifest,
} from 'learn-card-base/helpers/share-links';
import * as m from '../../paraglide/messages.js';
import {
    createVerificationBudget,
    readShareAddress,
    shareWallet,
    verifyCredentialTree,
    verifySharedPresentation,
    type ProofState,
} from './shareLinkFlow';
import { ProofBadge, ShareLinkPreview } from './ShareLinkPreview';
import { downloadSharePresentation } from './shareDownload';
import { enterSharePrivacy } from './sharePrivacy';

type Ready = {
    payload: SharePayload;
    metadata: Extract<ShareLinkPublicState, { state: 'active' }>;
    receipt: string;
};
type ViewState =
    'loading' | 'incomplete' | 'expired' | 'stopped' | 'not_found' | 'error' | 'corrupt' | 'ready';

const secondaryButton =
    'inline-flex items-center gap-2 px-5 py-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 text-sm font-medium hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const ShareLinkViewer = () => {
    const { id } = useParams<{ id: string }>();
    const { hash } = useLocation();
    const [state, setState] = useState<ViewState>('loading');
    const [ready, setReady] = useState<Ready>();
    const [attempt, setAttempt] = useState(0);
    const [proofs, setProofs] = useState<ProofState[]>([]);
    const [holder, setHolder] = useState<ProofState>('checking');
    const [link, setLink] = useState('');
    const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');
    const [downloading, setDownloading] = useState(false);
    const [actionError, setActionError] = useState<'copy' | 'download'>();
    const visible = useRef<HTMLDivElement>(null);
    const acknowledged = useRef(new Set<string>());

    useEffect(() => {
        enterSharePrivacy();
        let cancelled = false;
        // One budget bounds the holder proof plus every credential/endorsement
        // check; cancelling on unmount/retry stops any further checks.
        let budget: ReturnType<typeof createVerificationBudget> | undefined;
        setReady(undefined);
        setState('loading');
        setProofs([]);
        setHolder('checking');
        setLink('');
        setCopyState('idle');
        setActionError(undefined);
        const address = readShareAddress(id, hash);
        if (!address) {
            setState('incomplete');
            return () => {
                cancelled = true;
                budget?.cancel();
            };
        }
        try {
            // Rebuild the full private link (fragment included) only for a
            // deliberate copy gesture; it is never rendered or logged.
            setLink(buildShareLinkUrl(window.location.host, id, address.key));
        } catch {
            setLink('');
        }
        const load = async () => {
            try {
                // Anonymous configured client: no account/key lookup or sign-in prerequisite.
                const wallet = shareWallet(await getBespokeLearnCard('a'));
                const metadata = await wallet.invoke.resolveShareLink(id);
                if (cancelled) return;
                if (metadata.state !== 'active') {
                    setState(metadata.state);
                    return;
                }
                const content = await wallet.invoke.getShareLinkContent(id);
                if (cancelled) return;
                try {
                    if (content.id !== id || content.contentVersion !== metadata.contentVersion)
                        throw new Error('version');
                    const plaintext = await decryptSharePayload({
                        shareId: id,
                        contentVersion: content.contentVersion,
                        key: address.key,
                        envelope: content.envelope,
                    });
                    const validated = validateShareManifest(plaintext, {
                        shareId: id,
                        contentVersion: content.contentVersion,
                    });
                    if (
                        !validated.ok ||
                        validated.manifest.selection.length !== metadata.selectedCount
                    )
                        throw new Error('manifest');
                    if (cancelled) return;
                    const payload = validated.manifest;
                    const members = payload.presentation.verifiableCredential;
                    budget = createVerificationBudget();
                    setReady({ payload, metadata, receipt: content.receipt });
                    setProofs(members.map(() => 'checking'));
                    setState('ready');
                    void verifySharedPresentation(wallet, payload, budget).then(result => {
                        if (!cancelled) setHolder(result);
                    });
                    // Bounded sequential checks avoid flooding issuer/status endpoints.
                    // The shared budget (not the wallet call) decides when to stop; a
                    // late result from an already-cancelled pass is ignored.
                    for (let index = 0; index < members.length; index++) {
                        if (cancelled || budget.expired()) {
                            if (!cancelled)
                                setProofs(previous =>
                                    previous.map((value, i) => (i >= index ? 'unavailable' : value))
                                );
                            break;
                        }
                        const result = await verifyCredentialTree(wallet, members[index], budget);
                        if (cancelled) break;
                        setProofs(previous =>
                            previous.map((value, i) => (i === index ? result : value))
                        );
                    }
                } catch {
                    if (!cancelled) setState('corrupt');
                }
            } catch {
                if (!cancelled) setState('error');
            }
        };
        void load();
        return () => {
            cancelled = true;
            budget?.cancel();
        };
    }, [id, hash, attempt]);

    useEffect(() => {
        if (state !== 'ready' || !ready || !visible.current) return;
        const receipt = ready.receipt;
        let disposed = false;
        let pending = false;
        let frame = 0;
        let intersecting = false;
        const schedule = () => {
            if (disposed || pending || !intersecting) return;
            if (document.visibilityState !== 'visible' || acknowledged.current.has(receipt)) return;
            pending = true;
            frame = requestAnimationFrame(() => {
                pending = false;
                if (
                    disposed ||
                    !intersecting ||
                    document.visibilityState !== 'visible' ||
                    acknowledged.current.has(receipt)
                )
                    return;
                acknowledged.current.add(receipt);
                void getBespokeLearnCard('a')
                    .then(wallet => {
                        if (!disposed) return wallet.invoke.acknowledgeShareLinkView(receipt);
                    })
                    .catch(() => {
                        // No new receipt or content fetch on an acknowledgement failure.
                    });
            });
        };
        const observer = new IntersectionObserver(entries => {
            intersecting = entries.some(entry => entry.isIntersecting);
            schedule();
        });
        observer.observe(visible.current);
        document.addEventListener('visibilitychange', schedule);
        return () => {
            disposed = true;
            observer.disconnect();
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
            document.removeEventListener('visibilitychange', schedule);
        };
    }, [ready, state]);

    const proofRecord = useMemo(
        () =>
            Object.fromEntries(proofs.map((value, index) => [index, value])) as Record<
                number,
                ProofState
            >,
        [proofs]
    );

    const copyLink = async () => {
        if (!link || copyState === 'copying') return;
        setCopyState('copying');
        setActionError(undefined);
        try {
            await Clipboard.write({ string: link });
            setCopyState('copied');
        } catch {
            setCopyState('idle');
            setActionError('copy');
        }
    };

    const download = () => {
        if (!ready || downloading) return;
        setDownloading(true);
        setActionError(undefined);
        try {
            downloadSharePresentation(ready.payload, ready.metadata.title);
        } catch {
            setActionError('download');
        } finally {
            setDownloading(false);
        }
    };

    const stateCopy = {
        loading: [m['shareLinks.opening'](), m['shareLinks.openingHint']()],
        incomplete: [m['shareLinks.incomplete'](), m['shareLinks.incompleteHint']()],
        expired: [m['shareLinks.expired'](), m['shareLinks.askNew']()],
        stopped: [m['shareLinks.stopped'](), m['shareLinks.askNew']()],
        not_found: [m['shareLinks.notFound'](), m['shareLinks.askNew']()],
        error: [m['shareLinks.connection'](), m['shareLinks.error']()],
        corrupt: [m['shareLinks.corrupt'](), m['shareLinks.incompleteHint']()],
        ready: ['', ''],
    }[state];
    return (
        <IonPage className="sentry-block ph-no-capture font-poppins" data-html2canvas-ignore>
            <IonHeader className="ion-no-border border-b border-grayscale-200">
                <IonToolbar style={{ '--background': 'white' }}>
                    <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2 text-xs font-medium text-grayscale-600">
                        <IonIcon icon={lockClosedOutline} />
                        {m['shareLinks.sharedCredentials']()}
                    </div>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <main className="bg-grayscale-100 text-grayscale-900 min-h-full">
                    <div className="max-w-3xl mx-auto px-5 py-8 md:py-14 space-y-5">
                        {state !== 'ready' || !ready ? (
                            <section
                                role="status"
                                className="bg-white rounded-[20px] p-8 md:p-12 text-center space-y-4"
                            >
                                <span className="inline-flex p-4 rounded-2xl bg-grayscale-100 text-grayscale-600">
                                    <IonIcon
                                        icon={
                                            state === 'loading'
                                                ? documentTextOutline
                                                : lockClosedOutline
                                        }
                                        className="w-7 h-7"
                                    />
                                </span>
                                <h1 className="text-xl font-semibold">{stateCopy[0]}</h1>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {stateCopy[1]}
                                </p>
                                {state === 'loading' && (
                                    <div
                                        aria-hidden
                                        className="mx-auto h-5 w-5 rounded-full border-2 border-grayscale-300 border-t-grayscale-900 animate-spin"
                                    />
                                )}
                                {state === 'error' && (
                                    <button
                                        className="px-5 py-3 rounded-[20px] bg-grayscale-900 text-white text-sm"
                                        onClick={() => setAttempt(value => value + 1)}
                                    >
                                        {m['shareLinks.retry']()}
                                    </button>
                                )}
                            </section>
                        ) : (
                            <>
                                <div ref={visible}>
                                    <ShareLinkPreview
                                        payload={ready.payload}
                                        title={ready.metadata.title}
                                        note={ready.metadata.note}
                                        sharerName={ready.metadata.sharer.displayName}
                                        expiresAt={ready.metadata.expiresAt}
                                        proofs={proofRecord}
                                        showOriginal
                                        summaryExtra={
                                            <div className="pt-4 border-t border-grayscale-100 space-y-2">
                                                <p className="text-xs font-medium text-grayscale-700">
                                                    {m['shareLinks.presentationProof']()}
                                                </p>
                                                <ProofBadge state={holder} />
                                                <p className="text-xs text-grayscale-500 leading-relaxed">
                                                    {m['shareLinks.proofHint']()}
                                                </p>
                                            </div>
                                        }
                                    />
                                </div>
                                <section className="bg-white rounded-[20px] p-6 md:p-8 space-y-3">
                                    <p className="text-xs text-grayscale-500 leading-relaxed">
                                        {m['shareLinks.downloadHint']()}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            className={secondaryButton}
                                            disabled={!link || copyState === 'copying'}
                                            onClick={() => void copyLink()}
                                        >
                                            <IonIcon
                                                icon={
                                                    copyState === 'copied'
                                                        ? checkmarkOutline
                                                        : copyOutline
                                                }
                                            />
                                            {copyState === 'copied'
                                                ? m['shareLinks.copied']()
                                                : copyState === 'copying'
                                                  ? m['shareLinks.copying']()
                                                  : m['shareLinks.copy']()}
                                        </button>
                                        <button
                                            type="button"
                                            className={secondaryButton}
                                            disabled={downloading}
                                            onClick={download}
                                        >
                                            <IonIcon icon={downloadOutline} />
                                            {downloading
                                                ? m['shareLinks.downloading']()
                                                : m['shareLinks.download']()}
                                        </button>
                                    </div>
                                    {actionError && (
                                        <p role="alert" className="text-sm text-red-700">
                                            {actionError === 'copy'
                                                ? m['shareLinks.copyError']()
                                                : m['shareLinks.downloadError']()}
                                        </p>
                                    )}
                                </section>
                                <p className="text-center text-xs text-grayscale-500 px-4 leading-relaxed">
                                    {m['shareLinks.recipientHint']()}
                                </p>
                            </>
                        )}
                    </div>
                </main>
            </IonContent>
        </IonPage>
    );
};
export default ShareLinkViewer;
