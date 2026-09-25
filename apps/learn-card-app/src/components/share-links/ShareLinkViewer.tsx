import { QRCodeSVG } from 'qrcode.react';
import { useIsLoggedIn, useModal, useWallet, ModalTypes, redirectStore } from 'learn-card-base';
import LearnCardBrandMark from '../../assets/images/lca-brandmark.png';
import LearnCardTextLogo from '../svgs/LearnCardTextLogo';
import { ShareCredentialsIllustration } from './ShareCredentialsIllustration';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { IonIcon, IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import {
    checkmarkOutline,
    copyOutline,
    documentTextOutline,
    downloadOutline,
    qrCodeOutline,
    lockClosedOutline,
    bookmarkOutline,
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
    parseSavedShareLinkMetadata,
    readShareAddress,
    SAVED_SHARE_METADATA_TYPE,
    shareWallet,
    verifyCredentialTree,
    verifySharedPresentation,
    type ProofState,
} from './shareLinkFlow';
import { ProofBadge, ShareLinkPreview } from './ShareLinkPreview';
import { downloadSharePdf } from './sharePdf';
import { downloadSharePresentation } from './shareDownload';
import { enterSharePrivacy } from './sharePrivacy';

type Ready = {
    payload: SharePayload;
    metadata: Extract<ShareLinkPublicState, { state: 'active' }>;
    receipt: string;
};
type ViewState =
    | 'loading'
    | 'passcode_required'
    | 'try_later'
    | 'incomplete'
    | 'expired'
    | 'stopped'
    | 'not_found'
    | 'error'
    | 'corrupt'
    | 'ready';

const secondaryButton =
    'inline-flex items-center justify-center gap-2 px-3 py-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 text-sm font-medium hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const SAVE_AFTER_SIGN_IN_KEY = 'learncard:share-link:save-after-sign-in';
const PRIVATE_RETURN_KEY = 'learncard:share-link:private-return';
const PRIVATE_RETURN_TTL_MS = 15 * 60 * 1000;

const isPasscodeRejection = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) return false;
    const candidate = error as { data?: { code?: string }; message?: string };
    return (
        candidate.data?.code === 'UNAUTHORIZED' ||
        candidate.message?.includes('share-link passcode required') === true
    );
};

const isRateLimited = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    (error as { data?: { code?: string } }).data?.code === 'TOO_MANY_REQUESTS';

