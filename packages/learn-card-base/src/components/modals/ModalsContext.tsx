import React, { useRef, useEffect, useCallback } from 'react';
import { createContext } from '../../helpers/context.helpers';

import { useFreezelessImmer } from 'learn-card-base/hooks/useFreezelessImmer';

import { Modal, ModalComponent, ModalInstanceToken, ModalOptions, ModalType } from './types/Modals';

export type ModalsContextValues = {
    /** The Modal Stack */
    modals: Modal[];
};

export type ModalActionsContextValues = {
    /** Opens a new modal */
    newModal: (component: ModalComponent, type: ModalType, options?: ModalOptions) => number;

    /** Opens a new modal and returns the exact instance token for ownership-sensitive cleanup. */
    newModalWithToken: (
        component: ModalComponent,
        type: ModalType,
        options?: ModalOptions
    ) => ModalInstanceToken;

    /** Replaces the current modal */
    replaceModal: (component: ModalComponent, options?: ModalOptions, type?: ModalType) => void;

    /** Closes the top modal and invokes its legacy cleanup callback. */
    closeModal: () => void;

    /** Administratively closes the top modal without invoking its cleanup callback. */
    forceCloseModal: () => void;

    /**
     * Requests that the user dismiss the top modal. The modal remains open while its callback
     * settles, and a false result or rejection vetoes removal.
     */
    requestCloseModal: () => Promise<boolean>;

    /** Closes a specific modal and invokes its legacy cleanup callback. */
    closeModalById: (modalId: number) => void;

    /** Administratively closes a specific modal without invoking its cleanup callback. */
    forceCloseModalById: (modalId: number) => void;

    /** Administratively closes only the exact modal instance represented by the token. */
    forceCloseModalByToken: (token: ModalInstanceToken) => void;

    /** Closes all modals */
    closeAllModals: () => void;
};

export const [useModalsContext, ModalsContextProvider] = createContext<ModalsContextValues>();
export const [useModalActionsContext, ModalActionsContextProvider] =
    createContext<ModalActionsContextValues>();

const getModalInstanceKey = ({ id, generation }: ModalInstanceToken): string =>
    `${id}:${generation}`;

const clearPendingForModalId = (pendingInstances: Set<string>, modalId: number): void => {
    for (const instanceKey of pendingInstances) {
        if (instanceKey.startsWith(`${modalId}:`)) pendingInstances.delete(instanceKey);
    }
};

export const ModalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modals, setModals] = useFreezelessImmer<Modal[]>([]);
    const currentId = useRef(0);
    const modalsRef = useRef(modals);
    const pendingUserCloseInstancesRef = useRef(new Set<string>());
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

    const newModalWithToken = useCallback(
        (component: ModalComponent, type: ModalType, options?: ModalOptions) => {
            const token: ModalInstanceToken = { id: currentId.current, generation: 0 };
            currentId.current += 1;

            setModals(oldModals => {
                oldModals.push({
                    component,
                    type,
                    options,
                    open: true,
                    ...token,
                });
            });

            return token;
        },
        [setModals]
    );

    const newModal = useCallback(
        (component: ModalComponent, type: ModalType, options?: ModalOptions) =>
            newModalWithToken(component, type, options).id,
        [newModalWithToken]
    );

    const replaceModal = useCallback(
        (component: ModalComponent, options?: ModalOptions, type?: ModalType) => {
            setModals(oldModals => {
                const currentModal = oldModals.findLast(modal => modal.open);

                if (currentModal) {
                    pendingUserCloseInstancesRef.current.delete(getModalInstanceKey(currentModal));
                    currentModal.component = component;
                    currentModal.options = options;
                    currentModal.generation += 1;
                    if (type) currentModal.type = type;
                }
            });
        },
        [setModals]
    );

    const closeModalInstance = useCallback(
        (modalId: number, generation: number | undefined, invokeOnClose: boolean) => {
            setModals(_modals => {
                const modalToClose = _modals.find(
                    modal =>
                        modal.id === modalId &&
                        modal.open &&
                        (generation === undefined || modal.generation === generation)
                );
                if (!modalToClose) return;

                const closingGeneration = modalToClose.generation;
                modalToClose.open = false;
                clearPendingForModalId(pendingUserCloseInstancesRef.current, modalId);
                if (invokeOnClose) modalToClose.options?.onClose?.();

                setTimeout(
                    () =>
                        setModals(oldModals => {
                            const modalIndex = oldModals.findIndex(
                                modal =>
                                    modal.id === modalId && modal.generation === closingGeneration
                            );
                            if (modalIndex === -1) return;

                            oldModals.splice(modalIndex, 1);
                        }),
                    300
                );
            });
        },
        [setModals]
    );

    const closeModal = useCallback(() => {
        const modalToClose = modalsRef.current.findLast(modal => modal.open);
        if (!modalToClose) return;

        closeModalInstance(modalToClose.id, modalToClose.generation, true);
    }, [closeModalInstance]);

    const forceCloseModal = useCallback(() => {
        const modalToClose = modalsRef.current.findLast(modal => modal.open);
        if (!modalToClose) return;

        closeModalInstance(modalToClose.id, modalToClose.generation, false);
    }, [closeModalInstance]);

    const closeModalById = useCallback(
        (modalId: number) => closeModalInstance(modalId, undefined, true),
        [closeModalInstance]
    );

    const forceCloseModalById = useCallback(
        (modalId: number) => closeModalInstance(modalId, undefined, false),
        [closeModalInstance]
    );

    const forceCloseModalByToken = useCallback(
        ({ id, generation }: ModalInstanceToken) => closeModalInstance(id, generation, false),
        [closeModalInstance]
    );

    const requestCloseModal = useCallback(async (): Promise<boolean> => {
        const modalToClose = modalsRef.current.findLast(modal => modal.open);
        if (!modalToClose || modalToClose.options?.disableCloseHandlers) return false;

        const { id, generation, options } = modalToClose;
        const instanceKey = getModalInstanceKey(modalToClose);
        if (pendingUserCloseInstancesRef.current.has(instanceKey)) return false;

        pendingUserCloseInstancesRef.current.add(instanceKey);

        let shouldClose = true;
        try {
            shouldClose = (await options?.onClose?.()) !== false;
        } catch {
            shouldClose = false;
        } finally {
            pendingUserCloseInstancesRef.current.delete(instanceKey);
        }

        if (!shouldClose) return false;

        const currentModal = modalsRef.current.find(modal => modal.id === id && modal.open);
        if (!currentModal || currentModal.generation !== generation) return false;

        closeModalInstance(id, generation, false);
        return true;
    }, [closeModalInstance]);

    const closeAllModals = useCallback(() => {
        pendingUserCloseInstancesRef.current.clear();
        setModals(oldModals => oldModals.map(modal => ({ ...modal, open: false })));
        setTimeout(() => setModals([]), 300);
    }, [setModals]);

    return (
        <ModalsContextProvider value={{ modals }}>
            <ModalActionsContextProvider
                value={{
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
                }}
            >
                {children}
            </ModalActionsContextProvider>
        </ModalsContextProvider>
    );
};

export default ModalsProvider;
