import React, { useEffect, useMemo, useRef } from 'react';

import { useToast } from '../../hooks/useToast';
import {
    useConnectWithConnectionPromptMutation,
    usePendingConnectionPrompts,
    useSkipConnectionPromptMutation,
} from '../../react-query/connectionPrompts';
import { useIsLoggedIn } from '../../stores/currentUserStore';
import { switchedProfileStore } from '../../stores/walletStore';
import { useModalsContext } from '../modals/ModalsContext';
import { ModalTypes } from '../modals/types/Modals';
import { useModal } from '../modals/useModal';
import ConnectionPromptModal, { type ConnectionPromptCopy } from './ConnectionPromptModal';

export type ConnectionPromptCoordinatorProps = {
    copy: ConnectionPromptCopy;
};

const PRESENTATION_DELAY_MS = 150;

export const ConnectionPromptCoordinator: React.FC<ConnectionPromptCoordinatorProps> = ({
    copy,
}) => {
    const isLoggedIn = useIsLoggedIn();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const viewerKey = isLoggedIn ? switchedDid ?? 'primary-profile' : null;
    const previousViewerKeyRef = useRef(viewerKey);
    const currentViewerKeyRef = useRef(viewerKey);
    currentViewerKeyRef.current = viewerKey;
    const activePromptIdRef = useRef<string | null>(null);
    const ownedModalIdRef = useRef<number | null>(null);
    const resolvedRef = useRef(false);
    const actionInFlightRef = useRef(false);
    const { data: pendingPrompts = [] } = usePendingConnectionPrompts(isLoggedIn);
    const connectPrompt = useConnectWithConnectionPromptMutation();
    const skipPrompt = useSkipConnectionPromptMutation();
    const { dismissToast } = useToast();
    const { modals } = useModalsContext();
    const { newModal, closeModalById } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const nextPrompt = useMemo(
        () =>
            [...pendingPrompts]
                .filter(prompt => prompt.surface === 'POST_CLAIM')
                .sort((left, right) => left.triggeredAt.localeCompare(right.triggeredAt))[0],
        [pendingPrompts]
    );

    useEffect(() => {
        if (previousViewerKeyRef.current === viewerKey) return;

        const ownedModalId = ownedModalIdRef.current;
        previousViewerKeyRef.current = viewerKey;
        activePromptIdRef.current = null;
        ownedModalIdRef.current = null;
        resolvedRef.current = true;
        actionInFlightRef.current = false;

        if (ownedModalId !== null) closeModalById(ownedModalId);
    }, [closeModalById, viewerKey]);

    useEffect(() => {
        const ownedModalId = ownedModalIdRef.current;
        if (
            ownedModalId === null ||
            modals.some(modal => modal.id === ownedModalId && modal.open)
        ) {
            return;
        }

        const promptId = activePromptIdRef.current;
        ownedModalIdRef.current = null;
        activePromptIdRef.current = null;

        if (!promptId || resolvedRef.current || actionInFlightRef.current) return;

        resolvedRef.current = true;
        void skipPrompt.mutateAsync(promptId);
    }, [modals, skipPrompt]);

    useEffect(() => {
        if (!viewerKey || modals.length > 0 || !nextPrompt || activePromptIdRef.current) return;

        const timeout = setTimeout(() => {
            if (activePromptIdRef.current) return;

            activePromptIdRef.current = nextPrompt.promptId;
            resolvedRef.current = false;
            actionInFlightRef.current = false;
            dismissToast();

            const promptViewerKey = viewerKey;
            let modalId: number | null = null;
            const ownsPromptModal = (): boolean =>
                currentViewerKeyRef.current === promptViewerKey &&
                activePromptIdRef.current === nextPrompt.promptId &&
                ownedModalIdRef.current === modalId;

            const handleConnect = async (promptId: string): Promise<void> => {
                if (!ownsPromptModal() || actionInFlightRef.current) return;

                actionInFlightRef.current = true;
                try {
                    await connectPrompt.mutateAsync(promptId);
                } catch (error) {
                    if (ownsPromptModal()) actionInFlightRef.current = false;
                    throw error;
                }

                if (!ownsPromptModal()) return;

                resolvedRef.current = true;
                actionInFlightRef.current = false;
                if (modalId !== null) closeModalById(modalId);
            };

            const handleSkip = async (promptId: string): Promise<void> => {
                if (!ownsPromptModal() || actionInFlightRef.current) return;

                actionInFlightRef.current = true;
                try {
                    await skipPrompt.mutateAsync(promptId);
                } catch (error) {
                    if (ownsPromptModal()) actionInFlightRef.current = false;
                    throw error;
                }

                if (!ownsPromptModal()) return;

                resolvedRef.current = true;
                actionInFlightRef.current = false;
                if (modalId !== null) closeModalById(modalId);
            };

            const handleClose = (): boolean => {
                if (!ownsPromptModal()) return true;
                if (actionInFlightRef.current && !resolvedRef.current) return false;

                activePromptIdRef.current = null;
                ownedModalIdRef.current = null;
                if (resolvedRef.current) return true;

                resolvedRef.current = true;
                void skipPrompt.mutateAsync(nextPrompt.promptId);

                return true;
            };

            modalId = newModal(
                <ConnectionPromptModal
                    prompt={nextPrompt}
                    copy={copy}
                    onConnect={handleConnect}
                    onSkip={handleSkip}
                />,
                { hideButton: false, onClose: handleClose }
            );
            ownedModalIdRef.current = modalId;
        }, PRESENTATION_DELAY_MS);

        return () => clearTimeout(timeout);
    }, [
        closeModalById,
        connectPrompt,
        copy,
        dismissToast,
        modals.length,
        newModal,
        nextPrompt,
        skipPrompt,
        viewerKey,
    ]);

    return null;
};

export default ConnectionPromptCoordinator;
