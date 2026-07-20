import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonFooter, IonHeader, IonToolbar } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import QrScanner from 'qr-scanner';

import { useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';
import LinkChain from 'learn-card-base/svgs/LinkChain';

import { useClaimInputRouter, type ClaimInputSource } from '../../hooks/useClaimInputRouter';
import type { UnrecognizedReason } from '../../hooks/parseClaimInput';
import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';
import * as m from '../../paraglide/messages.js';

const unrecognizedCopyFor = (reason: UnrecognizedReason, source: ClaimInputSource): string => {
    const isQrImage = source === 'image_upload';

    switch (reason) {
        case 'empty':
            return isQrImage
                ? m['claim.paste.unrecognized.emptyQr']()
                : m['claim.paste.unrecognized.emptyLink']();
        case 'malformed_url':
            return isQrImage
                ? m['claim.paste.unrecognized.malformedUrlQr']()
                : m['claim.paste.unrecognized.malformedUrlLink']();
        case 'unknown_scheme':
            return isQrImage
                ? m['claim.paste.unrecognized.unknownSchemeQr']()
                : m['claim.paste.unrecognized.unknownSchemeLink']();
        case 'invalid_vc':
            return m['claim.paste.unrecognized.invalidVc']();
        case 'interaction_unavailable':
            return isQrImage
                ? m['claim.paste.unrecognized.interactionUnavailableQr']()
                : m['claim.paste.unrecognized.interactionUnavailableLink']();
        case 'unknown_format':
            return isQrImage
                ? m['claim.paste.unrecognized.unknownFormatQr']()
                : m['claim.paste.unrecognized.unknownFormatLink']();
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

    const queryIndex = trimmed.indexOf('?');
    if (queryIndex === -1) return false;
    try {
        const params = new URLSearchParams(trimmed.substring(queryIndex));
        if (params.has('boostUri')) return true;
        if (params.get('iuv') === '1') return true;
        const did = params.get('did') ?? '';
        if (did.includes('did:web') && did.includes('users:')) return true;
    } catch {
        return false;
    }
    return false;
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

export type PasteOrUploadClaimMode = 'claim-link' | 'qr-code';

export const PasteOrUploadClaimModal: React.FC<{ mode?: PasteOrUploadClaimMode }> = ({ mode }) => {
    const { closeModal, replaceModal, newModal } = useModal();
    const { presentToast } = useToast();
    const safeArea = useSafeArea();

    const [pasted, setPasted] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorCopy, setErrorCopy] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const route = useClaimInputRouter({ defaultSource: 'paste' });
    const showClaimLink = mode !== 'qr-code';
    const showQrUpload = mode !== 'claim-link';
    const title = mode === 'qr-code' ? m['claim.paste.titleQr']() : m['claim.paste.title']();
    const subtitle =
        mode === 'qr-code'
            ? m['claim.paste.subtitleQr']()
            : mode === 'claim-link'
            ? m['claim.paste.subtitleLink']()
            : m['claim.paste.subtitle']();

    let footerBottom = safeArea.bottom;
    if (Capacitor.isNativePlatform()) footerBottom = 20 + safeArea.bottom;

    const dispatch = useCallback(
        async (input: string, source: ClaimInputSource): Promise<boolean> => {
            setIsProcessing(true);
            try {
                const result = await route(input, source);

                if (result.kind === 'unrecognized') {
                    if (mountedRef.current) {
                        setErrorCopy(unrecognizedCopyFor(result.reason, source));
                    }
                    return false;
                }

                if (result.kind === 'open_claim_boost') {
                    closeModal();
                    newModal(
                        <ClaimBoost
                            uri={result.boost.uri}
                            claimChallenge={result.boost.challenge}
                            dismissClaimModal={closeModal}
                            vc={null}
                        />,
                        { hideButton: true },
                        {
                            desktop: ModalTypes.FullScreen,
                            mobile: ModalTypes.FullScreen,
                        }
                    );
                } else if (result.kind === 'open_claim_vc') {
                    closeModal();
                    newModal(
                        <ClaimBoost dismissClaimModal={closeModal} vc={result.vc} />,
                        { hideButton: true },
                        {
                            desktop: ModalTypes.FullScreen,
                            mobile: ModalTypes.FullScreen,
                        }
                    );
                } else if (result.kind === 'open_contact') {
                    replaceModal(
                        <AddContactView
                            user={result.contact}
                            handleCancel={closeModal}
                            mode={AddContactViewMode.requestConnection}
                        />,
                        { hideButton: true }
                    );
                } else if (result.kind === 'open_website') {
                    closeModal();
                    window.open(result.url, '_blank');
                } else if (result.kind === 'routed') {
                    closeModal();
                }

                return true;
            } catch (err) {
                presentToast(
                    m['claim.paste.oops']({
                        message:
                            err instanceof Error
                                ? err.message
                                : m['claim.paste.somethingWentWrong'](),
                    }),
                    { type: ToastTypeEnum.Error, hasDismissButton: true }
                );
                return false;
            } finally {
                if (mountedRef.current) setIsProcessing(false);
            }
        },
        [route, closeModal, newModal, replaceModal, presentToast]
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
                const decoded = typeof scanResult === 'string' ? scanResult : scanResult.data;
                if (!decoded) {
                    setErrorCopy(m['claim.paste.qrNotFound']());
                    return;
                }
                await dispatch(decoded, 'image_upload');
            } catch {
                setErrorCopy(m['claim.paste.qrReadFailed']());
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
        <div className="h-full relative bg-grayscale-100">
            <IonHeader
                color="light"
                className="rounded-b-[30px] safe-area-top-margin overflow-hidden shadow-md "
            >
                <IonToolbar color="light" className="text-white px-4 !py-4">
                    <div className="flex items-center justify-normal p-2">
                        <div className="flex items-center">
                            <div className="bg-white rounded-[15px] p-2 w-[60px] h-[60px] flex items-center justify-center mr-2 shrink-0">
                                <LinkChain
                                    className="w-[40px] h-[40px] text-grayscale-900"
                                    version="thin"
                                />
                            </div>
                            <div className="flex flex-col items-start justify-center">
                                <h5 className="text-[22px] font-semibold text-grayscale-900 font-poppins leading-[24px]">
                                    {title}
                                </h5>
                                <p className="text-[14px] text-grayscale-700 font-notoSans leading-[20px] mt-[2px]">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <section className="h-full bg-grayscale-100 ion-padding overflow-y-scroll pb-[200px]">
                {showClaimLink && (
                    <div className="w-full bg-white flex flex-col gap-[15px] shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                        <div className="flex flex-col items-start justify-center gap-[5px]">
                            <h4 className="text-[20px] text-grayscale-900 font-notoSans text-left">
                                {m['claim.paste.linkHeading']()}
                            </h4>
                            <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
                                {m['claim.paste.linkDesc']()}
                            </p>
                        </div>

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
                                    {m['claim.paste.checking']()}
                                </span>
                            ) : (
                                m['common.continue']()
                            )}
                        </button>
                    </div>
                )}

                {showQrUpload && (
                    <div className="w-full bg-white flex flex-col gap-[15px] shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                        <div className="flex flex-col items-start justify-center gap-[5px]">
                            <h4 className="text-[20px] text-grayscale-900 font-notoSans text-left">
                                {m['claim.paste.qrHeading']()}
                            </h4>
                            <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
                                {m['claim.paste.qrDesc']()}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={dragHandlers.onDragEnter}
                            onDragOver={dragHandlers.onDragOver}
                            onDragLeave={dragHandlers.onDragLeave}
                            onDrop={dragHandlers.onDrop}
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
                                {isDragging
                                    ? m['claim.paste.dropIt']()
                                    : m['claim.paste.chooseImage']()}
                            </p>
                            <p
                                className={`text-xs mt-1 ${
                                    isDragging ? 'text-emerald-600' : 'text-grayscale-500'
                                }`}
                            >
                                {isDragging
                                    ? m['claim.paste.releaseToUpload']()
                                    : m['claim.paste.orDropHere']()}
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
                )}

                {errorCopy && (
                    <div className="w-full p-3 mt-4 bg-red-50 border border-red-100 rounded-2xl">
                        <p className="text-sm text-red-700 leading-relaxed">{errorCopy}</p>
                    </div>
                )}
            </section>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 left-0 bg-white !max-h-[100px]"
                style={{
                    bottom: `${footerBottom}px`,
                }}
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center"
                        >
                            {m['common.back']()}
                        </button>
                    </div>
                </div>
            </IonFooter>
        </div>
    );
};

export default PasteOrUploadClaimModal;
