import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import QrScanner from 'qr-scanner';

import { useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';

import { useClaimInputRouter, type ClaimInputSource } from '../../hooks/useClaimInputRouter';
import type { UnrecognizedReason } from '../../hooks/parseClaimInput';
import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';

const UNRECOGNIZED_COPY: Record<UnrecognizedReason, string> = {
    empty: '',
    malformed_url:
        "That doesn't look like a claim link. Try copying the whole link, starting with https://, openid-credential-offer://, or similar.",
    unknown_scheme:
        "We don't recognize this kind of link yet. The link looks valid, but the format isn't supported.",
    invalid_vc: "That looks like a credential, but we couldn't read it. Ask the issuer for a fresh copy.",
    unknown_format:
        "We couldn't make sense of that. Paste a claim link or upload a QR code image.",
};

const QR_DECODE_OPTIONS = { returnDetailedScanResult: true } as const;

export const PasteOrUploadClaimModal: React.FC = () => {
    const { closeModal, newModal } = useModal();
    const { presentToast } = useToast();

    const [pasted, setPasted] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorCopy, setErrorCopy] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const pasteRouter = useClaimInputRouter({ source: 'paste' });
    const uploadRouter = useClaimInputRouter({ source: 'image_upload' });
    const clipboardRouter = useClaimInputRouter({ source: 'clipboard_auto' });

    const openDownstreamClaimBoostModal = useCallback(
        (props: {
            uri?: string;
            claimChallenge?: string;
            vc?: import('@learncard/types').VC;
        }) => {
            newModal(
                <ClaimBoost
                    uri={props.uri}
                    claimChallenge={props.claimChallenge}
                    dismissClaimModal={closeModal}
                    vc={props.vc ?? null}
                />,
                { hideButton: true },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
        },
        [newModal, closeModal]
    );

    const openDownstreamAddContactModal = useCallback(
        (contact: import('../../pages/addressBook/addressBookHelpers').AddressBookContact) => {
            newModal(
                <AddContactView
                    user={contact}
                    handleCancel={closeModal}
                    mode={AddContactViewMode.requestConnection}
                />,
                { hideButton: true },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
        },
        [newModal, closeModal]
    );

    const dispatch = useCallback(
        async (input: string, source: ClaimInputSource): Promise<boolean> => {
            const router =
                source === 'paste'
                    ? pasteRouter
                    : source === 'image_upload'
                      ? uploadRouter
                      : clipboardRouter;

            setIsProcessing(true);
            try {
                const result = await router(input);

                if (result.kind === 'unrecognized') {
                    setErrorCopy(UNRECOGNIZED_COPY[result.reason] || UNRECOGNIZED_COPY.unknown_format);
                    return false;
                }

                // The router's 'routed' / 'open_website' / 'open_*' kinds all
                // require the modal to step out of the way so the user can see
                // whatever opens next (a new modal, a navigation target, a new
                // tab). Close ourselves FIRST, then open the downstream modal —
                // matches the established `closeModal() → newModal()` pattern in
                // AddToLearnCardMenu.
                closeModal();

                if (result.kind === 'open_claim_boost') {
                    openDownstreamClaimBoostModal({
                        uri: result.boost.uri,
                        claimChallenge: result.boost.challenge,
                    });
                } else if (result.kind === 'open_claim_vc') {
                    openDownstreamClaimBoostModal({ vc: result.vc });
                } else if (result.kind === 'open_contact') {
                    openDownstreamAddContactModal(result.contact);
                } else if (result.kind === 'open_website') {
                    window.open(result.url, '_blank');
                }
                // 'routed' — the router already called history.push; nothing more to do.

                return true;
            } catch (err) {
                presentToast(
                    `Couldn't process that — ${err instanceof Error ? err.message : 'unknown error'}`,
                    { type: ToastTypeEnum.Error, hasDismissButton: true }
                );
                return false;
            } finally {
                setIsProcessing(false);
            }
        },
        [
            pasteRouter,
            uploadRouter,
            clipboardRouter,
            closeModal,
            presentToast,
            openDownstreamClaimBoostModal,
            openDownstreamAddContactModal,
        ]
    );

    const handleContinueWithPaste = useCallback(async () => {
        setErrorCopy(null);
        await dispatch(pasted, 'paste');
    }, [pasted, dispatch]);

    const handleFile = useCallback(
        async (file: File) => {
            setErrorCopy(null);
            try {
                const scanResult = await QrScanner.scanImage(file, QR_DECODE_OPTIONS);
                const decoded = typeof scanResult === 'string' ? scanResult : scanResult.data;
                if (!decoded) {
                    setErrorCopy(
                        "We couldn't find a QR code in that image. Make sure the QR fills most of the photo and isn't blurry."
                    );
                    return;
                }
                await dispatch(decoded, 'image_upload');
            } catch {
                setErrorCopy(
                    "We couldn't read a QR code from that image. Try a clearer photo, or paste the link instead."
                );
            }
        },
        [dispatch]
    );

    useEffect(() => {
        let cancelled = false;
        const tryClipboard = async () => {
            if (!navigator.clipboard?.readText) return;
            try {
                const text = await navigator.clipboard.readText();
                if (cancelled || !text) return;
                const looksLikeClaim =
                    text.startsWith('openid-credential-offer://') ||
                    text.startsWith('openid4vp://') ||
                    text.startsWith('dccrequest://') ||
                    text.startsWith('msprequest://') ||
                    text.startsWith('asuprequest://') ||
                    text.includes('boostUri=') ||
                    text.includes('iuv=1');
                if (looksLikeClaim) {
                    setPasted(text);
                }
            } catch {
                // Permissions API denied — silent, the user can paste manually
            }
        };
        void tryClipboard();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith('image/')) {
                await handleFile(file);
            }
        },
        [handleFile]
    );

    const onChangeFile = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) await handleFile(file);
            e.target.value = '';
        },
        [handleFile]
    );

    const continueDisabled = isProcessing || !pasted.trim();

    return (
        <IonPage>
            <IonContent>
                <div className="font-poppins p-6 sm:p-8 space-y-6 max-w-md mx-auto">
                    <div className="space-y-1.5">
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            Got a credential link?
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Paste it below, or upload a QR code image.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="claim-link-input"
                            className="text-xs font-medium text-grayscale-700"
                        >
                            Paste a link
                        </label>
                        <input
                            id="claim-link-input"
                            type="text"
                            value={pasted}
                            onChange={e => {
                                setPasted(e.target.value);
                                setErrorCopy(null);
                            }}
                            placeholder="https://… or openid-credential-offer://…"
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            disabled={isProcessing}
                        />
                        <button
                            type="button"
                            onClick={handleContinueWithPaste}
                            disabled={continueDisabled}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Checking…
                                </span>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-grayscale-200" />
                        <span className="text-xs text-grayscale-500">or</span>
                        <div className="flex-1 h-px bg-grayscale-200" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-grayscale-700">
                            Got a QR code as an image?
                        </label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            disabled={isProcessing}
                            className="w-full py-6 px-4 rounded-xl border-2 border-dashed border-grayscale-300 hover:border-grayscale-400 hover:bg-grayscale-10 transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <p className="text-sm text-grayscale-700 font-medium">Choose an image</p>
                            <p className="text-xs text-grayscale-500 mt-1">
                                or drop it here
                            </p>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onChangeFile}
                            className="hidden"
                        />
                    </div>

                    {errorCopy && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl">
                            <p className="text-sm text-red-700 leading-relaxed">{errorCopy}</p>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default PasteOrUploadClaimModal;
