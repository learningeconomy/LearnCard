import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AssistantAgentChatModal from './AssistantAgentChatModal';
import { DEFAULT_ASSISTANT_AVATAR_CONFIG } from './assistantAvatarOptions';
import {
    runLearnCardAssistantAgent,
    type LearnCardAssistantAgentRunResponse,
} from './learnCardAssistant.api';

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('./AssistantAvatar', () => ({ default: () => null }));
vi.mock('./learnCardAssistant.api', () => ({ runLearnCardAssistantAgent: vi.fn() }));

const response = (content: string): LearnCardAssistantAgentRunResponse => ({
    runId: 'synthetic-run',
    message: content,
    messages: [{ role: 'assistant', content }],
});

const props = {
    agentUrl: 'http://agent.test',
    avatarConfig: DEFAULT_ASSISTANT_AVATAR_CONFIG,
    auth: { did: 'did:key:learner', getHeaders: vi.fn() },
    consentFlowContractUri: 'urn:contract:first',
    open: true,
    title: 'My Assistant',
    onClose: vi.fn(),
};

const send = (content: string) => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: content } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
};

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        value: vi.fn(),
    });
});

afterEach(cleanup);

describe('assistant chat request ownership', () => {
    it.each(['success', 'error'] as const)(
        'ignores an old %s and finally handler after reopening and sending again',
        async outcome => {
            const oldRequest = Promise.withResolvers<LearnCardAssistantAgentRunResponse>();
            const newRequest = Promise.withResolvers<LearnCardAssistantAgentRunResponse>();
            vi.mocked(runLearnCardAssistantAgent)
                .mockReturnValueOnce(oldRequest.promise)
                .mockReturnValueOnce(newRequest.promise);
            const view = render(<AssistantAgentChatModal {...props} />);
            send('Old question');
            const oldSignal = vi.mocked(runLearnCardAssistantAgent).mock.calls[0]?.[4];

            fireEvent.click(screen.getByRole('button', { name: 'Close assistant chat' }));
            expect(oldSignal?.aborted).toBe(true);
            view.rerender(<AssistantAgentChatModal {...props} open={false} />);
            view.rerender(<AssistantAgentChatModal {...props} />);
            expect(screen.getByRole('textbox')).toBeEnabled();
            expect(screen.queryByText('Old question')).not.toBeInTheDocument();
            send('New question');

            await act(async () => {
                if (outcome === 'success') oldRequest.resolve(response('Stale answer'));
                else oldRequest.reject(new Error('Stale failure'));
            });
            expect(screen.getByText('New question')).toBeInTheDocument();
            expect(screen.queryByText('Stale answer')).not.toBeInTheDocument();
            expect(screen.queryByText('Stale failure')).not.toBeInTheDocument();
            expect(screen.getByRole('textbox')).toBeDisabled();
            expect(screen.getByText('Assistant is thinking...')).toBeInTheDocument();

            await act(async () => newRequest.resolve(response('Current answer')));
            expect(screen.getByText('Current answer')).toBeInTheDocument();
            expect(screen.getByRole('textbox')).toBeEnabled();
        }
    );

    it.each([
        { agentUrl: 'http://other-agent.test' },
        { auth: { did: 'did:key:other', getHeaders: vi.fn() } },
        { consentFlowContractUri: 'urn:contract:other' },
    ])('resets and invalidates a request when context changes: %j', async context => {
        const pending = Promise.withResolvers<LearnCardAssistantAgentRunResponse>();
        vi.mocked(runLearnCardAssistantAgent).mockReturnValueOnce(pending.promise);
        const view = render(<AssistantAgentChatModal {...props} />);
        send('Old context question');
        const signal = vi.mocked(runLearnCardAssistantAgent).mock.calls[0]?.[4];

        view.rerender(<AssistantAgentChatModal {...props} {...context} />);
        expect(signal?.aborted).toBe(true);
        expect(screen.getByRole('textbox')).toBeEnabled();
        await act(async () => pending.resolve(response('Wrong context answer')));
        expect(screen.queryByText('Wrong context answer')).not.toBeInTheDocument();
        expect(screen.queryByText('Old context question')).not.toBeInTheDocument();
    });

    it('aborts its pending request on unmount', async () => {
        const pending = Promise.withResolvers<LearnCardAssistantAgentRunResponse>();
        vi.mocked(runLearnCardAssistantAgent).mockReturnValueOnce(pending.promise);
        const view = render(<AssistantAgentChatModal {...props} />);
        send('Pending question');
        const signal = vi.mocked(runLearnCardAssistantAgent).mock.calls[0]?.[4];

        view.unmount();
        expect(signal?.aborted).toBe(true);
        await act(async () => pending.reject(new Error('Late failure')));
    });
});
