import { beforeEach, describe, expect, it, vi } from 'vitest';

const { capture, identify, init, register, reset } = vi.hoisted(() => ({
    // If the identified SDK were used, its final event could contain this
    // top-level person mutation bag even after properties were rebuilt.
    capture: vi.fn(() => ({
        uuid: '0198d3f2-f0d3-7000-8000-000000000001',
        event: 'feedback_idea_submitted',
        properties: { distinct_id: 'did:key:signed-in-wallet' },
        $set_once: { email: 'signed-in@example.com' },
    })),
    identify: vi.fn(),
    init: vi.fn(),
    register: vi.fn(),
    reset: vi.fn(),
}));

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
        forbiddenSharedExtra: 'must-not-leave',
    }),
    shouldDropEvents: () => false,
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { PostHogProvider } from './posthog';

const FIRST_UUID = '00000000-0000-4000-8000-000000000001';
const SECOND_UUID = '00000000-0000-4000-8000-000000000002';

const IDEA_PAYLOAD = {
    source: 'settings' as const,
    message: 'Add a compact credential view',
    currentRoute: '/wallet',
    appVersion: '1.98.3',
};

const readRequestBody = (fetchRequest: ReturnType<typeof vi.fn>, call: number) =>
    JSON.parse(fetchRequest.mock.calls[call]?.[1]?.body as string) as Record<string, unknown>;

const createProvider = (
    fetchRequest: ReturnType<typeof vi.fn>,
    randomUUID: ReturnType<typeof vi.fn>
) =>
    new PostHogProvider(
        {
            apiKey: 'ph_test',
            apiHost: 'https://eu.i.posthog.com///?ignored=yes#fragment',
        },
        {
            fetch: fetchRequest,
            randomUUID,
        }
    );

describe('PostHogProvider.submitFeedbackIdea', () => {
    let fetchRequest: ReturnType<typeof vi.fn>;
    let randomUUID: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        fetchRequest = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        randomUUID = vi.fn().mockReturnValueOnce(FIRST_UUID).mockReturnValueOnce(SECOND_UUID);
    });

    it('posts each idea statelessly with a fresh id and only allowlisted properties', async () => {
        const provider = createProvider(fetchRequest, randomUUID);
        await provider.init();
        vi.clearAllMocks();

        await provider.submitFeedbackIdea({
            ...IDEA_PAYLOAD,
            credential: { secret: true },
            $set_once: { email: 'signed-in@example.com' },
        } as typeof IDEA_PAYLOAD);
        await provider.submitFeedbackIdea(IDEA_PAYLOAD);

        expect(fetchRequest).toHaveBeenCalledTimes(2);
        expect(fetchRequest).toHaveBeenNthCalledWith(1, 'https://eu.i.posthog.com/capture/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            keepalive: true,
            body: expect.any(String),
        });

        expect(readRequestBody(fetchRequest, 0)).toEqual({
            api_key: 'ph_test',
            event: 'feedback_idea_submitted',
            properties: {
                source: 'settings',
                message: 'Add a compact credential view',
                currentRoute: '/wallet',
                appVersion: '1.98.3',
                environment: 'production',
                app_version: '2.0.0',
                tenant_id: 'learncard',
                platform: 'web',
                distinct_id: FIRST_UUID,
                $process_person_profile: false,
            },
        });
        expect(readRequestBody(fetchRequest, 1)).toMatchObject({
            properties: { distinct_id: SECOND_UUID },
        });
        expect(readRequestBody(fetchRequest, 0)).not.toHaveProperty('$set_once');
        expect(readRequestBody(fetchRequest, 0)).not.toHaveProperty('properties.$set_once');
        expect(readRequestBody(fetchRequest, 0)).not.toHaveProperty('properties.credential');
        expect(readRequestBody(fetchRequest, 0)).not.toHaveProperty(
            'properties.forbiddenSharedExtra'
        );

        expect(randomUUID).toHaveBeenCalledTimes(2);
        expect(capture).not.toHaveBeenCalled();
        expect(identify).not.toHaveBeenCalled();
        expect(reset).not.toHaveBeenCalled();
        expect(register).not.toHaveBeenCalled();
    });

    it('omits optional app properties when unavailable', async () => {
        const provider = createProvider(fetchRequest, randomUUID);

        await provider.submitFeedbackIdea({
            source: 'settings',
            message: 'Add a compact credential view',
            currentRoute: '/wallet',
        });

        expect(readRequestBody(fetchRequest, 0)).not.toHaveProperty('properties.appVersion');
    });

    it('rejects non-2xx ingestion responses', async () => {
        fetchRequest.mockResolvedValue({ ok: false, status: 503 });
        const provider = createProvider(fetchRequest, randomUUID);

        await expect(provider.submitFeedbackIdea(IDEA_PAYLOAD)).rejects.toThrow(
            'PostHog rejected feedback idea (503)'
        );
    });

    it('propagates network failures', async () => {
        const networkError = new Error('network unavailable');
        fetchRequest.mockRejectedValue(networkError);
        const provider = createProvider(fetchRequest, randomUUID);

        await expect(provider.submitFeedbackIdea(IDEA_PAYLOAD)).rejects.toBe(networkError);
    });

    it('rejects unsafe ingestion hosts before sending', async () => {
        const provider = new PostHogProvider(
            { apiKey: 'ph_test', apiHost: 'javascript:alert(1)' },
            { fetch: fetchRequest, randomUUID }
        );

        await expect(provider.submitFeedbackIdea(IDEA_PAYLOAD)).rejects.toThrow(
            'Invalid PostHog API host'
        );
        expect(fetchRequest).not.toHaveBeenCalled();
    });
});
