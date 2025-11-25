import { useModalActionsContext } from './ModalsContext';

import { ModalTypes, ModalType, ModalOptions, ModalComponent } from './types/Modals';

export const useModal = ({
    desktop: _desktop = ModalTypes.Center,
    mobile: _mobile = ModalTypes.Cancel,
}: Partial<ModalType> = {}) => {
    const {
        newModal: _newModal,
        replaceModal,
        closeModal,
        closeAllModals,
    } = useModalActionsContext();

    const newModal = (
        component: ModalComponent,
        options?: ModalOptions,
        { desktop = _desktop, mobile = _mobile } = { desktop: _desktop, mobile: _mobile }
    ) => {
        _newModal(component, { desktop, mobile }, options);
    };

    return { newModal, replaceModal, closeModal, closeAllModals };
};

export default useModal;
