import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { getIdFromUri } from '@helpers/uri.helpers';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const setup = async (expiresAt?: string) => {
    const suffix = randomBytes(5).toString('hex');
    const owner = await getUser(randomBytes(32).toString('hex'));
    const learner = await getUser(randomBytes(32).toString('hex'));
    await owner.clients.fullAuth.profile.createProfile({ profileId: `version-owner-${suffix}` });
    await learner.clients.fullAuth.profile.createProfile({ profileId: `version-user-${suffix}` });
    const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
        name: 'Version QA',
        contract: normalContract,
        expiresAt,
    });
    const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
        contractUri: uri,
        terms: normalFullTerms,
    });
    return { owner, learner, uri, termsUri };
};

describe('safe live contract patches', () => {
    it('merges every scope map and preserves existing grants unless explicitly removed', async () => {
        const { owner, uri, termsUri } = await setup();
        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: {
                        credentials: { categories: { Transcript: { required: false } } },
                        personal: { nickname: { required: false } },
                    },
                    write: {
                        credentials: { categories: { Certificate: { required: false } } },
                        personal: { phone: { required: false } },
                    },
                },
            },
        });
        expect(result.kind).toBe('expanded_optional');
        const current = await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2);
        expect(current?.contract.read.credentials.categories).toMatchObject(
            normalContract.read.credentials.categories
        );
        expect(current?.contract.write.credentials.categories).toMatchObject(
            normalContract.write.credentials.categories
        );
        expect(current?.contract.read.personal).toMatchObject(normalContract.read.personal);
        expect(current?.contract.write.personal).toMatchObject(normalContract.write.personal);
        const granted = (await getContractTermsByUri(termsUri))!.terms;
        expect(granted.status).toBe('live');
        expect(granted.terms.read.personal).toMatchObject(normalFullTerms.read.personal);
        expect(granted.terms.read.credentials.categories.ID).toEqual(
            normalFullTerms.read.credentials.categories.ID
        );
        expect(granted.terms.write.credentials.categories.Certificate).toBe(false);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { contract: { read: { credentials: { categories: {} } } } },
        });
        expect(
            (await getContractTermsByUri(termsUri))!.terms.terms.read.credentials.categories.ID
        ).toEqual(normalFullTerms.read.credentials.categories.ID);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { contract: { read: { credentials: { categories: { ID: null } } } } },
        });
        const removed = (await getContractTermsByUri(termsUri))!.terms;
        expect(removed.terms.read.credentials.categories.ID).toBeUndefined();
        expect(removed.terms.read.credentials.categories.Achievement).toEqual(
            normalFullTerms.read.credentials.categories.Achievement
        );
    });

    it('clears expiry explicitly without changing the ticket-approved quiet-extension policy', async () => {
        const { owner, uri, termsUri } = await setup('2100-01-01T00:00:00.000Z');
        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { expiresAt: null },
        });
        expect(result.kind).toBe('relaxed');
        expect(
            (await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2))?.expiresAt
        ).toBeUndefined();
        expect((await getContractTermsByUri(termsUri))!.terms.status).toBe('live');
    });

    it.each(['writer', 'autoboost'] as const)(
        'rejects an unknown %s without committing or retaining a lock',
        async kind => {
            const { owner, uri } = await setup();
            const changes =
                kind === 'writer'
                    ? { writers: ['missing-writer'] }
                    : {
                          autoboosts: [
                              {
                                  id: 'missing-boost',
                                  signingAuthorityEndpoint: 'http://localhost:5000/api',
                                  signingAuthorityName: 'default',
                              },
                          ],
                      };
            await expect(
                owner.clients.fullAuth.contracts.updateConsentFlowContract({
                    uri,
                    changes,
                    reason: 'Test requested access',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            const state = await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id}) RETURN contract.currentVersion AS version, contract._contractVersionLock AS lock`,
                { id: getIdFromUri(uri) }
            );
            expect(Number(state.records[0]!.get('version'))).toBe(1);
            expect(state.records[0]!.get('lock')).toBeNull();
            expect(await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2)).toBeNull();
        }
    );

    it('removes the final requested scope without making the request unreadable', async () => {
        const { owner, learner } = await setup();
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Single option',
            contract: {
                read: { credentials: { categories: {} }, personal: {} },
                write: { credentials: { categories: { Only: { required: false } } }, personal: {} },
            },
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: {
                read: { credentials: { categories: {} }, personal: {} },
                write: { credentials: { categories: { Only: true } }, personal: {} },
            },
        });
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { contract: { write: { credentials: { categories: { Only: null } } } } },
        });
        const current = await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2);
        expect(current?.contract.write.credentials.categories).toEqual({});
        const terms = (await getContractTermsByUri(termsUri))!.terms;
        expect(terms.status).toBe('live');
        expect(terms.terms.write.credentials.categories).toEqual({});
    });

    it('accepts every required change across multiple unreviewed versions', async () => {
        const { owner, learner, uri, termsUri } = await setup();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: { credentials: { categories: { Transcript: { required: true } } } },
                },
            },
            reason: 'Verify completed courses.',
        });
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: {
                        credentials: { categories: { 'Learning History': { required: true } } },
                    },
                    write: {
                        credentials: {
                            categories: {
                                'Social Badge': { required: false, defaultEnabled: true },
                            },
                        },
                    },
                },
            },
            reason: 'Personalize learning and recognize progress.',
        });
        const listed = await learner.clients.fullAuth.contracts.getConsentedContracts({});
        const record = listed.records.find(item => item.uri === termsUri)!;
        expect(record.consentedVersion).toBe(1);
        expect(record.cumulativeUpdate).toMatchObject({
            fromVersion: 1,
            toVersion: 3,
            diff: {
                added: expect.arrayContaining([
                    expect.objectContaining({ area: 'read', key: 'Transcript', required: true }),
                    expect.objectContaining({
                        area: 'read',
                        key: 'Learning History',
                        required: true,
                    }),
                    expect.objectContaining({
                        area: 'write',
                        key: 'Social Badge',
                        required: false,
                    }),
                ]),
            },
        });

        const terms = structuredClone(record.terms);
        terms.read.credentials.shareAll = false;
        terms.read.credentials.categories['Learning History'] = {
            sharing: true,
            shareAll: true,
            shared: [],
        };
        terms.write.credentials.categories['Social Badge'] = true;
        await expect(
            learner.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms,
                acceptVersion: 3,
                audienceVersion: 0,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect((await getContractTermsByUri(termsUri))!.terms.consentedVersion).toBe(1);

        for (const scope of record.cumulativeUpdate!.diff.added) {
            if (scope.area === 'read' && scope.type === 'credential' && scope.required) {
                terms.read.credentials.categories[scope.key] = {
                    sharing: true,
                    shareAll: true,
                    shared: [],
                };
            }
        }
        expect(
            await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms,
                acceptVersion: record.cumulativeUpdate!.toVersion,
                audienceVersion: 0,
            })
        ).toBe(true);
        const saved = (await getContractTermsByUri(termsUri))!.terms;
        expect(saved).toMatchObject({ consentedVersion: 3, status: 'live' });
        expect(saved.terms.read.credentials.categories.Transcript?.sharing).toBe(true);
        expect(saved.terms.read.credentials.categories['Learning History']?.sharing).toBe(true);
        expect(saved.terms.write.credentials.categories).toMatchObject({
            ...normalFullTerms.write.credentials.categories,
            'Social Badge': true,
        });
    });

    it('clears pending optional defaults only after successfully saving the holder choices', async () => {
        const { owner, learner, uri, termsUri } = await setup();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    write: {
                        credentials: {
                            categories: {
                                'Social Badge': { required: false, defaultEnabled: true },
                            },
                        },
                    },
                },
            },
        });
        const pending = (
            await learner.clients.fullAuth.contracts.getConsentedContracts({})
        ).records.find(item => item.uri === termsUri)!;
        expect(pending.newOptionsUntil).toEqual(expect.any(String));
        const terms = structuredClone(pending.terms);
        delete terms.write.credentials.categories['Social Badge'];
        await expect(
            learner.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: {
                    ...terms,
                    read: { ...terms.read, personal: { unrequested: 'not allowed' } },
                },
                audienceVersion: 0,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect((await getContractTermsByUri(termsUri))!.terms.newOptionsUntil).toBe(
            pending.newOptionsUntil
        );
        expect(
            await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms,
                audienceVersion: 0,
            })
        ).toBe(true);
        const reopened = (
            await learner.clients.fullAuth.contracts.getConsentedContracts({})
        ).records.find(item => item.uri === termsUri)!;
        expect(reopened.newOptionsUntil).toBeUndefined();
        expect(reopened.terms.write.credentials.categories['Social Badge']).toBeUndefined();
        expect(reopened.terms.write.credentials.categories).toEqual(
            normalFullTerms.write.credentials.categories
        );
    });
});
