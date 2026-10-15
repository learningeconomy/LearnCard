// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inAppMessageValidator, type InAppMessage } from '@learncard/types';
import { InAppMessageHost } from '../InAppMessageHost';
import { resetInAppMessageDismissals, shouldSuppressMessage } from '../dismissalStore';
import { getInAppMessageFatigueState, shouldSuppressByFatigue } from '../fatigueStore';
import { getRecentInAppMessageEvents, resetInAppMessageEventSession } from '../inAppMessageEvents';
import { setInAppMessageOverride } from '../debugOverrideStore';

const state = vi.hoisted(() => ({ gate: false, message: null as InAppMessage | null }));
const settings = { maxBlockingPerSession: 1, blockingCooldownHours: 48 };

vi.mock('../useInAppMessages', () => ({
    useInAppMessages: () => ({
        message:
            state.message &&
            !shouldSuppressMessage(
                state.message.id,
                state.message.frequency,
                Date.now(),
                'alice'
            ) &&
            !shouldSuppressByFatigue(state.message, settings, Date.now(), 'alice')
                ? state.message
                : null,
        credentialFacts: { accountDid: 'alice' },
    }),
}));
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
        state.message = inAppMessageValidator.parse({ id: 'test', title: 'Claim complete' });
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

    it('does not consume seen state or fatigue for a preview', () => {
        setInAppMessageOverride(state.message);
        render(<InAppMessageHost />);
        expect(screen.getByText('Claim complete')).toBeTruthy();
        expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(0);
        expect(shouldSuppressMessage('test', 'once', Date.now(), 'alice')).toBe(false);
    });
});
