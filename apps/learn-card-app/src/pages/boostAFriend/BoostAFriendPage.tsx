import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, CheckCircle2, Copy, Share, Loader2 } from 'lucide-react';
import {
    useWallet,
    useGetCurrentLCNUser,
    useSigningAuthority,
    useToast,
    ToastTypeEnum,
    walletSubtypeToDefaultImageSrc,
} from 'learn-card-base';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';

import MainHeader from '../../components/main-header/MainHeader';
import { BadgePicker } from './components/BadgePicker';
import { BadgePersonalize } from './components/BadgePersonalize';
import { RecipientPicker } from '../issue/components/RecipientPicker';
import { Confetti } from '../issue/components/Confetti';
import { RecipientMode, Recipient, LinkOptions } from '../issue/components/recipientTypes';
import { issueViaBoost } from '../../components/simple-send/simpleSend.helpers';
import { buildBoostFriendTemplate, BadgePreset, resolveBadgeStyle } from './boostAFriend.helpers';
import { useStylePackRegistry } from '../../registries/useStylePackRegistry';
import { useBadgeGroups } from '../../registries/useBadgeGroups';

type Step = 'pick' | 'personalize' | 'send' | 'celebrate';

const BoostAFriendPage: React.FC = () => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { getRegisteredSigningAuthorities, getRegisteredSigningAuthority } =
        useSigningAuthority();
    const { presentToast } = useToast();
    const { data: stylePacks } = useStylePackRegistry();
    const { data: badgeGroups } = useBadgeGroups();
    const categoryFallback = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.socialBadges);

    const [step, setStep] = useState<Step>('pick');
    const [selectedBadge, setSelectedBadge] = useState<BadgePreset | null>(null);
    const [vibeColor, setVibeColor] = useState<string>('#3B82F6');
    const [note, setNote] = useState('');

    const [recipientMode, setRecipientMode] = useState<RecipientMode>('people');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});

    const [isIssuing, setIsIssuing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [claimLink, setClaimLink] = useState<string | null>(null);

    const handleSelectBadge = (badge: BadgePreset, color: string) => {
        const { backgroundColor } = resolveBadgeStyle(badge, stylePacks, categoryFallback);
        setSelectedBadge(badge);
        setVibeColor(backgroundColor || color);
        setStep('personalize');
    };

    const handleIssue = async () => {
        if (!selectedBadge) return;

        const isLinkMode = recipientMode === 'link';
        const hasRecipients = recipients.length > 0;

        if (recipientMode === 'people' && !hasRecipients) {
            setError('Please add at least one recipient.');
            return;
        }

        setError(null);
        setIsIssuing(true);

        try {
            const wallet = await initWallet();

            let claimLinkSA: { name?: string; endpoint?: string } | undefined;

            const hasEmailRecipient =
                recipientMode === 'people' && recipients.some(r => r.kind === 'email');

            if (isLinkMode) {
                const rsas = await getRegisteredSigningAuthorities(wallet);
                if (rsas && rsas.length > 0) {
                    const rsa = rsas[0];
                    claimLinkSA = {
                        name: rsa?.relationship?.name,
                        endpoint: rsa?.signingAuthority?.endpoint,
                    };
                } else {
                    const { registeredSigningAuthority: rsa, signingAuthority: sa } =
                        await getRegisteredSigningAuthority(wallet);
                    if (sa) {
                        claimLinkSA = {
                            name: sa.name,
                            endpoint: sa.endpoint,
                        };
                    }
                }
            } else if (hasEmailRecipient) {
                await getRegisteredSigningAuthority(wallet);
            }

            const { imageUrl } = resolveBadgeStyle(selectedBadge, stylePacks, categoryFallback);

            const template = buildBoostFriendTemplate({
                title: selectedBadge.title,
                description: `A social badge for being a ${selectedBadge.title}`,
                note,
                vibeColor,
                imageUrl,
            });

            const result = await issueViaBoost(wallet, template, {
                mode: recipientMode,
                recipients,
                linkOptions,
                currentLCNUser,
                claimLinkSA,
            });

            if (result.claimLink) {
                setClaimLink(result.claimLink);
            }

            setStep('celebrate');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsIssuing(false);
        }
    };

    const handleCopyLink = async () => {
        if (!claimLink) return;
        try {
            await navigator.clipboard.writeText(claimLink);
            presentToast('Link copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Failed to copy link', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShareLink = async () => {
        if (!claimLink) return;
        try {
            await navigator.share({
                title: 'Claim your badge!',
                text: `I sent you a ${selectedBadge?.title} badge!`,
                url: claimLink,
            });
        } catch {
            // The share sheet rejects when the user dismisses it — nothing to handle.
        }
    };

    const handleBoostAnother = () => {
        setSelectedBadge(null);
        setNote('');
        setRecipients([]);
        setClaimLink(null);
        setError(null);
        setStep('pick');
    };

    return (
        <IonPage className="bg-white">
            <MainHeader showBackButton customClassName="bg-white" />
            <IonContent>
                <div className="min-h-full font-poppins relative overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none transition-colors duration-700 ease-in-out opacity-20"
                        style={{
                            background: `radial-gradient(circle at 50% 0%, ${vibeColor} 0%, transparent 70%)`,
                        }}
                    />

                    <div className="max-w-xl mx-auto h-full flex flex-col px-4 sm:px-6 py-6 relative z-10">
                        {step === 'pick' && (
                            <BadgePicker
                                onSelect={handleSelectBadge}
                                onBack={() => history.goBack()}
                                stylePacks={stylePacks}
                                badgeGroups={badgeGroups}
                                categoryFallback={categoryFallback}
                            />
                        )}

                        {step === 'personalize' && selectedBadge && (
                            <BadgePersonalize
                                badge={selectedBadge}
                                vibeColor={vibeColor}
                                onVibeColorChange={setVibeColor}
                                note={note}
                                onNoteChange={setNote}
                                onNext={() => setStep('send')}
                                onBack={() => setStep('pick')}
                                stylePacks={stylePacks}
                                categoryFallback={categoryFallback}
                            />
                        )}

                        {step === 'send' && (
                            <div className="flex flex-col h-full animate-fade-in-up">
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep('personalize')}
                                        className="p-2 -ml-2 rounded-full hover:bg-white/50 text-grayscale-600 transition-colors"
                                        aria-label="Go back"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-2xl font-semibold text-grayscale-900">
                                            Send to
                                        </h1>
                                        <p className="text-sm text-grayscale-600 mt-1">
                                            Who gets this badge?
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pb-20 flex flex-col justify-center">
                                    <div className="max-w-sm mx-auto w-full">
                                        <RecipientPicker
                                            mode={recipientMode}
                                            onModeChange={setRecipientMode}
                                            recipients={recipients}
                                            onRecipientsChange={setRecipients}
                                            linkOptions={linkOptions}
                                            onLinkOptionsChange={setLinkOptions}
                                            hideHeader
                                        />

                                        {error && (
                                            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 animate-fade-in-up shadow-sm">
                                                <span className="text-sm text-red-700 leading-relaxed">
                                                    {error}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto">
                                    <button
                                        type="button"
                                        onClick={handleIssue}
                                        disabled={
                                            isIssuing ||
                                            (recipientMode === 'people' && recipients.length === 0)
                                        }
                                        className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        {isIssuing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {recipientMode === 'link'
                                                    ? 'Creating link...'
                                                    : 'Sending...'}
                                            </>
                                        ) : recipientMode === 'link' ? (
                                            'Create Link'
                                        ) : (
                                            'Send Badge'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'celebrate' && (
                            <div className="flex flex-col h-full items-center justify-center text-center animate-pop-in relative py-10">
                                <Confetti />

                                <div className="flex flex-col items-center justify-center max-w-sm w-full mx-auto flex-1">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>

                                    <h1 className="text-3xl font-semibold text-grayscale-900 mb-2">
                                        {recipientMode === 'link' ? 'Link Created!' : 'Badge Sent!'}
                                    </h1>
                                    <p className="text-base text-grayscale-600 mb-10">
                                        {recipientMode === 'link'
                                            ? 'Your badge is ready to be shared. Anyone with the link can claim it.'
                                            : "They'll be notified about their new badge."}
                                    </p>

                                    {claimLink && (
                                        <div className="w-full mb-10 space-y-3">
                                            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl break-all text-sm text-grayscale-900 border border-grayscale-200 shadow-sm">
                                                {claimLink}
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleCopyLink}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] border border-grayscale-300 bg-white/50 backdrop-blur-sm text-grayscale-700 font-medium text-sm hover:bg-white transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    Copy
                                                </button>
                                                {navigator.share && (
                                                    <button
                                                        type="button"
                                                        onClick={handleShareLink}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
                                                    >
                                                        <Share className="w-4 h-4" />
                                                        Share
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full max-w-sm space-y-3 mt-auto pt-6">
                                    <button
                                        type="button"
                                        onClick={handleBoostAnother}
                                        className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm"
                                    >
                                        Boost Another
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => history.push('/wallet')}
                                        className="w-full py-3.5 px-4 rounded-[20px] border border-grayscale-300 bg-white/50 backdrop-blur-sm text-grayscale-700 font-medium text-base hover:bg-white transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default BoostAFriendPage;
