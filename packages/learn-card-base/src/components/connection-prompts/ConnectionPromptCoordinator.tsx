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
    const activePromptIdRef = useRef<string | null>(null);
    const resolvedRef = useRef(false);
    const { data: pendingPrompts = [] } = usePendingConnectionPrompts(isLoggedIn);
    const connectPrompt = useConnectWithConnectionPromptMutation();
    const skipPrompt = useSkipConnectionPromptMutation();
    const { dismissToast } = useToast();
    const { modals } = useModalsContext();
    const { newModal, closeModal } = useModal({
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

        previousViewerKeyRef.current = viewerKey;
        activePromptIdRef.current = null;
        resolvedRef.current = false;
    }, [viewerKey]);

    useEffect(() => {
        if (!viewerKey || modals.length > 0 || !nextPrompt || activePromptIdRef.current) return;

        const timeout = setTimeout(() => {
            if (activePromptIdRef.current) return;

            activePromptIdRef.current = nextPrompt.promptId;
            resolvedRef.current = false;
            dismissToast();

            const handleConnect = async (promptId: string): Promise<void> => {
                await connectPrompt.mutateAsync(promptId);
                resolvedRef.current = true;
                closeModal();
            };

            const handleSkip = async (promptId: string): Promise<void> => {
                await skipPrompt.mutateAsync(promptId);
                resolvedRef.current = true;
                closeModal();
            };

            const handleClose = (): void => {
                if (activePromptIdRef.current !== nextPrompt.promptId) return;

                activePromptIdRef.current = null;
                if (resolvedRef.current) return;

                resolvedRef.current = true;
                void skipPrompt.mutateAsync(nextPrompt.promptId);
            };

            newModal(
                <ConnectionPromptModal
                    prompt={nextPrompt}
                    copy={copy}
                    onConnect={handleConnect}
                    onSkip={handleSkip}
                />,
                { hideButton: false, onClose: handleClose }
            );
        }, PRESENTATION_DELAY_MS);

        return () => clearTimeout(timeout);
    }, [
        closeModal,
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
