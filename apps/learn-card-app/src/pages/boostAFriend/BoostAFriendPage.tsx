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

import { BadgePicker } from './components/BadgePicker';
import { BadgePersonalize } from './components/BadgePersonalize';
import { BoostRecipientPicker } from './components/BoostRecipientPicker';
import { Confetti } from '../issue/components/Confetti';
import { RecipientMode, Recipient, LinkOptions } from '../issue/components/recipientTypes';
import { issueViaBoost } from '../../components/simple-send/simpleSend.helpers';
import {
    buildBoostFriendTemplate,
    BadgePreset,
    resolveBadgeStyle,
    buildPreviewCredential,
} from './boostAFriend.helpers';
import { useStylePackRegistry } from '../../registries/useStylePackRegistry';
import { useBadgeGroups } from '../../registries/useBadgeGroups';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import { BoostCategoryOptionsEnum, BoostPageViewMode } from 'learn-card-base';

type Step = 'pick' | 'personalize' | 'send' | 'celebrate';

const formatRecipients = (recs: Recipient[]) => {
    if (recs.length === 0) return '';
    const names = recs.map(r => (r.kind === 'profile' ? r.displayName : r.email));
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
};

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
    const [title, setTitle] = useState('');
    const [subtype, setSubtype] = useState('');
    const [vibeColor, setVibeColor] = useState<string>('#3B82F6');
    const [note, setNote] = useState('');

    const [recipientMode, setRecipientMode] = useState<RecipientMode>('people');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});

    const [isIssuing, setIsIssuing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [claimLink, setClaimLink] = useState<string | null>(null);

    const handleSelectBadge = (badge: BadgePreset, color: string) => {
        const { backgroundColor } = resolveBadgeStyle(badge, stylePacks);
        setSelectedBadge(badge);
        setTitle(badge.title);
        setSubtype(badge.title);
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

            const { imageUrl } = resolveBadgeStyle(selectedBadge, stylePacks);

            const template = buildBoostFriendTemplate({
                title: title.trim(),
                subtype: subtype.trim(),
                description: `A social badge for being a ${title.trim()}`,
                note,
                vibeColor,
                imageUrl: imageUrl || categoryFallback,
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
        setTitle('');
        setSubtype('');
        setNote('');
        setRecipients([]);
        setClaimLink(null);
        setError(null);
        setStep('pick');
    };

    return (
        <IonPage className="bg-white">
            <IonContent scrollY={false}>
                <div className="h-full font-poppins relative">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                            className="absolute inset-0 transition-colors duration-700 ease-in-out opacity-[0.16]"
                            style={{
                                background: `radial-gradient(120% 60% at 50% 0%, ${vibeColor} 0%, transparent 60%)`,
                            }}
                        />
                    </div>

                    <div className="max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto h-full flex flex-col px-4 sm:px-6 pb-4 relative z-10 w-full">
                        {step === 'pick' && (
                            <BadgePicker
                                onSelect={handleSelectBadge}
                                onBack={() => history.goBack()}
                                stylePacks={stylePacks}
                                badgeGroups={badgeGroups}
                            />
                        )}

                        {step === 'personalize' && selectedBadge && (
                            <div className="max-w-xl mx-auto w-full h-full">
                                <BadgePersonalize
                                    badge={selectedBadge}
                                    title={title}
                                    onTitleChange={setTitle}
                                    subtype={subtype}
                                    onSubtypeChange={setSubtype}
                                    isCustom={selectedBadge?.type === 'ext:Custom'}
                                    vibeColor={vibeColor}
                                    onVibeColorChange={setVibeColor}
                                    note={note}
                                    onNoteChange={setNote}
                                    onNext={() => setStep('send')}
                                    onBack={() => setStep('pick')}
                                    stylePacks={stylePacks}
                                    issuerName={
                                        currentLCNUser?.displayName ||
                                        currentLCNUser?.profileId ||
                                        ''
                                    }
                                />
                            </div>
                        )}

                        {step === 'send' && (
                            <div className="max-w-xl mx-auto w-full flex flex-col h-full animate-fade-in-up pt-[calc(env(safe-area-inset-top)+1rem)]">
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

                                <div className="flex-1 min-h-0 flex flex-col pb-20">
                                    <div className="max-w-sm mx-auto w-full flex-1 flex flex-col min-h-0">
                                        <BoostRecipientPicker
                                            mode={recipientMode}
                                            onModeChange={setRecipientMode}
                                            recipients={recipients}
                                            onRecipientsChange={setRecipients}
                                            linkOptions={linkOptions}
                                            onLinkOptionsChange={setLinkOptions}
                                        />

                                        {error && (
                                            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 animate-fade-in-up shadow-sm shrink-0">
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
                                        ) : recipientMode === 'self' ? (
                                            'Boost Myself'
                                        ) : (
                                            'Send Badge'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'celebrate' && (
                            <div className="max-w-xl mx-auto w-full flex flex-col h-full text-center animate-pop-in relative py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] overflow-y-auto scrollbar-hide">
                                <Confetti />

                                <div className="my-auto w-full py-6 space-y-8">
                                    <div className="flex flex-col items-center justify-center max-w-sm w-full mx-auto">
                                        {selectedBadge && (
                                            <div className="w-[160px] sm:w-[200px] mb-6">
                                                <BoostEarnedCard
                                                    credential={
                                                        buildPreviewCredential({
                                                            title: title.trim() || 'Your Badge',
                                                            subtype:
                                                                subtype.trim() ||
                                                                title.trim() ||
                                                                'Your Badge',
                                                            note,
                                                            vibeColor,
                                                            imageUrl:
                                                                resolveBadgeStyle(
                                                                    selectedBadge,
                                                                    stylePacks
                                                                ).imageUrl || categoryFallback,
                                                            issuerName:
                                                                currentLCNUser?.displayName ||
                                                                currentLCNUser?.profileId ||
                                                                '',
                                                        }) as any
                                                    }
                                                    categoryType={
                                                        BoostCategoryOptionsEnum.socialBadge
                                                    }
                                                    boostPageViewMode={BoostPageViewMode.Card}
                                                    useWrapper={false}
                                                    verifierState={false}
                                                    hideOptionsMenu
                                                    isPreview
                                                    className="shadow-xl"
                                                />
                                            </div>
                                        )}

                                        <h1 className="text-3xl font-semibold text-grayscale-900 mb-2">
                                            {recipientMode === 'link'
                                                ? 'Link ready!'
                                                : recipientMode === 'self'
                                                ? 'Added to your Passport!'
                                                : 'Badge sent!'}
                                        </h1>
                                        <p className="text-base text-grayscale-600 mb-10">
                                            {recipientMode === 'link'
                                                ? 'Your badge is ready to be shared. Anyone with the link can claim it.'
                                                : recipientMode === 'self'
                                                ? "You'll find it in your badges."
                                                : `Sent to ${formatRecipients(recipients)}`}
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
                                </div>

                                <div className="w-full max-w-sm mx-auto space-y-3 mt-auto pt-6">
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
