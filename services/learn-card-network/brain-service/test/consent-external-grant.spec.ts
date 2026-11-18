import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const pruningMocks = vi.hoisted(() => ({ prune: vi.fn() }));
vi.mock('@accesslayer/consentflowcontract/relationships/update', async importOriginal => {
    const actual =
        await importOriginal<
            typeof import('@accesslayer/consentflowcontract/relationships/update')
        >();
    pruningMocks.prune.mockImplementation(actual.pruneDeletedUrisFromConsentTerms);
    return { ...actual, pruneDeletedUrisFromConsentTerms: pruningMocks.prune };
});

const signingAuthorityMocks = vi.hoisted(() => ({ issueCredential: vi.fn() }));
vi.mock('@helpers/signingAuthority.helpers', async importOriginal => {
    const actual = await importOriginal<typeof import('@helpers/signingAuthority.helpers')>();
    signingAuthorityMocks.issueCredential.mockImplementation(
        actual.issueCredentialWithSigningAuthority
    );
    return {
        ...actual,
        issueCredentialWithSigningAuthority: signingAuthorityMocks.issueCredential,
    };
});

import { neogma } from '@instance';
import {
    Boost,
    ConsentFlowContract,
    ConsentFlowTerms,
    ConsentFlowTransaction,
    Credential,
    Profile,
    SigningAuthority,
} from '@models';
import {
    getContractTermsByUri,
    getTransactionsForTerms,
} from '@accesslayer/consentflowcontract/relationships/read';
import { normalContract, normalFullTerms } from './helpers/contract';
import { getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';

const externalGrant = {
    issuer: 'https://grants.example.test',
    ref: 'consent-123',
    revision: 0,
    hash: 'grant-hash-v0',
};
const expectedGrant = { revision: externalGrant.revision, hash: externalGrant.hash };
const conflict = {
    code: 'CONFLICT',
    message: 'External grant revision or hash does not match the expected grant',
};
const signingAuthority = { endpoint: 'http://localhost:5000/api', name: 'mysa' };
type Fixture = { contractUri: string; termsUri: string; boostUri: string };
type WriteRoute = 'direct' | 'signing authority';
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const setupConsent = async (withGrant = true): Promise<Fixture> => {
    const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
        contract: normalContract,
        name: 'External grant contract',
    });
    const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
        contractUri,
        terms: { ...normalFullTerms, ...(withGrant ? { externalGrant } : {}) },
    });
    const boostUri = await userA.clients.fullAuth.boost.createBoost({
        credential: testUnsignedBoost,
        category: 'Achievement',
        name: 'External grant boost',
    });
    const stored = await getContractTermsByUri(termsUri);
    expect(stored).not.toBeNull();
    expect(stored!.terms.terms.externalGrant).toEqual(withGrant ? externalGrant : undefined);
    return { contractUri, termsUri, boostUri };
};

const writeCredential = async (
    route: WriteRoute,
    fixture: Fixture,
    expectedExternalGrant?: typeof expectedGrant
): Promise<string> => {
    const input = {
        did: userB.learnCard.id.did(),
        contractUri: fixture.contractUri,
        boostUri: fixture.boostUri,
        ...(expectedExternalGrant ? { expectedExternalGrant } : {}),
    };
    if (route === 'signing authority') {
        return userA.clients.fullAuth.contracts.writeCredentialToContractViaSigningAuthority({
            ...input,
            signingAuthority,
        });
    }
    const credential = await userA.learnCard.invoke.issueCredential({
        ...testUnsignedBoost,
        issuer: userA.learnCard.id.did(),
        credentialSubject: { ...testUnsignedBoost.credentialSubject, id: userB.learnCard.id.did() },
        boostId: fixture.boostUri,
    });
    return userA.clients.fullAuth.contracts.writeCredentialToContract({ ...input, credential });
};

