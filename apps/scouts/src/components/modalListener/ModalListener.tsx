import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import modalStateStore from 'learn-card-base/stores/modalStateStore';
import { VCClaim, useModal, ModalTypes } from 'learn-card-base';

export const PresentVcModalListener: React.FC = () => {
    const history = useHistory();
    const presentVcModalState = modalStateStore.useTracked.presentVcModal();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    useEffect(() => {
        if (presentVcModalState?.open) {
            newModal(
                <VCClaim
                    _streamId={presentVcModalState.name as string}
                    dismiss={({ historyPush, callback }: any) => {
                        closeModal();
                        history.push(historyPush ?? '/wallet');
                        modalStateStore.set.presentVcModal({
                            open: false,
                            name: null,
                        });
                        callback?.();
                    }}
                />
            );
        }
    }, [presentVcModalState]);

    return null;
};

export default PresentVcModalListener;
