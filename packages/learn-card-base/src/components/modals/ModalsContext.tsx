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
    newModal: (component: ModalComponent, type: ModalType, options?: ModalOptions) => number;

    /** Replaces the current modal */
    replaceModal: (component: ModalComponent, options?: ModalOptions, type?: ModalType) => void;

    /** Closes the top modal without invoking its user-dismissal callback. */
    closeModal: () => void;

    /**
     * Requests that the user dismiss the top modal. The modal remains open while its callback
     * settles, and a false result or rejection vetoes removal.
     */
    requestCloseModal: () => Promise<boolean>;

    /** Closes a specific modal without invoking its user-dismissal callback. */
    closeModalById: (modalId: number) => void;

    /** Closes all modals */
    closeAllModals: () => void;
};

export const [useModalsContext, ModalsContextProvider] = createContext<ModalsContextValues>();
export const [useModalActionsContext, ModalActionsContextProvider] =
    createContext<ModalActionsContextValues>();

export const ModalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modals, setModals] = useFreezelessImmer<Modal[]>([]);
    const currentId = useRef(0);
    const modalsRef = useRef(modals);
    const pendingUserCloseIdsRef = useRef(new Set<number>());
    modalsRef.current = modals;

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
            const modalId = currentId.current;
            currentId.current += 1;

            setModals(oldModals => {
                oldModals.push({ component, type, options, open: true, id: modalId });
            });

            return modalId;
        },
        [setModals]
    );

    const replaceModal = useCallback(
        (component: ModalComponent, options?: ModalOptions, type?: ModalType) => {
            setModals(oldModals => {
                const currentModal = oldModals[oldModals.length - 1];

                if (currentModal) {
                    currentModal.component = component;
                    currentModal.options = options;
                    if (type) currentModal.type = type;
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
            pendingUserCloseIdsRef.current.delete(id);

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

    const closeModalById = useCallback(
        (modalId: number) => {
            setModals(_modals => {
                const modalToClose = _modals.find(modal => modal.id === modalId && modal.open);
                if (!modalToClose) return;

                modalToClose.open = false;
                pendingUserCloseIdsRef.current.delete(modalId);

                setTimeout(
                    () =>
                        setModals(oldModals => {
                            const modalIndex = oldModals.findIndex(modal => modal.id === modalId);
                            if (modalIndex === -1) return;

                            oldModals.splice(modalIndex, 1);
                        }),
                    300
                );
            });
        },
        [setModals]
    );

    const requestCloseModal = useCallback(async (): Promise<boolean> => {
        const modalToClose = modalsRef.current.findLast(modal => modal.open);
        if (!modalToClose || modalToClose.options?.disableCloseHandlers) return false;

        const { id, options } = modalToClose;
        if (pendingUserCloseIdsRef.current.has(id)) return false;

        pendingUserCloseIdsRef.current.add(id);

        let shouldClose = true;
        try {
            shouldClose = (await options?.onClose?.()) !== false;
        } catch {
            shouldClose = false;
        } finally {
            pendingUserCloseIdsRef.current.delete(id);
        }

        if (!shouldClose) return false;

        closeModalById(id);
        return true;
    }, [closeModalById]);

    const closeAllModals = useCallback(() => {
        pendingUserCloseIdsRef.current.clear();
        setModals(oldModals => oldModals.map(modal => ({ ...modal, open: false })));
        setTimeout(() => setModals([]), 300);
    }, [setModals]);

    return (
        <ModalsContextProvider value={{ modals }}>
            <ModalActionsContextProvider
                value={{
                    newModal,
                    replaceModal,
                    closeModal,
                    requestCloseModal,
                    closeModalById,
                    closeAllModals,
                }}
            >
                {children}
            </ModalActionsContextProvider>
        </ModalsContextProvider>
    );
};

export default ModalsProvider;
