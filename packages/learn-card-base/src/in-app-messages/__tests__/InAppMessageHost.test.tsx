// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inAppMessageValidator, type InAppMessage } from '@learncard/types';
import { InAppMessageHost } from '../InAppMessageHost';
import { resetInAppMessageDismissals, shouldSuppressMessage } from '../dismissalStore';
import { getInAppMessageFatigueState } from '../fatigueStore';
import { getRecentInAppMessageEvents, resetInAppMessageEventSession } from '../inAppMessageEvents';
import { setInAppMessageOverride } from '../debugOverrideStore';

const state = vi.hoisted(() => ({
    gate: false,
    messages: [] as InAppMessage[],
    accountDid: 'alice' as string | null,
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({ inAppMessages: { messages: state.messages } }),
}));
vi.mock('../useRuntimeContext', () => ({
    useInAppMessageRuntimeContext: () => ({
        ready: true,
        context: { platform: 'web', role: 'learner', versions: {}, now: Date.now() },
    }),
}));
vi.mock('../useCredentialFacts', () => ({
    useCredentialFacts: () => ({
        accountDid: state.accountDid,
        summaries: [],
        complete: true,
        total: 0,
        readsUsed: 0,
        backfillNow: vi.fn(),
        clearFacts: vi.fn(),
    }),
}));
vi.mock('../debug', () => ({ isInAppMessagesDebug: () => false, iamDebug: vi.fn() }));
vi.mock('../usePresentationGate', () => ({
    useInAppMessagePresentationGate: () => ({
        canPresent: state.gate,
        reason: state.gate ? 'ok' : 'suppressed-route',
    }),
}));
vi.mock('../debugGlobals', () => ({ installInAppMessagesDebugGlobals: () => undefined }));
vi.mock('../InAppMessageModal', () => ({
    InAppMessageModal: ({ message, onClose }: { message: InAppMessage; onClose: () => void }) => (
        <button onClick={onClose}>{message.title}</button>
    ),
}));
vi.mock('../InAppMessageBanner', () => ({ InAppMessageBanner: () => null }));
vi.mock('../InAppMessageToast', () => ({ InAppMessageToast: () => null }));
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('message host impressions', () => {
    beforeEach(() => {
        localStorage.clear();
        resetInAppMessageDismissals();
        resetInAppMessageEventSession();
        state.gate = false;
        state.accountDid = 'alice';
        state.messages = [inAppMessageValidator.parse({ id: 'test', title: 'Claim complete' })];
    });
    afterEach(() => {
        cleanup();
        setInAppMessageOverride(null);
    });

    it('waits for the gate, records one impression, and retains the visible message despite its own cap', async () => {
        const { rerender } = render(<InAppMessageHost />);
        expect(screen.queryByText('Claim complete')).toBeNull();
        expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(0);
        state.gate = true;
        rerender(<InAppMessageHost />);
        await waitFor(() =>
            expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(1)
        );
        rerender(<InAppMessageHost />);
        expect(screen.getByText('Claim complete')).toBeTruthy();
        expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(1);
        expect(
            getRecentInAppMessageEvents('alice').filter(event => event.event === 'app.opened')
        ).toHaveLength(1);
        fireEvent.click(screen.getByText('Claim complete'));
        expect(screen.queryByText('Claim complete')).toBeNull();
    });

    it('evaluates the opening event before selecting or recording the first impression per account', async () => {
        state.messages = [
            inAppMessageValidator.parse({ id: 'fallback', title: 'Fallback', priority: 0 }),
            inAppMessageValidator.parse({
                id: 'opening',
                title: 'Welcome',
                priority: 100,
                trigger: { event: 'app.opened' },
            }),
        ];
        const { rerender } = render(<InAppMessageHost />);
        expect(getRecentInAppMessageEvents('alice')).toHaveLength(0);
        state.gate = true;
        rerender(<InAppMessageHost />);
        await waitFor(() => expect(screen.getByText('Welcome')).toBeTruthy());
        expect(screen.queryByText('Fallback')).toBeNull();
        expect(shouldSuppressMessage('fallback', 'once', Date.now(), 'alice')).toBe(false);
        expect(shouldSuppressMessage('opening', 'once', Date.now(), 'alice')).toBe(true);
        expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(1);

        state.accountDid = 'bob';
        rerender(<InAppMessageHost />);
        await waitFor(() => expect(screen.getByText('Welcome')).toBeTruthy());
        expect(shouldSuppressMessage('fallback', 'once', Date.now(), 'bob')).toBe(false);
        expect(shouldSuppressMessage('opening', 'once', Date.now(), 'bob')).toBe(true);
        expect(getInAppMessageFatigueState('bob').blockingShownThisSession).toBe(1);
    });

    it.each(['bob', null])(
        'waits for account events after a gated transition through %s',
        async otherAccount => {
            state.gate = true;
            state.messages = [
                inAppMessageValidator.parse({ id: 'fallback', title: 'Fallback' }),
                inAppMessageValidator.parse({
                    id: 'opening',
                    title: 'Welcome',
                    priority: 100,
                    frequency: 'always',
                    bypassFatigue: true,
                    trigger: { event: 'app.opened' },
                }),
            ];
            const { rerender } = render(<InAppMessageHost />);
            await waitFor(() => expect(screen.getByText('Welcome')).toBeTruthy());
            state.gate = false;
            state.accountDid = otherAccount;
            rerender(<InAppMessageHost />);
            if (otherAccount === null) act(() => resetInAppMessageEventSession());
            state.gate = true;
            state.accountDid = 'alice';
            rerender(<InAppMessageHost />);
            await waitFor(() => expect(screen.getByText('Welcome')).toBeTruthy());
            expect(shouldSuppressMessage('fallback', 'once', Date.now(), 'alice')).toBe(false);
            expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(0);
        }
    );

    it.each(['disabled', 'removed'])(
        'withdraws a retained required modal when its live campaign is %s',
        async change => {
            state.gate = true;
            const required = inAppMessageValidator.parse({
                id: 'required',
                title: 'Required action',
                dismissible: false,
            });
            state.messages = [required];
            const { rerender } = render(<InAppMessageHost />);
            await waitFor(() => expect(screen.getByText('Required action')).toBeTruthy());
            expect(shouldSuppressMessage('required', 'once', Date.now(), 'alice')).toBe(true);
            rerender(<InAppMessageHost />);
            await waitFor(() => expect(screen.getByText('Required action')).toBeTruthy());

            state.messages = change === 'disabled' ? [{ ...required, enabled: false }] : [];
            rerender(<InAppMessageHost />);
            expect(screen.queryByText('Required action')).toBeNull();
            state.messages = [required];
            rerender(<InAppMessageHost />);
            expect(screen.queryByText('Required action')).toBeNull();
        }
    );

    it('does not consume seen state or fatigue for a preview', () => {
        setInAppMessageOverride(state.messages[0]!);
        render(<InAppMessageHost />);
        expect(screen.getByText('Claim complete')).toBeTruthy();
        expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(0);
        expect(shouldSuppressMessage('test', 'once', Date.now(), 'alice')).toBe(false);
    });
});
