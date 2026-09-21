import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { IonIcon, IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import {
    alertCircleOutline,
    checkmarkCircleOutline,
    documentTextOutline,
    lockClosedOutline,
} from 'ionicons/icons';
import type { ShareLinkPublicState, SharePayload } from '@learncard/types';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { decryptSharePayload, validateShareManifest } from 'learn-card-base/helpers/share-links';
import * as m from '../../paraglide/messages.js';
import {
    credentialText,
    readShareAddress,
    shareWallet,
    verifyCredentialTree,
    verifySharedPresentation,
    type ProofState,
} from './shareLinkFlow';
import { enterSharePrivacy } from './sharePrivacy';

type Ready = {
    payload: SharePayload;
    metadata: Extract<ShareLinkPublicState, { state: 'active' }>;
    receipt: string;
};
type ViewState =
    'loading' | 'incomplete' | 'expired' | 'stopped' | 'not_found' | 'error' | 'corrupt' | 'ready';
const proofLabel = (state: ProofState) =>
    ({
        checking: m['shareLinks.checking'](),
        verified: m['shareLinks.verified'](),
        failed: m['shareLinks.failed'](),
        unavailable: m['shareLinks.unavailable'](),
    })[state];
const ProofBadge = ({ state }: { state: ProofState }) => (
    <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${state === 'verified' ? 'text-emerald-700' : state === 'failed' ? 'text-red-700' : 'text-grayscale-600'}`}
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

const ShareLinkViewer = () => {
    const { id } = useParams<{ id: string }>();
    const { hash } = useLocation();
    const [state, setState] = useState<ViewState>('loading');
    const [ready, setReady] = useState<Ready>();
    const [attempt, setAttempt] = useState(0);
    const [proofs, setProofs] = useState<ProofState[]>([]);
    const [holder, setHolder] = useState<ProofState>('checking');
    const visible = useRef<HTMLDivElement>(null);
    const acknowledged = useRef(new Set<string>());

    useEffect(() => {
        enterSharePrivacy();
        let cancelled = false;
        setReady(undefined);
        setState('loading');
        setProofs([]);
        setHolder('checking');
        const address = readShareAddress(id, hash);
        if (!address) {
            setState('incomplete');
            return;
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
                    setReady({ payload, metadata, receipt: content.receipt });
                    setProofs(payload.presentation.verifiableCredential.map(() => 'checking'));
                    setState('ready');
                    void verifySharedPresentation(wallet, payload).then(result => {
                        if (!cancelled) setHolder(result);
                    });
                    // Bounded sequential checks avoid flooding issuer/status endpoints.
                    for (
                        let index = 0;
                        index < payload.presentation.verifiableCredential.length && !cancelled;
                        index++
                    ) {
                        const result = await verifyCredentialTree(
                            wallet,
                            payload.presentation.verifiableCredential[index]
                        );
                        if (!cancelled)
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
        };
    }, [id, hash, attempt]);

    useEffect(() => {
        if (state !== 'ready' || !ready || !visible.current) return;
        const receipt = ready.receipt;
        let frame = 0;
        let intersecting = false;
        const acknowledge = () => {
            if (
                !intersecting ||
                document.visibilityState !== 'visible' ||
                acknowledged.current.has(receipt)
            )
                return;
            frame = requestAnimationFrame(() => {
                if (
                    !intersecting ||
                    document.visibilityState !== 'visible' ||
                    acknowledged.current.has(receipt)
                )
                    return;
                acknowledged.current.add(receipt);
                void getBespokeLearnCard('a')
                    .then(wallet => wallet.invoke.acknowledgeShareLinkView(receipt))
                    .catch(() => {
                        // No new receipt or content fetch on an acknowledgement failure.
                    });
            });
        };
        const observer = new IntersectionObserver(entries => {
            intersecting = entries.some(entry => entry.isIntersecting);
            acknowledge();
        });
        observer.observe(visible.current);
        document.addEventListener('visibilitychange', acknowledge);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
            document.removeEventListener('visibilitychange', acknowledge);
        };
    }, [ready, state]);

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
                                <section className="bg-white rounded-[20px] p-6 md:p-8 space-y-4">
                                    <p className="text-xs text-grayscale-500">
                                        {m['shareLinks.sharedBy']({
                                            name: ready.metadata.sharer.displayName,
                                        })}
                                    </p>
                                    <h1 className="text-2xl md:text-3xl font-semibold break-words">
                                        {ready.metadata.title}
                                    </h1>
                                    {ready.metadata.note && (
                                        <p className="text-sm text-grayscale-600 leading-relaxed whitespace-pre-wrap break-words">
                                            {ready.metadata.note}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-xs text-grayscale-500">
                                        <span>
                                            {m['shareLinks.selected']({
                                                count: String(ready.payload.selection.length),
                                            })}
                                        </span>
                                        {ready.metadata.expiresAt && (
                                            <span>
                                                {m['shareLinks.expires']({
                                                    date: new Date(
                                                        ready.metadata.expiresAt
                                                    ).toLocaleDateString(),
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="pt-4 border-t border-grayscale-100 space-y-2">
                                        <p className="text-xs font-medium text-grayscale-700">
                                            {m['shareLinks.presentationProof']()}
                                        </p>
                                        <ProofBadge state={holder} />
                                        <p className="text-xs text-grayscale-500 leading-relaxed">
                                            {m['shareLinks.proofHint']()}
                                        </p>
                                    </div>
                                </section>
                                <div ref={visible} className="space-y-4">
                                    {ready.payload.selection.map(({ credentialIndex }, order) => {
                                        const credential =
                                            ready.payload.presentation.verifiableCredential[
                                                credentialIndex
                                            ];
                                        const text = credentialText(credential);
                                        const endorsements = ready.payload.endorsements.filter(
                                            item => item.targetCredentialIndex === credentialIndex
                                        );
                                        return (
                                            <article
                                                key={credentialIndex}
                                                className="bg-white rounded-[20px] p-6 md:p-8 space-y-4"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <span className="p-3 bg-grayscale-100 rounded-xl text-grayscale-600">
                                                        <IonIcon
                                                            icon={documentTextOutline}
                                                            className="w-6 h-6"
                                                        />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-grayscale-500 mb-1">
                                                            {String(order + 1).padStart(2, '0')}
                                                        </p>
                                                        <h2 className="text-lg font-semibold break-words">
                                                            {text.name ||
                                                                m['shareLinks.credential']()}
                                                        </h2>
                                                        {text.issuer && (
                                                            <p className="text-xs text-grayscale-600 mt-1 break-words">
                                                                {text.issuer}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {text.description && (
                                                    <p className="text-sm text-grayscale-600 leading-relaxed whitespace-pre-wrap break-words">
                                                        {text.description}
                                                    </p>
                                                )}
                                                <div aria-live="polite">
                                                    <ProofBadge
                                                        state={
                                                            proofs[credentialIndex] ?? 'checking'
                                                        }
                                                    />
                                                </div>
                                                {endorsements.length > 0 && (
                                                    <div className="pt-4 border-t border-grayscale-100 space-y-2">
                                                        <h3 className="text-xs font-medium text-grayscale-700">
                                                            {m['shareLinks.endorsements']()}
                                                        </h3>
                                                        {endorsements.map(item => (
                                                            <div key={item.credentialIndex}>
                                                                <ProofBadge
                                                                    state={
                                                                        proofs[
                                                                            item.credentialIndex
                                                                        ] ?? 'checking'
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <details className="text-xs text-grayscale-600">
                                                    <summary className="cursor-pointer py-2">
                                                        {m['shareLinks.original']()}
                                                    </summary>
                                                    <pre className="mt-2 p-4 bg-grayscale-100 rounded-xl overflow-auto max-h-80 text-xs whitespace-pre-wrap break-all">
                                                        {JSON.stringify(credential, null, 2)}
                                                    </pre>
                                                </details>
                                            </article>
                                        );
                                    })}
                                </div>
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
