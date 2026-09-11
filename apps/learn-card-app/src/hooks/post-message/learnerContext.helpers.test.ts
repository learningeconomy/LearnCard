import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

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

import { formatLearnerContext, type LearnerContextSelection } from './learnerContext.helpers';

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
        await expect(formatLearnerContext(wallet, selection)).rejects.toThrow('Consent withdrawn');
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
});
