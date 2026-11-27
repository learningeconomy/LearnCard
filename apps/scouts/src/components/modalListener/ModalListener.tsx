import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

import modalStateStore from 'learn-card-base/stores/modalStateStore';
import { VCClaim, useModal, ModalTypes } from 'learn-card-base';

export const PresentVcModalListener: React.FC = () => {
    const navigate = useNavigate();
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy typing, out of scope for the router migration
                    dismiss={({ historyPush, callback }: any) => {
                        closeModal();
                        navigate(historyPush ?? '/wallet');
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
