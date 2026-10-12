import { beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { ConsentFlowDataQuery, ConsentFlowTermsInput } from '@learncard/types';
import { ConsentFlowTerms, ConsentFlowContract } from '@models';
import { getUser } from './helpers/getClient';
import { minimalContract, minimalTerms, normalContract, normalFullTerms } from './helpers/contract';

describe('consented data boundaries', () => {
    let owner: Awaited<ReturnType<typeof getUser>>;
    let learner: Awaited<ReturnType<typeof getUser>>;
    let learnerDid: string;

    beforeEach(async () => {
        const suffix = randomBytes(5).toString('hex');
        owner = await getUser(randomBytes(32).toString('hex'));
        learner = await getUser(randomBytes(32).toString('hex'));
        await owner.clients.fullAuth.profile.createProfile({
            profileId: `boundary-owner-${suffix}`,
        });
        await learner.clients.fullAuth.profile.createProfile({
            profileId: `boundary-user-${suffix}`,
        });
        learnerDid = (await learner.clients.fullAuth.profile.getProfile())!.did;
    });

    const consent = async ({
        terms = normalFullTerms,
        expiresAt,
        contractExpiresAt,
        oneTime,
        minimal = false,
    }: {
        terms?: ConsentFlowTermsInput;
        expiresAt?: string;
        contractExpiresAt?: string;
        oneTime?: boolean;
        minimal?: boolean;
    } = {}) => {
        const contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic boundary contract',
            contract: minimal ? minimalContract : normalContract,
            expiresAt: contractExpiresAt,
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms,
            expiresAt,
            oneTime,
        });
        return { contractUri, termsUri };
    };

    const readAll = async (
        contractUri: string,
        query: ConsentFlowDataQuery = {},
        pagination: { limit?: number; cursor?: string } = {}
    ) => [
        await owner.clients.fullAuth.contracts.getConsentedDataForContract({
            uri: contractUri,
            query,
            ...pagination,
        }),
        await owner.clients.fullAuth.contracts.getConsentedDataForDid({
            did: learnerDid,
            query: { ...query, id: contractUri.split(':').at(-1)! },
            ...pagination,
        }),
        await owner.clients.fullAuth.contracts.getConsentedData({ query, ...pagination }),
    ];

    it('returns live unexpired personal fields and selected credentials on every route', async () => {
        const { contractUri } = await consent({
            expiresAt: '2100-01-01T00:00:00+05:30',
            contractExpiresAt: '2100-01-01T00:00:00-05:00',
        });
        for (const response of await readAll(contractUri)) {
            expect(response.records).toHaveLength(1);
            expect(response.records[0]!.personal).toEqual(normalFullTerms.read.personal);
            expect(JSON.stringify(response)).toContain('achievement1');
        }
    });

    it.each([
        [{ name: true }, 1],
        [{ name: false }, 0],
        [{ missing: false }, 1],
        [{ name: true, missing: true }, 0],
    ] as const)(
        'filters personal field presence without treating empty strings as absent: %j',
        async (personal, count) => {
            const terms = structuredClone(normalFullTerms);
            terms.read.personal = { ...terms.read.personal, name: '' };
            const { contractUri } = await consent({ terms });
            for (const response of await readAll(contractUri, { personal })) {
                expect(response.records).toHaveLength(count);
            }
        }
    );

    it('treats legacy empty expiry strings as no expiry, including category expiry', async () => {
        const terms = structuredClone(normalFullTerms);
        terms.read.credentials.categories.Achievement!.shareUntil = '';
        const { contractUri, termsUri } = await consent({ terms });
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
            expiresAt: '',
        });
        for (const response of await readAll(contractUri, {
            credentials: { categories: { Achievement: true } },
        })) {
            expect(response.records).toHaveLength(1);
        }
        await learner.clients.fullAuth.contracts.syncCredentialsToContract({
            termsUri,
            categories: { Achievement: ['urn:blank-expiry:copy'] },
        });
    });

    it.each([true, false, undefined] as const)(
        'preserves anonymize presence filters for stored value %s',
        async anonymize => {
            const terms = structuredClone(normalFullTerms);
            if (anonymize === undefined) delete terms.read.anonymize;
            else terms.read.anonymize = anonymize;
            const { contractUri } = await consent({ terms });
            for (const filter of [true, false, undefined]) {
                // The per-DID query does not expose anonymize; check its two supported routes.
                const query = filter === undefined ? {} : { anonymize: filter };
                for (const response of [
                    await owner.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri: contractUri,
                        query,
                        limit: 1,
                    }),
                    await owner.clients.fullAuth.contracts.getConsentedData({ query, limit: 1 }),
                ]) {
                    expect(response.records).toHaveLength(
                        filter === undefined || filter === (anonymize !== undefined) ? 1 : 0
                    );
                    expect(response.hasMore).toBe(false);
                }
            }
        }
    );

    it.each(['terms', 'contract'] as const)(
        'allows locked sync when %s expiry contains only whitespace',
        async kind => {
            const { contractUri, termsUri } = await consent();
            const model = kind === 'terms' ? ConsentFlowTerms : ConsentFlowContract;
            const uri = kind === 'terms' ? termsUri : contractUri;
            await model.update({ expiresAt: '   ' }, { where: { id: uri.split(':').at(-1)! } });
            await expect(
                learner.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: { Achievement: ['urn:whitespace-expiry:copy'] },
                })
            ).resolves.toBe(true);
        }
    );

    it('excludes withdrawn consent while retaining its audit history', async () => {
        const { contractUri, termsUri } = await consent();
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        const history = await learner.clients.fullAuth.contracts.getConsentedContracts();
        expect(history.records.find(record => record.uri === termsUri)?.status).toBe('withdrawn');
        for (const response of await readAll(contractUri)) expect(response.records).toEqual([]);
    });

    it.each(['terms', 'contract'] as const)('excludes expired %s on every route', async kind => {
        const past = '2000-01-01T00:00:00.000Z';
        const { contractUri } = await consent({
            expiresAt: kind === 'terms' ? past : undefined,
        });
        // Seed an existing consent that subsequently expires, rather than consent to an expired contract.
        if (kind === 'contract')
            await ConsentFlowContract.update(
                { expiresAt: past },
                { where: { id: contractUri.split(':').at(-1)! } }
            );
        for (const response of await readAll(contractUri)) expect(response.records).toEqual([]);
    });

    it('preserves one-time snapshots without permitting ongoing sync, then honors withdrawal', async () => {
        const { contractUri, termsUri } = await consent({ oneTime: true });
        const history = await learner.clients.fullAuth.contracts.getConsentedContracts();
        expect(history.records.find(record => record.uri === termsUri)?.status).toBe('stale');
        for (const response of await readAll(contractUri)) {
            expect(response.records).toHaveLength(1);
            expect(JSON.stringify(response)).toContain('achievement1');
        }
        await expect(
            learner.clients.fullAuth.contracts.syncCredentialsToContract({
                termsUri,
                categories: { Achievement: ['urn:synthetic:new'] },
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        for (const response of await readAll(contractUri)) expect(response.records).toEqual([]);
    });

    it('excludes stale consent without the explicit one-time flag', async () => {
        const { contractUri, termsUri } = await consent();
        await ConsentFlowTerms.update(
            { status: 'stale' },
            { where: { id: termsUri.split(':').at(-1)! } }
        );
        for (const response of await readAll(contractUri)) expect(response.records).toEqual([]);
    });

    it('also expires one-time snapshots', async () => {
        const { contractUri } = await consent({ oneTime: true, expiresAt: '2000-01-01T00:00:00Z' });
        for (const response of await readAll(contractUri)) expect(response.records).toEqual([]);
    });

    it.each(['disabled', 'unspecified', 'expired'] as const)(
        'excludes %s category URIs and filters by permitted data on every route',
        async kind => {
            const terms = structuredClone(normalFullTerms);
            terms.read.credentials.categories.Achievement = {
                shared: ['urn:synthetic:blocked'],
                sharing: kind === 'expired' ? true : kind === 'disabled' ? false : undefined,
                shareUntil: kind === 'expired' ? '2000-01-01T00:00:00Z' : undefined,
            };
            const { contractUri } = await consent({ terms });
            for (const response of await readAll(contractUri)) {
                expect(response.records).toHaveLength(1);
                expect(response.records[0]!.personal).toEqual(normalFullTerms.read.personal);
                expect(JSON.stringify(response)).not.toContain('urn:synthetic:blocked');
                expect(JSON.stringify(response)).toContain('id1');
            }
            for (const response of await readAll(contractUri, {
                credentials: { categories: { Achievement: true } },
            })) {
                expect(response.records).toEqual([]);
            }
            for (const response of await readAll(contractUri, {
                credentials: { categories: { Achievement: false } },
            })) {
                expect(response.records).toHaveLength(1);
                expect(JSON.stringify(response)).not.toContain('urn:synthetic:blocked');
            }
        }
    );

    it('returns an empty credential collection for valid terms without categories', async () => {
        const { contractUri } = await consent({ terms: minimalTerms, minimal: true });
        const [byContract, byDid, aggregate] = await readAll(contractUri);
        expect(byContract!.records[0]!.credentials).toEqual({ categories: {} });
        expect(aggregate!.records[0]!.credentials).toEqual({ categories: {} });
        expect(byDid!.records[0]!.credentials).toEqual([]);
        expect(byDid!.records[0]!.personal).toEqual(minimalTerms.read.personal);
    });

    it('hides saved URIs when credential sharing is disabled globally', async () => {
        const terms = structuredClone(normalFullTerms);
        terms.read.credentials.sharing = false;
        const { contractUri } = await consent({ terms });
        for (const response of await readAll(contractUri)) {
            expect(response.records).toHaveLength(1);
            expect(JSON.stringify(response)).not.toContain('achievement1');
            expect(JSON.stringify(response)).not.toContain('id1');
        }
        for (const response of await readAll(contractUri, {
            credentials: { categories: { Achievement: true } },
        })) {
            expect(response.records).toEqual([]);
        }
        for (const response of await readAll(contractUri, {
            credentials: { categories: { Achievement: false } },
        })) {
            expect(response.records).toHaveLength(1);
        }
    });

    it.each(['terms', 'contract'] as const)(
        'excludes malformed legacy %s expiry without failing the query',
        async kind => {
            const { contractUri, termsUri } = await consent();
            const model = kind === 'terms' ? ConsentFlowTerms : ConsentFlowContract;
            await model.update(
                { expiresAt: 'invalid-legacy-date' },
                { where: { id: (kind === 'terms' ? termsUri : contractUri).split(':').at(-1)! } }
            );
            for (const response of await readAll(contractUri)) expect(response.records).toEqual([]);
        }
    );

    it('projects only requested categories consistently', async () => {
        const { contractUri } = await consent();
        for (const response of await readAll(contractUri, {
            credentials: { categories: { Achievement: true } },
        })) {
            expect(JSON.stringify(response)).toContain('achievement1');
            expect(JSON.stringify(response)).not.toContain('id1');
        }
    });

    it('applies eligibility before pagination and accepts a cursor on every route', async () => {
        const { contractUri, termsUri } = await consent();
        const secondLearner = await getUser(randomBytes(32).toString('hex'));
        await secondLearner.clients.fullAuth.profile.createProfile({
            profileId: `boundary-second-${randomBytes(5).toString('hex')}`,
        });
        await secondLearner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            expiresAt: '2000-01-01T00:00:00Z',
        });
        // Put the expired row first, so filtering after LIMIT would hide the live row.
        await ConsentFlowTerms.update(
            { updatedAt: '2001-01-01T00:00:00Z' },
            {
                where: { id: termsUri.split(':').at(-1)! },
            }
        );
        for (const response of await readAll(contractUri, {}, { limit: 1 })) {
            expect(response.records).toHaveLength(1);
            expect(response.hasMore).toBe(false);
        }
        for (const response of await readAll(
            contractUri,
            {},
            { cursor: '2001-01-01T00:00:00Z', limit: 1 }
        )) {
            expect(response.records).toEqual([]);
        }
    });

    it('paginates per-DID data across contracts after excluding expired consent', async () => {
        const { termsUri } = await consent();
        await ConsentFlowTerms.update(
            { updatedAt: '2001-01-01T00:00:00Z' },
            { where: { id: termsUri.split(':').at(-1)! } }
        );
        await consent({ expiresAt: '2000-01-01T00:00:00Z' });
        const response = await owner.clients.fullAuth.contracts.getConsentedDataForDid({
            did: learnerDid,
            limit: 1,
        });
        expect(response.records).toHaveLength(1);
        expect(response.hasMore).toBe(false);
        expect(response.cursor).toBe('2001-01-01T00:00:00Z');
        const next = await owner.clients.fullAuth.contracts.getConsentedDataForDid({
            did: learnerDid,
            limit: 1,
            cursor: response.cursor,
        });
        expect(next.records).toEqual([]);
    });
});
