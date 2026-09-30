import type { BespokeLearnCard } from '../types/learn-card';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { completionStorage } = vi.hoisted(() => {
    const completionStorage = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            location: { hostname: 'localhost' },
            localStorage: {
                getItem: (key: string) => completionStorage.get(key) ?? null,
                setItem: (key: string, value: string) => completionStorage.set(key, value),
                removeItem: (key: string) => completionStorage.delete(key),
            },
        },
    });
    return { completionStorage };
});

// This index-only test supplies its wallet; don't initialize wallet crypto through helper imports.
vi.mock('./walletHelpers', () => ({ getBespokeLearnCard: vi.fn() }));

import { reconcileQualificationCategories } from './qualificationCategoryBackfill';

type TestCredential = {
    '@context': string[];
    id: string;
    type: string[];
    issuer: string;
    validFrom: string;
    validUntil?: string;
    proof?: { jws: string };
    credentialSubject: {
        id: string;
        type: string[];
        achievement: {
            id: string;
            type: string[];
            name: string;
            description: string;
            criteria: { narrative: string };
            achievementType: string;
            tag?: string[];
        };
    };
};

type TestRecord = {
    id: string;
    uri: string;
    category: string;
    categorySource?: 'manual';
    boostUri?: string;
    expiresAt?: string;
    credential: TestCredential;
};

const credential = (achievementType: string, tags?: string[]): TestCredential => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `urn:uuid:${achievementType}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2025-01-01T00:00:00Z',
    credentialSubject: {
        id: 'did:example:holder',
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:achievement:${achievementType}`,
            type: ['Achievement'],
            name: 'Professional qualification',
            description: 'Qualification awarded by the issuer.',
            criteria: { narrative: 'Complete the requirements.' },
            achievementType,
            ...(tags ? { tag: tags } : {}),
        },
    },
});

let walletCounter = 0;
const makeWallet = (name: string, pages: TestRecord[][]) => {
    const did = `${name}:${++walletCounter}`;
    const updates: { id: string; metadata: { category: string } }[] = [];
    const getPage = vi.fn(async (_query: unknown, options: { cursor?: string }) => {
        const pageIndex = options.cursor ? Number(options.cursor) : 0;
        return {
            records: pages[pageIndex] ?? [],
            hasMore: pageIndex + 1 < pages.length,
            cursor: pageIndex + 1 < pages.length ? String(pageIndex + 1) : undefined,
        };
    });
    const update = vi.fn(async (id: string, metadata: { category: string }) => {
        updates.push({ id, metadata });
        const record = pages.flat().find(item => item.id === id);
        if (record) record.category = metadata.category;
        return true;
    });
    const wallet = {
        id: { did: () => did },
        index: { LearnCloud: { getPage, update } },
        read: {
            get: vi.fn(async (uri: string) => pages.flat().find(r => r.uri === uri)?.credential),
        },
    };
    return { wallet: wallet as unknown as BespokeLearnCard, updates, getPage, update };
};

const startNewSession = async () => {
    vi.resetModules();
    return (await import('./qualificationCategoryBackfill')).reconcileQualificationCategories;
};

