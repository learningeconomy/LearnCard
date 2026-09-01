import React, { useEffect, useRef } from 'react';

import { useToast } from '../../hooks/useToast';
import {
    useConnectWithConnectionPromptMutation,
    usePendingConnectionPrompts,
    useSkipConnectionPromptMutation,
} from '../../react-query/connectionPrompts';
import { useIsLoggedIn } from '../../stores/currentUserStore';
import { switchedProfileStore } from '../../stores/walletStore';
import { useModalsContext } from '../modals/ModalsContext';
import { ModalTypes, type ModalInstanceToken } from '../modals/types/Modals';
import { useModal } from '../modals/useModal';
import ConnectionPromptModal, {
    type ConnectionPromptCopy,
    type ConnectionPromptModalActions,
} from './ConnectionPromptModal';

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
    const copyRef = useRef(copy);
    copyRef.current = copy;
    const previousViewerKeyRef = useRef(viewerKey);
    const currentViewerKeyRef = useRef(viewerKey);
    currentViewerKeyRef.current = viewerKey;
    const activePromptIdRef = useRef<string | null>(null);
    const resolvedPromptIdsRef = useRef(new Set<string>());
    const ownedModalTokenRef = useRef<ModalInstanceToken | null>(null);
    const resolvedRef = useRef(false);
    const actionInFlightRef = useRef(false);
    const {
        data: pendingPromptsData,
        isSuccess: pendingPromptsQueryIsSuccess,
        isFetching: pendingPromptsQueryIsFetching,
    } = usePendingConnectionPrompts(isLoggedIn);
    const pendingPrompts = pendingPromptsData ?? [];
    const { mutateAsync: connectPrompt } = useConnectWithConnectionPromptMutation();
    const { mutateAsync: skipPrompt } = useSkipConnectionPromptMutation();
    const { dismissToast } = useToast();
    const { modals } = useModalsContext();
    const { newModalWithToken, forceCloseModalByToken } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const nextPrompt = [...pendingPrompts]
        .filter(
            prompt =>
                prompt.surface === 'POST_CLAIM' &&
                !resolvedPromptIdsRef.current.has(prompt.promptId)
        )
        .sort(
            (left, right) =>
                left.triggeredAt.localeCompare(right.triggeredAt) ||
                left.promptId.localeCompare(right.promptId)
        )[0];

    useEffect(() => {
        if (previousViewerKeyRef.current === viewerKey) return;

        const ownedModalToken = ownedModalTokenRef.current;
        previousViewerKeyRef.current = viewerKey;
        activePromptIdRef.current = null;
        resolvedPromptIdsRef.current.clear();
        ownedModalTokenRef.current = null;
        resolvedRef.current = true;
        actionInFlightRef.current = false;

        if (ownedModalToken !== null) forceCloseModalByToken(ownedModalToken);
    }, [forceCloseModalByToken, viewerKey]);

    useEffect(() => {
        const ownedModalToken = ownedModalTokenRef.current;
        if (
            ownedModalToken === null ||
            modals.some(
                modal =>
                    modal.id === ownedModalToken.id &&
                    modal.generation === ownedModalToken.generation &&
                    modal.open
            )
        ) {
            return;
        }

        ownedModalTokenRef.current = null;
        activePromptIdRef.current = null;
        resolvedRef.current = true;
        actionInFlightRef.current = false;
    }, [modals]);

    useEffect(() => {
        const activePromptId = activePromptIdRef.current;
        const ownedModalToken = ownedModalTokenRef.current;

        if (
            pendingPromptsData === undefined ||
            !pendingPromptsQueryIsSuccess ||
            pendingPromptsQueryIsFetching ||
            activePromptId === null ||
            ownedModalToken === null ||
            actionInFlightRef.current ||
            pendingPromptsData.some(prompt => prompt.promptId === activePromptId)
        ) {
            return;
        }

        resolvedPromptIdsRef.current.add(activePromptId);
        resolvedRef.current = true;
        forceCloseModalByToken(ownedModalToken);
    }, [
        forceCloseModalByToken,
        pendingPromptsData,
        pendingPromptsQueryIsFetching,
        pendingPromptsQueryIsSuccess,
    ]);

    useEffect(() => {
        if (
            !viewerKey ||
            modals.length > 0 ||
            !nextPrompt ||
            activePromptIdRef.current ||
            resolvedPromptIdsRef.current.has(nextPrompt.promptId)
        ) {
            return;
        }

        const timeout = setTimeout(() => {
            if (
                activePromptIdRef.current ||
                resolvedPromptIdsRef.current.has(nextPrompt.promptId)
            ) {
                return;
            }

            activePromptIdRef.current = nextPrompt.promptId;
            resolvedRef.current = false;
            actionInFlightRef.current = false;
            dismissToast();

            const promptViewerKey = viewerKey;
            let modalToken: ModalInstanceToken | null = null;
            const promptModalActionsRef: React.MutableRefObject<ConnectionPromptModalActions | null> =
                { current: null };
            const ownsPromptModal = (): boolean =>
                modalToken !== null &&
                currentViewerKeyRef.current === promptViewerKey &&
                activePromptIdRef.current === nextPrompt.promptId &&
                ownedModalTokenRef.current?.id === modalToken?.id &&
                ownedModalTokenRef.current?.generation === modalToken?.generation;

            const handleConnect = async (promptId: string): Promise<void> => {
                if (!ownsPromptModal() || actionInFlightRef.current) return;

                actionInFlightRef.current = true;
                try {
                    await connectPrompt(promptId);
                } catch (error) {
                    if (ownsPromptModal()) actionInFlightRef.current = false;
                    throw error;
                }

                if (!ownsPromptModal()) return;

                resolvedPromptIdsRef.current.add(promptId);
                resolvedRef.current = true;
                actionInFlightRef.current = false;
                if (modalToken !== null) forceCloseModalByToken(modalToken);
            };

            const handleSkip = async (promptId: string): Promise<void> => {
                if (!ownsPromptModal() || actionInFlightRef.current) return;

                actionInFlightRef.current = true;
                try {
                    await skipPrompt(promptId);
                } catch (error) {
                    if (ownsPromptModal()) actionInFlightRef.current = false;
                    throw error;
                }

                if (!ownsPromptModal()) return;

                resolvedPromptIdsRef.current.add(promptId);
                resolvedRef.current = true;
                actionInFlightRef.current = false;
                if (modalToken !== null) forceCloseModalByToken(modalToken);
            };

            const handleClose = (): boolean => {
                if (!ownsPromptModal()) return true;
                if (actionInFlightRef.current && !resolvedRef.current) return false;

                if (!resolvedRef.current) {
                    promptModalActionsRef.current?.requestSkip();
                    return false;
                }

                activePromptIdRef.current = null;
                ownedModalTokenRef.current = null;

                return true;
            };

            modalToken = newModalWithToken(
                <ConnectionPromptModal
                    prompt={nextPrompt}
                    copy={copyRef.current}
                    onConnect={handleConnect}
                    onSkip={handleSkip}
                    actionsRef={promptModalActionsRef}
                />,
                { hideButton: false, onClose: handleClose }
            );
            ownedModalTokenRef.current = modalToken;
        }, PRESENTATION_DELAY_MS);

        return () => clearTimeout(timeout);
    }, [
        connectPrompt,
        dismissToast,
        forceCloseModalByToken,
        modals.length,
        newModalWithToken,
        nextPrompt,
        skipPrompt,
        viewerKey,
    ]);

    return null;
};

export default ConnectionPromptCoordinator;
