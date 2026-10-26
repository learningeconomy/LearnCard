import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { RecordProvisioningBindingMetadata } from '@learncard/types';
import { neogma } from '@instance';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { createProfile } from '@accesslayer/profile/create';
import {
    acceptGovernanceConsentContract,
    governConsentContract,
} from '@accesslayer/consentflowcontract/governance';
import { ServiceAccount } from '@models';
import { reconcileInstallIntent } from '@reconciler';
import { exchangeServiceAccountCredential } from '@accesslayer/service-account/auth';
import { purgeExpiredProvisionedRecords } from '@helpers/record-release.helpers';
import { retryRecordIssuance } from '@helpers/issuers/retry';
import { resolveIssuerAdapter } from '@helpers/issuers/registry';
import { resolveRecordLaneGaps } from '@accesslayer/binding/record-lane';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { upsertSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import { setupServiceAccount, partnerClient } from './helpers/service-account.helpers';
import { makeListingInput } from './helpers/app-store.helpers';
import { createSignedListingVersionForKind } from './helpers/manifest.helpers';

type Issuer = { groupId: string; profileId: string };

const metadataFor = (
    issuer: Issuer,
    overrides: Partial<RecordProvisioningBindingMetadata> = {}
): RecordProvisioningBindingMetadata => ({
    capability: 'record-provisioning',
    mode: 'TRANSACTIONAL',
    recordClass: 'academic',
    legalBasis: 'FERPA school-official exception (declared by the institution, not established).',
    identityBinding: 'roster-mapped',
    transactional: {
        triggerAuthority: 'system-event',
        purpose: 'Issue a course completion credential.',
        fields: ['completionId', 'courseId', 'courseTitle', 'completedAt'],
        idempotencyKeyField: 'completionId',
        timeoutMs: 5000,
        maxRetries: 2,
        retentionDays: 30,
    },
    issuance: {
        issuerGroupId: issuer.groupId,
        issuerIdentityProfileId: issuer.profileId,
        template: {
            kind: 'obv3-achievement',
            achievementType: 'Course',
            criteria: 'Completed every module of the course.',
            fieldMap: {
                achievementId: 'courseId',
                name: 'courseTitle',
                completedAt: 'completedAt',
            },
        },
    },
    ...overrides,
});

/** ADR-001 identity-bearing Group owned by the ecosystem, with a primary signing authority. */
const createIssuerGroup = async (
    ecosystemId: string,
    options: { issuanceEnabled?: boolean; signingAuthority?: boolean } = {}
): Promise<Issuer> => {
    const groupId = `group_${randomUUID()}`;
    const profileId = `issuer-${randomUUID()}`;
    await createProfile({
        profileId,
        did: `did:web:localhost%3A3000:users:${profileId}`,
        displayName: 'District Issuer',
    } as Parameters<typeof createProfile>[0]);
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (g:Group {id: $groupId, name: 'Springfield District', type: 'INSTITUTION',
             ownerEcosystemId: $ecosystemId, identityProfileId: $profileId,
             identityIssuanceEnabled: $enabled, members: []})-[:HAS_IDENTITY]->(p)`,
        { profileId, groupId, ecosystemId, enabled: options.issuanceEnabled ?? true }
    );
    if (options.signingAuthority ?? true) {
        const profile = await getProfileByProfileId(profileId);
        if (!profile) throw new Error('Missing issuer profile');
        const sa = await upsertSigningAuthority('http://localhost:5000/api');
        await createUseSigningAuthorityRelationship(profile, sa, 'issuer-sa', profile.did, true);
    }
    return { groupId, profileId };
};

const record = (completionId = `completion_${randomUUID()}`): Record<string, string> => ({
    completionId,
    courseId: 'course-101',
    courseTitle: 'Intro to Credentials',
    completedAt: '2026-10-23',
});

type LearnerConsent = 'live' | 'withdrawn' | 'expired' | 'operator-only' | 'none';

type OwnerClient = Awaited<ReturnType<typeof setupServiceAccount>>['client'];

const approveRecordBinding = async (
    client: OwnerClient,
    ecosystemId: string,
    installId: string,
    issuer: Issuer
) => {
    const proposed = await client.installIntent.proposeBinding({
        ecosystemId,
        capability: 'record-provisioning',
        provider: { resourceType: 'INTEGRATION_INSTALL', resourceId: installId, ecosystemId },
        consumer: { resourceType: 'ECOSYSTEM', resourceId: ecosystemId, ecosystemId },
        capabilityMetadata: metadataFor(issuer),
    });
    const preflight = await client.installIntent.prepareBindingConsentPreflight({
        bindingId: proposed.bindingId,
    });
    return client.installIntent.approveBinding({
        bindingId: proposed.bindingId,
        expectedRevision: preflight.bindingRevision,
        preflightId: preflight.preflightId,
        preflightHash: preflight.hash,
    });
};

const setup = async (options: { learnerConsent?: LearnerConsent } = {}) => {
    const { ecosystem: root, client, profileId } = await setupServiceAccount();
    const installEco = await createEcosystem({
        name: 'District',
        slug: `district-${randomUUID()}`,
        ownerProfileId: profileId,
        parentEcosystemId: root.id,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    const listingId = `listing_${randomUUID()}`;
    const versionId = `version_${randomUUID()}`;
    await createAppStoreListing(
        makeListingInput({
            listing_id: listingId,
            kind: 'INTEGRATION',
            app_listing_status: 'LISTED',
        })
    );
    await createSignedListingVersionForKind({
        listingId,
        versionId,
        kind: 'INTEGRATION',
        manifestOverrides: {
            category: 'lms',
            endpoints: {},
            scopes: [
                {
                    resource: 'completion',
                    action: 'ingest',
                    selectorKind: 'tree',
                    selectorValue: '$installEcosystemId',
                    reason: 'Submit course completions for issuance',
                },
            ],
            consentRequirements: ['credential-body'],
            capabilities: { provided: ['record-provisioning'], consumed: [] },
            supportedRecordClasses: ['academic'],
        },
    });
    const planned = await client.installIntent.planInstallIntent({
        ecosystemId: installEco.id,
        listingId,
        versionId,
        requestedConfig: {},
        proposedBindings: [],
    });
    await client.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: ['credential-body'],
    });
    await reconcileInstallIntent(planned.intentId);
    const account = await ServiceAccount.findOne({
        where: { ecosystemId: installEco.id },
        plain: true,
    });
    if (!account) throw new Error('Missing account');
    const issued = await client.installIntent.issueServiceAccountCredential({
        serviceAccountId: account.id,
    });
    // Request authorization is under test here; the enable gate has its own suite.
    await neogma.queryRunner.run('MATCH (sa:ServiceAccount {id: $id}) SET sa.status = "ENABLED"', {
        id: account.id,
    });
    const token = await exchangeServiceAccountCredential(account.id, issued.secret);

    // Institutional governance: the operator governs and accepts the data-sharing agreement.
    const contractId = `contract_${randomUUID()}`;
    const operatorTermsId = `${contractId}-operator`;
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (c:ConsentFlowContract {id: $contractId, name: 'LMS data sharing'})-[:CREATED_BY]->(p)`,
        { profileId, contractId }
    );
    await governConsentContract({
        ecosystemId: installEco.id,
        contractId,
        actorProfileId: profileId,
        agreement: 'institutional-data-sharing',
        grant: {
            apiVersion: 'lc.consent-grant/v1',
            grants: [
                {
                    capability: 'record-provisioning',
                    operation: 'read',
                    scopes: [`completion:ingest:tree:${installEco.id}`],
                    selectors: { ecosystemIds: [installEco.id] },
                    tiers: ['credential-body'],
                    purpose: 'Course completions for credential issuance.',
                },
            ],
        },
    });
    const now = new Date().toISOString();
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId}), (c:ConsentFlowContract {id: $contractId})
         CREATE (p)-[:CREATED_BY]->(:ConsentFlowTerms {id: $termsId, status: 'live',
             mutationVersion: 1, createdAt: $now, updatedAt: $now})-[:CONSENTS_TO]->(c)`,
        { profileId, contractId, termsId: operatorTermsId, now }
    );
    const contract = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})
         RETURN c.educationOsGrantRevision AS revision, c.educationOsGrantHash AS hash`,
        { contractId }
    );
    await acceptGovernanceConsentContract(
        {
            ecosystemId: installEco.id,
            contractId,
            termsId: operatorTermsId,
            contractRevision: String(contract.records[0]?.get('revision')),
            grantHash: String(contract.records[0]?.get('hash')),
        },
        profileId
    );

    const issuer = await createIssuerGroup(installEco.id);
    const issuerGroupId = issuer.groupId;
    const binding = await approveRecordBinding(client, installEco.id, account.installId, issuer);

    // The learner: a member of the district, consenting (or not) to the governed contract.
    const learnerId = `learner-${randomUUID()}`;
    await createProfile({
        profileId: learnerId,
        did: `did:key:${learnerId}`,
        displayName: 'Learner',
    } as Parameters<typeof createProfile>[0]);
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $learnerId}), (e:Ecosystem {id: $ecosystemId})
         CREATE (p)-[:MEMBER_OF {role: 'MEMBER'}]->(e)`,
        { learnerId, ecosystemId: installEco.id }
    );
    const consent = options.learnerConsent ?? 'live';
    if (consent !== 'none') {
        // 'operator-only' models a governance acceptance, which is never learner consent.
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $learnerId}), (c:ConsentFlowContract {id: $contractId})
             CREATE (p)-[:CREATED_BY]->(t:ConsentFlowTerms {id: $termsId, status: $status,
                 createdAt: $now, updatedAt: $now})-[:CONSENTS_TO]->(c)
             SET t.expiresAt = $expiresAt, t.educationOsAcceptedRole = $acceptedRole`,
            {
                learnerId,
                contractId,
                termsId: `${learnerId}-terms`,
                status: consent === 'withdrawn' ? 'withdrawn' : 'live',
                expiresAt: consent === 'expired' ? '2020-01-01T00:00:00.000Z' : null,
                acceptedRole: consent === 'operator-only' ? 'OWNER' : null,
                now,
            }
        );
    }

    return {
        client,
        binding,
        learnerId,
        installId: account.installId,
        issuer,
        issuerGroupId,
        intentId: planned.intentId,
        ecosystem: installEco,
        partner: await partnerClient(token),
    };
};

