import React, { useState, useMemo } from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';
import numeral from 'numeral';

import { IonPage, IonContent, IonSpinner, IonFooter, IonHeader, IonToast } from '@ionic/react';
import { useModal, ModalTypes, useConfirmation, useWithdrawConsent, useWallet, useGetAppMetadata, useGetAppReviews, AppStoreAppMetadata, AppStoreAppReview } from 'learn-card-base';
import { ThreeDotVertical } from '@learncard/react';
import TrashBin from '../../components/svgs/TrashBin';

import useAppStore from './useAppStore';
import { EmbedIframeModal } from './EmbedIframeModal';
import useTheme from '../../theme/hooks/useTheme';
import AppScreenshotsSlider from '../../components/ai-passport-apps/helpers/AppScreenshotSlider';
import Checkmark from '../../components/svgs/Checkmark';
import StaticStarRating from '../../components/ai-passport-apps/helpers/StaticStarRating';
import AiPassportAppProfileRatings from '../../components/ai-passport-apps/AiPassportAppProfileDetails/AiPassportAppProfileRatings';
import { AppInstallConsentModal } from '../../components/credentials/AppInstallConsentModal';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import ConsentFlowPrivacyAndData from '../consentFlow/ConsentFlowPrivacyAndData';
import GuardianConsentLaunchModal from './GuardianConsentLaunchModal';
import AiTutorConnectedView from './AiTutorConnectedView';
import { Settings } from 'lucide-react';

// Extended type to include new fields (until types package is rebuilt)
type ExtendedAppStoreListing = (AppStoreListing | InstalledApp) & {
    highlights?: string[];
    screenshots?: string[];
    promo_video_url?: string;
    ios_app_store_id?: string;
    hero_background_color?: string;
};

// Helper to convert YouTube/Vimeo URLs to embed URLs
const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
};

interface AppStoreDetailModalProps {
    listing: ExtendedAppStoreListing;
    isInstalled?: boolean;
    onInstallSuccess?: () => void;
}

