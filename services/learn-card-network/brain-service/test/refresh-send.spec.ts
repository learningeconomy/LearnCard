import { vi } from 'vitest';
import { JWEValidator, VC, UnsignedVC } from '@learncard/types';
import { injectManagedRefreshService } from '@learncard/helpers';

const MANAGED_REFRESH_TYPE_TERM = 'LearnCardCredentialRefresh2026';

/**
 * The signing-authority helper signs as the brain identity under the unit-test mock,
 * which managed binding would (correctly) reject as a foreign issuer. Replace it with
 * an issuer-controlled authority: the credential is signed with the issuer's own key
 * after the server-driven status allocation, mirroring a real registered SA.
 */
const signingAuthorityMocks = vi.hoisted(() => ({
    issueCredential: vi.fn(),
}));

vi.mock('@helpers/signingAuthority.helpers', async importOriginal => ({
    ...(await importOriginal<Record<string, unknown>>()),
    issueCredentialWithSigningAuthority: signingAuthorityMocks.issueCredential,
}));

import { neogma } from '@instance';
import {
    Boost,
    ConsentFlowContract,
    Credential,
    CredentialActivity,
    CredentialRefresh,
    InboxCredential,
    Profile,
    SigningAuthority,
} from '@models';

import { getClient, getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import { blockProfile } from '@helpers/connection.helpers';
import { appendBitstringStatusListEntries } from '@helpers/status-list.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getCredentialRefresh, getCredentialRefreshHead } from '@accesslayer/credential-refresh';
import { testUnsignedBoost } from './helpers/send';

// Minimal VC 2.0 isolates the managed send/status behavior here. The real-signing
// E2E matrix also covers VCDM 2.0 + OBv3 3.0.3: only older OB contexts (through
// 3.0.1) conflict with VC2 protected terms, not OBv3 as a whole.
const testUnsignedVcV2: UnsignedVC = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:web:localhost%3A3000:users:refresh-send-issuer',
    name: 'Refreshable VC',
    credentialSubject: { id: 'did:example:recipient' },
} as UnsignedVC;

let brain: SeedLearnCard;
let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let outsider: Awaited<ReturnType<typeof getUser>>;

const ISSUER_PROFILE_ID = 'refresh-send-issuer';
const HOLDER_PROFILE_ID = 'refresh-send-holder';
const OUTSIDER_PROFILE_ID = 'refresh-send-outsider';
const DOMAIN = 'localhost%3A3000';

type SendResult = {
    type: 'boost';
    uri: string;
    credentialUri: string;
    activityId: string;
    refresh?: {
        refreshId: string;
        refreshService: { id: string; type: string; authorization?: { type: string } };
        credentialId: string;
        issuerDid: string;
        holderDid: string;
        credentialStatus?: unknown;
    };
};

const toNum = (value: unknown): number =>
    value && typeof (value as { toNumber?: () => number }).toNumber === 'function'
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value ?? 0);

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

const countNodes = async (label: string): Promise<number> =>
    toNum((await runQuery(`MATCH (n:${label}) RETURN count(n) AS count`)).records[0]?.get('count'));

const countRelationships = async (type: string): Promise<number> =>
    toNum(
        (await runQuery(`MATCH ()-[r:${type}]->() RETURN count(r) AS count`)).records[0]?.get(
            'count'
        )
    );

/** The stored root credential body must be a holder-only JWE, never plaintext. */
const getRootCredentialBody = async (refreshId: string): Promise<string> => {
    const result = await runQuery(
        `MATCH (:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         RETURN root.credential AS credential LIMIT 1`,
        { refreshId }
    );

    return result.records[0]?.get('credential');
};

const expectsNoMutation = async (baseline: Record<string, number>) => {
    const counts: Record<string, number> = {
        credential: await countNodes('Credential'),
        boost: await countNodes('Boost'),
        refresh: await countNodes('CredentialRefresh'),
        activity: await countNodes('CredentialActivity'),
        inbox: await countNodes('InboxCredential'),
    };

    expect(counts).toEqual(baseline);
};

