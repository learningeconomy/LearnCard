import { useCallback } from 'react';
import { useModalActionsContext } from './ModalsContext';

import { ModalTypes, ModalType, ModalOptions, ModalComponent } from './types/Modals';

export const useModal = ({
    desktop: _desktop = ModalTypes.Center,
    mobile: _mobile = ModalTypes.Cancel,
}: Partial<ModalType> = {}) => {
    const {
        newModal: _newModal,
        newModalWithToken: _newModalWithToken,
        replaceModal,
        closeModal,
        forceCloseModal,
        requestCloseModal,
        closeModalById,
        forceCloseModalById,
        forceCloseModalByToken,
        closeAllModals,
    } = useModalActionsContext();

    const newModal = useCallback(
        (
            component: ModalComponent,
            options?: ModalOptions,
            { desktop = _desktop, mobile = _mobile } = { desktop: _desktop, mobile: _mobile }
        ) => {
            return _newModal(component, { desktop, mobile }, options);
        },
        [_newModal, _desktop, _mobile]
    );

    const newModalWithToken = useCallback(
        (
            component: ModalComponent,
            options?: ModalOptions,
            { desktop = _desktop, mobile = _mobile } = { desktop: _desktop, mobile: _mobile }
        ) => {
            return _newModalWithToken(component, { desktop, mobile }, options);
        },
        [_newModalWithToken, _desktop, _mobile]
    );

    return {
        newModal,
        newModalWithToken,
        replaceModal,
        closeModal,
        forceCloseModal,
        requestCloseModal,
        closeModalById,
        forceCloseModalById,
        forceCloseModalByToken,
        closeAllModals,
    };
};

export default useModal;