const ShareLinkViewerContent = ({ id }: { id: string }) => {
    const location = useLocation();
    const history = useHistory();
    const { hash } = location;
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const [state, setState] = useState<ViewState>('loading');
    const [ready, setReady] = useState<Ready>();
    const [attempt, setAttempt] = useState(0);
    const [proofs, setProofs] = useState<ProofState[]>([]);
    const [holder, setHolder] = useState<ProofState>('checking');
    const [link, setLink] = useState('');
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });
    const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');
    const [downloading, setDownloading] = useState(false);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [actionError, setActionError] = useState<'copy' | 'download'>();
    const [passcode, setPasscode] = useState('');
    const [submittedPasscode, setSubmittedPasscode] = useState<string>();
    const [passcodeError, setPasscodeError] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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
        if (!hash && id) {
            try {
                const saved = JSON.parse(sessionStorage.getItem(PRIVATE_RETURN_KEY) ?? 'null');
                if (
                    saved?.id === id &&
                    typeof saved.hash === 'string' &&
                    typeof saved.createdAt === 'number' &&
                    Date.now() - saved.createdAt <= PRIVATE_RETURN_TTL_MS &&
                    readShareAddress(id, saved.hash)
                ) {
                    sessionStorage.removeItem(PRIVATE_RETURN_KEY);
                    history.replace({ pathname: location.pathname, hash: saved.hash });
                    return () => {
                        cancelled = true;
                    };
                }
                if (
                    saved?.id === id ||
                    typeof saved?.createdAt !== 'number' ||
                    Date.now() - saved.createdAt > PRIVATE_RETURN_TTL_MS
                )
                    sessionStorage.removeItem(PRIVATE_RETURN_KEY);
            } catch {
                // A private return is optional; a malformed entry cannot grant access.
            }
        }
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
                const metadata = await wallet.invoke.resolveShareLink(id, submittedPasscode);
                if (cancelled) return;
                if (metadata.state === 'passcode_required') {
                    setPasscodeError(previous => previous || Boolean(submittedPasscode));
                    setState('passcode_required');
                    return;
                }
                if (metadata.state === 'try_later') {
                    setState('try_later');
                    return;
                }
                if (metadata.state !== 'active') {
                    setState(metadata.state);
                    return;
                }
                let content: Awaited<ReturnType<typeof wallet.invoke.getShareLinkContent>>;
                try {
                    content = await wallet.invoke.getShareLinkContent(id, submittedPasscode);
                } catch (error) {
                    if (!cancelled && isRateLimited(error)) {
                        setState('try_later');
                        return;
                    }
                    if (!cancelled && submittedPasscode && isPasscodeRejection(error)) {
                        setPasscodeError(true);
                        setSubmittedPasscode(undefined);
                        setState('passcode_required');
                        return;
                    }
                    throw error;
                }
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
    }, [id, hash, attempt, submittedPasscode, history, location.pathname]);

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

    const downloadPdf = async () => {
        if (!ready || !visible.current || pdfDownloading) return;
        setPdfDownloading(true);
        setActionError(undefined);
        try {
            await downloadSharePdf(visible.current, ready.metadata.title);
        } catch {
            setActionError('download');
        } finally {
            setPdfDownloading(false);
        }
    };

    const saveToLearnCard = useCallback(async () => {
        if (!ready || !isLoggedIn || saveState === 'saving' || saveState === 'saved') return;
        setSaveState('saving');
        try {
            const wallet = shareWallet(await initWallet());
            const alreadySaved = (await wallet.invoke.getReceivedPresentations()).some(
                item =>
                    item.from === item.to &&
                    parseSavedShareLinkMetadata(item.metadata)?.shareId === ready.payload.shareId
            );
            if (alreadySaved) {
                setSaveState('saved');
                return;
            }
            const pendingSave = (await wallet.invoke.getIncomingPresentations()).find(
                item =>
                    item.from === item.to &&
                    parseSavedShareLinkMetadata(item.metadata)?.shareId === ready.payload.shareId
            );
            if (pendingSave) {
                await wallet.invoke.acceptPresentation(pendingSave.uri);
                setSaveState('saved');
                return;
            }
            const profile = await wallet.invoke.getProfile();
            if (!profile?.profileId) throw new Error('profile');
            const savedMetadata = {
                type: SAVED_SHARE_METADATA_TYPE,
                shareId: ready.payload.shareId,
                title: ready.metadata.title,
                ...(ready.metadata.note ? { note: ready.metadata.note } : {}),
                sharer: {
                    profileId: ready.payload.sharer.profileId,
                    displayName: ready.metadata.sharer.displayName,
                },
            };
            const uri = await wallet.invoke.sendPresentation(
                profile.profileId,
                ready.payload.presentation,
                savedMetadata,
                true
            );
            await wallet.invoke.acceptPresentation(uri);
            setSaveState('saved');
        } catch {
            setSaveState('error');
        }
    }, [initWallet, isLoggedIn, ready, saveState]);

    useEffect(() => {
        if (!ready || !isLoggedIn || saveState !== 'idle') return;
        let cancelled = false;
        void initWallet()
            .then(wallet => shareWallet(wallet).invoke.getReceivedPresentations())
            .then(received => {
                if (
                    !cancelled &&
                    received.some(
                        item =>
                            item.from === item.to &&
                            parseSavedShareLinkMetadata(item.metadata)?.shareId ===
                                ready.payload.shareId
                    )
                )
                    setSaveState('saved');
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [initWallet, isLoggedIn, ready, saveState]);

    useEffect(() => {
        if (!id || !ready || !isLoggedIn || saveState !== 'idle') return;

        try {
            if (sessionStorage.getItem(SAVE_AFTER_SIGN_IN_KEY) !== id) return;
            sessionStorage.removeItem(SAVE_AFTER_SIGN_IN_KEY);
            void saveToLearnCard();
        } catch {
            // Storage can be unavailable in hardened browsers. The manual save
            // action remains available after sign-in in that case.
        }
    }, [id, isLoggedIn, ready, saveState, saveToLearnCard]);

    const stateCopy = {
        loading: [m['shareLinks.opening'](), m['shareLinks.openingHint']()],
        passcode_required: [
            m['shareLinks.passcodeRequired'](),
            m['shareLinks.passcodeRequiredHint'](),
        ],
        try_later: [m['shareLinks.tryLater'](), m['shareLinks.tryLaterHint']()],
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
                    <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4 text-xs font-medium text-grayscale-600">
                        <a
                            href="https://learncard.app"
                            aria-label="LearnCard"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 shrink-0 rounded text-grayscale-900 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <img
                                src={LearnCardBrandMark}
                                alt=""
                                className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                            />
                            <LearnCardTextLogo className="w-28 sm:w-40 h-auto" />
                        </a>
                        <span className="flex items-center gap-2 text-right">
                            <IonIcon icon={lockClosedOutline} className="shrink-0" />
                            {m['shareLinks.sharedCredentials']()}
                        </span>
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
                                {state === 'try_later' && (
                                    <button
                                        type="button"
                                        onClick={() => setAttempt(value => value + 1)}
                                        className={secondaryButton}
                                    >
                                        {m['shareLinks.retry']()}
                                    </button>
                                )}
                                {state === 'passcode_required' && (
                                    <form
                                        className="mx-auto max-w-sm space-y-4 text-left"
                                        onSubmit={event => {
                                            event.preventDefault();
                                            if (passcode.length < 4) return;
                                            setPasscodeError(false);
                                            setSubmittedPasscode(passcode);
                                            setAttempt(value => value + 1);
                                        }}
                                    >
                                        <label className="block text-xs font-medium text-grayscale-700">
                                            {m['shareLinks.passcodeLabel']()}
                                            <input
                                                autoFocus
                                                type="password"
                                                minLength={4}
                                                maxLength={64}
                                                autoComplete="current-password"
                                                value={passcode}
                                                onChange={event => {
                                                    setPasscode(event.target.value);
                                                    setPasscodeError(false);
                                                }}
                                                className="mt-2 w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder={m['shareLinks.passcodeLabel']()}
                                            />
                                        </label>
                                        {passcodeError && (
                                            <p role="alert" className="text-sm text-red-700">
                                                {m['shareLinks.passcodeIncorrect']()}
                                            </p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={passcode.length < 4}
                                            className="w-full rounded-[20px] bg-grayscale-900 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {m['shareLinks.unlock']()}
                                        </button>
                                    </form>
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
                                        summaryIllustration={<ShareCredentialsIllustration />}
                                        payload={ready.payload}
                                        title={ready.metadata.title}
                                        note={ready.metadata.note}
                                        sharerName={ready.metadata.sharer.displayName}
                                        sharerAvatar={ready.metadata.sharer.avatar}
                                        sharedAt={ready.metadata.createdAt}
                                        expiresAt={ready.metadata.expiresAt}
                                        proofs={proofRecord}
                                        showOriginal
                                        summaryExtra={
                                            <>
                                                <section
                                                    data-share-export-exclude
                                                    className="pt-4 border-t border-grayscale-100 space-y-3"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <IonIcon
                                                            icon={bookmarkOutline}
                                                            className="mt-0.5 text-grayscale-600 shrink-0"
                                                        />
                                                        <p className="text-xs text-grayscale-500 leading-relaxed">
                                                            {m['shareLinks.saveHint']()}
                                                        </p>
                                                    </div>
                                                    {isLoggedIn ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => void saveToLearnCard()}
                                                            disabled={
                                                                saveState === 'saving' ||
                                                                saveState === 'saved'
                                                            }
                                                            className="w-full rounded-[20px] bg-grayscale-900 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {saveState === 'saving'
                                                                ? m[
                                                                      'shareLinks.savingToLearnCard'
                                                                  ]()
                                                                : saveState === 'saved'
                                                                  ? m[
                                                                        'shareLinks.savedToLearnCard'
                                                                    ]()
                                                                  : m[
                                                                        'shareLinks.saveToLearnCard'
                                                                    ]()}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!id) return;
                                                                try {
                                                                    sessionStorage.setItem(
                                                                        SAVE_AFTER_SIGN_IN_KEY,
                                                                        id
                                                                    );
                                                                    sessionStorage.setItem(
                                                                        PRIVATE_RETURN_KEY,
                                                                        JSON.stringify({
                                                                            id,
                                                                            hash,
                                                                            createdAt: Date.now(),
                                                                        })
                                                                    );
                                                                } catch {
                                                                    // Storage may be unavailable in hardened browsers.
                                                                }
                                                                // The persisted auth redirect contains only the public
                                                                // route. The decryption key stays in this tab's session.
                                                                redirectStore.set.authRedirect(
                                                                    location.pathname
                                                                );
                                                                history.push('/login');
                                                            }}
                                                            className="block w-full rounded-[20px] bg-grayscale-900 px-5 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                                                        >
                                                            {m['shareLinks.signInToSave']()}
                                                        </button>
                                                    )}
                                                    {saveState === 'error' && (
                                                        <p
                                                            role="alert"
                                                            className="text-sm text-red-700"
                                                        >
                                                            {m['shareLinks.saveError']()}
                                                        </p>
                                                    )}
                                                </section>
                                                <div className="pt-4 border-t border-grayscale-100 space-y-2">
                                                    <p className="text-xs font-medium text-grayscale-700">
                                                        {m['shareLinks.presentationProof']()}
                                                    </p>
                                                    <ProofBadge state={holder} />
                                                    <p className="text-xs text-grayscale-500 leading-relaxed">
                                                        {m['shareLinks.proofHint']()}
                                                    </p>
                                                </div>
                                                <section
                                                    data-share-export-exclude
                                                    className="pt-4 border-t border-grayscale-100 space-y-3"
                                                >
                                                    <p className="text-xs text-grayscale-500 leading-relaxed">
                                                        {m['shareLinks.downloadHint']()}
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                                        <button
                                                            type="button"
                                                            className={secondaryButton}
                                                            disabled={
                                                                !link || copyState === 'copying'
                                                            }
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
                                                        <button
                                                            type="button"
                                                            className={secondaryButton}
                                                            disabled={!link}
                                                            onClick={() =>
                                                                newModal(
                                                                    <div
                                                                        className="sentry-block ph-no-capture bg-white p-6 font-poppins text-grayscale-900 text-center space-y-5"
                                                                        data-html2canvas-ignore
                                                                    >
                                                                        <h2 className="text-xl font-semibold break-words">
                                                                            {ready.metadata.title}
                                                                        </h2>
                                                                        <QRCodeSVG
                                                                            value={link}
                                                                            size={256}
                                                                            level="M"
                                                                            includeMargin
                                                                            bgColor="#FFFFFF"
                                                                            fgColor="#18224E"
                                                                            role="img"
                                                                            aria-label={m[
                                                                                'shareLinks.qrLabel'
                                                                            ]()}
                                                                            className="mx-auto h-auto max-w-full"
                                                                        />
                                                                        <p className="text-sm text-grayscale-600">
                                                                            {m[
                                                                                'shareLinks.qrHint'
                                                                            ]()}
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            className="rounded-[20px] !bg-grayscale-900 !text-white px-5 py-3 text-sm font-medium"
                                                                            onClick={closeModal}
                                                                        >
                                                                            {m[
                                                                                'shareLinks.close'
                                                                            ]()}
                                                                        </button>
                                                                    </div>
                                                                )
                                                            }
                                                        >
                                                            <IonIcon icon={qrCodeOutline} />
                                                            {m['shareLinks.showQr']()}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={secondaryButton}
                                                            disabled={pdfDownloading}
                                                            onClick={() => void downloadPdf()}
                                                        >
                                                            <IonIcon icon={downloadOutline} />
                                                            {pdfDownloading
                                                                ? m['shareLinks.preparingPdf']()
                                                                : m['shareLinks.downloadPdf']()}
                                                        </button>
                                                    </div>
                                                    {actionError && (
                                                        <p
                                                            role="alert"
                                                            className="text-sm text-red-700"
                                                        >
                                                            {actionError === 'copy'
                                                                ? m['shareLinks.copyError']()
                                                                : m['shareLinks.downloadError']()}
                                                        </p>
                                                    )}
                                                </section>
                                            </>
                                        }
                                    />
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

// A route-param change must discard the previous link's passcode and all other
// private viewer state before any request for the next link can start.
const ShareLinkViewer = () => {
    const { id } = useParams<{ id: string }>();
    return <ShareLinkViewerContent key={id} id={id} />;
};

export default ShareLinkViewer;
