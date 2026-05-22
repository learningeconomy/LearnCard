import { beforeEach, describe, expect, it, vi } from 'vitest';

const { relateToMock, runMock } = vi.hoisted(() => ({
    relateToMock: vi.fn(async () => true),
    runMock: vi.fn(),
}));

vi.mock('@models', () => ({
    Credential: {
        relateTo: relateToMock,
    },
    Boost: {},
    Role: {},
    Profile: {},
    ConsentFlowTerms: {},
    ConsentFlowTransaction: {},
    AppStoreListing: {},
    ConsentFlowContract: {},
}));

vi.mock('@instance', () => ({
    neogma: {
        queryRunner: {
            run: runMock,
        },
    },
}));

vi.mock('@helpers/objects.helpers', () => ({
    flattenObject: vi.fn((value: unknown) => value),
    inflateObject: vi.fn((value: unknown) => value),
}));

vi.mock('@accesslayer/boost/relationships/update', () => ({
    clearDidWebCacheForChildProfileManagers: vi.fn(async () => undefined),
}));

vi.mock('../../src/accesslayer/credential/relationships/read', async importOriginal => {
    const actual = (await importOriginal()) as object;

    return {
        ...actual,
        getBoostIdForCredentialInstance: vi.fn(async () => undefined),
    };
});

describe('credential supersession relationships', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a SUPERSEDES relationship from the new credential to the old credential', async () => {
        const { createSupersessionRelationship } = await import(
            '../../src/accesslayer/credential/relationships/create'
        );

        await createSupersessionRelationship('credential-old', 'credential-new');

        expect(relateToMock).toHaveBeenCalledWith({
            alias: 'supersedes',
            where: {
                source: { id: 'credential-new' },
                target: { id: 'credential-old' },
            },
        });
    });

    it('returns the supersession chain ordered from oldest to newest', async () => {
        runMock.mockResolvedValue({
            records: [
                {
                    get: vi.fn((key: string) =>
                        key === 'chain'
                            ? ['credential-v1', 'credential-v2', 'credential-v3']
                            : undefined
                    ),
                },
            ],
        });

        const { getSupersessionChain } = await import(
            '../../src/accesslayer/credential/relationships/read'
        );

        await expect(getSupersessionChain('credential-v2')).resolves.toEqual([
            'credential-v1',
            'credential-v2',
            'credential-v3',
        ]);

        expect(runMock).toHaveBeenCalledWith(expect.stringContaining('SUPERSEDES'), {
            credentialId: 'credential-v2',
        });
    });
});
