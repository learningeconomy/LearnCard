import React, { useMemo } from 'react';
import { useModal, ModalTypes, useWallet } from 'learn-card-base';

import type { AppStoreListing, InstalledApp } from '@learncard/types';

import AppStoreDetailModal from '../../launchPad/AppStoreDetailModal';
import { EmbedIframeModal } from '../../launchPad/EmbedIframeModal';
import AiTutorConnectedView from '../../launchPad/AiTutorConnectedView';
import GuardianConsentLaunchModal from '../../launchPad/GuardianConsentLaunchModal';
import { useConsentFlowByUri } from '../../consentFlow/useConsentFlow';
import { openExternalLink } from '../../../helpers/externalLinkHelpers';

type AnyListing = AppStoreListing | InstalledApp;

type UseAppLaunchOptions = {
    listing: AnyListing;
    isInstalled: boolean;
    onInstallSuccess?: () => void;
};

const parseLaunchConfig = (raw: string | undefined): Record<string, any> => {
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

export const useAppLaunch = ({
    listing,
    isInstalled,
    onInstallSuccess,
}: UseAppLaunchOptions) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });
    const { initWallet } = useWallet();

    const launchConfig = useMemo(
        () => parseLaunchConfig(listing.launch_config_json),
        [listing.launch_config_json],
    );

    const contractUri: string | undefined = launchConfig?.contractUri;
    const { contract, hasConsented } = useConsentFlowByUri(contractUri);

    const openDetail = () => {
        newModal(
            <AppStoreDetailModal
                listing={listing}
                isInstalled={isInstalled}
                onInstallSuccess={onInstallSuccess}
            />,
        );
    };

    const launch = async () => {
        if (!isInstalled) {
            openDetail();
            return;
        }

        // Consent-flow apps that the user has already consented to: redirect
        // out to the contract's URL with `did` + delegate-VP query params.
        // Mirrors AppStoreListItem.proceedWithLaunch's first branch — these
        // guards (guardian flow, delegate VP issuance) are security-critical.
        if (hasConsented && contract) {
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
                        { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen },
                    );
                    return;
                }
            }

            const redirectUrl =
                launchConfig.redirectUri?.trim() || contract.redirectUrl?.trim();

            if (redirectUrl) {
                const wallet = await initWallet();
                const urlObj = new URL(redirectUrl);

                urlObj.searchParams.set('did', wallet.id.did());

                if (contract.owner?.did) {
                    const unsignedDelegateCredential = wallet.invoke.newCredential({
                        type: 'delegate',
                        subject: contract.owner.did,
                        access: ['read', 'write'],
                    });

                    const delegateCredential = await wallet.invoke.issueCredential(
                        unsignedDelegateCredential,
                    );

                    const unsignedDidAuthVp =
                        await wallet.invoke.newPresentation(delegateCredential);

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

        if ((listing.launch_type as string) === 'AI_TUTOR' && launchConfig.aiTutorUrl) {
            newModal(
                <AiTutorConnectedView
                    listing={listing}
                    launchConfig={{
                        aiTutorUrl: launchConfig.aiTutorUrl,
                        contractUri: launchConfig.contractUri,
                    }}
                />,
            );
            return;
        }

        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig.url) {
            newModal(
                <EmbedIframeModal
                    embedUrl={launchConfig.url}
                    appId={(listing as any).slug || listing.listing_id}
                    appName={listing.display_name}
                    launchConfig={launchConfig}
                    isInstalled
                />,
            );
            return;
        }

        if (listing.launch_type === 'DIRECT_LINK' && launchConfig.url) {
            await openExternalLink(launchConfig.url);
            return;
        }

        if (listing.launch_type === 'SECOND_SCREEN' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
            return;
        }

        openDetail();
    };

    return { launch };
};

export default useAppLaunch;
