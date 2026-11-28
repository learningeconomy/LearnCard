import { useNavigate } from 'react-router';
import { useModal, ModalTypes } from 'learn-card-base';
import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';
import TrustedAppRequestModal from 'learn-card-base/components/connected-applications/TrustedAppRequestModal';
import UnknownAppRequestModal from 'learn-card-base/components/connected-applications/UnknownAppRequestModal';
import { closeAll } from '../helpers/uiHelpers';

export const useAppConnectModal = (profileId: string, challenge: string) => {
    const navigate = useNavigate();
    const { data: trustedAppRegistry, isLoading: trustedAppRegistryLoading } =
        useTrustedAppsRegistry();

    const trustedAppInfo = trustedAppRegistry?.find(
        a => a.profileId.toLowerCase() === profileId.toLowerCase()
    );

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Cancel,
    });

    const presentConnectAppModal = () => {
        const Component = trustedAppInfo ? TrustedAppRequestModal : UnknownAppRequestModal;
        newModal(
            <Component
                appProfileId={profileId.toLowerCase()}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy typing, out of scope for the router migration
                appInfo={trustedAppInfo as any}
                challenge={challenge}
                handleCloseModal={() => {
                    closeModal();
                    navigate('/launchpad');
                }}
                onSuccess={() => {
                    closeModal();
                    navigate(`/select-credentials/${encodeURI(profileId)}`);
                    closeAll();
                }}
            />
        );
    };

    return {
        presentConnectAppModal,
        dismissConnectAppModal: closeModal,
        loading: trustedAppRegistryLoading,
    };
};

export default useAppConnectModal;