const expectNoDelivery = async (termsUri: string): Promise<void> => {
    // Serial suite, empty credential graph per case: detect even unlinked orphan nodes.
    expect(await Credential.findMany({ where: {} })).toHaveLength(0);
    const sent = await neogma.queryRunner.run(
        'MATCH ()-[edge:CREDENTIAL_SENT]->() RETURN count(edge) AS count'
    );
    expect(Number(sent.records[0]!.get('count'))).toBe(0);
    const edges = await neogma.queryRunner.run(
        'MATCH (:Credential)-[edge]-(:ConsentFlowTransaction) RETURN count(edge) AS count'
    );
    expect(Number(edges.records[0]!.get('count'))).toBe(0);
    const stored = await getContractTermsByUri(termsUri);
    expect(stored).not.toBeNull();
    const transactions = await getTransactionsForTerms(stored!.terms.id, { limit: 100 });
    expect(transactions.filter(transaction => transaction.action === 'write')).toEqual([]);
};

const expectDelivery = async (fixture: Fixture, uri: string): Promise<void> => {
    expect(uri).toEqual(expect.any(String));
    expect(await Credential.findMany({ where: {} })).toHaveLength(1);
    const deliveries = await userB.clients.fullAuth.contracts.getCredentialsForContract({
        termsUri: fixture.termsUri,
    });
    expect(deliveries.records).toHaveLength(1);
    const stored = await getContractTermsByUri(fixture.termsUri);
    const transactions = await getTransactionsForTerms(stored!.terms.id, { limit: 100 });
    expect(transactions.filter(transaction => transaction.action === 'write')).toHaveLength(1);
};

