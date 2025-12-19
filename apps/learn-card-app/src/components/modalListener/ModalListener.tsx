import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import modalStateStore from 'learn-card-base/stores/modalStateStore';
import { VCClaim } from 'learn-card-base';
import { useIonModal } from '@ionic/react';

export const PresentVcModalListener: React.FC = () => {
    const history = useHistory();
    const presentVcModalState = modalStateStore.useTracked.presentVcModal();
    const [present, dismiss] = useIonModal(VCClaim, {
        dismiss: ({historyPush, callback}) => {
            dismiss();
           history.push(historyPush ?? '/wallet');
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
