import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { createDeferred } from 'learn-card-base/helpers/deferred';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    ensure: vi.fn(),
    mode: vi.fn(),
    serviceUrl: vi.fn(() => 'https://ai.example.test'),
}));
vi.mock('learn-card-base/helpers/aiPassportAuth', () => ({
    aiPassportFetch: mocks.fetch,
    ensureAiPassportSession: mocks.ensure,
    getAiPassportAuthMode: mocks.mode,
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: { get: { aiServiceUrl: mocks.serviceUrl } },
}));
vi.mock('learn-card-base/i18n', () => ({
    addActiveLocaleToUrl: (url: string) => `${url}?locale=ar`,
}));

import {
    formatLearnerContext,
    resolveLearnerContextCredentials,
    useLearnerContextPrewarm,
    type LearnerContextSelection,
} from './learnerContext.helpers';
import { createRequestLearnerContextHandler } from './useLearnCardPostMessage.handlers';

const wallet = { id: { did: () => 'did:example:learner' } } as BespokeLearnCard;
const selection: LearnerContextSelection = {
    credentialUris: ['lc:storage:signed-source'],
    personalFields: ['name'],
    detailLevel: 'compact',
    includeStructuredContext: false,
};
const response = () =>
    Response.json({
        prompt: 'Verified learner evidence',
        metadata: { consentRevision: 'current-revision', promptCacheHit: true },
    });

beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensure.mockResolvedValue('session');
    mocks.mode.mockReturnValue('session');
    mocks.serviceUrl.mockReturnValue('https://ai.example.test');
    mocks.fetch.mockImplementation(async () => response());
});

