import React, { useState, useMemo, useRef, useEffect } from 'react';
import numeral from 'numeral';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { IonPage, IonContent, IonSpinner, IonFooter, IonHeader, IonToast } from '@ionic/react';
import {
    useModal,
    ModalTypes,
    useConfirmation,
    useWithdrawConsent,
    useWallet,
    useGetAppMetadata,
    useGetAppReviews,
    AppStoreAppMetadata,
    AppStoreAppReview,
    switchedProfileStore,
    useGetCurrentLCNUser,
    calculateAge,
    useDeviceTypeByWidth,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { ThreeDotVertical } from '@learncard/react';
import TrashBin from '../../components/svgs/TrashBin';

import { useAnalytics, AnalyticsEvents } from '@analytics';
import useAppStore from './useAppStore';
import { EmbedIframeModal } from './EmbedIframeModal';
import useTheme from '../../theme/hooks/useTheme';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import AppScreenshotsSlider from '../../components/ai-passport-apps/helpers/AppScreenshotSlider';
import Checkmark from '../../components/svgs/Checkmark';
import StaticStarRating from '../../components/ai-passport-apps/helpers/StaticStarRating';
import AiPassportAppProfileRatings from '../../components/ai-passport-apps/AiPassportAppProfileDetails/AiPassportAppProfileRatings';
import { AppInstallConsentModal } from '../../components/credentials/AppInstallConsentModal';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import ConsentFlowPrivacyAndData from '../consentFlow/ConsentFlowPrivacyAndData';
import GuardianConsentLaunchModal from './GuardianConsentLaunchModal';
import AiTutorConnectedView from './AiTutorConnectedView';
import { Settings, ShieldAlert } from 'lucide-react';
import { useGuardianGate } from '../../hooks/useGuardianGate';
import DatePickerInput from '../../components/date-picker/DatePickerInput';
import { checkAppInstallEligibility, AGE_RATING_TO_MIN_AGE } from '@learncard/helpers';

// Extended type to include new fields (until types package is rebuilt)
type ExtendedAppStoreListing = (AppStoreListing | InstalledApp) & {
    highlights?: string[];
    screenshots?: string[];
    promo_video_url?: string;
    ios_app_store_id?: string;
    hero_background_color?: string;
    min_age?: number;
    age_rating?: '4+' | '9+' | '12+' | '17+';
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
    isPreview?: boolean;
}

const AppStoreDetailModal: React.FC<AppStoreDetailModalProps> = ({
    listing,
    isInstalled: initialIsInstalled = false,
    onInstallSuccess,
    isPreview = false,
}) => {
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { closeModal, replaceModal, newModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { isMobile } = useDeviceTypeByWidth();

    const { track } = useAnalytics();
    const { useInstallApp, useUninstallApp, useInstallCount, useIsAppInstalled } = useAppStore();

    const installMutation = useInstallApp();
    const uninstallMutation = useUninstallApp();

    // Check installation status
    const { data: isInstalledData, isLoading: isCheckingInstalled } = useIsAppInstalled(
        listing.listing_id
    );

    const isInstalled = isInstalledData ?? initialIsInstalled ?? 'installed_at' in listing;

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
    const [isExpanded, setIsExpanded] = useState(false);

    // Guardian gate for child profiles - verify before showing permissions modal
    const { guardedAction } = useGuardianGate({
        skip: isPreview,
    });
    const [canExpand, setCanExpand] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const raf = requestAnimationFrame(() => {
            setCanExpand(el.scrollHeight > el.clientHeight);
        });

        return () => cancelAnimationFrame(raf);
    }, [listing.full_description]);

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

    // Get current user profile for age checking
    const { currentLCNUser } = useGetCurrentLCNUser();
    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();
    const profileType = switchedProfileStore.use.profileType();
    const isChildProfile = Boolean(isSwitchedProfile && profileType === 'child');

    // Separate min_age (hard block) from age_rating (soft block with guardian approval)
    const minAge: number | undefined = listing.min_age;
    const ageRating: string | undefined = listing.age_rating;

    // Map age_rating to numeric value for display purposes
    const ageRatingMinAge = ageRating ? AGE_RATING_TO_MIN_AGE[ageRating] ?? 0 : 0;

    // Calculate user's age from DOB
    const userAge = useMemo(() => {
        if (!currentLCNUser?.dob) return null;
        const age = calculateAge(currentLCNUser.dob);
        return Number.isNaN(age) ? null : age;
    }, [currentLCNUser?.dob]);

    // Hard block: min_age violation (block installation entirely)
    // Only applies when userAge is known
    const isHardBlocked =
        userAge !== null && minAge !== undefined && minAge > 0 && userAge < minAge;

    // Combined age floor for display purposes
    const ageFloor = minAge !== undefined ? minAge : ageRatingMinAge;

    const doInstall = async () => {
        setIsProcessing(true);

        try {
            await installMutation.mutateAsync(listing.listing_id);
            track(AnalyticsEvents.LAUNCHPAD_APP_INSTALLED, {
                appName: listing.display_name,
                appId: listing.listing_id,
                category: listing.category,
            });
            onInstallSuccess?.();
        } catch (error) {
            console.error('Failed to install app:', error);
            if (error?.message) {
                presentToast(`Failed to install app: ${error?.message}`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Show the consent modal and proceed with install
    const showInstallConsentModal = (enteredAge?: number) => {
        const permissions: string[] = launchConfig?.permissions || [];
        const consentContractUri: string | undefined = launchConfig?.contractUri;

        newModal(
            <AppInstallConsentModal
                appName={listing.display_name}
                appIcon={listing.icon_url}
                permissions={permissions}
                contractUri={consentContractUri}
                isPreview={isPreview}
                ageRestriction={{
                    isChildProfile,
                    userAge: enteredAge ?? userAge,
                    minAge,
                    ageRating: listing.age_rating,
                }}
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

    // Show age restriction blocked modal
    const showAgeBlockedModal = () => {
        newModal(
            <div className="flex flex-col h-full w-full bg-white max-w-[500px] mx-auto">
                <div
                    className="border-b border-grayscale-200 p-6"
                    style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
                >
                    <h2 className="text-2xl font-bold text-grayscale-900 text-center">
                        Age Restricted
                    </h2>
                </div>

                <div className="flex-1 p-6 overflow-auto">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                            <ShieldAlert className="w-10 h-10 text-red-600" />
                        </div>

                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-grayscale-100 flex items-center justify-center shadow-md">
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

                        <div>
                            <p className="text-lg font-semibold text-grayscale-900 mb-2">
                                {listing.display_name}
                            </p>

                            <p className="text-sm text-grayscale-600">
                                This app requires users to be <strong>{ageFloor}+</strong> years
                                old.
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 w-full text-left">
                            <p className="text-sm text-red-800">
                                Based on your profile's date of birth, you do not meet the minimum
                                age requirement for this app.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center justify-center gap-4 p-6 border-t border-grayscale-200 bg-white"
                    style={{
                        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                    }}
                >
                    <button
                        onClick={closeModal}
                        className="px-8 py-3 text-lg font-semibold text-white bg-grayscale-600 rounded-full hover:bg-grayscale-700 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
        );
    };

    // Show DOB entry modal for child profiles missing DOB
    const showDobEntryModal = () => {
        const DobEntryModal: React.FC = () => {
            const [enteredDob, setEnteredDob] = useState('');

            const handleDobSubmit = () => {
                if (!enteredDob) return;

                // Calculate age from entered DOB
                const enteredAge = calculateAge(enteredDob);
                if (Number.isNaN(enteredAge)) {
                    return; // Invalid date
                }

                closeModal();

                // Check if entered age meets the requirement
                if (enteredAge < ageFloor) {
                    // Child is underage - block installation
                    showAgeBlockedModal();
                } else {
                    // Child meets age requirement - proceed to install
                    showInstallConsentModal(enteredAge);
                }
            };

            return (
                <div className="flex flex-col h-full w-full bg-white max-w-[500px] mx-auto">
                    <div
                        className="border-b border-grayscale-200 p-6"
                        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
                    >
                        <h2 className="text-2xl font-bold text-grayscale-900 text-center">
                            Date of Birth Required
                        </h2>
                    </div>

                    <div className="flex-1 p-6 overflow-auto">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-grayscale-100 flex items-center justify-center shadow-md">
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

                            <div>
                                <p className="text-lg font-semibold text-grayscale-900 mb-2">
                                    {listing.display_name}
                                </p>

                                <p className="text-sm text-grayscale-600 mb-4">
                                    This app has an age rating of{' '}
                                    <strong>{listing.age_rating || `${ageFloor}+`}</strong>.
                                    {listing.min_age !== undefined && (
                                        <>
                                            {' '}
                                            Minimum age: <strong>{listing.min_age}+</strong>.
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 w-full text-left">
                                <p className="text-sm text-amber-800 mb-3">
                                    Please enter your child's date of birth to continue.
                                </p>

                                <DatePickerInput
                                    value={enteredDob}
                                    onChange={date => {
                                        setEnteredDob(date);
                                    }}
                                    isMobile={isMobile}
                                    label="Date of Birth"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex items-center justify-center gap-4 p-6 border-t border-grayscale-200 bg-white"
                        style={{
                            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                        }}
                    >
                        <button
                            onClick={closeModal}
                            className="px-6 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-200 rounded-full hover:bg-grayscale-300 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleDobSubmit}
                            className="px-6 py-3 text-lg font-semibold text-white bg-cyan-600 rounded-full hover:bg-cyan-700 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            );
        };

        newModal(
            <DobEntryModal />,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
        );
    };

    const handleInstall = () => {
        const result = checkAppInstallEligibility({
            isChildProfile,
            userAge,
            minAge,
            ageRating,
            hasContract: Boolean(contractUri),
        });

        switch (result.action) {
            case 'hard_blocked':
                showAgeBlockedModal();
                return;

            case 'require_dob':
                guardedAction(
                    () => {
                        showDobEntryModal();
                    },
                    { ignorePriorVerification: true }
                );
                return;

            case 'require_guardian_approval':
                guardedAction(
                    () => {
                        showInstallConsentModal();
                    },
                    { ignorePriorVerification: true }
                );
                return;

            case 'proceed':
                showInstallConsentModal();
                return;
        }
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
        const appUrl = `${getAppBaseUrl()}/app/${listing.listing_id}`;

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
        // Hard block: min_age violation - show blocked modal
        if (isHardBlocked) {
            showAgeBlockedModal();
            return;
        }

        await proceedWithLaunch();
    };

    const proceedWithLaunch = async () => {
        // For consent flow apps, redirect with did and delegate VP
        if (hasConsented && contract) {
            // Guardian consent apps need profile selection flow
            if (contract.needsGuardianConsent) {
                const redirectUrl =
                    launchConfig.redirectUri?.trim() || contract.redirectUrl?.trim();

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
                    appId={(listing as any).slug || listing.listing_id}
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
                    <div className="flex items-center justify-normal ion-padding safe-area-top-margin">
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

                            {!iosMetadata && (
                                <div className="flex items-center gap-2 mt-2">
                                    {listing.category && (
                                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full capitalize">
                                            {listing.category}
                                        </span>
                                    )}
                                    {listing.age_rating && (
                                        <span className="inline-block px-2 py-0.5 bg-grayscale-100 text-grayscale-700 text-xs font-medium rounded-full">
                                            Age {listing.age_rating}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* iOS App Store Metadata Section */}
                    {iosMetadata && (
                        <div className="flex items-center justify-evenly ">
                            <div className="flex flex-col items-center justify-center pl-4 pr-6 border-r-solid border-r-grayscale-200 border-r-[1px]">
                                <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                                    {iosMetadata.userRatingCount >= 1000
                                        ? numeral(iosMetadata.userRatingCount).format('0.0a')
                                        : iosMetadata.userRatingCount}{' '}
                                    Ratings
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
                                    {listing.age_rating ||
                                        iosMetadata.contentAdvisoryRating ||
                                        '4+'}
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

            <IonContent
                fullscreen
                className="ion-padding"
                style={
                    {
                        '--background': listing.hero_background_color || '#00BA88',
                    } as React.CSSProperties
                }
            >
                <div className="w-full flex flex-col pb-[120px]">
                    {/* Screenshots Section */}
                    {screenshots.length > 0 && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-4">Preview</h3>

                            <AppScreenshotsSlider appScreenshots={screenshots} />
                        </div>
                    )}

                    {/* About Section */}
                    <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                        <h3 className="text-xl text-gray-900 font-notoSans">About</h3>

                        <p
                            ref={textRef}
                            className={`text-grayscale-700 text-sm font-notoSans mt-2 font-normal whitespace-pre-wrap ${
                                isExpanded ? '' : 'line-clamp-4'
                            }`}
                        >
                            {listing.full_description}
                        </p>
                        {canExpand && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="underline text-grayscale-700 text-sm font-notoSans mt-2 font-normal whitespace-pre-wrap"
                            >
                                {isExpanded ? 'Read Less' : 'Read More'}
                            </button>
                        )}
                    </div>

                    {/* Highlights Section */}
                    {listing.highlights && listing.highlights.length > 0 && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans">
                                Why Use This App?
                            </h3>

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
