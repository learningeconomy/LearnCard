import React, { useCallback, useState, useRef } from 'react';
import { Check, Copy, Share2, Download, Clock, Users } from 'lucide-react';
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
import type { LinkOptions, Recipient, RecipientMode } from './recipientTypes';

const log = getLogger('issue-success');

interface IssueSuccessProps {
    credential: Record<string, unknown> | null;
    credentialType: SimpleCredentialType | null;
    recipientMode: RecipientMode;
    recipients: Recipient[];
    claimLink?: string | null;
    linkOptions?: LinkOptions;
    onIssueAnother: () => void;
    onViewWallet: () => void;
}

const recipientName = (recipient: Recipient): string =>
    recipient.kind === 'profile' ? recipient.displayName : recipient.email;

const summarizeRecipients = (recipients: Recipient[]): string => {
    const names = recipients.map(recipientName).filter(Boolean);
    if (names.length === 0) return 'the recipient';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]} and ${names.length - 1} others`;
};

export const IssueSuccess: React.FC<IssueSuccessProps> = ({
    credential,
    credentialType,
    recipientMode,
    recipients,
    claimLink,
    linkOptions,
    onIssueAnother,
    onViewWallet,
}) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleCopy = useCallback(async () => {
        if (!claimLink) return;
        try {
            await navigator.clipboard.writeText(claimLink);
            setCopied(true);
            presentToast('Link copied.', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            log.error('issue-success.copy_failed', e);
        }
    }, [claimLink, presentToast]);

    const handleShare = useCallback(async () => {
        if (!claimLink) return;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'A credential for you',
                    url: claimLink,
                });
                return;
            } catch (e) {
                log.info('issue-success.share_dismissed');
                return;
            }
        }
        await handleCopy();
    }, [claimLink, handleCopy]);

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

    const renderCard = () => {
        if (!credentialType || !credential) return null;
        return (
            <div className="flex justify-center">
                <div className="w-[160px] motion-safe:animate-reveal-card">
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
        );
    };

    const renderLimits = () => {
        if (!linkOptions?.expiresAt && !linkOptions?.maxClaims) return null;

        const parts = [];
        if (linkOptions.expiresAt) {
            const dateStr = new Date(linkOptions.expiresAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            parts.push(
                <span key="expires" className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Expires {dateStr}
                </span>
            );
        }
        if (linkOptions.maxClaims) {
            const claims = linkOptions.maxClaims;
            parts.push(
                <span key="claims" className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {claims} claim{claims === 1 ? '' : 's'} limit
                </span>
            );
        }

        return (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-grayscale-500">
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span>&middot;</span>}
                        {part}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const truncateLink = (link: string) => {
        if (link.length <= 44) return link;
        return `${link.slice(0, 28)}…${link.slice(-10)}`;
    };

    return (
        <div className="font-poppins relative min-h-full flex justify-center px-6 pt-16 pb-12 overflow-hidden">
            <Confetti />
            {claimLink ? (
                <div className="relative w-full max-w-[860px] mx-auto desktop:grid desktop:grid-cols-2 desktop:gap-10 desktop:items-center">
                    <div className="text-center space-y-6 mb-8 desktop:mb-0">
                        {renderCard()}
                        <div className="animate-fade-in-up">
                            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                                Your link is ready
                            </h2>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Anyone with this link or QR code can claim it.
                            </p>
                            {renderLimits()}
                        </div>
                    </div>

                    <div className="animate-fade-in-up space-y-6 text-center max-w-[420px] mx-auto w-full">
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

                            <div className="w-full bg-grayscale-10 p-3 rounded-xl border border-grayscale-200 text-center">
                                <p
                                    className="text-xs text-grayscale-600 font-mono truncate"
                                    title={claimLink}
                                >
                                    {truncateLink(claimLink)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                {copied ? 'Copied' : 'Copy link'}
                            </button>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadQR}
                                    className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download QR
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onIssueAnother}
                            className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            Issue Another
                        </button>
                    </div>
                </div>
            ) : recipientMode === 'people' ? (
                <div className="relative w-full max-w-[420px] text-center space-y-6">
                    {renderCard()}
                    <div className="animate-fade-in-up">
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">Sent!</h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Delivered to {summarizeRecipients(recipients)}.
                        </p>
                    </div>

                    <div className="space-y-3 animate-fade-in-up">
                        <button
                            type="button"
                            onClick={onViewWallet}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            Done
                        </button>
                        <button
                            type="button"
                            onClick={onIssueAnother}
                            className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            Issue Another
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative w-full max-w-[420px] text-center space-y-6">
                    {renderCard()}
                    <div className="animate-fade-in-up">
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            You made it!
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Your credential is signed and saved to your wallet.
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
                        <button
                            type="button"
                            onClick={onIssueAnother}
                            className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            Issue Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