const AppStoreDetailModal: React.FC<AppStoreDetailModalProps> = ({
    listing,
    isInstalled: initialIsInstalled = false,
    onInstallSuccess,
}) => {
    const { closeModal, replaceModal, newModal } = useModal();
    const confirm = useConfirmation();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    console.log(primaryColor);

    const { useInstallApp, useUninstallApp, useInstallCount, useIsAppInstalled } = useAppStore();

    const installMutation = useInstallApp();
    const uninstallMutation = useUninstallApp();

    // Check installation status
    const { data: isInstalledData, isLoading: isCheckingInstalled } = useIsAppInstalled(
        listing.listing_id
    );

    const isInstalled = isInstalledData ?? initialIsInstalled ?? ('installed_at' in listing);

    // Get install count
    const { data: installCount } = useInstallCount(listing.listing_id);

    // Fetch iOS App Store metadata if ios_app_store_id is available
    const iosAppId = listing.ios_app_store_id;
    const { data: iosMetadata } = useGetAppMetadata(iosAppId || '');
    const { data: iosReviews } = useGetAppReviews(iosAppId || '');

    // Use iOS screenshots as fallback if no screenshots provided in listing
    const screenshots = useMemo(() => {
        if (listing.screenshots && listing.screenshots.length > 0) {
            return listing.screenshots;
        }

        if (iosMetadata?.screenshotUrls && iosMetadata.screenshotUrls.length > 0) {
            return iosMetadata.screenshotUrls;
        }

        return [];
    }, [listing.screenshots, iosMetadata?.screenshotUrls]);

    const [isProcessing, setIsProcessing] = useState(false);

    // Parse launch config
    const launchConfig = useMemo(() => {
        try {
            return JSON.parse(listing.launch_config_json);
        } catch {
            return {};
        }
    }, [listing.launch_config_json]);

    // Consent flow hooks for withdraw on uninstall and edit permissions
    const contractUri: string | undefined = launchConfig?.contractUri;
    const { contract, consentedContract, hasConsented } = useConsentFlowByUri(contractUri);
    const termsUri = consentedContract?.uri;
    const { mutateAsync: withdrawConsent } = useWithdrawConsent(termsUri ?? '');

    const { initWallet } = useWallet();

    const doInstall = async () => {
        setIsProcessing(true);

        try {
            await installMutation.mutateAsync(listing.listing_id);
            onInstallSuccess?.();
        } catch (error) {
            console.error('Failed to install app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInstall = () => {
        // Get permissions from launch config
        const permissions: string[] = launchConfig?.permissions || [];
        const contractUri: string | undefined = launchConfig?.contractUri;

        // Show consent modal with permissions
        newModal(
            <AppInstallConsentModal
                appName={listing.display_name}
                appIcon={listing.icon_url}
                permissions={permissions}
                contractUri={contractUri}
                onAccept={() => {
                    closeModal();
                    doInstall();
                }}
                onReject={closeModal}
            />,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
        );
    };

    const handleUninstall = async () => {
        setIsProcessing(true);

        try {
            // Withdraw consent if there's a contract
            if (termsUri) {
                try {
                    await withdrawConsent(termsUri);
                } catch (error) {
                    console.error('Failed to withdraw consent:', error);
                    // Continue with uninstall even if consent withdrawal fails
                }
            }

            await uninstallMutation.mutateAsync(listing.listing_id);
            closeModal();
        } catch (error) {
            console.error('Failed to uninstall app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUninstallConfirm = async () => {
        await confirm({
            text: `Are you sure you want to uninstall ${listing.display_name}?`,
            onConfirm: handleUninstall,
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-red-600 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const [showCopiedToast, setShowCopiedToast] = useState(false);

    const handleShareApp = async () => {
        const appUrl = !IS_PRODUCTION ? `${window.location.origin}/app/${listing.listing_id}` : `https://learncard.app/app/${listing.listing_id}`;

        try {
            await navigator.clipboard.writeText(appUrl);
            closeModal();
            setShowCopiedToast(true);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleEditPermissions = () => {
        if (!contract || !consentedContract?.terms) return;

        closeModal(); // Close options menu

        newModal(
            <ConsentFlowPrivacyAndData
                contractDetails={contract}
                terms={consentedContract.terms}
                setTerms={() => {}} // Not used for direct updates - ConsentFlowPrivacyAndData uses updateTerms internally
                isPostConsent={true}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleOpenOptionsMenu = () => {
        newModal(
            <ul className="w-full flex flex-col items-center justify-center ion-padding">
                <li className="w-full border-b border-grayscale-200">
                    <button
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                        type="button"
                        onClick={handleShareApp}
                    >
                        <p className="text-grayscale-900">Share App</p>
                        <svg
                            className="w-5 h-5 text-grayscale-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                        </svg>
                    </button>
                </li>

                {hasConsented && contract && (
                    <li className="w-full border-b border-grayscale-200">
                        <button
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                            type="button"
                            onClick={handleEditPermissions}
                        >
                            <p className="text-grayscale-900">Edit Permissions</p>
                            <Settings className="w-5 h-5 text-grayscale-600" />
                        </button>
                    </li>
                )}

                <li className="w-full">
                    <button
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                        type="button"
                        onClick={() => {
                            closeModal();
                            handleUninstallConfirm();
                        }}
                    >
                        <p className="text-red-600">Uninstall</p>
                        <TrashBin className="text-red-600" />
                    </button>
                </li>
            </ul>,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleLaunch = async () => {
        // For consent flow apps, redirect with did and delegate VP
        if (hasConsented && contract) {
            // Guardian consent apps need profile selection flow
            if (contract.needsGuardianConsent) {
                const redirectUrl = launchConfig.redirectUri?.trim() || contract.redirectUrl?.trim();

                if (redirectUrl) {
                    closeModal();
                    newModal(
                        <GuardianConsentLaunchModal
                            contractDetails={contract}
                            redirectUrl={redirectUrl}
                        />,
                        { sectionClassName: '!bg-transparent !shadow-none' },
                        { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
                    );
                    return;
                }
            }

            // Prefer app listing URL, then contract redirectUrl
            const redirectUrl = launchConfig.redirectUri?.trim() || contract.redirectUrl?.trim();

            if (redirectUrl) {
                const wallet = await initWallet();
                const urlObj = new URL(redirectUrl);

                // Add user's did to redirect url
                urlObj.searchParams.set('did', wallet.id.did());

                // Add delegate credential VP if contract has an owner
                if (contract.owner?.did) {
                    const unsignedDelegateCredential = wallet.invoke.newCredential({
                        type: 'delegate',
                        subject: contract.owner.did,
                        access: ['read', 'write'],
                    });

                    const delegateCredential = await wallet.invoke.issueCredential(
                        unsignedDelegateCredential
                    );

                    const unsignedDidAuthVp = await wallet.invoke.newPresentation(
                        delegateCredential
                    );

                    const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                        proofPurpose: 'authentication',
                        proofFormat: 'jwt',
                    })) as any as string;

                    urlObj.searchParams.set('vp', vp);
                }

                window.open(urlObj.toString(), '_blank');
                return;
            }
        }

        // AI Tutor apps - open full connected view with topics
        if ((listing.launch_type as string) === 'AI_TUTOR' && launchConfig.aiTutorUrl) {
            replaceModal(
                <AiTutorConnectedView
                    listing={listing}
                    launchConfig={{
                        aiTutorUrl: launchConfig.aiTutorUrl,
                        contractUri: launchConfig.contractUri,
                    }}
                />
            );
            return;
        }

        // Default launch behavior for non-consent-flow apps
        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig.url) {
            replaceModal(
                <EmbedIframeModal
                    embedUrl={launchConfig.url}
                    appId={listing.listing_id}
                    appName={listing.display_name}
                    launchConfig={launchConfig}
                    isInstalled={isInstalled}
                />
            );
        } else if (listing.launch_type === 'DIRECT_LINK' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        } else if (listing.launch_type === 'SECOND_SCREEN' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        }
    };

    const launchType = listing.launch_type as string;
    const canLaunch =
        launchType === 'EMBEDDED_IFRAME' ||
        launchType === 'DIRECT_LINK' ||
        launchType === 'SECOND_SCREEN' ||
        launchType === 'CONSENT_REDIRECT' ||
        launchType === 'AI_TUTOR';

    return (
        <IonPage className="h-full w-full">
            {/* Header */}
            <IonHeader mode="ios" className="ion-no-border">
                <div className="ion-padding shadow-header bg-white">
                <div className="flex items-center justify-normal ion-padding">
                    <div className="h-[65px] w-[65px] mr-3">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[16px] overflow-hidden border-[1px] border-solid border-grayscale-200"
                            alt={`${listing.display_name} logo`}
                            src={listing.icon_url}
                            onError={e => {
                                (e.target as HTMLImageElement).src =
                                    'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                            }}
                        />
                    </div>

                    <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                        <p className="text-[22px] font-semibold text-grayscale-900 font-poppins leading-[1]">
                            {listing.display_name}
                        </p>

                        <p className="text-sm text-grayscale-600 font-poppins mt-1">
                            {listing.tagline}
                        </p>

                        {!iosMetadata && <div className="flex items-center gap-2 mt-2">
                            {listing.category && (
                                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                    {listing.category}
                                </span>
                            )}

                            {/* {installCount !== undefined && (
                                <span className="text-xs text-grayscale-500">
                                    {installCount.toLocaleString()} installs
                                </span>
                            )} */}
                        </div>}
                    </div>
                </div>

                {/* iOS App Store Metadata Section */}
                {iosMetadata && (
                    <div className="flex items-center justify-evenly ">
                        <div className="flex flex-col items-center justify-center pl-4 pr-6 border-r-solid border-r-grayscale-200 border-r-[1px]">
                            <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                                {iosMetadata.userRatingCount >= 1000
                                    ? numeral(iosMetadata.userRatingCount).format('0.0a')
                                    : iosMetadata.userRatingCount} Ratings
                            </p>

                            <h6 className="text-grayscale-600 font-bold text-[17px] my-2 font-notoSans">
                                {iosMetadata.averageUserRating?.toFixed(1)}
                            </h6>

                            <StaticStarRating rating={iosMetadata.averageUserRating} />
                        </div>

                        <div className="flex flex-col items-center justify-center pl-4 pr-6 border-r-solid border-r-grayscale-200 border-r-[1px]">
                            <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                                AGE
                            </p>

                            <h6 className="text-grayscale-600 font-bold text-[17px] my-2 font-notoSans">
                                {iosMetadata.contentAdvisoryRating || '12+'}
                            </h6>

                            <p className="text-xs text-grayscale-400 text-center font-notoSans uppercase">
                                Years Old
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center px-4">
                            <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                                Category
                            </p>

                            <h6 className="text-grayscale-600 font-bold text-[17px] my-2 font-notoSans">
                                {'#2'}
                            </h6>

                            <p className="text-xs text-grayscale-400 text-center font-notoSans uppercase">
                                {listing.category || iosMetadata.primaryGenreName || 'App'}
                            </p>
                        </div>
                    </div>
                )}

                </div>
            </IonHeader>

            <IonContent fullscreen className="ion-padding" style={{ '--background': listing.hero_background_color || '#00BA88' } as React.CSSProperties}>
                <div className="w-full flex flex-col pb-[120px]">
                    {/* About Section */}
                    <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                        <h3 className="text-xl text-gray-900 font-notoSans">About</h3>

                        <p className="text-grayscale-700 text-sm font-notoSans mt-2 font-normal whitespace-pre-wrap">
                            {listing.full_description}
                        </p>
                    </div>

                    {/* Highlights Section */}
                    {listing.highlights && listing.highlights.length > 0 && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans">Why Use This App?</h3>

                            {listing.highlights.map((highlight: string, index: number) => (
                                <div key={index} className="flex items-center justify-start mt-2">
                                    <Checkmark className="text-grayscale-900 w-[24px] h-auto mr-2 shrink-0" />

                                    <p className="text-grayscale-700 text-sm font-notoSans font-normal">
                                        {highlight}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Promo Video Section */}
                    {listing.promo_video_url && getEmbedUrl(listing.promo_video_url) && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-4">Watch</h3>

                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                    src={getEmbedUrl(listing.promo_video_url)!}
                                    title="Promo Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Screenshots Section */}
                    {screenshots.length > 0 && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-4">Preview</h3>

                            <AppScreenshotsSlider appScreenshots={screenshots} />
                        </div>
                    )}

                    {/* Links Section */}
                    {(listing.privacy_policy_url || listing.terms_url) && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-3">Links</h3>

                            <div className="space-y-3">
                                {listing.privacy_policy_url && (
                                    <a
                                        href={listing.privacy_policy_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-cyan-700 font-notoSans text-sm"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Privacy Policy
                                    </a>
                                )}

                                {listing.terms_url && (
                                    <a
                                        href={listing.terms_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-cyan-700 font-notoSans text-sm"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Terms of Service
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Ratings and Reviews Section - from iOS App Store */}
                    {iosMetadata && iosReviews && iosReviews.length > 0 && (
                        <AiPassportAppProfileRatings
                            appMetaData={iosMetadata as AppStoreAppMetadata}
                            appReviews={iosReviews as AppStoreAppReview[]}
                        />
                    )}
                </div>
            </IonContent>

            {/* Footer */}
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding gap-2">
                        <button
                            onClick={closeModal}
                            className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 shadow-button-bottom flex gap-[5px] justify-center flex-1"
                        >
                            Back
                        </button>

                        {isCheckingInstalled ? (
                            <button
                                disabled
                                className="py-[9px] px-[20px] rounded-[30px] bg-gray-100 text-gray-400 font-notoSans text-[17px] flex items-center justify-center flex-1"
                            >
                                <IonSpinner name="dots" className="w-5 h-5" />
                            </button>
                        ) : isInstalled ? (
                            <>
                                {canLaunch && (
                                    <button
                                        onClick={handleLaunch}
                                        className={`bg-${primaryColor} py-[9px] px-[20px] rounded-[30px] text-white font-notoSans text-[17px] shadow-button-bottom flex items-center justify-center flex-1`}
                                    >
                                        Open
                                    </button>
                                )}

                                <button
                                    onClick={handleOpenOptionsMenu}
                                    className="p-2 rounded-full bg-white shadow-button-bottom flex items-center justify-center"
                                    aria-label="More options"
                                >
                                    <ThreeDotVertical className="w-6 h-6 text-grayscale-600" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleInstall}
                                disabled={isProcessing}
                                className={`bg-${primaryColor} py-[9px] px-[20px] rounded-[30px] text-white font-notoSans text-[17px] shadow-button-bottom disabled:opacity-50 flex items-center justify-center flex-1`}
                            >
                                {isProcessing ? (
                                    <IonSpinner name="dots" className="w-5 h-5" />
                                ) : (
                                    'Install'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </IonFooter>

            <IonToast
                isOpen={showCopiedToast}
                onDidDismiss={() => setShowCopiedToast(false)}
                message="Link copied to clipboard!"
                duration={2000}
                position="bottom"
                color="success"
            />
        </IonPage>
    );
};

export default AppStoreDetailModal;
