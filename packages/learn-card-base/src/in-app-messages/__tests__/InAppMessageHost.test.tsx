// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inAppMessageValidator, type InAppMessage } from '@learncard/types';
import { InAppMessageHost } from '../InAppMessageHost';
import {
    getMessageLastSeen,
    resetInAppMessageDismissals,
    shouldSuppressMessage,
} from '../dismissalStore';
import { iamDebug } from '../debug';
import { getInAppMessageFatigueState } from '../fatigueStore';
import { getRecentInAppMessageEvents, resetInAppMessageEventSession } from '../inAppMessageEvents';
import { setInAppMessageOverride } from '../debugOverrideStore';
import type { MessagePresentationProps, InAppMessagePresentationEvent } from '../presentationTypes';
import { I18nProvider } from '../../i18n';

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
    InAppMessageModal: ({ message, onClose, onAction }: MessagePresentationProps) => (
        <>
            <button onClick={() => onClose('dismissed')}>{message.title}</button>
            <button
                onClick={() => {
                    onAction?.({ actionIndex: 0, actionType: 'internalLink' });
                    onClose('action');
                }}
            >
                Navigate
            </button>
        </>
    ),
}));
vi.mock('../InAppMessageBanner', () => ({ InAppMessageBanner: () => null }));
vi.mock('../useInAppMessageActions', () => ({
    useInAppMessageActions: () => ({ runAction: vi.fn().mockResolvedValue('closed') }),
}));
vi.mock('framer-motion', async importOriginal => {
    const original = await importOriginal<typeof import('framer-motion')>();
    return {
        ...original,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useReducedMotion: () => true,
    };
});

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
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it.each([false, true])(
        'only emits toast dismissal for a user tap (tapped: %s)',
        async tapped => {
            vi.useFakeTimers();
            state.gate = true;
            state.messages = [
                inAppMessageValidator.parse({
                    id: 'toast-event',
                    title: 'Saved',
                    presentation: 'toast',
                }),
            ];
            const onEvent = vi.fn();
            await act(async () => {
                render(<InAppMessageHost onEvent={onEvent} />);
            });
            const toast = screen.getByRole('button', { name: 'Saved' });
            if (tapped) fireEvent.click(toast);
            await act(async () => vi.advanceTimersByTimeAsync(5000));
            expect(screen.queryByRole('button', { name: 'Saved' })).toBeNull();
            expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual(
                tapped ? ['shown', 'dismissed'] : ['shown']
            );
        }
    );

    it('records seen and fatigue before shown, localizes live, and emits no dismissal for navigation', async () => {
        state.gate = true;
        state.messages = [
            inAppMessageValidator.parse({
                id: 'localized',
                title: 'Hello',
                locales: { es: { title: 'Hola' } },
            }),
        ];
        const impressions: Array<{ seen: boolean; count: number }> = [];
        const onEvent = vi.fn((event: InAppMessagePresentationEvent) => {
            if (event.type === 'shown') {
                impressions.push({
                    seen: shouldSuppressMessage('localized', 'once', Date.now(), 'alice'),
                    count: getInAppMessageFatigueState('alice').blockingShownThisSession,
                });
            }
        });
        const view = render(
            <I18nProvider locale="en" resolve={() => undefined}>
                <InAppMessageHost onEvent={onEvent} />
            </I18nProvider>
        );
        await screen.findByText('Hello');
        await waitFor(() => expect(impressions).toEqual([{ seen: true, count: 1 }]));
        view.rerender(
            <I18nProvider locale="es" resolve={() => undefined}>
                <InAppMessageHost onEvent={onEvent} />
            </I18nProvider>
        );
        expect(screen.getByText('Hola')).toBeTruthy();
        expect(onEvent.mock.calls.filter(([event]) => event.type === 'shown')).toHaveLength(1);
        fireEvent.click(screen.getByText('Navigate'));
        expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual(['shown', 'action']);
        expect(onEvent).toHaveBeenLastCalledWith({
            type: 'action',
            messageId: 'localized',
            presentation: 'modal',
            source: 'flag',
            actionIndex: 0,
            actionType: 'internalLink',
        });
    });

    it('reports override dismissal without writing impression state', async () => {
        const onEvent = vi.fn();
        act(() =>
            setInAppMessageOverride(
                inAppMessageValidator.parse({ id: 'preview-event', title: 'Preview event' })
            )
        );
        render(<InAppMessageHost onEvent={onEvent} />);
        fireEvent.click(await screen.findByText('Preview event'));
        expect(onEvent.mock.calls.map(([event]) => [event.type, event.source])).toEqual([
            ['shown', 'override'],
            ['dismissed', 'override'],
        ]);
        expect(getInAppMessageFatigueState('alice').blockingShownThisSession).toBe(0);
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

    it.each(['test', 'preview'])(
        'preserves a retained campaign impression across repeated previews with id %s',
        async previewId => {
            const firstShown = Date.parse('2026-10-20T12:00:00Z');
            const now = vi.spyOn(Date, 'now').mockReturnValue(firstShown);
            vi.mocked(iamDebug).mockClear();
            state.gate = true;
            render(<InAppMessageHost />);
            await waitFor(() => expect(screen.getByText('Claim complete')).toBeTruthy());
            const fatigue = getInAppMessageFatigueState('alice');
            expect(fatigue).toEqual({
                blockingShownThisSession: 1,
                lastBlockingShown: new Date(firstShown).toISOString(),
            });
            const preview = inAppMessageValidator.parse({ id: previewId, title: 'Preview' });

            for (const offset of [1000, 2000]) {
                now.mockReturnValue(firstShown + offset);
                act(() => setInAppMessageOverride(preview));
                expect(screen.getByText('Preview')).toBeTruthy();
                expect(screen.queryByText('Claim complete')).toBeNull();
                expect(getInAppMessageFatigueState('alice')).toEqual(fatigue);
                fireEvent.click(screen.getByText('Preview'));
                expect(screen.getByText('Claim complete')).toBeTruthy();
                expect(getInAppMessageFatigueState('alice')).toEqual(fatigue);
                expect(getMessageLastSeen('test', 'alice')).toBe(
                    new Date(firstShown).toISOString()
                );
            }

            const impressions = vi
                .mocked(iamDebug)
                .mock.calls.filter(([event]) => event === 'shown');
            expect(impressions).toEqual([
                ['shown', expect.objectContaining({ override: false })],
                ['shown', expect.objectContaining({ override: true })],
                ['shown', expect.objectContaining({ override: true })],
            ]);
            fireEvent.click(screen.getByText('Claim complete'));
            expect(screen.queryByText('Claim complete')).toBeNull();
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
