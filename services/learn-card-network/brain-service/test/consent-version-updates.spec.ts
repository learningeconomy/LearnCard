import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { getIdFromUri } from '@helpers/uri.helpers';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getClient, getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { testUnsignedBoost } from './helpers/send';
import type { ConsentFlowContractChanges } from '@learncard/types';
import { migrateLegacyConsentFlowContracts } from '@helpers/consentflow-legacy-migration.helpers';
import { seedLegacyAutoBoost } from './helpers/legacy-autoboost';

const setup = async (expiresAt?: string, oneTime = false) => {
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
        oneTime,
    });
    return { owner, learner, uri, termsUri };
};

describe('safe live contract patches', () => {
    it('saves choices for an already handled update as an update transaction', async () => {
        const { owner, learner, uri, termsUri } = await setup();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: { credentials: { categories: { Gamma: { required: false } } } },
                },
            },
        });
        const terms = structuredClone(normalFullTerms);
        terms.read.credentials.categories.Gamma = {
            shareAll: false,
            sharing: true,
            shared: [],
        };
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
            acceptVersion: 2,
        });
        terms.read.credentials.categories.Gamma.sharing = false;
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
        });

        const saved = (await getContractTermsByUri(termsUri))!;
        expect(saved.terms).toMatchObject({
            consentedVersion: 2,
            lastReviewedVersion: 2,
            status: 'live',
        });
        expect(saved.terms.terms.read.credentials.categories.Gamma.sharing).toBe(false);
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: termsUri,
        });
        expect(history.records.slice(0, 2).map(record => record.action)).toEqual([
            'update',
            'reconsent',
        ]);
    });

    it('preserves consumed one-time consent when updates omit oneTime', async () => {
        const { owner, learner, uri, termsUri } = await setup(undefined, true);
        const terms = structuredClone(normalFullTerms);
        terms.read.personal.name = 'Updated name';
        await expect(
            learner.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await getContractTermsByUri(termsUri))!.terms).toMatchObject({
            oneTime: true,
            status: 'consumed',
        });
        expect((await getContractTermsByUri(termsUri))!.terms.terms.read.personal.name).toBe(
            normalFullTerms.read.personal.name
        );

        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: { personal: { name: { required: true } } },
                },
            },
            reason: 'Require a name for the connected feature.',
        });
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
            acceptVersion: 2,
        });
        expect((await getContractTermsByUri(termsUri))!.terms).toMatchObject({
            oneTime: true,
            status: 'consumed',
            consentedVersion: 2,
            lastReviewedVersion: 2,
        });
    });
    it('recovers old quiet-update review baselines and advances them only after explicit review', async () => {
        const { owner, learner, uri, termsUri } = await setup();
        for (const key of ['Alpha', 'Beta']) {
            await owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: {
                    contract: {
                        read: {
                            credentials: {
                                categories: {
                                    [key]: { required: false },
                                },
                            },
                        },
                    },
                },
            });
        }
        await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms {id:$id}) REMOVE terms.lastReviewedVersion`,
            { id: getIdFromUri(termsUri) }
        );
        await neogma.queryRunner.run(
            `MATCH (migration:ConsentFlowContractMigration {id:'holder-review-v1'}) DELETE migration`
        );
        await migrateLegacyConsentFlowContracts();
        const recovered = (await getContractTermsByUri(termsUri))!;
        expect(recovered.terms).toMatchObject({
            consentedVersion: 3,
            lastReviewedVersion: 1,
            status: 'live',
        });
        expect(recovered.cumulativeUpdate?.diff.added.map(scope => scope.key)).toEqual([
            'Alpha',
            'Beta',
        ]);
        const selected = structuredClone(recovered.terms.terms);
        selected.read.credentials.categories.Alpha = { sharing: true, shareAll: true, shared: [] };
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: selected,
            acceptVersion: 3,
        });
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: {
                        credentials: {
                            categories: {
                                Gamma: { required: false },
                            },
                        },
                    },
                },
            },
        });
        const next = (await getContractTermsByUri(termsUri))!;
        expect(next.terms).toMatchObject({ consentedVersion: 4, lastReviewedVersion: 3 });
        expect(next.cumulativeUpdate?.diff.added.map(scope => scope.key)).toEqual(['Gamma']);
        expect(next.terms.terms.read.credentials.categories.Alpha.sharing).toBe(true);
        expect(next.terms.terms.read.credentials.categories.Gamma.sharing).toBe(false);
    });

    it('does not publish or mutate holders for an unchanged resulting request', async () => {
        const { owner, learner, uri, termsUri } = await setup();
        const before = (await getContractTermsByUri(termsUri))!.terms;
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: termsUri,
        });
        const unchanged: ConsentFlowContractChanges[] = [
            {},
            { name: 'Version QA' },
            { contract: { read: { personal: {} } } },
        ];
        for (const changes of unchanged) {
            const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes,
                expectedVersion: 1,
            });
            expect(result).toMatchObject({ version: 1, affectedUsers: 0 });
        }
        expect((await getContractTermsByUri(termsUri))!.terms).toEqual(before);
        expect(
            await learner.clients.fullAuth.contracts.getTermsTransactionHistory({ uri: termsUri })
        ).toEqual(history);
        expect(
            (await owner.clients.fullAuth.contracts.getContractVersions({ uri })).map(
                v => v.version
            )
        ).toEqual([1]);
        expect(
            (await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri })).latestUpdate
        ).toBeUndefined();
    });

    it.each([false, true])('rejects an obsolete draft version (dryRun=%s)', async dryRun => {
        const { owner, uri } = await setup();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { subtitle: 'Intervening publication' },
            expectedVersion: 1,
        });
        await expect(
            owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: { subtitle: 'Older draft' },
                expectedVersion: 1,
                dryRun,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(
            await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri })
        ).toMatchObject({ version: 2, subtitle: 'Intervening publication' });
    });

    it.each(['2000-01-01T00:00:00.000Z', 'now'])(
        'rejects a deadline at or before publication time: %s',
        async deadline => {
            const { owner, uri, termsUri } = await setup();
            await expect(
                owner.clients.fullAuth.contracts.updateConsentFlowContract({
                    uri,
                    changes: { name: 'New request identity' },
                    reason: 'Review the new request identity.',
                    reconsentDeadline: deadline === 'now' ? new Date().toISOString() : deadline,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect((await getContractTermsByUri(termsUri))!.terms).toMatchObject({
                status: 'live',
                consentedVersion: 1,
            });
            expect(
                (await owner.clients.fullAuth.contracts.getContractVersions({ uri })).map(
                    v => v.version
                )
            ).toEqual([1]);
        }
    );

    it('keeps a valid future approval deadline', async () => {
        const { owner, uri, termsUri } = await setup();
        const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { name: 'New request identity' },
            reason: 'Review the new request identity.',
            reconsentDeadline: deadline,
        });
        expect((await getContractTermsByUri(termsUri))!.terms).toMatchObject({
            status: 'needs_reconsent',
            reconsentDeadline: deadline,
        });
    });

    it('preserves existing delegated issuers without authorizing new delegated setups', async () => {
        const suffix = randomBytes(5).toString('hex');
        const owner = await getUser(randomBytes(32).toString('hex'));
        const learner = await getUser(randomBytes(32).toString('hex'));
        const writer = await getUser(randomBytes(32).toString('hex'));
        const ownerId = `legacy-owner-${suffix}`;
        const writerId = `legacy-writer-${suffix}`;
        await owner.clients.fullAuth.profile.createProfile({ profileId: ownerId });
        await learner.clients.fullAuth.profile.createProfile({
            profileId: `legacy-holder-${suffix}`,
        });
        await writer.clients.fullAuth.profile.createProfile({ profileId: writerId });
        await writer.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: 'http://localhost:5000/api',
            name: 'writer-sa',
            did: writer.learnCard.id.did(),
        });
        const boostUri = await writer.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Achievement',
            name: 'Existing writer delivery',
        });
        const config = {
            boostUri,
            signingAuthority: { endpoint: 'http://localhost:5000/api', name: 'writer-sa' },
        };
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Existing delegated request',
            contract: normalContract,
            writers: [writerId],
        });
        await seedLegacyAutoBoost(uri, { ...config, issuerProfileId: writerId });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: { ...normalFullTerms, deniedWriters: [writerId] },
        });
        await expect(
            writer.clients.fullAuth.contracts.addAutoBoostsToContract({
                contractUri: uri,
                autoboosts: [config],
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            writer.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                contractUri: uri,
                boostUris: [boostUri],
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: { subtitle: 'Updated description', autoboosts: [config] },
                expectedVersion: 1,
            })
        ).resolves.toMatchObject({ version: 2, kind: 'relaxed' });
        expect(
            (await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2))?.autoboosts
        ).toMatchObject([{ issuer: writerId, signingAuthorityName: 'writer-sa' }]);
        expect((await getContractTermsByUri(termsUri))!.terms).toMatchObject({
            status: 'live',
            consentedVersion: 2,
        });
        await owner.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: 'http://localhost:5000/api',
            name: 'owner-sa',
            did: owner.learnCard.id.did(),
        });
        await expect(
            owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: {
                    autoboosts: [
                        {
                            ...config,
                            signingAuthority: {
                                endpoint: 'http://localhost:5000/api',
                                name: 'owner-sa',
                            },
                        },
                    ],
                },
                reason: 'Change delivery signer.',
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(
            (await owner.clients.fullAuth.contracts.getContractVersions({ uri })).map(
                v => v.version
            )
        ).toEqual([2, 1]);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { autoboosts: [] },
        });
        await expect(
            owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: { autoboosts: [config] },
                reason: 'Add a new delivery.',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        const ownerBoost = await owner.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Achievement',
            name: 'Owner delivery',
        });
        await expect(
            owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: {
                    autoboosts: [
                        {
                            boostUri: ownerBoost,
                            signingAuthority: {
                                endpoint: 'http://localhost:5000/api',
                                name: 'owner-sa',
                            },
                        },
                    ],
                },
                reason: 'Add owner delivery.',
                expectedVersion: 3,
            })
        ).resolves.toMatchObject({ version: 4, kind: 'requires_consent' });
        expect(
            (await getConsentFlowContractVersionRecord(getIdFromUri(uri), 4))?.autoboosts
        ).toMatchObject([{ issuer: ownerId }]);
        expect((await getContractTermsByUri(termsUri))!.terms.status).toBe('needs_reconsent');
    });

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

    it('keeps cumulative optional additions visible after later quiet publications', async () => {
        const { owner, learner, uri, termsUri } = await setup();
        for (const name of ['Alpha', 'Beta']) {
            await owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri,
                changes: {
                    contract: {
                        read: { credentials: { categories: { [name]: { required: false } } } },
                    },
                },
            });
        }
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { subtitle: 'Updated description' },
        });

        const listed = await learner.clients.fullAuth.contracts.getConsentedContracts({});
        const record = listed.records.find(item => item.uri === termsUri)!;
        expect(record.cumulativeUpdate).toMatchObject({
            fromVersion: 1,
            toVersion: 4,
            diff: {
                added: expect.arrayContaining([
                    expect.objectContaining({ key: 'Alpha', required: false }),
                    expect.objectContaining({ key: 'Beta', required: false }),
                ]),
            },
        });
    });
    it('requires review and queues a holder notification when a required scope reason changes', async () => {
        const { owner, learner } = await setup();
        const contract = structuredClone(normalContract);
        contract.read.credentials.categories.Transcript = {
            required: true,
            reason: 'Verify enrollment',
        };
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Required transcript',
            contract,
        });
        const terms = structuredClone(normalFullTerms);
        terms.read.credentials.categories.Transcript = {
            sharing: true,
            shareAll: true,
            shared: [],
        };
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms,
        });
        const reason = 'Personalize recommendations';
        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: {
                        credentials: { categories: { Transcript: { required: true, reason } } },
                    },
                },
            },
            reason: 'The reason for requesting this information has changed.',
        });
        expect(result).toMatchObject({ version: 2, kind: 'requires_consent', affectedUsers: 1 });
        const holder = (await getContractTermsByUri(termsUri))!;
        expect(holder.terms).toMatchObject({ status: 'needs_reconsent', consentedVersion: 1 });
        expect(holder.cumulativeUpdate?.diff.changed).toContainEqual(
            expect.objectContaining({ key: 'Transcript', reason })
        );
        const learnerProfile = (await learner.clients.fullAuth.profile.getProfile())!;
        const notifications = (await getClient().test.notificationQueue()).filter(
            notification =>
                notification.type === 'CONSENT_FLOW_CONTRACT_UPDATED' &&
                notification.data?.contractUri === uri &&
                notification.data?.toVersion === result.version
        );
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toMatchObject({
            to: { profileId: learnerProfile.profileId },
            message: { body: 'The reason for requesting this information has changed.' },
            data: {
                kind: 'requires_consent',
                diff: { changed: [expect.objectContaining({ key: 'Transcript', reason })] },
            },
        });
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
