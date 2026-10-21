import React, { type ReactElement, type ReactNode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiSessionTopicsContainer from './AiSessionTopicsContainer';

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeAllModals: vi.fn(),
    setChatBotSelected: vi.fn(),
    resetStore: vi.fn(),
    clearNewCreds: vi.fn(),
    replace: vi.fn(),
    chatBotSelected: 'newTopic' as string | null,
    topicsLoading: false,
    existingTopics: [] as { uri: string }[],
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ replace: mocks.replace }),
    useLocation: () => ({ search: '' }),
}));

vi.mock('../../paraglide/messages.js', () => ({ m: {} }));

vi.mock('../../hooks/useAiSession', () => ({
    default: () => ({ openNewAiSessionModal: vi.fn() }),
}));

vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { set: { clearNewCreds: mocks.clearNewCreds } },
}));

vi.mock('learn-card-base/hooks/useDeviceTypeByWidth', () => ({
    useDeviceTypeByWidth: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { Right: 'right' },
    useGetCredentialList: () => ({
        data: { pages: [{ records: mocks.existingTopics }] },
        isLoading: mocks.topicsLoading,
    }),
    useModal: () => ({
        newModal: mocks.newModal,
        closeAllModals: mocks.closeAllModals,
    }),
}));

vi.mock('../ai-feature-gate/AiFeatureGate', () => ({
    AiFeatureGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../../pages/ai-sessions/AiSessionsPage', () => ({
    default: () => <div>AI Sessions</div>,
}));

vi.mock('../new-ai-session/NewAiSessionContainer', () => ({
    default: () => <div>New AI Session</div>,
}));

vi.mock('../../stores/chatBotStore', () => ({
    chatBotStore: {
        useTracked: { chatBotSelected: () => mocks.chatBotSelected },
        set: {
            setChatBotSelected: (step: string | null) => {
                mocks.setChatBotSelected(step);
                mocks.chatBotSelected = step;
            },
            resetStore: mocks.resetStore,
        },
    },
}));

describe('AiSessionTopicsContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.chatBotSelected = 'newTopic';
        mocks.topicsLoading = false;
        mocks.existingTopics = [];
    });

    it('opens a selected AI chat on desktop', async () => {
        render(<AiSessionTopicsContainer />);

        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));
    });

    it('waits for existing topics before opening the modal', async () => {
        mocks.topicsLoading = true;
        const { rerender } = render(<AiSessionTopicsContainer />);

        expect(mocks.newModal).not.toHaveBeenCalled();

        mocks.existingTopics = [{ uri: 'urn:topic:existing' }];
        mocks.topicsLoading = false;
        rerender(<AiSessionTopicsContainer />);

        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));

        const modal = mocks.newModal.mock.calls[0]?.[0] as ReactElement<{
            existingTopics: { uri: string }[];
        }>;
        expect(modal.props.existingTopics).toEqual(mocks.existingTopics);
    });

    it('closes the modal when starting over', async () => {
        render(<AiSessionTopicsContainer />);

        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));

        const modal = mocks.newModal.mock.calls[0]?.[0] as ReactElement<{
            handleStartOver: () => void;
        }>;
        act(() => modal.props.handleStartOver());

        expect(mocks.closeAllModals).toHaveBeenCalledTimes(1);
        expect(mocks.resetStore).toHaveBeenCalledTimes(1);
        expect(mocks.setChatBotSelected).toHaveBeenCalledWith(null);
    });

    it('can reopen after the modal is dismissed', async () => {
        const { rerender } = render(<AiSessionTopicsContainer />);

        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));

        const { onClose } = mocks.newModal.mock.calls[0]?.[1] as {
            onClose?: () => void;
        };

        expect(onClose).toBeTypeOf('function');
        act(() => onClose?.());
        rerender(<AiSessionTopicsContainer />);

        expect(mocks.resetStore).not.toHaveBeenCalled();
        expect(mocks.setChatBotSelected).toHaveBeenCalledWith(null);

        mocks.chatBotSelected = 'newTopic';
        rerender(<AiSessionTopicsContainer />);

        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(2));
    });
});
