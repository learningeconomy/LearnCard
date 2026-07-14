import React, { useState, useMemo, useRef } from 'react';
import { useHistory } from 'react-router';
import { IonPage, IonContent } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { ArrowLeft, Copy, Check, Share, Download, Loader2 } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
    useWallet,
    useGetCurrentLCNUser,
    useSigningAuthority,
    useToast,
    ToastTypeEnum,
    walletSubtypeToDefaultImageSrc,
    getLogger,
} from 'learn-card-base';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';

import { BadgePicker } from './components/BadgePicker';
import { BadgePersonalize } from './components/BadgePersonalize';
import { BoostRecipientPicker } from './components/BoostRecipientPicker';
import { Confetti } from '../issue/components/Confetti';
import {
    RecipientMode,
    Recipient,
    LinkOptions,
    summarizeRecipients,
} from '../issue/components/recipientTypes';
import { issueViaBoost } from '../../components/simple-send/simpleSend.helpers';
import { getFriendlyIssueError, withTransientRetry } from '../issue/issueErrors';
import {
    buildBoostFriendTemplate,
    BadgePreset,
    resolveBadgeStyle,
    buildPreviewCredential,
} from './boostAFriend.helpers';
import useLCNGatedAction from '../../components/network-prompts/hooks/useLCNGatedAction';
import { useStylePackRegistry } from '../../registries/useStylePackRegistry';
import { useBadgeGroups } from '../../registries/useBadgeGroups';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import { BoostCategoryOptionsEnum, BoostPageViewMode } from 'learn-card-base';

type Step = 'pick' | 'personalize' | 'send' | 'celebrate';

const log = getLogger('boost-a-friend-page');

const QR_ALBUM_NAME = 'LearnCard';

const ensureQrAlbumExists = async (): Promise<string | undefined> => {
    if (Capacitor.getPlatform() !== 'android') return undefined;

    let { albums } = await Media.getAlbums();
    let album = albums.find(a => a.name === QR_ALBUM_NAME);
    if (album?.identifier) return album.identifier;

    await Media.createAlbum({ name: QR_ALBUM_NAME });
    ({ albums } = await Media.getAlbums());
    album = albums.find(a => a.name === QR_ALBUM_NAME);
    return album?.identifier;
};

