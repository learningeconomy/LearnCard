import { useHistory } from 'react-router-dom';
import { useIonModal } from '@ionic/react';
import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';
import TrustedAppRequestModal from 'learn-card-base/components/connected-applications/TrustedAppRequestModal';
import UnknownAppRequestModal from 'learn-card-base/components/connected-applications/UnknownAppRequestModal';
import { closeAll } from '../helpers/uiHelpers';

export const useAppConnectModal = (profileId: string, challenge: string) => {
    const history = useHistory();
    const { data: trustedAppRegistry, isLoading: trustedAppRegistryLoading } =
        useTrustedAppsRegistry();

    const trustedAppInfo = trustedAppRegistry?.find(
        a => a.profileId.toLowerCase() === profileId.toLowerCase()
    );

    const [presentConnectAppModal, dismissConnectAppModal] = useIonModal(
        trustedAppInfo ? TrustedAppRequestModal : UnknownAppRequestModal,
        {
            appProfileId: profileId.toLowerCase(),
            appInfo: trustedAppInfo,
            challenge,
            handleCloseModal: () => {
                dismissConnectAppModal();
                history.push('/launchpad');
            },
            onSuccess: () => {
                dismissConnectAppModal();
                history.push(`/select-credentials/${encodeURI(profileId)}`);
                closeAll();
            },
        }
    );

    return { presentConnectAppModal, dismissConnectAppModal, loading: trustedAppRegistryLoading };
};

export default useAppConnectModal;
