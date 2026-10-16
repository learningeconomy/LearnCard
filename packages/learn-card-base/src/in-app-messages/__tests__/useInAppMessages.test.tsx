// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import type { CredentialFactsState } from '../useCredentialFacts';
import { useInAppMessages } from '../useInAppMessages';
import { emitInAppMessageEvent, resetInAppMessageEventSession } from '../inAppMessageEvents';
import { resetInAppMessageDismissals } from '../dismissalStore';
import { summarizeCredential } from '../credentialFacts';

const state = vi.hoisted(() => ({
    flags: {} as Record<string, unknown>,
    facts: {} as CredentialFactsState,
    factsRequired: false,
}));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => state.flags }));
vi.mock('../useRuntimeContext', () => ({
    useInAppMessageRuntimeContext: () => ({
        ready: true,
        context: {
            platform: 'web',
            role: 'learner',
            versions: {},
            now: Date.parse('2026-10-15T12:00:00Z'),
        },
    }),
}));
vi.mock('../useCredentialFacts', () => ({
    useCredentialFacts: (required: boolean) => {
        state.factsRequired = required;

        return state.facts;
    },
}));
vi.mock('../debug', () => ({ isInAppMessagesDebug: () => false, iamDebug: vi.fn() }));

describe('message evaluation lifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
        localStorage.clear();
        resetInAppMessageDismissals();
        resetInAppMessageEventSession();
        state.facts = {
            accountDid: 'alice',
            summaries: null,
            complete: false,
            total: 0,
            readsUsed: 0,
            backfillNow: vi.fn(),
            clearFacts: vi.fn(),
        };
        state.factsRequired = false;
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('waits at most five seconds, then allows positive partial matches but vetoes incomplete negation', () => {
        const credential = { credential: { issuers: ['did:example:pilot'] } };
        state.flags = {
            inAppMessages: {
                messages: [
                    {
                        id: 'negative',
                        title: 'Negative',
                        priority: 10,
                        targeting: { any: [{ platform: ['web'] }, { not: credential }] },
                    },
                    { id: 'positive', title: 'Positive', targeting: credential },
                ],
            },
        };
        state.facts.summaries = [summarizeCredential('lc:one', { issuer: 'did:example:pilot' })];
        const { result, rerender } = renderHook(() => useInAppMessages());
        expect(result.current.ready).toBe(false);
        act(() => vi.advanceTimersByTime(4999));
        expect(result.current.message).toBeNull();
        act(() => vi.advanceTimersByTime(1));
        expect(result.current.ready).toBe(true);
        expect(result.current.message?.id).toBe('positive');
        state.facts = { ...state.facts, complete: true };
        rerender();
        expect(result.current.message?.id).toBe('negative');
    });

    it('re-evaluates a claim immediately and expires its trigger without another user action', () => {
        state.facts.complete = true;
        state.facts.summaries = [];
        state.flags = {
            inAppMessages: {
                messages: [
                    {
                        id: 'claim',
                        title: 'Claimed',
                        trigger: {
                            event: 'credential.claimed',
                            windowMinutes: 0.1,
                            where: { issuers: ['did:example:pilot'] },
                        },
                    },
                ],
            },
        };
        const { result } = renderHook(() => useInAppMessages());
        expect(result.current.message).toBeNull();
        act(() => vi.advanceTimersByTime(1000));
        act(() =>
            emitInAppMessageEvent('credential.claimed', {
                accountDid: 'alice',
                credential: summarizeCredential('lc:one', { issuer: 'did:example:pilot' }),
            })
        );
        expect(result.current.message?.id).toBe('claim');
        act(() => vi.advanceTimersByTime(6001));
        expect(result.current.message).toBeNull();
        expect(result.current.report.diagnostics[0]?.triggerSatisfied).toBe(false);
    });

    it('does not turn a future event into the current clock', () => {
        state.flags = {
            inAppMessages: {
                messages: [{ id: 'open', title: 'Opened', trigger: { event: 'app.opened' } }],
            },
        };
        const { result } = renderHook(() => useInAppMessages());
        act(() =>
            emitInAppMessageEvent('app.opened', {
                accountDid: 'alice',
                occurredAt: Date.now() + 60_000,
            })
        );
        expect(result.current.message).toBeNull();
    });

    it('can force credential facts for debug tooling without a credential-aware flag', () => {
        state.flags = { inAppMessages: { messages: [] } };
        state.facts.summaries = [];
        state.facts.complete = true;

        const { result } = renderHook(() =>
            useInAppMessages(undefined, { forceCredentialFacts: true })
        );

        expect(state.factsRequired).toBe(true);
        expect(result.current.context?.credentials).toEqual([]);
        expect(result.current.context?.credentialsComplete).toBe(true);
    });
});