const BoostAFriendPage: React.FC = () => {
    const history = useHistory();
    const { initWallet, addVCtoWallet } = useWallet();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { getRegisteredSigningAuthorities, getRegisteredSigningAuthority } =
        useSigningAuthority();
    const { presentToast } = useToast();
    const { gate } = useLCNGatedAction();
    const { data: stylePacks } = useStylePackRegistry();
    const { data: badgeGroups } = useBadgeGroups();
    const categoryFallback = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.socialBadges);

    const [step, setStep] = useState<Step>('pick');
    const [selectedBadge, setSelectedBadge] = useState<BadgePreset | null>(null);
    const [title, setTitle] = useState('');
    const [subtype, setSubtype] = useState('');
    const [vibeColor, setVibeColor] = useState<string>('#3B82F6');
    const [note, setNote] = useState('');
    const [criteria, setCriteria] = useState('');
    const [description, setDescription] = useState('');
    const [customImageUrl, setCustomImageUrl] = useState('');

    const [recipientMode, setRecipientMode] = useState<RecipientMode>('people');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});

    const [isIssuing, setIsIssuing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [claimLink, setClaimLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleSelectBadge = (badge: BadgePreset, color: string) => {
        const {
            backgroundColor,
            description: presetDescription,
            criteria: presetCriteria,
        } = resolveBadgeStyle(badge, stylePacks);
        setSelectedBadge(badge);
        setTitle(badge.title);
        setSubtype(badge.title);
        setVibeColor(backgroundColor || color);
        setDescription(presetDescription ?? '');
        setNote('');
        setCriteria(presetCriteria ?? '');
        setCustomImageUrl('');
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

        // Every send mode needs an LCN profile. If the user has none, open
        // onboarding and resume this same send once it completes.
        const { prompted } = await gate(() => {
            void handleIssue();
        });
        if (prompted) return;

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
            const badgeImageUrl = customImageUrl.trim() || imageUrl;

            const template = buildBoostFriendTemplate({
                title: title.trim(),
                subtype: subtype.trim(),
                description: description.trim() || `A social badge for being a ${title.trim()}`,
                note: note.trim() || criteria,
                vibeColor,
                imageUrl: badgeImageUrl || categoryFallback,
            });

            const result = await withTransientRetry(() =>
                issueViaBoost(wallet, template, {
                    mode: recipientMode,
                    recipients,
                    linkOptions,
                    currentLCNUser,
                    claimLinkSA,
                })
            );

            if (recipientMode === 'self') {
                if (!result.credentialUri) {
                    throw new Error(
                        'Badge was issued, but it could not be saved to your Passport.'
                    );
                }
                await addVCtoWallet({ uri: result.credentialUri });
            }

            if (result.claimLink) {
                setClaimLink(result.claimLink);
            }

            setStep('celebrate');
        } catch (err: any) {
            setError(getFriendlyIssueError(err, recipientMode).message);
        } finally {
            setIsIssuing(false);
        }
    };

    const handleCopyLink = async () => {
        if (!claimLink) return;
        try {
            await navigator.clipboard.writeText(claimLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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

    const handleDownloadQR = async () => {
        if (!qrCanvasRef.current) return;
        try {
            const dataUrl = qrCanvasRef.current.toDataURL('image/png');

            if (!Capacitor.isNativePlatform()) {
                const link = document.createElement('a');
                link.download = 'badge-qr.png';
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            const base64 = dataUrl.split(',')[1];
            const fileName = `qrcode_${Date.now()}.png`;

            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Documents,
            });

            const albumIdentifier = await ensureQrAlbumExists();

            await Media.savePhoto({
                path: savedFile.uri,
                fileName,
                ...(albumIdentifier ? { albumIdentifier } : {}),
            });

            presentToast('QR code saved to Photos.', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            log.error('boost-a-friend.qr_download_failed', err);
            presentToast('Failed to download QR code.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const truncateLink = (link: string) =>
        link.length <= 44 ? link : `${link.slice(0, 28)}…${link.slice(-10)}`;

    const handleBoostAnother = () => {
        setSelectedBadge(null);
        setTitle('');
        setSubtype('');
        setNote('');
        setCriteria('');
        setDescription('');
        setCustomImageUrl('');
        setRecipients([]);
        setClaimLink(null);
        setError(null);
        setStep('pick');
    };

    const celebrateCredential = useMemo(() => {
        if (!selectedBadge) return null;
        return buildPreviewCredential({
            title: title.trim() || 'Your Badge',
            subtype: subtype.trim() || title.trim() || 'Your Badge',
            description,
            note: note.trim() || criteria,
            vibeColor,
            imageUrl:
                customImageUrl.trim() ||
                resolveBadgeStyle(selectedBadge, stylePacks).imageUrl ||
                categoryFallback,
            issuerName: currentLCNUser?.displayName || currentLCNUser?.profileId || '',
        });
    }, [
        selectedBadge,
        title,
        subtype,
        description,
        note,
        criteria,
        vibeColor,
        customImageUrl,
        stylePacks,
        categoryFallback,
        currentLCNUser,
    ]);

    const celebrateCard = celebrateCredential && (
        <BoostEarnedCard
            credential={celebrateCredential as any}
            categoryType={BoostCategoryOptionsEnum.socialBadge}
            boostPageViewMode={BoostPageViewMode.Card}
            useWrapper={false}
            verifierState={false}
            hideOptionsMenu
            isPreview
            className="shadow-xl"
        />
    );

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
                                    description={description}
                                    note={note}
                                    notePlaceholder={criteria}
                                    onNoteChange={setNote}
                                    imageUrl={customImageUrl}
                                    onImageUrlChange={setCustomImageUrl}
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

                                <div className="flex-1 min-h-0 flex flex-col">
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

                                <div className="pt-4 mt-auto pb-[env(safe-area-inset-bottom,0px)]">
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

                        {step === 'celebrate' && claimLink && (
                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                                <div className="relative w-full max-w-[860px] mx-auto min-h-full flex flex-col justify-center animate-pop-in py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] desktop:grid desktop:grid-cols-2 desktop:gap-10 desktop:items-center">
                                    <Confetti />

                                    <div className="text-center space-y-6 mb-8 desktop:mb-0">
                                        {celebrateCard && (
                                            <div className="flex justify-center">
                                                <div className="w-[160px] sm:w-[200px]">
                                                    {celebrateCard}
                                                </div>
                                            </div>
                                        )}
                                        <div className="animate-fade-in-up">
                                            <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                                Link ready!
                                            </h1>
                                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                                Anyone with this link or QR code can claim it.
                                            </p>
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
                                                        ref={qrCanvasRef}
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
                                                onClick={handleCopyLink}
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
                                                {typeof navigator !== 'undefined' &&
                                                    navigator.share && (
                                                        <button
                                                            type="button"
                                                            onClick={handleShareLink}
                                                            className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Share className="w-4 h-4" />
                                                            Share
                                                        </button>
                                                    )}
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

                                        <div className="space-y-3 pt-5 border-t border-grayscale-200">
                                            <button
                                                type="button"
                                                onClick={() => history.push('/wallet')}
                                                className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm"
                                            >
                                                Done
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleBoostAnother}
                                                className="w-full py-3.5 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-base hover:bg-grayscale-10 transition-colors"
                                            >
                                                Boost Another
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'celebrate' && !claimLink && (
                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                                <div className="relative w-full max-w-[420px] mx-auto min-h-full flex flex-col justify-center text-center space-y-6 animate-pop-in py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
                                    <Confetti />

                                    {celebrateCard && (
                                        <div className="flex justify-center">
                                            <div className="w-[160px] sm:w-[200px]">
                                                {celebrateCard}
                                            </div>
                                        </div>
                                    )}

                                    <div className="animate-fade-in-up">
                                        <h1 className="text-3xl font-semibold text-grayscale-900 mb-2">
                                            {recipientMode === 'self'
                                                ? 'Added to your Passport!'
                                                : 'Badge sent!'}
                                        </h1>
                                        <p className="text-base text-grayscale-600">
                                            {recipientMode === 'self'
                                                ? "You'll find it in your badges."
                                                : `Sent to ${summarizeRecipients(recipients)}`}
                                        </p>
                                    </div>

                                    <div className="w-full max-w-sm mx-auto space-y-3">
                                        <button
                                            type="button"
                                            onClick={handleBoostAnother}
                                            className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            Boost Another
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                history.push(
                                                    recipientMode === 'self'
                                                        ? '/socialBadges'
                                                        : '/wallet'
                                                )
                                            }
                                            className="w-full py-3.5 px-4 rounded-[20px] border border-grayscale-300 bg-white/50 backdrop-blur-sm text-grayscale-700 font-medium text-base hover:bg-white transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
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
