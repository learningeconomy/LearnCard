import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import QrScanner from 'qr-scanner';

import { useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import type { VC } from '@learncard/types';

import { useClaimInputRouter, type ClaimInputSource } from '../../hooks/useClaimInputRouter';
import type { UnrecognizedReason } from '../../hooks/parseClaimInput';
import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';
import type { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';

const unrecognizedCopyFor = (reason: UnrecognizedReason): string => {
    switch (reason) {
        case 'empty':
            return 'Paste a link or upload a QR code image to continue.';
        case 'malformed_url':
            return "That doesn't look like a claim link. Try copying the whole link, starting with https://, openid-credential-offer://, or similar.";
        case 'unknown_scheme':
            return "We don't recognize this kind of link yet. The link looks valid, but the format isn't supported.";
        case 'invalid_vc':
            return "That looks like a credential, but we couldn't read it. Ask the issuer for a fresh copy.";
        case 'unknown_format':
            return "We couldn't make sense of that. Paste a claim link or upload a QR code image.";
    }
};

const CLAIM_LINK_PREFIXES = [
    'openid-credential-offer://',
    'openid4vp://',
    'dccrequest://',
    'msprequest://',
    'asuprequest://',
];

const looksLikeClaimLink = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (CLAIM_LINK_PREFIXES.some(p => trimmed.toLowerCase().startsWith(p))) return true;
    return trimmed.includes('boostUri=') || trimmed.includes('iuv=1');
};

const tryReadClipboardForClaim = async (): Promise<string | null> => {
    if (!navigator.clipboard?.readText) return null;
    if (typeof navigator.permissions?.query === 'function') {
        try {
            const status = await navigator.permissions.query({
                name: 'clipboard-read' as PermissionName,
            });
            if (status.state !== 'granted') return null;
        } catch {
            return null;
        }
    }
    try {
        const text = await navigator.clipboard.readText();
        return text && looksLikeClaimLink(text) ? text : null;
    } catch {
        return null;
    }
};

export const PasteOrUploadClaimModal: React.FC = () => {
    const { closeModal, newModal } = useModal();
    const { presentToast } = useToast();

    const [pasted, setPasted] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorCopy, setErrorCopy] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);

    const route = useClaimInputRouter({ defaultSource: 'paste' });

    const openDownstreamClaimBoostModal = useCallback(
        (props: { uri?: string; claimChallenge?: string; vc?: VC }) => {
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
        (contact: AddressBookContact) => {
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
            setIsProcessing(true);
            try {
                const result = await route(input, source);

                if (result.kind === 'unrecognized') {
                    setErrorCopy(unrecognizedCopyFor(result.reason));
                    return false;
                }

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

                return true;
            } catch (err) {
                presentToast(
                    `Oops! ${err instanceof Error ? err.message : 'Something went wrong.'}`,
                    { type: ToastTypeEnum.Error, hasDismissButton: true }
                );
                return false;
            } finally {
                setIsProcessing(false);
            }
        },
        [
            route,
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
                const scanResult = await QrScanner.scanImage(file, {
                    returnDetailedScanResult: true,
                });
                const decoded =
                    typeof scanResult === 'string' ? scanResult : scanResult.data;
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
        void tryReadClipboardForClaim().then(text => {
            if (!cancelled && text) setPasted(text);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const dragHandlers = useMemo(
        () => ({
            onDragEnter: (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current += 1;
                if (dragDepthRef.current === 1) setIsDragging(true);
            },
            onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();
            },
            onDragLeave: (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                if (dragDepthRef.current === 0) setIsDragging(false);
            },
            onDrop: async (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current = 0;
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                    await handleFile(file);
                }
            },
        }),
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
                            {...dragHandlers}
                            disabled={isProcessing}
                            className={`w-full py-6 px-4 rounded-xl border-2 border-dashed transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed ${
                                isDragging
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-grayscale-300 hover:border-grayscale-400 hover:bg-grayscale-10'
                            }`}
                        >
                            <p
                                className={`text-sm font-medium ${
                                    isDragging ? 'text-emerald-700' : 'text-grayscale-700'
                                }`}
                            >
                                {isDragging ? 'Drop it!' : 'Choose an image'}
                            </p>
                            <p
                                className={`text-xs mt-1 ${
                                    isDragging ? 'text-emerald-600' : 'text-grayscale-500'
                                }`}
                            >
                                {isDragging ? 'Release to upload' : 'or drop it here'}
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