const decisions = async (subjectProfileId: string): Promise<string[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (d:ConsentDecisionRecord {subjectProfileId: $subjectProfileId})
         RETURN d.decision AS decision`,
        { subjectProfileId }
    );
    return result.records.map(row => String(row.get('decision')));
};

const storedRecords = async (subjectProfileId: string): Promise<number> => {
    const result = await neogma.queryRunner.run(
        'MATCH (r:ProvisionedRecord {subjectProfileId: $subjectProfileId}) RETURN count(r) AS count',
        { subjectProfileId }
    );
    return Number(result.records[0]?.get('count'));
};

describe('Record provisioning release (ADR-012 Transactional)', () => {
    it('approves a declared academic record lane and releases with live learner consent', async () => {
        const { partner, learnerId, binding, issuerGroupId } = await setup();
        expect(binding.status).toBe('ACTIVE');
        const fields = record();

        const first = await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            externalSubjectId: 'sis-123',
            fields,
        });
        expect(first.status).toBe('ACCEPTED');
        expect(first.issuance?.status).toBe('ISSUED');
        const sent = await neogma.queryRunner.run(
            `MATCH (r:ProvisionedRecord {id: $recordId})
             MATCH (:Group {id: $issuerGroupId})-[:HAS_IDENTITY]->(issuer:Profile)
             MATCH (issuer)-[s:CREDENTIAL_SENT]->(c:Credential)
             RETURN r.issuanceStatus AS status, r.credentialUri AS uri, count(c) AS sent`,
            { recordId: first.recordId, issuerGroupId }
        );
        expect(sent.records[0]?.get('status')).toBe('ISSUED');
        expect(String(sent.records[0]?.get('uri'))).toBe(first.issuance?.credentialUri);
        expect(Number(sent.records[0]?.get('sent'))).toBe(1);

        const replay = await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields,
        });
        // A replay never re-issues.
        expect(replay).toEqual({ recordId: first.recordId, status: 'DUPLICATE' });
        expect(await storedRecords(learnerId)).toBe(1);
        expect(await decisions(learnerId)).toEqual(['ALLOW', 'ALLOW']);
    });

    it('denies and stores nothing when the learner has not consented', async () => {
        const { partner, learnerId } = await setup({ learnerConsent: 'none' });
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await storedRecords(learnerId)).toBe(0);
        expect(await decisions(learnerId)).toEqual(['DENY']);
    });

    it('denies when the learner withdrew consent', async () => {
        const { partner, learnerId } = await setup({ learnerConsent: 'withdrawn' });
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await storedRecords(learnerId)).toBe(0);
    });

    it('stops the next release once the Binding is revoked', async () => {
        const { partner, learnerId, binding, client } = await setup();
        await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields: record(),
        });
        await client.installIntent.revokeBinding({
            bindingId: binding.bindingId,
            expectedRevision: binding.revision,
        });
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        const audit = await neogma.queryRunner.run(
            `MATCH (a:InstallIntentAuditEvent {action: 'RECORD_PROVISION_DENY'})
             WHERE a.afterSummary CONTAINS $learnerId AND a.afterSummary CONTAINS 'NO_ACTIVE_BINDING'
             RETURN count(a) AS count`,
            { learnerId }
        );
        expect(Number(audit.records[0]?.get('count'))).toBe(1);
    });

    it('denies undeclared fields and subjects outside the install tree', async () => {
        const { partner, learnerId } = await setup();
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: { ...record(), ssn: '000-00-0000' },
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        const outsider = `outsider-${randomUUID()}`;
        await createProfile({
            profileId: outsider,
            did: `did:key:${outsider}`,
            displayName: 'Outsider',
        } as Parameters<typeof createProfile>[0]);
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: outsider,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await storedRecords(learnerId)).toBe(0);
    });

    it('requires a record-lane declaration and blocks ETL and employment lanes at preflight', async () => {
        const { client, ecosystem, binding, issuer } = await setup();
        const endpoints = {
            ecosystemId: ecosystem.id,
            capability: 'record-provisioning' as const,
            provider: binding.provider,
            consumer: binding.consumer,
        };
        await expect(client.installIntent.proposeBinding(endpoints)).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        for (const capabilityMetadata of [
            metadataFor(issuer, { mode: 'ETL', transactional: undefined, issuance: undefined }),
            metadataFor(issuer, { recordClass: 'employment' }),
            metadataFor(issuer, { issuance: undefined }),
            metadataFor({ ...issuer, profileId: 'someone-else' }),
            metadataFor(await createIssuerGroup(ecosystem.id, { issuanceEnabled: false })),
            metadataFor(await createIssuerGroup(ecosystem.id, { signingAuthority: false })),
        ]) {
            const proposed = await client.installIntent.proposeBinding({
                ...endpoints,
                capabilityMetadata,
            });
            const preflight = await client.installIntent.prepareBindingConsentPreflight({
                bindingId: proposed.bindingId,
            });
            expect(preflight.satisfied).toBe(false);
        }
    });

    it('purges records past their declared retention', async () => {
        const { partner, learnerId } = await setup();
        await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields: record(),
        });
        await purgeExpiredProvisionedRecords(new Date(Date.now() + 29 * 86_400_000));
        expect(await storedRecords(learnerId)).toBe(1);
        await purgeExpiredProvisionedRecords(new Date(Date.now() + 31 * 86_400_000));
        expect(await storedRecords(learnerId)).toBe(0);
    });

    it('denies expired consent and governance-only acceptances', async () => {
        for (const learnerConsent of ['expired', 'operator-only'] as const) {
            const { partner, learnerId } = await setup({ learnerConsent });
            await expect(
                partner.integrationService.submitRecord({
                    subjectProfileId: learnerId,
                    fields: record(),
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
            expect(await storedRecords(learnerId)).toBe(0);
        }
    });

    it('rejects an idempotency key reused for another subject or payload', async () => {
        const { partner, learnerId, ecosystem } = await setup();
        const fields = record();
        await partner.integrationService.submitRecord({ subjectProfileId: learnerId, fields });
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: { ...fields, courseTitle: 'Changed' },
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const other = `learner-${randomUUID()}`;
        await createProfile({
            profileId: other,
            did: `did:key:${other}`,
            displayName: 'Other learner',
        } as Parameters<typeof createProfile>[0]);
        const contract = await neogma.queryRunner.run(
            `MATCH (:Profile {profileId: $learnerId})-[:CREATED_BY]->(:ConsentFlowTerms)
                 -[:CONSENTS_TO]->(c:ConsentFlowContract) RETURN c.id AS id`,
            { learnerId }
        );
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $other}), (e:Ecosystem {id: $ecosystemId}),
                 (c:ConsentFlowContract {id: $contractId})
             CREATE (p)-[:MEMBER_OF {role: 'MEMBER'}]->(e)
             CREATE (p)-[:CREATED_BY]->(:ConsentFlowTerms {id: $termsId, status: 'live',
                 createdAt: $now, updatedAt: $now})-[:CONSENTS_TO]->(c)`,
            {
                other,
                ecosystemId: ecosystem.id,
                contractId: String(contract.records[0]?.get('id')),
                termsId: `${other}-terms`,
                now: new Date().toISOString(),
            }
        );
        await expect(
            partner.integrationService.submitRecord({ subjectProfileId: other, fields })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await storedRecords(other)).toBe(0);
    });

    it('denies when more than one ACTIVE record Binding exists for the install', async () => {
        const { partner, learnerId, client, ecosystem, installId, issuer } = await setup();
        await approveRecordBinding(client, ecosystem.id, installId, issuer);
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('requires a re-plan when approval would add consent tiers the plan did not show', async () => {
        const { client, ecosystem } = await setup();
        const listingId = `listing_${randomUUID()}`;
        const versionId = `version_${randomUUID()}`;
        await createAppStoreListing(
            makeListingInput({
                listing_id: listingId,
                kind: 'INTEGRATION',
                app_listing_status: 'LISTED',
            })
        );
        await createSignedListingVersionForKind({
            listingId,
            versionId,
            kind: 'INTEGRATION',
            manifestOverrides: { endpoints: {}, consentRequirements: ['credential-body'] },
        });
        const planned = await client.installIntent.planInstallIntent({
            ecosystemId: ecosystem.id,
            listingId,
            versionId,
            requestedConfig: {},
            proposedBindings: [],
        });
        // Simulate a plan rendered before manifest tiers were surfaced.
        await neogma.queryRunner.run(
            `MATCH (i:InstallIntent {intentId: $intentId})
             SET i.plan = $plan`,
            {
                intentId: planned.intentId,
                plan: JSON.stringify({ ...planned.plan, consentTiers: [] }),
            }
        );
        await expect(
            client.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: [],
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('keeps the record and audits a failure when the issuer is disabled after approval', async () => {
        const { partner, learnerId, issuerGroupId } = await setup();
        await neogma.queryRunner.run(
            'MATCH (g:Group {id: $issuerGroupId}) SET g.identityIssuanceEnabled = false',
            { issuerGroupId }
        );
        const result = await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields: record(),
        });
        expect(result.status).toBe('ACCEPTED');
        expect(result.issuance).toEqual({ status: 'ISSUE_FAILED' });
        expect(await storedRecords(learnerId)).toBe(1);
        const audit = await neogma.queryRunner.run(
            `MATCH (a:InstallIntentAuditEvent {action: 'RECORD_CREDENTIAL_ISSUE_FAILED'})
             WHERE a.afterSummary CONTAINS $recordId RETURN count(a) AS count`,
            { recordId: result.recordId }
        );
        expect(Number(audit.records[0]?.get('count'))).toBe(1);
    });

    const issuanceState = async (recordId: string) => {
        const result = await neogma.queryRunner.run(
            `MATCH (r:ProvisionedRecord {id: $recordId})
             OPTIONAL MATCH (:Profile)-[s:CREDENTIAL_SENT]->(:Credential)
             WHERE s.\`metadata.educationOsRecordId\` = $recordId
             RETURN r.issuanceStatus AS status, r.credentialUri AS uri, count(s) AS sent`,
            { recordId }
        );
        const row = result.records[0];
        return {
            status: row?.get('status'),
            uri: row?.get('uri'),
            sent: Number(row?.get('sent')),
        };
    };

    it('reconciles a lost status write on retry without re-signing', async () => {
        const { partner, learnerId } = await setup();
        const first = await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields: record(),
        });
        await neogma.queryRunner.run(
            `MATCH (r:ProvisionedRecord {id: $recordId})
             SET r.issuanceStatus = 'PENDING', r.credentialUri = null`,
            { recordId: first.recordId }
        );
        const retried = await retryRecordIssuance(first.recordId, 'localhost%3A3000');
        expect(retried?.status).toBe('ISSUED');
        const state = await issuanceState(first.recordId);
        expect(state.status).toBe('ISSUED');
        expect(state.sent).toBe(1);
    });

    it('re-issues a failed record once the issuer is re-enabled', async () => {
        const { partner, learnerId, issuerGroupId } = await setup();
        await neogma.queryRunner.run(
            'MATCH (g:Group {id: $issuerGroupId}) SET g.identityIssuanceEnabled = false',
            { issuerGroupId }
        );
        const first = await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields: record(),
        });
        expect((await issuanceState(first.recordId)).status).toBe('ISSUE_FAILED');
        await neogma.queryRunner.run(
            'MATCH (g:Group {id: $issuerGroupId}) SET g.identityIssuanceEnabled = true',
            { issuerGroupId }
        );
        expect((await retryRecordIssuance(first.recordId, 'localhost%3A3000'))?.status).toBe(
            'ISSUED'
        );
        expect((await issuanceState(first.recordId)).sent).toBe(1);
        // A delivered record is no longer eligible for retry.
        expect(await retryRecordIssuance(first.recordId, 'localhost%3A3000')).toBeNull();
    });

    it('fails issuance when the issuer identity was replaced or the date is malformed', async () => {
        const replaced = await setup();
        await neogma.queryRunner.run(
            'MATCH (g:Group {id: $issuerGroupId}) SET g.identityProfileId = $other',
            { issuerGroupId: replaced.issuerGroupId, other: `issuer-${randomUUID()}` }
        );
        const swapped = await replaced.partner.integrationService.submitRecord({
            subjectProfileId: replaced.learnerId,
            fields: record(),
        });
        expect(swapped.issuance).toEqual({ status: 'ISSUE_FAILED' });

        const malformed = await setup();
        const bad = await malformed.partner.integrationService.submitRecord({
            subjectProfileId: malformed.learnerId,
            fields: { ...record(), completedAt: 'yesterday' },
        });
        expect(bad.status).toBe('ACCEPTED');
        expect(bad.issuance).toEqual({ status: 'ISSUE_FAILED' });
        expect((await issuanceState(bad.recordId)).sent).toBe(0);
    });

    it('routes the lane to a registered issuer and fails closed for consumers without one', async () => {
        const { binding, ecosystem } = await setup();
        expect(resolveIssuerAdapter(binding.consumer)?.kind).toBe('platform');
        expect(await resolveRecordLaneGaps(binding)).toEqual([]);

        for (const resourceType of ['WORKLOAD_DEPLOYMENT', 'INTEGRATION_INSTALL'] as const) {
            const consumer = { resourceType, resourceId: 'some-issuer', ecosystemId: ecosystem.id };
            expect(resolveIssuerAdapter(consumer)).toBeNull();
            expect(await resolveRecordLaneGaps({ ...binding, consumer })).toContain(
                'No credential issuer implementation exists for this consumer yet.'
            );
        }
    });

    const denialReasons = async (subjectProfileId: string): Promise<string[]> => {
        const result = await neogma.queryRunner.run(
            `MATCH (a:InstallIntentAuditEvent {action: 'RECORD_PROVISION_DENY'})
             WHERE a.afterSummary CONTAINS $subjectProfileId RETURN a.afterSummary AS summary`,
            { subjectProfileId }
        );
        return result.records.map(row => JSON.parse(String(row.get('summary'))).reason);
    };

    it('denies release without an issuance declaration and stores nothing', async () => {
        const { partner, learnerId, binding } = await setup();
        await neogma.queryRunner.run(
            'MATCH (b:Binding {bindingId: $bindingId}) SET b.capabilityMetadata = $metadata',
            {
                bindingId: binding.bindingId,
                metadata: JSON.stringify({ ...binding.capabilityMetadata, issuance: undefined }),
            }
        );
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await storedRecords(learnerId)).toBe(0);
        expect(await denialReasons(learnerId)).toContain('NO_ISSUANCE_DECLARATION');
    });

    it('fails closed at release and retry when the consumer has no issuer', async () => {
        const { partner, learnerId, binding, ecosystem } = await setup();
        const first = await partner.integrationService.submitRecord({
            subjectProfileId: learnerId,
            fields: record(),
        });
        await neogma.queryRunner.run(
            `MATCH (b:Binding {bindingId: $bindingId}) SET b.consumer = $consumer
             WITH b MATCH (r:ProvisionedRecord {id: $recordId}) SET r.issuanceStatus = 'PENDING'`,
            {
                bindingId: binding.bindingId,
                recordId: first.recordId,
                consumer: JSON.stringify({
                    resourceType: 'WORKLOAD_DEPLOYMENT',
                    resourceId: 'some-issuer',
                    ecosystemId: ecosystem.id,
                }),
            }
        );
        await expect(
            partner.integrationService.submitRecord({
                subjectProfileId: learnerId,
                fields: record(),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await storedRecords(learnerId)).toBe(1);
        expect(await denialReasons(learnerId)).toContain('NO_ISSUER');
        expect(await retryRecordIssuance(first.recordId, 'localhost%3A3000')).toBeNull();
    });
});
