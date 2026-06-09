import React, { useCallback, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

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

                <div className="animate-fade-in-up">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">You made it!</h2>
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
            </div>
        </div>
    );
};
