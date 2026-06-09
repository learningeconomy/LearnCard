import React, { useCallback, useState, useRef } from 'react';
import { Check, Copy, Share2, Download } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

import {
    BoostCategoryOptionsEnum,
    BoostPageViewMode,
    useToast,
    ToastTypeEnum,
    getLogger,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import type { SimpleCredentialType } from '../../../components/simple-send/simpleSend.helpers';
import { Confetti } from './Confetti';

const log = getLogger('issue-success');

interface IssueSuccessProps {
    credentialUri: string;
    credential: Record<string, unknown> | null;
    credentialType: SimpleCredentialType | null;
    claimLink?: string | null;
    onIssueAnother: () => void;
    onViewWallet: () => void;
}

export const IssueSuccess: React.FC<IssueSuccessProps> = ({
    credentialUri,
    credential,
    credentialType,
    claimLink,
    onIssueAnother,
    onViewWallet,
}) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const linkToCopy = claimLink || credentialUri;

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(linkToCopy);
            setCopied(true);
            presentToast('Link copied.', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            log.error('issue-success.copy_failed', e);
        }
    }, [linkToCopy, presentToast]);

    const handleShare = useCallback(async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'A credential for you',
                    url: linkToCopy,
                });
                return;
            } catch (e) {
                log.info('issue-success.share_dismissed');
                return;
            }
        }
        await handleCopy();
    }, [linkToCopy, handleCopy]);

    const handleDownloadQR = useCallback(() => {
        if (!canvasRef.current) return;
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'credential-qr.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            log.error('issue-success.download_qr_failed', e);
            presentToast('Failed to download QR code.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    }, [presentToast]);

    return (
        <div className="font-poppins relative min-h-full flex items-center justify-center px-6 py-12 overflow-hidden">
            <Confetti />
            <div className="relative w-full max-w-[420px] text-center space-y-6">
                {credentialType && credential && (
                    <div className="flex justify-center">
                        <div className="w-[200px] motion-safe:animate-reveal-card">
                            <BoostEarnedCard
                                credential={credential as any}
                                categoryType={
                                    getDefaultCategoryForCredential(credential as any) ||
                                    BoostCategoryOptionsEnum.achievement
                                }
                                boostPageViewMode={BoostPageViewMode.Card}
                                useWrapper={false}
                                verifierState={false}
                                hideOptionsMenu
                                className="shadow-xl"
                            />
                        </div>
                    </div>
                )}

                {claimLink ? (
                    <div className="animate-fade-in-up space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                                Your link is ready
                            </h2>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Anyone with this link or QR code can claim it.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-grayscale-200 flex flex-col items-center gap-4">
                            <div className="w-48 h-48 relative">
                                <QRCodeSVG
                                    className="w-full h-full"
                                    value={claimLink}
                                    bgColor="transparent"
                                />
                                <div className="hidden">
                                    <QRCodeCanvas
                                        value={claimLink}
                                        size={1024}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                        includeMargin={true}
                                        ref={canvasRef}
                                    />
                                </div>
                            </div>

                            <div className="w-full flex items-center gap-2 bg-grayscale-10 p-2 rounded-xl border border-grayscale-200">
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-grayscale-600 font-mono truncate px-2">
                                        {claimLink}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="shrink-0 p-2 rounded-lg bg-white border border-grayscale-300 text-grayscale-700 hover:bg-grayscale-10 transition-colors flex items-center justify-center"
                                    aria-label="Copy link"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleDownloadQR}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download QR
                            </button>
                            <button
                                type="button"
                                onClick={handleShare}
                                className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onIssueAnother}
                            className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            Issue Another
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="animate-fade-in-up">
                            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                                You made it!
                            </h2>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Your credential is signed and on its way.
                            </p>
                        </div>

                        <div className="space-y-3 animate-fade-in-up">
                            <button
                                type="button"
                                onClick={onViewWallet}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                View in Wallet
                            </button>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    {copied ? 'Copied' : 'Copy link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={onIssueAnother}
                                className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Issue Another
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
