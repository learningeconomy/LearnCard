import { beforeEach, describe, expect, it, vi } from 'vitest';

const { capture, identify, init, register, reset, sentEvents, sdkState } = vi.hoisted(() => {
    type BeforeSend = (
        event: { event: string; properties: Record<string, unknown> } | null
    ) => { event: string; properties: Record<string, unknown> } | null;

    const state = {
        activeDistinctId: 'did:key:signed-in-wallet',
        apiKey: '',
        beforeSend: undefined as BeforeSend | undefined,
    };
    const events: Array<{ event: string; properties: Record<string, unknown> }> = [];

    const captureMock = vi.fn((event: string, properties: Record<string, unknown>) => {
        // Mirrors posthog-js 1.396.5 ordering: caller properties beat persisted
        // identity, `$process_person_profile` is then overwritten by the SDK,
        // and `before_send` gets the final opportunity to transform the event.
        const captured = {
            event,
            properties: {
                distinct_id: state.activeDistinctId,
                $device_id: 'persisted-device-id',
                $session_id: 'persisted-session-id',
                email: 'signed-in@example.com',
                ...properties,
                $process_person_profile: true,
                token: state.apiKey,
            },
        };
        const processed = state.beforeSend?.(captured) ?? captured;

        if (processed) events.push(processed);

        return processed
            ? { uuid: '0198d3f2-f0d3-7000-8000-000000000001', ...processed }
            : undefined;
    });

    return {
        capture: captureMock,
        identify: vi.fn(),
        init: vi.fn((_apiKey: string, config: { before_send?: BeforeSend }) => {
            state.apiKey = _apiKey;
            state.beforeSend = config.before_send;
        }),
        register: vi.fn(),
        reset: vi.fn(),
        sentEvents: events,
        sdkState: state,
    };
});

vi.mock('posthog-js', () => ({
    default: {
        capture,
        identify,
        init,
        register,
        reset,
        opt_in_capturing: vi.fn(),
        opt_out_capturing: vi.fn(),
    },
}));

vi.mock('../sharedContext', () => ({
    getSharedEventContext: () => ({
        environment: 'production',
        app_version: '2.0.0',
        tenant_id: 'learncard',
        platform: 'web',
    }),
    shouldDropEvents: () => false,
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { AnalyticsEvents } from '../events';
import { PostHogProvider } from './posthog';

const IDEA_PAYLOAD = {
    source: 'settings' as const,
    message: 'Add a compact credential view',
    currentRoute: '/wallet',
    appVersion: '1.98.3',
};

describe('PostHogProvider.trackAnonymous', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentEvents.length = 0;
        sdkState.activeDistinctId = 'did:key:signed-in-wallet';
        sdkState.beforeSend = undefined;
    });

    it('captures each event with a fresh anonymous id and person processing disabled', async () => {
        const provider = new PostHogProvider({ apiKey: 'ph_test' });
        await provider.init();
        vi.clearAllMocks();

        await provider.trackAnonymous(AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED, IDEA_PAYLOAD);
        await provider.trackAnonymous(AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED, IDEA_PAYLOAD);

        expect(sentEvents).toHaveLength(2);

        const [first, second] = sentEvents;
        expect(first?.event).toBe(AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED);
        expect(first?.properties).toEqual({
            ...IDEA_PAYLOAD,
            distinct_id: expect.stringMatching(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            ),
            $process_person_profile: false,
            token: 'ph_test',
            environment: 'production',
            app_version: '2.0.0',
            tenant_id: 'learncard',
            platform: 'web',
        });
        expect(second?.properties.distinct_id).not.toBe(first?.properties.distinct_id);
        expect(first?.properties.distinct_id).not.toBe(sdkState.activeDistinctId);
        expect(second?.properties.distinct_id).not.toBe(sdkState.activeDistinctId);

        expect(identify).not.toHaveBeenCalled();
        expect(reset).not.toHaveBeenCalled();
        expect(register).not.toHaveBeenCalled();
        expect(sdkState.activeDistinctId).toBe('did:key:signed-in-wallet');
    });

    it('rejects when the PostHog SDK is unavailable', async () => {
        const provider = new PostHogProvider({ apiKey: 'ph_test' });

        await expect(
            provider.trackAnonymous(AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED, IDEA_PAYLOAD)
        ).rejects.toThrow('PostHog is unavailable');
    });

    it('rejects with the capture error instead of claiming delivery', async () => {
        const provider = new PostHogProvider({ apiKey: 'ph_test' });
        await provider.init();
        const captureError = new Error('capture failed');
        capture.mockImplementationOnce(() => {
            throw captureError;
        });

        await expect(
            provider.trackAnonymous(AnalyticsEvents.FEEDBACK_IDEA_SUBMITTED, IDEA_PAYLOAD)
        ).rejects.toBe(captureError);
    });
});