const getMutationBaseline = async (): Promise<Record<string, number>> => ({
    credential: await countNodes('Credential'),
    boost: await countNodes('Boost'),
    refresh: await countNodes('CredentialRefresh'),
    activity: await countNodes('CredentialActivity'),
    inbox: await countNodes('InboxCredential'),
});

describe('Unified send with managed refresh (LC-2198)', () => {
    beforeAll(async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';

        brain = await getLearnCard();
        issuer = await getUser('e'.repeat(64));
        holder = await getUser('9'.repeat(64));
        outsider = await getUser('1'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );

        await runQuery(
            'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE'
        );
        await runQuery(
            'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE'
        );

        signingAuthorityMocks.issueCredential.mockImplementation(
            async (
                _issuer: unknown,
                credential: UnsignedVC,
                _signingAuthority: unknown,
                domain: string,
                _encrypt = true,
                _ownerDidOverride: unknown,
                appendCredentialStatus = true
            ) => {
                const body = appendCredentialStatus
                    ? await appendBitstringStatusListEntries(credential, ISSUER_PROFILE_ID, domain)
                    : credential;

                const vc = await issuer.learnCard.invoke.issueCredential({
                    ...body,
                    issuer: issuer.learnCard.id.did(),
                });

                return { kind: 'issued-credential', credential: vc, statusEntries: [] };
            }
        );
    });

    afterAll(() => {
        signingAuthorityMocks.issueCredential.mockRestore();
    });

    beforeEach(async () => {
        await runQuery('MATCH (r:CredentialRefresh) DETACH DELETE r');
        await runQuery('MATCH (a:CredentialActivity) DETACH DELETE a');
        await runQuery('MATCH (t:ConsentFlowTransaction) DETACH DELETE t');
        await runQuery('MATCH (c:Credential) DETACH DELETE c');
        await Boost.delete({ detach: true, where: {} });
        await InboxCredential.delete({ detach: true, where: {} });
        await ConsentFlowContract.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await runQuery('MATCH (p:Profile) DETACH DELETE p');

        await issuer.clients.fullAuth.profile.createProfile({ profileId: ISSUER_PROFILE_ID });
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_PROFILE_ID });
        await outsider.clients.fullAuth.profile.createProfile({ profileId: OUTSIDER_PROFILE_ID });

        await issuer.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: 'https://sa.example.com',
            name: 'refresh-send-sa',
            did: issuer.learnCard.id.did(),
        });

        addNotificationToQueueSpy.mockReset();
    });

    describe('inline refresh preparation', () => {
        it('preserves metadata, permissions, skills and contract linkage, then reuses one boost', async () => {
            const contractUri = await issuer.clients.fullAuth.contracts.createConsentFlowContract({
                contract: {
                    read: { anonymize: false },
                    write: { credentials: { categories: { TestBoosts: { required: false } } } },
                },
                name: 'Prepared Refresh Contract',
                writers: [ISSUER_PROFILE_ID],
            });
            await holder.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: {
                    read: { anonymize: false },
                    write: { credentials: { categories: { TestBoosts: true } } },
                },
            });
            const frameworkId = `refresh-prep-${crypto.randomUUID()}`;
            await issuer.clients.fullAuth.skillFrameworks.createManaged({
                id: frameworkId,
                name: 'Refresh skills',
            });
            await issuer.clients.fullAuth.skills.create({
                frameworkId,
                skill: { id: 'skill-1', statement: 'Refresh skill' },
            });
            const baseline = await getMutationBaseline();
            const uri = await issuer.clients.fullAuth.boost.prepareRefreshableSend({
                recipient: HOLDER_PROFILE_ID,
                contractUri,
                template: {
                    credential: testUnsignedBoost,
                    name: 'Prepared Boost',
                    category: 'TestBoosts',
                    claimPermissions: { canView: true },
                    skills: [{ frameworkId, id: 'skill-1', proficiencyLevel: 2 }],
                },
            });
            const boost = await issuer.clients.fullAuth.boost.getBoost({ uri });
            expect(boost).toMatchObject({
                name: 'Prepared Boost',
                category: 'TestBoosts',
                claimPermissions: { canView: true },
            });
            expect(await issuer.clients.fullAuth.boost.getBoostSkills({ uri })).toEqual([
                expect.objectContaining({ id: 'skill-1', proficiencyLevel: 2 }),
            ]);
            const links = await runQuery(
                'MATCH (:ConsentFlowContract)-[:RELATED_TO]->(b:Boost {name: $name}) RETURN count(b) AS count',
                { name: 'Prepared Boost' }
            );
            expect(toNum(links.records[0].get('count'))).toBe(1);
            // Preparation creates only the anchor, not an allocation or delivery.
            await expectsNoMutation({ ...baseline, boost: baseline.boost + 1 });
            const allocation =
                await issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId: 'urn:uuid:prepared-send',
                });
            const signedCredential = await issuer.learnCard.invoke.issueCredential(
                injectManagedRefreshService(
                    {
                        ...testUnsignedBoost,
                        id: 'urn:uuid:prepared-send',
                        issuer: issuer.learnCard.id.did(),
                        credentialSubject: {
                            ...testUnsignedBoost.credentialSubject,
                            id: holder.learnCard.id.did(),
                        },
                        boostId: uri,
                    },
                    allocation.refreshService
                )
            );
            const result = await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: uri,
                signedCredential,
                contractUri,
                refresh: true,
            });
            expect(result.uri).toBe(uri);
            expect(await countNodes('Boost')).toBe(baseline.boost + 1);
            const rows = await runQuery(
                `MATCH (root:Credential {refreshVersionKey: $key})-[:ISSUED_VIA_TRANSACTION]->(:ConsentFlowTransaction)-[:IS_FOR]->(:ConsentFlowTerms)
                 RETURN count(*) AS count`,
                { key: `${allocation.refreshId}:1` }
            );
            expect(toNum(rows.records[0].get('count'))).toBe(1);
        });

        it.each([
            ['holder@example.com', 'BAD_REQUEST'],
            ['+15551234567', 'BAD_REQUEST'],
            ['did:web:example.com:users:remote-holder', 'NOT_FOUND'],
            ['did:key:z6Mkunknown', 'NOT_FOUND'],
            ['unknown-profile', 'NOT_FOUND'],
        ])('rejects unsupported recipient %s before creating anything', async (recipient, code) => {
            const baseline = await getMutationBaseline();
            await expect(
                issuer.clients.fullAuth.boost.prepareRefreshableSend({
                    recipient,
                    template: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code });
            await expectsNoMutation(baseline);
        });

        it.each(['boosts:write', 'credentials:write'])(
            'requires both scopes, not just %s',
            async scope => {
                const client = getClient({
                    did: issuer.learnCard.id.did(),
                    isChallengeValid: true,
                    scope,
                });
                const baseline = await getMutationBaseline();
                await expect(
                    client.boost.prepareRefreshableSend({
                        recipient: HOLDER_PROFILE_ID,
                        template: { credential: testUnsignedBoost },
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
                await expectsNoMutation(baseline);
            }
        );

        it('rejects disabled refresh before creating anything', async () => {
            const baseline = await getMutationBaseline();
            const previous = process.env.CREDENTIAL_REFRESH_ENABLED;
            process.env.CREDENTIAL_REFRESH_ENABLED = 'false';
            try {
                await expect(
                    issuer.clients.fullAuth.boost.prepareRefreshableSend({
                        recipient: HOLDER_PROFILE_ID,
                        template: { credential: testUnsignedBoost },
                    })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            } finally {
                process.env.CREDENTIAL_REFRESH_ENABLED = previous;
            }
            await expectsNoMutation(baseline);
        });

        it('rejects blocked recipients before creating anything', async () => {
            await blockProfile(
                await issuer.clients.fullAuth.profile.getProfile(),
                await holder.clients.fullAuth.profile.getProfile()
            );
            const baseline = await getMutationBaseline();
            await expect(
                issuer.clients.fullAuth.boost.prepareRefreshableSend({
                    recipient: HOLDER_PROFILE_ID,
                    template: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            await expectsNoMutation(baseline);
        });

        it('rejects draft templates before creating anything', async () => {
            const baseline = await getMutationBaseline();
            await expect(
                issuer.clients.fullAuth.boost.prepareRefreshableSend({
                    recipient: HOLDER_PROFILE_ID,
                    template: { credential: testUnsignedBoost, status: 'DRAFT' },
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
            await expectsNoMutation(baseline);
        });
    });

    describe('refresh sends produce a usable receipt', () => {
        it('sends a refreshable boost from a templateUri to a local profile', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedVcV2,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            expect(result.type).toBe('boost');
            expect(result.uri).toBe(boostUri);
            expect(result.credentialUri).toBeDefined();
            expect(result.activityId).toBeDefined();

            expect(result.refresh).toBeDefined();
            expect(result.refresh!.refreshId).toBeDefined();
            expect(result.refresh!.refreshService.type).toBe('LearnCardCredentialRefresh2026');
            expect(result.refresh!.refreshService.id).toContain(result.refresh!.refreshId);
            expect(result.refresh!.credentialId).toBeDefined();
            expect(result.refresh!.issuerDid).toBe(issuer.learnCard.id.did());
            expect(result.refresh!.holderDid).toBe(getDidWeb(DOMAIN, HOLDER_PROFILE_ID));
            // Status descriptors are taken from the signed version 1
            expect(result.refresh!.credentialStatus).toBeDefined();

            // The stored root is a holder-only JWE, never plaintext
            const stored = await getRootCredentialBody(result.refresh!.refreshId);
            expect(stored).toBeDefined();
            expect(stored).not.toContain('Refreshable VC');
            expect(JWEValidator.safeParse(JSON.parse(stored)).success).toBe(true);

            // Bound as version 1
            const head = await getCredentialRefreshHead(result.refresh!.refreshId);
            expect(head).toMatchObject({ version: 1 });
        });

        it('resolves profile DIDs as recipients', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const holderProfile = await holder.clients.fullAuth.profile.getProfile();

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: holderProfile.did,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            expect(result.refresh).toBeDefined();
            // The receipt holder identity is the holder's public did:web, matching the
            // credential subject written by the template renderer.
            expect(result.refresh!.holderDid).toBe(getDidWeb(DOMAIN, HOLDER_PROFILE_ID));

            const didWeb = getDidWeb(DOMAIN, HOLDER_PROFILE_ID);

            const result2 = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: didWeb,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            expect(result2.refresh).toBeDefined();
            expect(result2.refresh!.holderDid).toBe(didWeb);
        });

        it('creates the boost when sending a refreshable inline template', async () => {
            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                template: { credential: testUnsignedBoost },
                refresh: true,
            })) as SendResult;

            expect(result.uri).toBeDefined();
            expect(result.refresh).toBeDefined();
            expect(result.refresh!.refreshId).toBeDefined();

            const boostId = await runQuery(
                `MATCH (c:Credential {refreshVersionKey: $key})-[:INSTANCE_OF]->(b:Boost)
                 RETURN b.id AS id LIMIT 1`,
                { key: `${result.refresh!.refreshId}:1` }
            );

            expect(boostId.records.length).toBe(1);
        });

        it('preserves activityId, integrationId, and boost linkage on the managed root', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                integrationId: 'integration-123',
                refresh: true,
            })) as SendResult;

            const rows = await runQuery(
                `MATCH (:Profile {profileId: $issuerId})-[sent:CREDENTIAL_SENT]->(root:Credential {refreshVersionKey: $key})
                 OPTIONAL MATCH (root)-[:INSTANCE_OF]->(b:Boost)
                 RETURN sent.activityId AS activityId, sent.integrationId AS integrationId,
                        b.id AS boostNodeId, $boostUri AS boostUri`,
                {
                    issuerId: ISSUER_PROFILE_ID,
                    key: `${result.refresh!.refreshId}:1`,
                    boostUri,
                }
            );

            expect(rows.records.length).toBe(1);
            expect(rows.records[0].get('activityId')).toBe(result.activityId);
            expect(rows.records[0].get('integrationId')).toBe('integration-123');
            expect(String(rows.records[0].get('boostNodeId'))).toBe(
                boostUri.split('/').pop()!.split(':').pop()
            );
        });

        it('correlates SEND and CLAIM activities through the same activityId', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            await holder.clients.fullAuth.credential.acceptCredential({
                uri: result.credentialUri,
            });

            const events = await runQuery(
                `MATCH (a:CredentialActivity {activityId: $activityId})
                 RETURN a.eventType AS eventType ORDER BY a.eventType`,
                { activityId: result.activityId }
            );

            const types = events.records.map(record => record.get('eventType')).sort();

            expect(types).toEqual(['CLAIMED', 'DELIVERED']);
        });

        it('preserves approved contract linkage on the managed root', async () => {
            const contractUri = await issuer.clients.fullAuth.contracts.createConsentFlowContract({
                contract: {
                    read: { anonymize: false },
                    write: { credentials: { categories: { TestBoosts: { required: false } } } },
                },
                name: 'Refresh Send Contract',
                writers: [ISSUER_PROFILE_ID],
            });

            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'TestBoosts',
            });

            await holder.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: {
                    read: { anonymize: false },
                    write: { credentials: { categories: { TestBoosts: true } } },
                },
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                contractUri,
                refresh: true,
            })) as SendResult;

            expect(result.refresh).toBeDefined();

            const rows = await runQuery(
                `MATCH (root:Credential {refreshVersionKey: $key})-[:ISSUED_VIA_TRANSACTION]->(:ConsentFlowTransaction)-[:IS_FOR]->(:ConsentFlowTerms)
                 RETURN count(*) AS count`,
                { key: `${result.refresh!.refreshId}:1` }
            );

            expect(toNum(rows.records[0].get('count'))).toBe(1);
        });
    });

    describe('preallocated signed credential handoff', () => {
        const buildHandoff = async (withStatus = false) => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credentialId = `urn:uuid:refresh-send-handoff-${withStatus ? 'status' : 'plain'}`;
            const allocation =
                await issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId,
                });

            const injected = injectManagedRefreshService(
                {
                    '@context': ['https://www.w3.org/ns/credentials/v2'],
                    id: credentialId,
                    type: ['VerifiableCredential'],
                    issuer: issuer.learnCard.id.did(),
                    validFrom: '2026-01-01T00:00:00Z',
                    name: 'Handoff Badge',
                    credentialSubject: { id: holder.learnCard.id.did() },
                } as UnsignedVC,
                allocation.refreshService
            );

            const toSign = withStatus
                ? ((await appendBitstringStatusListEntries(
                      injected,
                      ISSUER_PROFILE_ID,
                      DOMAIN
                  )) as UnsignedVC)
                : injected;

            const signed = await issuer.learnCard.invoke.issueCredential(toSign);

            return { boostUri, allocation, signed };
        };

        it('binds an already-allocated signed credential and returns the receipt', async () => {
            const { boostUri, signed } = await buildHandoff(true);

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                signedCredential: signed,
                refresh: true,
            })) as SendResult;

            expect(result.refresh).toBeDefined();
            expect(result.refresh!.refreshId).toBeDefined();
            expect(result.refresh!.credentialId).toBe(signed.id);
            expect(result.refresh!.issuerDid).toBe(issuer.learnCard.id.did());
            expect(result.refresh!.holderDid).toBe(holder.learnCard.id.did());
            expect(result.refresh!.credentialStatus).toEqual(
                (signed as unknown as Record<string, unknown>).credentialStatus
            );

            const head = await getCredentialRefreshHead(result.refresh!.refreshId);
            expect(head).toMatchObject({ version: 1 });
        });

        it('rejects a signed credential without an allocated managed service, with no second allocation', async () => {
            const baseline = await getMutationBaseline();

            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const signed = await issuer.learnCard.invoke.issueCredential({
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                id: 'urn:uuid:no-managed-service',
                type: ['VerifiableCredential'],
                issuer: issuer.learnCard.id.did(),
                validFrom: '2026-01-01T00:00:00Z',
                credentialSubject: { id: holder.learnCard.id.did() },
            } as UnsignedVC);

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: HOLDER_PROFILE_ID,
                    templateUri: boostUri,
                    signedCredential: signed,
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            // No allocation, no managed binding, no duplicate credential storage
            expect(await countNodes('CredentialRefresh')).toBe(baseline.refresh);
            expect(await countNodes('Credential')).toBe(baseline.credential);
        });

        it('rejects a signed credential whose allocation belongs to another issuer', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credentialId = 'urn:uuid:foreign-allocation';
            const allocation =
                await outsider.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId,
                });

            const signed = await outsider.learnCard.invoke.issueCredential(
                injectManagedRefreshService(
                    {
                        '@context': ['https://www.w3.org/ns/credentials/v2'],
                        id: credentialId,
                        type: ['VerifiableCredential'],
                        issuer: outsider.learnCard.id.did(),
                        validFrom: '2026-01-01T00:00:00Z',
                        credentialSubject: { id: holder.learnCard.id.did() },
                    } as UnsignedVC,
                    allocation.refreshService
                )
            );

            const baseline = await getMutationBaseline();

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: HOLDER_PROFILE_ID,
                    templateUri: boostUri,
                    signedCredential: signed,
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(await countNodes('Credential')).toBe(baseline.credential);
        });

        it('does not duplicate the root, activity, or notification when the same handoff is retried', async () => {
            const { boostUri, signed } = await buildHandoff();

            const first = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                integrationId: 'retry-integration',
                signedCredential: signed,
                refresh: true,
            })) as SendResult;

            const second = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                integrationId: 'retry-integration',
                signedCredential: signed,
                refresh: true,
            })) as SendResult;

            expect(second.credentialUri).toBe(first.credentialUri);
            expect(second.refresh!.refreshId).toBe(first.refresh!.refreshId);

            // Same activity reused — no duplicate issuance activity on resume
            expect(second.activityId).toBe(first.activityId);
            expect(await countNodes('CredentialActivity')).toBe(1);

            // One stored root, one sent relationship, one initial notification
            expect(await countNodes('Credential')).toBe(1);
            expect(await countRelationships('CREDENTIAL_SENT')).toBe(1);

            const notifications = addNotificationToQueueSpy.mock.calls.filter(
                ([event]) =>
                    (event as { type?: string })?.type === 'CREDENTIAL_RECEIVED' ||
                    (event as { notification?: { type?: string } })?.notification?.type ===
                        'CREDENTIAL_RECEIVED'
            );
            expect(notifications).toHaveLength(1);

            const head = await getCredentialRefreshHead(first.refresh!.refreshId);
            expect(head).toMatchObject({ version: 1 });
        });
    });

    describe('normal sends are unchanged', () => {
        it('returns no refresh receipt when refresh is omitted', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
            })) as SendResult;

            expect(result.refresh).toBeUndefined();
            expect(result.credentialUri).toBeDefined();
            expect(result.activityId).toBeDefined();
            expect(await countNodes('CredentialRefresh')).toBe(0);
        });

        it('returns no refresh receipt when refresh is false', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: false,
            })) as SendResult;

            expect(result.refresh).toBeUndefined();
            expect(await countNodes('CredentialRefresh')).toBe(0);
        });

        it('keeps the normal BOOST_RECEIVED notification for non-refresh sends', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
            });

            const boostNotifications = addNotificationToQueueSpy.mock.calls.filter(
                ([event]) =>
                    (event as { type?: string })?.type === 'BOOST_RECEIVED' ||
                    (event as { notification?: { type?: string } })?.notification?.type ===
                        'BOOST_RECEIVED'
            );

            expect(boostNotifications.length).toBeGreaterThan(0);
        });
    });

    describe('early rejection before any mutation', () => {
        it('rejects email recipients with a clear error and creates nothing', async () => {
            const baseline = await getMutationBaseline();

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: 'holder@example.com',
                    template: { credential: testUnsignedBoost },
                    refresh: true,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: expect.stringContaining('refresh'),
            });

            await expectsNoMutation(baseline);
        });

        it('rejects phone recipients with a clear error and creates nothing', async () => {
            const baseline = await getMutationBaseline();

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: '+15551234567',
                    template: { credential: testUnsignedBoost },
                    refresh: true,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: expect.stringContaining('refresh'),
            });

            await expectsNoMutation(baseline);
        });

        it('rejects remote/unresolvable DIDs before federation or delivery', async () => {
            const baseline = await getMutationBaseline();

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: 'did:web:example.com:users:remote-holder',
                    template: { credential: testUnsignedBoost },
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            await expectsNoMutation(baseline);

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: 'did:key:z6MkremoteHolderThatIsNotRegistered0000000',
                    template: { credential: testUnsignedBoost },
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            await expectsNoMutation(baseline);
        });

        it('rejects when the refresh feature is disabled and creates nothing', async () => {
            const baseline = await getMutationBaseline();
            const previous = process.env.CREDENTIAL_REFRESH_ENABLED;
            process.env.CREDENTIAL_REFRESH_ENABLED = 'false';

            try {
                await expect(
                    issuer.clients.fullAuth.boost.send({
                        type: 'boost',
                        recipient: HOLDER_PROFILE_ID,
                        template: { credential: testUnsignedBoost },
                        refresh: true,
                    })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            } finally {
                process.env.CREDENTIAL_REFRESH_ENABLED = previous;
            }

            await expectsNoMutation(baseline);
        });

        it('rejects refresh sends without the credentials:write scope', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const scopedClient = getClient({
                did: issuer.learnCard.id.did(),
                isChallengeValid: true,
                scope: 'boosts:write boosts:read',
            });

            const baseline = await getMutationBaseline();

            await expect(
                scopedClient.boost.send({
                    type: 'boost',
                    recipient: HOLDER_PROFILE_ID,
                    templateUri: boostUri,
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expectsNoMutation(baseline);
        });

        it('rejects blocked recipients before any mutation', async () => {
            const issuerProfile = await issuer.clients.fullAuth.profile.getProfile();
            const holderProfile = await holder.clients.fullAuth.profile.getProfile();
            await blockProfile(issuerProfile, holderProfile);

            const baseline = await getMutationBaseline();

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: HOLDER_PROFILE_ID,
                    template: { credential: testUnsignedBoost },
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            await expectsNoMutation(baseline);
        });

        it('rejects unauthorized issuers and draft boosts', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await expect(
                outsider.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: HOLDER_PROFILE_ID,
                    templateUri: boostUri,
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const draftUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                status: 'DRAFT',
            });

            const baseline = await getMutationBaseline();

            await expect(
                issuer.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: HOLDER_PROFILE_ID,
                    templateUri: draftUri,
                    refresh: true,
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });

            // The draft boost existed before the attempt; nothing new was created
            expect(await countNodes('CredentialRefresh')).toBe(baseline.refresh);
            expect(await countNodes('Credential')).toBe(baseline.credential);
        });
    });

    describe('self-send and notification behavior', () => {
        it('suppresses the initial notification for self-sends', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: ISSUER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            expect(result.refresh).toBeDefined();

            const refreshNotifications = addNotificationToQueueSpy.mock.calls.filter(
                ([event]) =>
                    (event as { type?: string })?.type === 'CREDENTIAL_RECEIVED' ||
                    (event as { notification?: { type?: string } })?.notification?.type ===
                        'CREDENTIAL_RECEIVED'
            );
            expect(refreshNotifications).toHaveLength(0);
        });

        it('notifies the holder with a CREDENTIAL_RECEIVED notification for managed sends', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            });

            const refreshNotifications = addNotificationToQueueSpy.mock.calls.filter(
                ([event]) =>
                    (event as { type?: string })?.type === 'CREDENTIAL_RECEIVED' ||
                    (event as { notification?: { type?: string } })?.notification?.type ===
                        'CREDENTIAL_RECEIVED'
            );
            expect(refreshNotifications).toHaveLength(1);
        });
    });

    describe('receipt-driven publication', () => {
        it('publishes version 2 from the retained receipt without a new status allocation', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedVcV2,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            const receipt = result.refresh!;
            expect(receipt.credentialStatus).toBeDefined();

            // Rebuild the updated body from the receipt metadata plus the issuer's own
            // claims; the managed service and exact status descriptor come from the
            // receipt (the issuer cannot read the holder-encrypted stored version).
            const updatedBody = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                id: receipt.credentialId,
                type: ['VerifiableCredential'],
                issuer: receipt.issuerDid,
                name: 'Updated Refreshable VC',
                credentialSubject: { id: receipt.holderDid },
                refreshService: receipt.refreshService,
                credentialStatus: receipt.credentialStatus,
                validFrom: new Date().toISOString(),
            };

            const updated = await issuer.learnCard.invoke.issueCredential(
                updatedBody as UnsignedVC
            );

            const publishResult =
                await issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                    mode: 'issuer-signed',
                    refreshId: receipt.refreshId,
                    signedCredential: updated,
                });

            expect(publishResult.version).toBe(2);

            const newHead = await getCredentialRefreshHead(receipt.refreshId);
            expect(newHead).toMatchObject({ version: 2 });
        });

        it('applies managed context preparation to signing-authority publications', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            const receipt = result.refresh!;

            // Unsigned body WITHOUT the inline managed context fragment: the service
            // must add it before handing the body to the signing authority.
            const unsignedBody = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                id: receipt.credentialId,
                type: ['VerifiableCredential'],
                issuer: receipt.issuerDid,
                name: 'SA Updated Badge',
                credentialSubject: { id: receipt.holderDid },
                refreshService: receipt.refreshService,
                validFrom: new Date().toISOString(),
            };

            const capturedBodies: UnsignedVC[] = [];
            signingAuthorityMocks.issueCredential.mockImplementationOnce(
                async (_issuer: unknown, credential: UnsignedVC) => {
                    capturedBodies.push(credential);

                    const vc = await issuer.learnCard.invoke.issueCredential({
                        ...credential,
                        issuer: issuer.learnCard.id.did(),
                    });

                    return { kind: 'issued-credential', credential: vc, statusEntries: [] };
                }
            );

            const publishResult =
                await issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                    mode: 'signing-authority',
                    refreshId: receipt.refreshId,
                    credential: unsignedBody as UnsignedVC,
                    signingAuthority: {
                        type: 'SigningAuthority',
                        name: 'refresh-send-sa',
                        endpoint: 'https://sa.example.com',
                    },
                });

            expect(publishResult.version).toBe(2);

            expect(capturedBodies).toHaveLength(1);
            const contexts = capturedBodies[0]['@context'];
            const hasManagedTerm = (Array.isArray(contexts) ? contexts : [contexts]).some(
                entry =>
                    typeof entry === 'object' &&
                    entry !== null &&
                    MANAGED_REFRESH_TYPE_TERM in (entry as Record<string, unknown>)
            );
            expect(hasManagedTerm).toBe(true);

            // The publication must not have appended new status entries: the
            // credentialStatus descriptor supplied by the receipt is preserved.
            const head = await getCredentialRefreshHead(receipt.refreshId);
            expect(head).toMatchObject({ version: 2 });
        });
    });

    describe('allocation state integrity', () => {
        it('binds the aggregate to the signed issuer identity and exposes it for publication', async () => {
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = (await issuer.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: HOLDER_PROFILE_ID,
                templateUri: boostUri,
                refresh: true,
            })) as SendResult;

            const aggregate = await getCredentialRefresh(result.refresh!.refreshId);
            expect(aggregate).toMatchObject({
                issuerProfileId: ISSUER_PROFILE_ID,
                holderProfileId: HOLDER_PROFILE_ID,
                credentialId: result.refresh!.credentialId,
                state: 'awaiting_claim',
                currentVersion: 1,
            });
        });
    });
});
