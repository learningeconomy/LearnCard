import React, { useMemo } from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { IonItem, IonSpinner } from '@ionic/react';
import {
    useModal,
    ModalTypes,
    useWallet,
    switchedProfileStore,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { ShieldAlert } from 'lucide-react';
import { ThreeDotVertical } from '@learncard/react';

import useTheme from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors';
import AppStoreDetailModal from './AppStoreDetailModal';
import { EmbedIframeModal } from './EmbedIframeModal';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import GuardianConsentLaunchModal from './GuardianConsentLaunchModal';
import AiTutorConnectedView from './AiTutorConnectedView';
import { useGuardianGate } from '../../hooks/useGuardianGate';

// Map age_rating to numeric minimum age
const AGE_RATING_TO_MIN_AGE: Record<string, number> = {
    '4+': 4,
    '9+': 9,
    '12+': 12,
    '17+': 17,
};

type AppStoreListItemProps = {
    listing: AppStoreListing | InstalledApp;
    isInstalled?: boolean;
    isInstalledLoading?: boolean;
    onInstallSuccess?: () => void;
};

const AppStoreListItem: React.FC<AppStoreListItemProps> = ({
    listing,
    isInstalled = false,
    isInstalledLoading = false,
    onInstallSuccess,
}) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.launchPad);

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    const buttonClass = `flex items-center justify-center rounded-full font-[600] px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.unconnected}`;
    const connectedButtonClass = `flex items-center justify-center rounded-full font-[600] px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.connected}`;

    // Parse launch config
    const launchConfig = useMemo(() => {
        try {
            return JSON.parse(listing.launch_config_json);
        } catch {
            return {};
        }
    }, [listing.launch_config_json]);

    // Consent flow hooks for redirect on launch
    const contractUri: string | undefined = launchConfig?.contractUri;
    const { contract, hasConsented } = useConsentFlowByUri(contractUri);

    const { initWallet } = useWallet();

    // Guardian gate for child profiles
    const { guardedAction, userAge } = useGuardianGate();

    // Get current user profile for age checking
    const { currentLCNUser } = useGetCurrentLCNUser();
    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();
    const profileType = switchedProfileStore.use.profileType();
    const isChildProfile = Boolean(isSwitchedProfile && profileType === 'child');

    // Separate min_age (hard block) from age_rating (soft block with guardian approval)
    const listingAny = listing as any;
    const minAge: number | undefined = listingAny.min_age;
    const ageRating: string | undefined = listingAny.age_rating;
    const ageRatingMinAge = ageRating ? AGE_RATING_TO_MIN_AGE[ageRating] ?? 0 : 0;

    // Hard block: min_age violation (hide app entirely, block installation)
    // Only applies when userAge is known
    const isHardBlocked =
        userAge !== null && minAge !== undefined && minAge > 0 && userAge < minAge;

    // Soft block: age_rating violation (child can install with guardian approval)
    // Only applies when userAge is known
    const isAgeRatingRestricted =
        userAge !== null && ageRatingMinAge > 0 && userAge < ageRatingMinAge;

    // Check if child profile is missing DOB
    const childMissingDob = isChildProfile && !currentLCNUser?.dob;

    // Check if listing has any age restriction (for DOB entry flow)
    const hasAgeRestriction = (minAge !== undefined && minAge > 0) || ageRatingMinAge > 0;

    // Combined age floor for display purposes
    const ageFloor = minAge !== undefined ? minAge : ageRatingMinAge;

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

    const handleOpenDetail = () => {
        newModal(
            <AppStoreDetailModal
                listing={listing}
                isInstalled={isInstalled}
                onInstallSuccess={onInstallSuccess}
            />
        );
    };

    const handleLaunch = async () => {
        // Hard block: min_age violation - show blocked modal
        if (isHardBlocked) {
            showAgeBlockedModal();
            return;
        }

        // Child profile missing DOB with age-restricted app - open detail modal for DOB entry flow
        if (childMissingDob && hasAgeRestriction) {
            guardedAction(() => handleOpenDetail());
            return;
        }

        // Soft block: age_rating violation for child profiles - require guardian approval
        if (isAgeRatingRestricted && isChildProfile) {
            guardedAction(async () => {
                await proceedWithLaunch();
            });
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
                />
            );
            return;
        }

        // Default launch behavior
        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig.url) {
            newModal(
                <EmbedIframeModal
                    embedUrl={launchConfig.url}
                    appId={(listing as any).slug || listing.listing_id}
                    appName={listing.display_name}
                    launchConfig={launchConfig}
                    isInstalled={isInstalled || !!installedAt}
                />
            );
        } else if (listing.launch_type === 'DIRECT_LINK' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        } else if (listing.launch_type === 'SECOND_SCREEN' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        } else {
            // Fallback to opening detail modal if launch type is not configured
            handleOpenDetail();
        }
    };

    // Check if this is an InstalledApp (has installed_at property)
    const installedAt = 'installed_at' in listing ? listing.installed_at : null;

    // Hide app entirely if user is hard-blocked by min_age
    if (isHardBlocked) {
        return null;
    }

    return (
        <IonItem
            lines="none"
            className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] max-h-[76px] border-gray-200 border-b-2 last:border-b-0 flex bg-white items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm"
        >
            <div className="flex items-center justify-start w-full bg-white-100">
                <div className="rounded-lg w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                    <img
                        className="w-full h-full object-cover bg-white rounded-lg"
                        src={listing.icon_url}
                        alt={`${listing.display_name} icon`}
                        onError={e => {
                            (e.target as HTMLImageElement).src =
                                'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                        }}
                    />
                </div>

                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-grayscale-900 font-medium line-clamp-1">
                                {listing.display_name}
                            </p>

                            {listing.age_rating && (
                                <span className="inline-block px-1.5 py-0.5 bg-grayscale-100 text-grayscale-700 text-[10px] font-medium rounded-full shrink-0">
                                    {listing.age_rating}
                                </span>
                            )}
                        </div>

                        <p className="text-grayscale-600 font-medium text-[12px] line-clamp-2 pr-1">
                            {listing.tagline}
                        </p>
                    </div>

                    <div className="flex app-connect-btn-container items-center ml-2 gap-2">
                        {isInstalledLoading ? (
                            <button className={buttonClass} disabled>
                                <IonSpinner name="dots" className="w-4 h-4" />
                            </button>
                        ) : isInstalled || installedAt ? (
                            <>
                                <button onClick={handleLaunch} className={connectedButtonClass}>
                                    Open
                                </button>

                                <button
                                    onClick={handleOpenDetail}
                                    className="p-1 rounded-full hover:bg-grayscale-100 transition-colors"
                                    aria-label="More options"
                                >
                                    <ThreeDotVertical className="w-5 h-5 text-grayscale-600" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    // Hard block check (defensive - should be hidden but user might navigate directly)
                                    if (isHardBlocked) {
                                        showAgeBlockedModal();
                                        return;
                                    }
                                    handleOpenDetail();
                                }}
                                className={buttonClass}
                            >
                                Get
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </IonItem>
    );
};

export default AppStoreListItem;
