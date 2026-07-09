import React, { useMemo } from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { useModal, ModalTypes, useWallet } from 'learn-card-base';
import { ShieldAlert } from 'lucide-react';
import { checkAppInstallEligibility } from '@learncard/helpers';

import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import { useGuardianGate } from '../../hooks/useGuardianGate';
import { openExternalLink } from '../../helpers/externalLinkHelpers';
import AppStoreDetailModal from './AppStoreDetailModal';
import { EmbedIframeModal } from './EmbedIframeModal';
import GuardianConsentLaunchModal from './GuardianConsentLaunchModal';
import AiTutorConnectedView from './AiTutorConnectedView';

const FALLBACK_ICON = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

type UseAppLaunchArgs = {
    listing: AppStoreListing | InstalledApp;
    isInstalled?: boolean;
    onInstallSuccess?: () => void;
};

/**
 * Shared "open an installed app" behavior for the app store.
 *
 * Encapsulates the launch flow used by both the browse list row
 * (AppStoreListItem) and the My Apps grid tile (MoreAppTile): consent-flow
 * redirect with delegate VP, AI Tutor, embedded iframe, direct/second-screen
 * links, age hard-block, and a fallback to the detail modal when a listing has
 * no launchable config. Modals are opened fresh via `newModal`, so this is safe
 * to call from a surface that isn't already inside a modal.
 */
const useAppLaunch = ({ listing, isInstalled = false, onInstallSuccess }: UseAppLaunchArgs) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

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
    const { userAge, isChildProfile } = useGuardianGate();

    // Separate min_age (hard block) from age_rating (soft block with guardian approval)
    const listingAny = listing as any;
    const minAge: number | undefined = listingAny.min_age;
    const ageRating: string | undefined = listingAny.age_rating;

    // Hard block: min_age violation (hide app entirely, block installation)
    // Only applies when userAge is known
    const isHardBlocked = useMemo(
        () =>
            checkAppInstallEligibility({
                isChildProfile,
                userAge,
                minAge,
                ageRating,
                hasContract: Boolean(contractUri),
            }).action === 'hard_blocked',
        [ageRating, contractUri, isChildProfile, minAge, userAge]
    );

    // Check if this is an InstalledApp (has installed_at property)
    const installedAt = 'installed_at' in listing ? listing.installed_at : null;

    const handleOpenDetail = () => {
        newModal(
            <AppStoreDetailModal
                listing={listing}
                isInstalled={isInstalled}
                onInstallSuccess={onInstallSuccess}
            />
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
                                    (e.target as HTMLImageElement).src = FALLBACK_ICON;
                                }}
                            />
                        </div>

                        <div>
                            <p className="text-lg font-semibold text-grayscale-900 mb-2">
                                {listing.display_name}
                            </p>

                            <p className="text-sm text-grayscale-600">
                                This app requires users to be <strong>{minAge}+</strong> years old.
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
            await openExternalLink(launchConfig.url);
        } else if (listing.launch_type === 'SECOND_SCREEN' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        } else {
            // Fallback to opening detail modal if launch type is not configured
            handleOpenDetail();
        }
    };

    const handleLaunch = async () => {
        // Hard block: min_age violation - show blocked modal
        if (isHardBlocked) {
            showAgeBlockedModal();
            return;
        }

        await proceedWithLaunch();
    };

    return {
        handleLaunch,
        handleOpenDetail,
        showAgeBlockedModal,
        isHardBlocked,
        launchConfig,
        installedAt,
    };
};

export default useAppLaunch;
