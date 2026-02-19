import React, { useRef, useEffect, useCallback } from 'react';
import { createContext } from '../../helpers/context.helpers';

import { useFreezelessImmer } from 'learn-card-base/hooks/useFreezelessImmer';

import { Modal, ModalComponent, ModalOptions, ModalType } from './types/Modals';

export type ModalsContextValues = {
    /** The Modal Stack */
    modals: Modal[];
};

export type ModalActionsContextValues = {
    /** Opens a new modal */
    newModal: (component: ModalComponent, type: ModalType, options?: ModalOptions) => void;

    /** Replaces the current modal */
    replaceModal: (component: ModalComponent, options?: ModalOptions) => void;

    /** Closes the top modal */
    closeModal: () => void;

    /** Closes all modals */
    closeAllModals: () => void;
};

export const [useModalsContext, ModalsContextProvider] = createContext<ModalsContextValues>();
export const [useModalActionsContext, ModalActionsContextProvider] =
    createContext<ModalActionsContextValues>();

export const ModalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modals, setModals] = useFreezelessImmer<Modal[]>([]);
    const currentId = useRef(0);

    // Disable dimmer for all but top modal
    useEffect(() => {
        setModals(oldModals => {
            oldModals.forEach((modal, index) => {
                modal.options = {
                    ...(modal.options ?? {}),
                    hideDimmer: index !== oldModals.length - 1,
                };
            });
        });
    }, [modals.length]);

    const newModal = useCallback(
        (component: ModalComponent, type: ModalType, options?: ModalOptions) => {
            setModals(oldModals => {
                // Keep the id numbers under control
                if (oldModals.length === 0) currentId.current = 0;

                // For some reason duplicate ids are periodically given out, this check prevents that from
                // happening
                if (
                    oldModals.length > 0 &&
                    currentId.current <= oldModals[oldModals.length - 1].id
                ) {
                    currentId.current = oldModals[oldModals.length - 1].id + 1;
                }

                oldModals.push({ component, type, options, open: true, id: currentId.current });

                currentId.current += 1;
            });
        },
        [setModals]
    );

    const replaceModal = useCallback(
        (component: ModalComponent, options?: ModalOptions) => {
            setModals(oldModals => {
                const currentModal = oldModals[oldModals.length - 1];

                if (currentModal) {
                    currentModal.component = component;
                    currentModal.options = options;
                }
            });
        },
        [setModals]
    );

    const closeModal = useCallback(() => {
        setModals(_modals => {
            const index = _modals.findLastIndex(modal => modal.open);
            if (index === -1) return;

            const modalToClose = _modals[index];

            const { id } = modalToClose;
            modalToClose.open = false;
            modalToClose?.options?.onClose?.();

            setTimeout(
                () =>
                    setModals(oldModals => {
                        const modalIndex = oldModals.findIndex(modal => modal.id === id);

                        if (modalIndex === -1) return;

                        oldModals.splice(modalIndex, 1);
                    }),
                300
            );
        });
    }, [setModals]);

    const closeAllModals = useCallback(() => {
        setModals(oldModals => oldModals.map(modal => ({ ...modal, open: false })));
        setTimeout(() => setModals([]), 300);
    }, [setModals]);

    return (
        <ModalsContextProvider value={{ modals }}>
            <ModalActionsContextProvider
                value={{ newModal, replaceModal, closeModal, closeAllModals }}
            >
                {children}
            </ModalActionsContextProvider>
        </ModalsContextProvider>
    );
};

export default ModalsProvider;
