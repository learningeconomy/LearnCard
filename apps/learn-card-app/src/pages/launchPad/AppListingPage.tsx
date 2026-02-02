import React, { useState, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import type { AppStoreListing } from '@learncard/types';
import numeral from 'numeral';

import { IonPage, IonContent, IonSpinner, IonToast } from '@ionic/react';
import {
    useModal,
    ModalTypes,
    useConfirmation,
    useIsLoggedIn,
    useWithdrawConsent,
    useWallet,
    useGetAppMetadata,
    useGetAppReviews,
    AppStoreAppMetadata,
    AppStoreAppReview,
} from 'learn-card-base';
import { ThreeDotVertical } from '@learncard/react';
import TrashBin from '../../components/svgs/TrashBin';

import useAppStore from './useAppStore';
import { EmbedIframeModal } from './EmbedIframeModal';
import AppScreenshotsSlider from '../../components/ai-passport-apps/helpers/AppScreenshotSlider';
import StaticStarRating from '../../components/ai-passport-apps/helpers/StaticStarRating';
import AiPassportAppProfileRatings from '../../components/ai-passport-apps/AiPassportAppProfileDetails/AiPassportAppProfileRatings';
import Checkmark from '../../components/svgs/Checkmark';
import { AppInstallConsentModal } from '../../components/credentials/AppInstallConsentModal';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import ConsentFlowPrivacyAndData from '../consentFlow/ConsentFlowPrivacyAndData';
import GuardianConsentLaunchModal from './GuardianConsentLaunchModal';
import AiTutorConnectedView from './AiTutorConnectedView';
import { Settings, Eye, ArrowLeft } from 'lucide-react';

// Extended type to include new fields
type ExtendedAppStoreListing = AppStoreListing & {
    highlights?: string[];
    screenshots?: string[];
    promo_video_url?: string;
    ios_app_store_id?: string;
    hero_background_color?: string;
};

// Helper to convert YouTube/Vimeo URLs to embed URLs
const getEmbedUrl = (url: string): string | null => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
};

interface AppListingParams {
    listingId: string;
}

interface LocationState {
    listing?: ExtendedAppStoreListing;
    isPreview?: boolean;
}

