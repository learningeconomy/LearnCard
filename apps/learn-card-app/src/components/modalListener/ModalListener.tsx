import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

import modalStateStore from 'learn-card-base/stores/modalStateStore';
import { VCClaim } from 'learn-card-base';
import { useAppOverlayModal } from 'learn-card-base/ui/overlays/useAppOverlayModal';

export const PresentVcModalListener: React.FC = () => {
    const navigate = useNavigate();
    const presentVcModalState = modalStateStore.useTracked.presentVcModal();
    const [present, dismiss] = useAppOverlayModal(VCClaim, {
        dismiss: ({ historyPush, callback }) => {
            dismiss();
            navigate(historyPush ?? '/wallet');
            modalStateStore.set.presentVcModal({
                open: false,
                name: null,
            });
            callback?.();
        },
    });
    useEffect(() => {
        if (presentVcModalState?.open) {
            present();
        }
    }, [presentVcModalState]);

    return null;
};

export default PresentVcModalListener;