describe('reconcileQualificationCategories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        completionStorage.clear();
    });

    it.each([
        ['License', 'ID'],
        ['Certification', 'Achievement'],
        ['JourneymanCertificate', 'Work History'],
        ['MasterCertificate', 'Work History'],
        ['ApprenticeshipCertificate', 'Work History'],
    ])(
        'moves legacy %s records from %s using the OB3 achievement type',
        async (achievementType, oldCategory) => {
            const signedCredential = {
                ...credential(achievementType),
                proof: { jws: 'proof-stays' },
            };
            const record: TestRecord = {
                id: `record-${achievementType}`,
                uri: `credential:${achievementType}`,
                category: oldCategory,
                credential: signedCredential,
            };
            const { wallet, updates } = makeWallet(`legacy-${achievementType}`, [[record]]);

            await reconcileQualificationCategories(wallet);

            expect(updates).toEqual([{ id: record.id, metadata: { category: 'Qualifications' } }]);
            expect(record.id).toBe(`record-${achievementType}`);
            expect(record.uri).toBe(`credential:${achievementType}`);
            expect(signedCredential.proof).toEqual({ jws: 'proof-stays' });
        }
    );

    it('scans pages, preserves expiry, skips mismatched/manual/issuer/boost records, and is idempotent', async () => {
        const expired = credential('Certification');
        expired.validUntil = '2000-01-01T00:00:00Z';
        const records: TestRecord[][] = [
            [{ id: 'expired', uri: 'expired', category: 'Achievement', credential: expired }],
            [
                {
                    id: 'wrong-category',
                    uri: 'wrong',
                    category: 'Skill',
                    credential: credential('License'),
                },
                {
                    id: 'manual',
                    uri: 'manual',
                    category: 'ID',
                    categorySource: 'manual',
                    credential: credential('License'),
                },
                {
                    id: 'issuer',
                    uri: 'issuer',
                    category: 'ID',
                    credential: credential('License', ['lc:category:ID']),
                },
                {
                    id: 'boost',
                    uri: 'boost',
                    category: 'ID',
                    boostUri: 'boost:uri',
                    credential: credential('License'),
                },
            ],
        ];
        const { wallet, updates, getPage } = makeWallet('pages', records);

        await reconcileQualificationCategories(wallet);
        await reconcileQualificationCategories(wallet);

        expect(getPage).toHaveBeenCalledTimes(2);
        expect(updates).toEqual([{ id: 'expired', metadata: { category: 'Qualifications' } }]);
        expect(expired.validUntil).toBe('2000-01-01T00:00:00Z');
    });

    it('defers failed updates until the next session and keeps accounts isolated', async () => {
        const record: TestRecord = {
            id: 'retry',
            uri: 'retry-uri',
            category: 'Work History',
            credential: credential('JourneymanCertificate'),
        };
        const first = makeWallet('retry', [[record]]);
        first.update.mockRejectedValueOnce(new Error('offline'));

        await reconcileQualificationCategories(first.wallet);
        await reconcileQualificationCategories(first.wallet);
        expect(first.update).toHaveBeenCalledTimes(1);
        const nextSession = await startNewSession();
        await nextSession(first.wallet);

        const otherRecord = { ...record, id: 'other', uri: 'other-uri', category: 'Work History' };
        const other = makeWallet('other-wallet', [[otherRecord]]);
        await reconcileQualificationCategories(other.wallet);
        expect(first.update).toHaveBeenCalledTimes(2);
        expect(other.updates).toEqual([{ id: 'other', metadata: { category: 'Qualifications' } }]);
    });

    it('does not mark a false index update as completed', async () => {
        const record: TestRecord = {
            id: 'unmodified',
            uri: 'credential:unmodified',
            category: 'ID',
            credential: credential('License'),
        };
        const { wallet, update } = makeWallet('false-update', [[record]]);
        update.mockResolvedValueOnce(false);
        await reconcileQualificationCategories(wallet);
        expect(record.category).toBe('ID');
        const nextSession = await startNewSession();
        await nextSession(wallet);
        expect(record.category).toBe('Qualifications');
    });

    it('continues past unavailable credentials without rescanning until the next session', async () => {
        const unavailable: TestRecord = {
            id: 'unavailable',
            uri: 'credential:unavailable',
            category: 'ID',
            credential: credential('License'),
        };
        const available: TestRecord = {
            id: 'available',
            uri: 'credential:available',
            category: 'Achievement',
            credential: credential('Certification'),
        };
        const { wallet } = makeWallet('unavailable', [[unavailable, available]]);
        vi.mocked(wallet.read.get).mockRejectedValueOnce(new Error('unavailable'));
        await reconcileQualificationCategories(wallet);
        expect(unavailable.category).toBe('ID');
        expect(available.category).toBe('Qualifications');
        await reconcileQualificationCategories(wallet);
        expect(unavailable.category).toBe('ID');
        expect(wallet.read.get).toHaveBeenCalledTimes(2);
        const nextSession = await startNewSession();
        await nextSession(wallet);
        expect(unavailable.category).toBe('Qualifications');
    });

    it('persists completion across fresh wallet clients and cold sessions', async () => {
        const record: TestRecord = {
            id: 'license',
            uri: 'stored-license',
            category: 'ID',
            credential: credential('License'),
        };
        const first = makeWallet('completed', [[record]]);
        await reconcileQualificationCategories(first.wallet, undefined, 'cloud-a');
        expect(record.category).toBe('Qualifications');

        const coldWallet = {
            ...first.wallet,
            index: { LearnCloud: { ...first.wallet.index.LearnCloud, getPage: vi.fn() } },
        } as unknown as BespokeLearnCard;
        const nextSession = await startNewSession();
        await nextSession(coldWallet, undefined, 'cloud-a');
        expect(coldWallet.index.LearnCloud.getPage).not.toHaveBeenCalled();

        const otherCloudRecord = { ...record, category: 'ID' };
        const otherCloud = makeWallet('another-cloud', [[otherCloudRecord]]);
        otherCloud.wallet.id.did = first.wallet.id.did;
        await nextSession(otherCloud.wallet, undefined, 'cloud-b');
        expect(otherCloudRecord.category).toBe('Qualifications');
    });

    it('shares an in-flight scan across concurrent clients for the same account', async () => {
        const first = makeWallet('concurrent', []);
        const { promise, resolve: finish } = Promise.withResolvers<{
            records: TestRecord[];
            hasMore: boolean;
            cursor: undefined;
        }>();
        first.getPage.mockReturnValueOnce(promise);
        const anotherClient = {
            ...first.wallet,
            index: { LearnCloud: { ...first.wallet.index.LearnCloud, getPage: vi.fn() } },
        } as unknown as BespokeLearnCard;
        const firstRun = reconcileQualificationCategories(first.wallet);
        const secondRun = reconcileQualificationCategories(anotherClient);
        expect(first.getPage).toHaveBeenCalledTimes(1);
        expect(anotherClient.index.LearnCloud.getPage).not.toHaveBeenCalled();
        finish({ records: [], hasMore: false, cursor: undefined });
        await Promise.all([firstRun, secondRun]);
    });
});