describe('Consent external grant issuance fence', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });
    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await ConsentFlowTransaction.delete({ detach: true, where: {} });
        await ConsentFlowTerms.delete({ detach: true, where: {} });
        await ConsentFlowContract.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userA.clients.fullAuth.profile.registerSigningAuthority({
            ...signingAuthority,
            did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
        });
    });

    describe.each(['direct', 'signing authority'] as const)('%s write route', route => {
        it('delivers when stored revision and hash match', async () => {
            const fixture = await setupConsent();
            await expectDelivery(fixture, await writeCredential(route, fixture, expectedGrant));
        });
        it.each([
            { revision: 1, hash: expectedGrant.hash },
            { revision: expectedGrant.revision, hash: 'different-hash' },
        ])('rejects mismatched expectation %j and cleans up', async expectation => {
            const fixture = await setupConsent();
            await expect(writeCredential(route, fixture, expectation)).rejects.toMatchObject(
                conflict
            );
            await expectNoDelivery(fixture.termsUri);
        });
        it.each([true, false])(
            'preserves issuance without expectation (stored grant: %s)',
            async withGrant => {
                const fixture = await setupConsent(withGrant);
                await expectDelivery(fixture, await writeCredential(route, fixture));
            }
        );
        it('rejects expectation when no grant is stored', async () => {
            const fixture = await setupConsent(false);
            await expect(writeCredential(route, fixture, expectedGrant)).rejects.toMatchObject(
                conflict
            );
            await expectNoDelivery(fixture.termsUri);
        });
    });

    it('stale route pruning preserves a newer grant and rejects the old expectation', async () => {
        const fixture = await setupConsent();
        const sharingTerms = {
            ...normalFullTerms,
            externalGrant,
            read: {
                ...normalFullTerms.read,
                credentials: {
                    ...normalFullTerms.read.credentials,
                    categories: {
                        ...normalFullTerms.read.credentials.categories,
                        Achievement: { sharing: true, shared: ['delete-uri', 'keep-uri'] },
                    },
                },
            },
        };
        await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: fixture.termsUri,
            terms: sharingTerms,
        });
        const newerGrant = { ...externalGrant, revision: 1, hash: 'grant-hash-v1' };
        const realPrune = pruningMocks.prune.getMockImplementation();
        if (!realPrune) throw new Error('Real pruning helper was not initialized');
        // The route has loaded its old snapshot; commit a real update before it prunes.
        pruningMocks.prune.mockImplementationOnce(async (terms, deletedUris) => {
            expect(terms.terms.externalGrant).toEqual(externalGrant);
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: fixture.termsUri,
                terms: { ...sharingTerms, externalGrant: newerGrant },
            });
            return realPrune(terms, deletedUris);
        });
        const result = await userB.clients.fullAuth.contracts.deleteCredentialFromAllContracts({
            deletedUris: ['delete-uri'],
        });
        expect(result).toEqual({ contractsUpdated: 1, removedSharedUris: 1 });
        const stored = (await getContractTermsByUri(fixture.termsUri))!.terms.terms;
        expect(stored.externalGrant).toEqual(newerGrant);
        expect(stored.read.credentials.categories.Achievement?.shared).toEqual(['keep-uri']);
        await expect(writeCredential('direct', fixture, expectedGrant)).rejects.toMatchObject(
            conflict
        );
        await expectNoDelivery(fixture.termsUri);
    });

    it.each(['missing', 'invalid-sharing', 'invalid-grant'] as const)(
        'leaves %s stored terms untouched during pruning',
        async shape => {
            const fixture = await setupConsent();
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: fixture.termsUri,
                terms: {
                    ...normalFullTerms,
                    externalGrant,
                    read: {
                        ...normalFullTerms.read,
                        credentials: {
                            ...normalFullTerms.read.credentials,
                            categories: {
                                ...normalFullTerms.read.credentials.categories,
                                Achievement: {
                                    sharing: true,
                                    shared: ['deleted-uri', 'retained-uri'],
                                },
                            },
                        },
                    },
                },
            });
            const snapshot = (await getContractTermsByUri(fixture.termsUri))!.terms;
            const original = await neogma.queryRunner.run(
                'MATCH (terms:ConsentFlowTerms {id:$id}) RETURN properties(terms) AS properties',
                { id: snapshot.id }
            );
            const properties: Record<string, unknown> = original.records[0]!.get('properties');
            const malformed =
                shape === 'missing'
                    ? Object.fromEntries(
                          Object.entries(properties).filter(([key]) => !key.startsWith('terms.'))
                      )
                    : {
                          ...properties,
                          ...(shape === 'invalid-sharing'
                              ? {
                                    'terms.read.credentials.categories.Achievement.sharing':
                                        'not-a-boolean',
                                }
                              : { 'terms.externalGrant.revision': -1 }),
                      };
            await neogma.queryRunner.run(
                'MATCH (terms:ConsentFlowTerms {id:$id}) SET terms = $properties',
                { id: snapshot.id, properties: malformed }
            );
            const before = await neogma.queryRunner.run(
                `MATCH (terms:ConsentFlowTerms {id:$id})
                 OPTIONAL MATCH (transaction:ConsentFlowTransaction)-[:IS_FOR]->(terms)
                 RETURN properties(terms) AS properties, count(transaction) AS audits`,
                { id: snapshot.id }
            );
            // The caller's snapshot remains valid; maintenance must validate the
            // fresh database node, not trust this earlier read.
            await expect(pruningMocks.prune(snapshot, ['deleted-uri'])).resolves.toBe(0);
            const after = await neogma.queryRunner.run(
                `MATCH (terms:ConsentFlowTerms {id:$id})
                 OPTIONAL MATCH (transaction:ConsentFlowTransaction)-[:IS_FOR]->(terms)
                 RETURN properties(terms) AS properties, count(transaction) AS audits`,
                { id: snapshot.id }
            );
            expect(after.records).toHaveLength(1);
            expect(after.records[0]!.get('properties')).toEqual(
                before.records[0]!.get('properties')
            );
            expect(after.records[0]!.get('audits')).toEqual(before.records[0]!.get('audits'));
        }
    );

    describe.each(['withdraw', 'revision bump'] as const)(
        'concurrent route contention: %s',
        mutation => {
            const iterations = Number(process.env.CONTRACT_CONTENTION_ITERATIONS ?? 20);
            const failures: unknown[] = [];
            const wins = {
                completed: 0,
                write: 0,
                mutation: 0,
                violations: 0,
                unexpected: 0,
                serverErrors: 0,
            };
            afterAll(() => {
                console.log('EXTERNAL_GRANT_CONTENTION', mutation, JSON.stringify(wins));
                expect(wins.unexpected, JSON.stringify(failures)).toBe(0);
            });
            it.each(Array.from({ length: iterations }, (_, i) => i + 1))(
                'preserves commit-order invariant %i',
                async iteration => {
                    const fixture = await setupConsent();
                    const before = (await getContractTermsByUri(fixture.termsUri))!.terms;
                    // Sign before launching either route, so crypto does not serialize the race.
                    const credential = await userA.learnCard.invoke.issueCredential({
                        ...testUnsignedBoost,
                        issuer: userA.learnCard.id.did(),
                        credentialSubject: {
                            ...testUnsignedBoost.credentialSubject,
                            id: userB.learnCard.id.did(),
                        },
                        boostId: fixture.boostUri,
                    });
                    const bumpedGrant = { ...externalGrant, revision: 1, hash: 'grant-hash-v1' };
                    try {
                        const [write, change] = await Promise.allSettled([
                            userA.clients.fullAuth.contracts.writeCredentialToContract({
                                did: userB.learnCard.id.did(),
                                contractUri: fixture.contractUri,
                                boostUri: fixture.boostUri,
                                credential,
                                expectedExternalGrant: expectedGrant,
                            }),
                            mutation === 'withdraw'
                                ? userB.clients.fullAuth.contracts.withdrawConsent({
                                      uri: fixture.termsUri,
                                  })
                                : userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                                      uri: fixture.termsUri,
                                      terms: { ...normalFullTerms, externalGrant: bumpedGrant },
                                  }),
                        ]);
                        for (const [operation, result] of [
                            ['write', write],
                            ['change', change],
                        ] as const) {
                            if (result.status === 'fulfilled') continue;
                            if (
                                operation === 'write' &&
                                ['FORBIDDEN', 'CONFLICT'].includes(result.reason.code)
                            )
                                continue;
                            wins.unexpected += 1;
                            if (result.reason.code === 'INTERNAL_SERVER_ERROR')
                                wins.serverErrors += 1;
                            const chain: {
                                name: string;
                                code: string;
                                message: string;
                                stack: string;
                            }[] = [];
                            let current: unknown = result.reason;
                            for (
                                let depth = 0;
                                depth < 6 && current && typeof current === 'object';
                                depth += 1
                            ) {
                                chain.push({
                                    name: String(Reflect.get(current, 'name') ?? ''),
                                    code: String(Reflect.get(current, 'code') ?? ''),
                                    message: String(Reflect.get(current, 'message') ?? ''),
                                    stack: String(Reflect.get(current, 'stack') ?? ''),
                                });
                                current = Reflect.get(current, 'cause');
                            }
                            failures.push({ iteration, operation, chain });
                        }
                        const current = (await getContractTermsByUri(fixture.termsUri))!.terms;
                        if (change.status === 'fulfilled') {
                            if (mutation === 'withdraw') expect(current.status).toBe('withdrawn');
                            else expect(current.terms.externalGrant).toEqual(bumpedGrant);
                        }
                        const delivered = await neogma.queryRunner.run(
                            `MATCH (credential:Credential)-[:ISSUED_VIA_TRANSACTION]->(transaction:ConsentFlowTransaction)-[:IS_FOR]->(:ConsentFlowTerms {id:$id})
                     RETURN transaction.consentMutationVersion AS version,
                            transaction.externalGrantRevision AS revision, transaction.externalGrantHash AS hash`,
                            { id: before.id }
                        );
                        if (write.status === 'fulfilled') {
                            // Historical delivery is valid only if its locked snapshot
                            // predates the mutation. Withdrawal is not retroactive.
                            expect(delivered.records).toHaveLength(1);
                            expect(Number(delivered.records[0]!.get('version'))).toBe(
                                Number(before.mutationVersion ?? 0)
                            );
                            if (change.status === 'fulfilled')
                                expect(Number(delivered.records[0]!.get('version'))).toBeLessThan(
                                    Number(current.mutationVersion)
                                );
                            expect(Number(delivered.records[0]!.get('revision'))).toBe(0);
                            expect(delivered.records[0]!.get('hash')).toBe(externalGrant.hash);
                            expect(await Credential.findMany({ where: {} })).toHaveLength(1);
                            wins.write += 1;
                        } else {
                            await expectNoDelivery(fixture.termsUri);
                            wins.mutation += 1;
                        }
                        if (change.status === 'fulfilled') {
                            await expect(
                                writeCredential('direct', fixture, expectedGrant)
                            ).rejects.toMatchObject({
                                code: mutation === 'withdraw' ? 'FORBIDDEN' : 'CONFLICT',
                            });
                        }
                        const orphaned = await neogma.queryRunner.run(
                            'MATCH (credential:Credential) WHERE NOT (credential)-[:ISSUED_VIA_TRANSACTION]->() RETURN count(credential) AS count'
                        );
                        expect(Number(orphaned.records[0]!.get('count'))).toBe(0);
                        expect(await Credential.findMany({ where: {} })).toHaveLength(
                            write.status === 'fulfilled' ? 1 : 0
                        );
                        wins.completed += 1;
                    } catch (error) {
                        wins.violations += 1;
                        throw error;
                    }
                },
                30000
            );
        }
    );

    // Ordered in-flight issuance races, NOT simultaneous database transactions.
    // Same-key issuance idempotency is a separate feature and is not asserted here.
    describe.each(['withdraw', 'revision bump'] as const)(
        'deterministic in-flight issuance race: %s before signing resumes',
        mutation => {
            it.each(Array.from({ length: 20 }, (_, index) => index + 1))(
                'rejects and cleans up iteration %i',
                async () => {
                    const fixture = await setupConsent();
                    let announceStarted!: () => void;
                    let releaseSigning!: () => void;
                    const started = new Promise<void>(resolve => {
                        announceStarted = resolve;
                    });
                    const gate = new Promise<void>(resolve => {
                        releaseSigning = resolve;
                    });
                    const realSigner =
                        signingAuthorityMocks.issueCredential.getMockImplementation();
                    if (!realSigner) throw new Error('Real signer was not initialized');
                    signingAuthorityMocks.issueCredential.mockImplementation(async (...args) => {
                        announceStarted();
                        await gate;
                        return realSigner(...args);
                    });
                    // Observe rejection immediately, even if issuance fails before reaching the signer.
                    const outcome = writeCredential(
                        'signing authority',
                        fixture,
                        expectedGrant
                    ).then(
                        value => ({ status: 'fulfilled' as const, value }),
                        error => ({ status: 'rejected' as const, error })
                    );
                    let timer: ReturnType<typeof setTimeout> | undefined;
                    try {
                        await Promise.race([
                            started,
                            outcome.then(() => {
                                throw new Error('Write settled before signer entry');
                            }),
                            new Promise<never>((_, reject) => {
                                timer = setTimeout(
                                    () => reject(new Error('Signer entry timed out')),
                                    10000
                                );
                            }),
                        ]);
                        if (mutation === 'withdraw') {
                            await userB.clients.fullAuth.contracts.withdrawConsent({
                                uri: fixture.termsUri,
                            });
                            expect(
                                (await getContractTermsByUri(fixture.termsUri))!.terms.status
                            ).toBe('withdrawn');
                        } else {
                            const bumpedGrant = { ...externalGrant, revision: 1 };
                            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                                uri: fixture.termsUri,
                                terms: { ...normalFullTerms, externalGrant: bumpedGrant },
                            });
                            expect(
                                (await getContractTermsByUri(fixture.termsUri))!.terms.terms
                                    .externalGrant
                            ).toEqual(bumpedGrant);
                        }
                        releaseSigning();
                        const result = await outcome;
                        expect(result.status).toBe('rejected');
                        if (result.status !== 'rejected')
                            throw new Error('Stale issuance was delivered');
                        expect(result.error).toMatchObject(
                            mutation === 'withdraw' ? { code: 'FORBIDDEN' } : conflict
                        );
                        await expectNoDelivery(fixture.termsUri);
                    } finally {
                        if (timer) clearTimeout(timer);
                        releaseSigning();
                        await outcome;
                        signingAuthorityMocks.issueCredential.mockImplementation(realSigner);
                    }
                },
                30000
            );
        }
    );
});