const AppListingPage: React.FC = () => {
    const { listingId } = useParams<AppListingParams>();
    const history = useHistory<LocationState>();
    const location = history.location;
    const isLoggedIn = useIsLoggedIn();
    const { newModal, closeModal, replaceModal } = useModal();
    const confirm = useConfirmation();

    // Check if we have a preview listing from route state (for admin preview)
    const previewListing = (location.state?.listing as ExtendedAppStoreListing) || null;
    const isPreviewMode = location.state?.isPreview || false;

    const { usePublicListing, useInstallApp, useUninstallApp, useInstallCount, useIsAppInstalled } =
        useAppStore();

    // Fetch public listing (skip if we have preview data)
    const {
        data: fetchedListing,
        isLoading: isLoadingListing,
        error,
    } = usePublicListing(listingId);

    // Use preview listing if available, otherwise use fetched
    const listing = previewListing || fetchedListing;

    const installMutation = useInstallApp();
    const uninstallMutation = useUninstallApp();

    // Check installation status (only if logged in)
    const { data: isInstalledData, isLoading: isCheckingInstalled } = useIsAppInstalled(listingId);

    const isInstalled = isInstalledData ?? false;

    // Get install count
    const { data: installCount } = useInstallCount(listingId);

    const [isProcessing, setIsProcessing] = useState(false);

    // Parse launch config
    const launchConfig = useMemo(() => {
        if (!listing) return {};
        try {
            return JSON.parse(listing.launch_config_json);
        } catch {
            return {};
        }
    }, [listing?.launch_config_json]);

    const extendedListing = listing as ExtendedAppStoreListing | undefined;

    // Consent flow hooks for withdraw on uninstall and edit permissions
    const contractUri: string | undefined = launchConfig?.contractUri;
    const { contract, consentedContract, hasConsented } = useConsentFlowByUri(contractUri);
    const termsUri = consentedContract?.uri;
    const { mutateAsync: withdrawConsent } = useWithdrawConsent(termsUri ?? '');

    const { initWallet } = useWallet();

    // Fetch iOS App Store metadata if ios_app_store_id is available
    const iosAppId = extendedListing?.ios_app_store_id;
    const { data: iosMetadata } = useGetAppMetadata(iosAppId || '');
    const { data: iosReviews } = useGetAppReviews(iosAppId || '');

    // Use iOS screenshots as fallback if no screenshots provided in listing
    const screenshots = useMemo(() => {
        if (extendedListing?.screenshots && extendedListing.screenshots.length > 0) {
            return extendedListing.screenshots;
        }

        if (iosMetadata?.screenshotUrls && iosMetadata.screenshotUrls.length > 0) {
            return iosMetadata.screenshotUrls;
        }

        return [];
    }, [extendedListing?.screenshots, iosMetadata?.screenshotUrls]);

    const [showCopiedToast, setShowCopiedToast] = useState(false);

    const handleShareApp = async () => {
        if (!listing) return;
        const appUrl = `${window.location.origin}/app/${listing.listing_id}`;

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

        closeModal();

        newModal(
            <ConsentFlowPrivacyAndData
                contractDetails={contract}
                terms={consentedContract.terms}
                setTerms={() => {}}
                isPostConsent={true}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const doInstall = async () => {
        if (!listing) return;
        setIsProcessing(true);

        try {
            await installMutation.mutateAsync(listing.listing_id);
        } catch (error) {
            console.error('Failed to install app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInstall = () => {
        if (!listing) return;

        if (!isLoggedIn) {
            // Redirect to login with return URL
            history.push(`/login?returnUrl=/app/${listingId}`);
            return;
        }

        const permissions: string[] = launchConfig?.permissions || [];
        const contractUri: string | undefined = launchConfig?.contractUri;

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
        if (!listing) return;
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
        } catch (error) {
            console.error('Failed to uninstall app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUninstallConfirm = async () => {
        if (!listing) return;
        await confirm({
            text: `Are you sure you want to uninstall ${listing.display_name}?`,
            onConfirm: handleUninstall,
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-red-600 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const handleOpenOptionsMenu = () => {
        if (!listing) return;
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
        if (!listing) return;

        // For consent flow apps, redirect with did and delegate VP
        if (hasConsented && contract) {
            // Guardian consent apps need profile selection flow
            if (contract.needsGuardianConsent) {
                const redirectUrl =
                    launchConfig.redirectUri?.trim() || contract.redirectUrl?.trim();

                if (redirectUrl) {
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
            newModal(
                <AiTutorConnectedView
                    listing={listing}
                    launchConfig={{
                        aiTutorUrl: launchConfig.aiTutorUrl,
                        contractUri: launchConfig.contractUri,
                    }}
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
            return;
        }

        // Default launch behavior for non-consent-flow apps
        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig.url) {
            newModal(
                <EmbedIframeModal
                    embedUrl={launchConfig.url}
                    appId={(listing as any).slug || listing.listing_id}
                    appName={listing.display_name}
                    launchConfig={launchConfig}
                    isInstalled={isInstalled}
                    hideFullScreenButton={listing.launch_type === 'EMBEDDED_IFRAME'}
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else if (listing.launch_type === 'DIRECT_LINK' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        } else if (listing.launch_type === 'SECOND_SCREEN' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        }
    };

    const launchType = listing?.launch_type as string;
    const canLaunch =
        launchType === 'EMBEDDED_IFRAME' ||
        launchType === 'DIRECT_LINK' ||
        launchType === 'SECOND_SCREEN' ||
        launchType === 'CONSENT_REDIRECT' ||
        launchType === 'AI_TUTOR';

    // Loading state
    if (isLoadingListing) {
        return (
            <IonPage>
                <IonContent fullscreen className="ion-padding">
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
                        <div className="flex flex-col items-center gap-4">
                            <IonSpinner name="crescent" className="w-12 h-12 text-indigo-600" />
                            <p className="text-grayscale-600 font-medium">Loading app...</p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Error / Not found state
    if (error || !listing) {
        return (
            <IonPage>
                <IonContent fullscreen>
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50">
                        <div className="text-center p-8 max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <h1 className="text-2xl font-bold text-grayscale-900 mb-2">
                                App Not Found
                            </h1>

                            <p className="text-grayscale-600 mb-6">
                                This app listing doesn't exist or is no longer available.
                            </p>

                            <button
                                onClick={() => history.push('/launchpad')}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Browse Apps
                            </button>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    console.log('iosMetadata', listing);
    return (
        <IonPage>
            <IonContent fullscreen>
                {/* Preview Mode Banner */}
                {isPreviewMode && (
                    <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md">
                        <button
                            onClick={() => history.goBack()}
                            className="flex items-center gap-1 hover:bg-amber-600 rounded-lg px-2 py-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Preview Mode</span>
                        </div>
                        <div className="w-16" /> {/* Spacer for centering */}
                    </div>
                )}

                <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/5 to-transparent" />

                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
                            {/* App Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 safe-area-top-margin">
                                <div className="w-28 h-28 rounded-[28px] overflow-hidden bg-white shadow-xl flex-shrink-0 border border-grayscale-100">
                                    <img
                                        src={listing.icon_url}
                                        alt={listing.display_name}
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                            (e.target as HTMLImageElement).src =
                                                'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                        }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-grayscale-900 mb-2">
                                        {listing.display_name}
                                    </h1>

                                    <p className="text-lg text-grayscale-600 mb-4">
                                        {listing.tagline}
                                    </p>

                                    {!iosMetadata && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            {listing.category && (
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                                                    {listing.category}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {isLoggedIn && isCheckingInstalled ? (
                                        <button
                                            disabled
                                            className="flex-1 sm:flex-none px-8 py-3 rounded-full bg-gray-100 text-gray-400 font-semibold"
                                        >
                                            <IonSpinner name="dots" className="w-5 h-5" />
                                        </button>
                                    ) : isLoggedIn && isInstalled ? (
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            {canLaunch && (
                                                <button
                                                    onClick={handleLaunch}
                                                    className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                                >
                                                    Open
                                                </button>
                                            )}

                                            <button
                                                onClick={handleOpenOptionsMenu}
                                                className="p-3 rounded-full bg-white shadow-md hover:bg-grayscale-50 transition-colors"
                                                aria-label="More options"
                                            >
                                                <ThreeDotVertical className="w-5 h-5 text-grayscale-600" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleInstall}
                                            disabled={isProcessing}
                                            className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <IonSpinner name="dots" className="w-5 h-5" />
                                            ) : (
                                                <>
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
                                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                        />
                                                    </svg>
                                                    {isLoggedIn ? 'Install' : 'Get App'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* iOS App Store Metadata Section */}
                        {iosMetadata && (
                            <div className="max-w-4xl mx-auto px-4 mt-6">
                                <div className="bg-white rounded-2xl shadow-sm p-4">
                                    <div className="flex items-center justify-evenly divide-x divide-grayscale-200">
                                        <div className="flex flex-col items-center justify-center px-4">
                                            <p className="text-xs text-grayscale-400 uppercase tracking-wide mb-1">
                                                {iosMetadata.userRatingCount >= 1000
                                                    ? numeral(iosMetadata.userRatingCount).format(
                                                          '0.0a'
                                                      )
                                                    : iosMetadata.userRatingCount}{' '}
                                                Ratings
                                            </p>

                                            <p className="text-xl font-bold text-grayscale-700 mb-1">
                                                {iosMetadata.averageUserRating?.toFixed(1)}
                                            </p>

                                            <StaticStarRating
                                                rating={iosMetadata.averageUserRating}
                                            />
                                        </div>

                                        <div className="flex flex-col items-center justify-center px-4">
                                            <p className="text-xs text-grayscale-400 uppercase tracking-wide mb-1">
                                                Age
                                            </p>

                                            <p className="text-xl font-bold text-grayscale-700 mb-1">
                                                {iosMetadata.contentAdvisoryRating || '12+'}
                                            </p>

                                            <p className="text-xs text-grayscale-400">Years Old</p>
                                        </div>

                                        <div className="flex flex-col items-center justify-center px-4">
                                            <p className="text-xs text-grayscale-400 uppercase tracking-wide mb-1">
                                                Category
                                            </p>

                                            <p className="text-xl font-bold text-grayscale-700 mb-1">
                                                #2
                                            </p>

                                            <p className="text-xs text-grayscale-400">
                                                {listing.category ||
                                                    iosMetadata.primaryGenreName ||
                                                    'App'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Sections */}
                    <div className="max-w-4xl mx-auto px-4 pb-16">
                        {/* About Section */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                            <h2 className="text-xl font-semibold text-grayscale-900 mb-4">About</h2>

                            <p className="text-grayscale-700 leading-relaxed whitespace-pre-wrap">
                                {listing.full_description}
                            </p>
                        </section>

                        {/* Highlights Section */}
                        {extendedListing?.highlights && extendedListing.highlights.length > 0 && (
                            <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                                <h2 className="text-xl font-semibold text-grayscale-900 mb-4">
                                    Why Use This App?
                                </h2>

                                <div className="space-y-3">
                                    {extendedListing.highlights.map(
                                        (highlight: string, index: number) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                                    <Checkmark className="w-4 h-4 text-emerald-600" />
                                                </div>

                                                <p className="text-grayscale-700">{highlight}</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Promo Video Section */}
                        {extendedListing?.promo_video_url &&
                            getEmbedUrl(extendedListing.promo_video_url) && (
                                <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                                    <h2 className="text-xl font-semibold text-grayscale-900 mb-4">
                                        Watch
                                    </h2>

                                    <div
                                        className="relative w-full rounded-xl overflow-hidden"
                                        style={{ paddingBottom: '56.25%' }}
                                    >
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={getEmbedUrl(extendedListing.promo_video_url)!}
                                            title="Promo Video"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </section>
                            )}

                        {/* Screenshots Section */}
                        {screenshots.length > 0 && (
                            <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                                <h2 className="text-xl font-semibold text-grayscale-900 mb-4">
                                    Preview
                                </h2>

                                <AppScreenshotsSlider appScreenshots={screenshots} />
                            </section>
                        )}

                        {/* Links Section */}
                        {(listing.privacy_policy_url || listing.terms_url) && (
                            <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                                <h2 className="text-xl font-semibold text-grayscale-900 mb-4">
                                    Legal
                                </h2>

                                <div className="flex flex-wrap gap-4">
                                    {listing.privacy_policy_url && (
                                        <a
                                            href={listing.privacy_policy_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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
                                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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
                            </section>
                        )}

                        {/* Ratings and Reviews Section - from iOS App Store */}
                        {iosMetadata && iosReviews && iosReviews.length > 0 && (
                            <AiPassportAppProfileRatings
                                appMetaData={iosMetadata as AppStoreAppMetadata}
                                appReviews={iosReviews as AppStoreAppReview[]}
                            />
                        )}
                    </div>

                    {/* Powered by LearnCard */}
                    <div className="text-center pb-8">
                        <p className="text-sm text-grayscale-400">
                            Powered by{' '}
                            <a
                                href="https://learncard.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-600 font-medium"
                            >
                                LearnCard
                            </a>
                        </p>
                    </div>
                </div>

                <IonToast
                    isOpen={showCopiedToast}
                    onDidDismiss={() => setShowCopiedToast(false)}
                    message="Link copied to clipboard!"
                    duration={2000}
                    position="bottom"
                    color="success"
                />
            </IonContent>
        </IonPage>
    );
};

export default AppListingPage;
