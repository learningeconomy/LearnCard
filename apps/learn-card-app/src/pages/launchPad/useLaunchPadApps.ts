import { useHistory } from 'react-router';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';
import useJoinLCNetworkModal from '../../components/network-prompts/hooks/useJoinLCNetworkModal';
import useConsentFlow from '../consentFlow/useConsentFlow';

import { LaunchPadAppListItem, useGetConnections, useIsCurrentUserLCNUser } from 'learn-card-base';

export const useLaunchPadApps = () => {
    const history = useHistory();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const { data: trustedAppRegistry } = useTrustedAppsRegistry();
    const { data: connections, isLoading: loadingConnections } = useGetConnections();

    const flags = useFlags();

    // Not ideal since it only works for SmartResume, but it's what we've got for now
    const smartResumeContract = flags.smartResumeContractUri;
    const {
        openConsentFlowModal: openSmartResumeContract,
        hasConsented: hasConsentedToSmartResume,
    } = useConsentFlow(undefined, undefined, smartResumeContract);

    const launchpadApps: LaunchPadAppListItem[] = [
        // show connections at the top of the list
        ...(connections
            ?.filter(connection => connection.isServiceProfile)
            .map((connection, index) => {
                const trustedApp = trustedAppRegistry?.find(
                    trustedApp =>
                        trustedApp.profileId.toLowerCase() === connection.profileId.toLowerCase()
                );

                return {
                    id: index,
                    name: trustedApp?.app.name ?? connection.displayName,
                    description: trustedApp?.app.description ?? '',
                    img: trustedApp?.app.icon ?? connection.image ?? '',
                    isConnected: true, // we're looping through connections, so these are all true
                    displayInLaunchPad: true,
                    handleConnect: () => {
                        // nothing to do here, we're already connected
                    },
                    handleView: () =>
                        history.push(
                            `/view-shared-credentials/${encodeURI(
                                trustedApp?.profileId ?? connection.profileId
                            )}`
                        ),
                };
            }) ?? []),
        ...(trustedAppRegistry
            // filter out apps that are already in the list from when we processed connections
            ?.filter(
                app =>
                    !connections ||
                    !connections.find(
                        connection =>
                            connection?.profileId?.toLowerCase() === app?.profileId?.toLowerCase()
                    )
            )
            .map((app, index) => {
                const isSmartResume = app.id === 'SmartResume';

                let isConnected: boolean | null;
                if (isSmartResume) {
                    isConnected = hasConsentedToSmartResume;
                } else {
                    isConnected = loadingConnections ? null : false;
                }

                return {
                    id: index + (connections?.length ?? 0),
                    name: app?.app?.name,
                    description: app?.app?.description ?? '',
                    img: app?.app?.icon ?? '',
                    isConnected,
                    displayInLaunchPad: app?.app?.publicizeOnLaunchPad,
                    handleConnect: () => {
                        if (!currentLCNUser && !currentLCNUserLoading) {
                            handlePresentJoinNetworkModal();
                            return;
                        }

                        if (isSmartResume) {
                            // special handling for SmartResume
                            openSmartResumeContract();
                        } else {
                            window.location.replace(app.app.connectUrl);
                        }
                    },
                    handleView: isSmartResume
                        ? openSmartResumeContract
                        : () =>
                              history.push(`/view-shared-credentials/${encodeURI(app.profileId)}`),
                };
            }) ?? []),
    ];

    return launchpadApps;
};

export default useLaunchPadApps;