describe('learner context authenticated formatter', () => {
    it('sends storage selections, never caller personal values or credentials, with locale and strict auth', async () => {
        await formatLearnerContext(wallet, {
            ...selection,
            credentials: [{ id: 'urn:uuid:not-a-storage-uri' }],
            personalData: { name: 'Private learner' },
            did: 'did:example:other',
        } as LearnerContextSelection);
        const [url, init, did] = mocks.fetch.mock.calls[0]!;
        expect(new URL(url).origin).toBe('https://ai.example.test');
        expect(new URL(url).searchParams.get('locale')).toBe('ar');
        expect(did).toBe('did:example:learner');
        expect(JSON.parse(init.body)).toEqual(selection);
    });

    it('rechecks server authorization instead of returning a previous prompt after consent withdrawal', async () => {
        await expect(formatLearnerContext(wallet, selection)).resolves.toMatchObject({
            metadata: { consentRevision: 'current-revision', promptCacheHit: true },
        });
        mocks.fetch.mockResolvedValueOnce(
            Response.json({ error: 'Consent withdrawn' }, { status: 403 })
        );
        await expect(formatLearnerContext(wallet, selection)).rejects.toMatchObject({
            data: { code: 'FORBIDDEN' },
        });
    });

    it('does not send formatter selections when session authentication fails', async () => {
        mocks.ensure.mockRejectedValue(new Error('Authentication unavailable'));
        await expect(formatLearnerContext(wallet, selection)).rejects.toThrow(
            'Authentication unavailable'
        );
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it.each([
        { prompt: 'Legacy response', metadata: {} },
        { prompt: 'Legacy response', metadata: { consentRevision: '' } },
        { prompt: '', metadata: { consentRevision: 'revision' } },
        { metadata: { consentRevision: 'revision' } },
    ])('rejects malformed or evidence-free success: %j', async data => {
        mocks.fetch.mockResolvedValueOnce(Response.json(data));
        await expect(formatLearnerContext(wallet, selection)).rejects.toThrow('consent evidence');
    });

    it('rejects provider errors and allows a fresh authorized retry', async () => {
        mocks.fetch.mockRejectedValueOnce(new Error('Provider unavailable'));
        await expect(formatLearnerContext(wallet, selection)).rejects.toThrow(
            'Provider unavailable'
        );
        await expect(formatLearnerContext(wallet, selection)).resolves.toMatchObject({
            prompt: 'Verified learner evidence',
        });
    });

    it('rejects an over-limit selection without silently dropping credentials', async () => {
        await expect(
            formatLearnerContext(wallet, {
                ...selection,
                credentialUris: Array.from({ length: 501 }, (_, index) => `lc:storage:${index}`),
            })
        ).rejects.toThrow('selection exceeds');
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it('reports an HTML upstream failure without parsing or leaking its body', async () => {
        mocks.fetch.mockResolvedValueOnce(
            new Response('<html>private upstream diagnostic</html>', { status: 502 })
        );
        await expect(formatLearnerContext(wallet, selection)).rejects.toThrow(
            'Learner context request failed (HTTP 502)'
        );
    });

    it('rejects successful data if the service changes while the body is being consumed', async () => {
        const body = createDeferred<unknown>();
        const json = vi.fn(() => body.promise);
        mocks.fetch.mockResolvedValueOnce({ ok: true, json });
        const pending = formatLearnerContext(wallet, selection);
        await waitFor(() => expect(json).toHaveBeenCalledOnce());
        mocks.serviceUrl.mockReturnValue('https://other.example.test');
        body.resolve({ prompt: 'Stale private data', metadata: { consentRevision: 'old' } });
        await expect(pending).rejects.toThrow('session identity or service changed');
    });

    it('rejects an identity switch before consuming a returned body', async () => {
        const json = vi.fn();
        mocks.fetch.mockImplementationOnce(async () => {
            mocks.mode.mockReturnValue('none');
            return { ok: true, json };
        });
        await expect(formatLearnerContext(wallet, selection)).rejects.toThrow(
            'session identity or service changed'
        );
        expect(json).not.toHaveBeenCalled();
    });
});

describe('structured learner context', () => {
    it('keeps available authorized siblings and never reads outside the selection', async () => {
        const available = { id: 'urn:credential:available' };
        const get = vi.fn(async (uri: string) => {
            if (uri === 'missing') return undefined;
            if (uri === 'unavailable') throw new Error('Storage unavailable');
            return available;
        });
        const reader = { read: { get } } as unknown as BespokeLearnCard;
        await expect(
            resolveLearnerContextCredentials(reader, ['missing', 'available', 'unavailable'])
        ).resolves.toEqual([available]);
        expect(get.mock.calls.map(([uri]) => uri)).toEqual(['missing', 'available', 'unavailable']);
        await expect(resolveLearnerContextCredentials(reader, ['missing'])).resolves.toEqual([]);
        await expect(resolveLearnerContextCredentials(reader, [])).resolves.toEqual([]);
    });

    it.each(['FORBIDDEN', 'UNAUTHORIZED'])(
        'does not swallow %s as a missing record',
        async code => {
            const denial = { data: { code }, message: 'Private permission diagnostic' };
            const reader = {
                read: {
                    get: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 'available' })
                        .mockRejectedValueOnce(denial),
                },
            } as unknown as BespokeLearnCard;
            await expect(
                resolveLearnerContextCredentials(reader, ['available', 'denied'])
            ).rejects.toBe(denial);
        }
    );

    it('preserves withdrawn consent as FORBIDDEN across the SDK handler boundary', async () => {
        const request = vi
            .fn()
            .mockResolvedValueOnce({ prompt: '', raw: { credentials: [] }, did: wallet.id.did() })
            .mockRejectedValueOnce({ data: { code: 'FORBIDDEN' }, message: 'Private details' });
        const handler = createRequestLearnerContextHandler({ requestLearnerContext: request });
        const context = {
            payload: { format: 'structured' as const },
            origin: 'https://app.example.test',
            source: window,
        };
        expect(await handler(context)).toMatchObject({ success: true });
        const withdrawn = await handler(context);
        expect(withdrawn).toMatchObject({
            success: false,
            error: { code: 'FORBIDDEN' },
        });
        expect(JSON.stringify(withdrawn)).not.toContain('Private details');
    });
});

describe('learner context prewarm scheduling', () => {
    it('ignores unstable callbacks but warms again for actual scope changes', async () => {
        const warm = vi.fn(async (_options: unknown) => {});
        const { rerender } = renderHook(
            ({ scope }) => {
                // Like useWallet's initWallet, this callback is new on every render.
                const prewarm = useLearnerContextPrewarm(scope, async options => warm(options));
                useEffect(() => {
                    void prewarm({});
                }, [prewarm]);
            },
            { initialProps: { scope: 'learner-a|app-a|service-a' } }
        );
        await waitFor(() => expect(warm).toHaveBeenCalledTimes(1));
        rerender({ scope: 'learner-a|app-a|service-a' });
        await act(async () => {});
        expect(warm).toHaveBeenCalledTimes(1);
        rerender({ scope: 'learner-b|app-a|service-a' });
        await waitFor(() => expect(warm).toHaveBeenCalledTimes(2));
        rerender({ scope: 'learner-b|app-b|service-a' });
        await waitFor(() => expect(warm).toHaveBeenCalledTimes(3));
        rerender({ scope: 'learner-b|app-b|service-b' });
        await waitFor(() => expect(warm).toHaveBeenCalledTimes(4));
    });

    it('coalesces concurrent equivalent selections but retains neither results nor failures', async () => {
        const gate = createDeferred<void>();
        const warm = vi.fn().mockReturnValueOnce(gate.promise).mockResolvedValue(undefined);
        const { result } = renderHook(() => useLearnerContextPrewarm('learner|app|service', warm));
        const first = result.current({});
        expect(result.current({ includeCredentials: true, detailLevel: 'compact' })).toBe(first);
        await result.current({ includePersonalData: true });
        expect(warm).toHaveBeenCalledTimes(2);
        gate.resolve();
        await first;
        await result.current({});
        expect(warm).toHaveBeenCalledTimes(3);
        warm.mockRejectedValueOnce(new Error('Unavailable'));
        await expect(result.current({})).rejects.toThrow('Unavailable');
        await result.current({});
        expect(warm).toHaveBeenCalledTimes(5);
    });
});
