import { beforeEach, describe, expect, it, vi } from 'vitest';
import { neogma } from '@instance';
import { Binding, Ecosystem, InstallIntent, IntegrationInstall } from '@models';
import { createProfile } from '@accesslayer/profile/create';
import { seedDevGovernanceConsent } from '@accesslayer/consentflowcontract/dev-seed';
import {
    acceptGovernanceConsentContract,
    governConsentContract,
    readGovernedConsentEvidence,
} from '@accesslayer/consentflowcontract/governance';
import {
    readBindingConsentPreflight,
    prepareBindingConsentPreflight,
} from '@accesslayer/binding/consent-preflight';
import { getInstallIntentAuditEvents } from '@accesslayer/install-intent/audit';
import {
    hashConsentEvidence,
    hashBindingConsentPreflight,
    hashEducationOsGrant,
} from '@helpers/consent-preflight-hash.helpers';
import {
    EducationOsConsentGrantValidator,
    ConsentFlowTermsValidator,
    InstallIntentPlanValidator,
    type BindingConsentPreflight,
} from '@learncard/types';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getContractById } from '@accesslayer/consentflowcontract/read';
import { consentToContract } from '@accesslayer/consentflowcontract/relationships/create';
import { updateTerms } from '@accesslayer/consentflowcontract/relationships/update';
import { getContractTermsById } from '@accesslayer/consentflowcontract/relationships/read';
import { DbTermsValidator } from 'types/consentflowcontract';

const ROOT = 'eco_dev_root';
const OWNER = 'cp-owner';
const CONTRACT = 'synthetic-dev-institutional-data-sharing';
const TERMS = `${CONTRACT}-operator-terms`;
const prepare = (): Promise<BindingConsentPreflight> =>
    prepareBindingConsentPreflight({ bindingId: 'cp-binding', actorProfileId: OWNER });

const setTermsProperty = async (
    property: 'status' | 'educationOsAcceptedRole',
    value: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (t:ConsentFlowTerms {id: $id}) SET t.${property} = $value`,
        { id: TERMS, value }
    );
};

describe('server-resolved binding governance readiness', () => {
    beforeEach(async () => {
        await neogma.queryRunner.run(
            `MATCH (n) WHERE n.id = $root OR n.id STARTS WITH 'cp-' OR
                n.id STARTS WITH 'synthetic-dev-' OR n.profileId STARTS WITH 'cp-' OR
                n.bindingId = 'cp-binding' OR n.intentId = 'cp-intent'
             DETACH DELETE n`,
            { root: ROOT }
        );
        await createProfile({
            profileId: OWNER,
            did: 'did:key:consent-preflight-owner',
            displayName: 'Synthetic owner',
        });
        await createProfile({
            profileId: 'cp-member',
            did: 'did:key:consent-preflight-member',
            displayName: 'Synthetic member',
        });
        const now = new Date().toISOString();
        await Ecosystem.createOne({
            id: ROOT,
            name: 'Synthetic preflight ecosystem',
            slug: ROOT,
            pathIds: [ROOT],
            slugPath: [ROOT],
            depth: 0,
            rootEcosystemId: ROOT,
            ownerProfileId: OWNER,
            settings: '{}',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
        });
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: 'cp-member'}), (e:Ecosystem {id: $root})
             CREATE (p)-[:MEMBER_OF {role: 'MEMBER'}]->(e)`,
            { root: ROOT }
        );
        const authorityChanges = {
            summary: 'Synthetic roster scope',
            addedScopes: [],
            removedScopes: [],
            affectedCapabilities: ['roster-source'],
        };
        await InstallIntent.createOne({
            apiVersion: 'lc.install-intent/v1',
            intentId: 'cp-intent',
            ecosystemId: ROOT,
            proposal: JSON.stringify({
                apiVersion: 'lc.install-intent-proposal/v1',
                source: {
                    type: 'CATALOG_LISTING',
                    listingId: 'cp-listing',
                    versionId: 'cp-version',
                    listingKind: 'INTEGRATION',
                },
                requestedConfig: {},
                proposedBindings: [],
            }),
            plan: JSON.stringify({
                apiVersion: 'lc.install-plan/v1',
                renderedAt: now,
                planHash: 'cp-plan',
                planRevision: 1,
                scopesRequested: [`group:sync:tree:${ROOT}`],
                consentTiers: ['roster'],
                infrastructureEffects: [],
                authorityChanges,
                dispositionPolicy: { mode: 'RETAIN' },
            }),
            approval: JSON.stringify({
                apiVersion: 'lc.install-approval/v1',
                state: 'APPROVED',
                artifact: {
                    apiVersion: 'lc.approval-artifact/v1',
                    planHash: 'cp-plan',
                    planRevision: 1,
                    approvedBy: OWNER,
                    approvedAt: now,
                    authorityChanges,
                    consentTiers: ['roster'],
                    proposedBindings: [],
                    infrastructureEffects: [],
                    dispositionPolicy: { mode: 'RETAIN' },
                },
            }),
            specRevision: 1,
            statusRevision: 0,
            policyRevision: 'cp-policy',
            createdAt: now,
            updatedAt: now,
        });
        await IntegrationInstall.createOne({
            apiVersion: 'lc.install-target/v1',
            id: 'cp-provider',
            intentId: 'cp-intent',
            ecosystemId: ROOT,
            targetType: 'INTEGRATION_INSTALL',
            status: 'READY',
            createdAt: now,
        });
        await Binding.createOne({
            apiVersion: 'lc.binding/v1',
            bindingId: 'cp-binding',
            ecosystemId: ROOT,
            capability: 'roster-source',
            provider: JSON.stringify({
                resourceId: 'cp-provider',
                resourceType: 'INTEGRATION_INSTALL',
                ecosystemId: ROOT,
            }),
            consumer: JSON.stringify({
                resourceId: ROOT,
                resourceType: 'ECOSYSTEM',
                ecosystemId: ROOT,
            }),
            status: 'PROPOSED',
            revision: 0,
            revisions: JSON.stringify({ bindingRevision: 0 }),
            createdAt: now,
            updatedAt: now,
        });
        await seedDevGovernanceConsent();
    });

    it('satisfies roster readiness using the synthetic governed contract without learners', async () => {
        const snapshot = await prepare();
        expect(snapshot.satisfied).toBe(true);
        expect(snapshot.missing).toEqual([]);
        expect(snapshot.evidence.acceptedBy).toEqual({ profileId: OWNER, role: 'OWNER' });
        expect(snapshot.collectionPath).toEqual({ kind: 'consentflow-terms', implemented: true });
        expect(
            (await getInstallIntentAuditEvents({ bindingId: 'cp-binding' })).map(
                event => event.action
            )
        ).toContain('CONSENT_PREFLIGHT_RESOLVED');
    });

    it('rejects a MEMBER caller', async () => {
        await expect(
            prepareBindingConsentPreflight({ bindingId: 'cp-binding', actorProfileId: 'cp-member' })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('reports NO_GOVERNANCE_CONTRACT when no local contract is governed', async () => {
        await neogma.queryRunner.run(
            'MATCH (:Ecosystem {id: $root})-[g:GOVERNS_CONSENT_CONTRACT]->() DELETE g',
            { root: ROOT }
        );
        expect((await prepare()).missing.map(item => item.code)).toContain(
            'NO_GOVERNANCE_CONTRACT'
        );
    });

    it.each(['withdrawn', 'stale'])('reports CONTRACT_NOT_LIVE for %s acceptance', async status => {
        await setTermsProperty('status', status);
        expect((await prepare()).missing.map(item => item.code)).toContain('CONTRACT_NOT_LIVE');
    });

    it('reports CONTRACT_NOT_LIVE for an expired contract', async () => {
        await neogma.queryRunner.run(
            'MATCH (c:ConsentFlowContract {id: $id}) SET c.expiresAt = $date',
            { id: CONTRACT, date: '2020-01-01T00:00:00.000Z' }
        );
        expect((await prepare()).missing.map(item => item.code)).toContain('CONTRACT_NOT_LIVE');
    });

    it('reports ACCEPTOR_NOT_AUTHORIZED for a MEMBER acceptance even after promotion', async () => {
        await setTermsProperty('educationOsAcceptedRole', 'MEMBER');
        expect((await prepare()).missing.map(item => item.code)).toContain(
            'ACCEPTOR_NOT_AUTHORIZED'
        );
    });

    it('denies after the accepting representative loses ecosystem authority', async () => {
        await neogma.queryRunner.run(
            'MATCH (e:Ecosystem {id: $root}) SET e.ownerProfileId = "cp-member"',
            { root: ROOT }
        );
        await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: $owner}), (e:Ecosystem {id: $root}) CREATE (p)-[:MEMBER_OF {role: "MEMBER"}]->(e)',
            { owner: OWNER, root: ROOT }
        );
        const result = await prepareBindingConsentPreflight({
            bindingId: 'cp-binding',
            actorProfileId: 'cp-member',
        });
        expect(result.missing.map(item => item.code)).toContain('ACCEPTOR_NOT_AUTHORIZED');
    });

    it('rejects partial scope coverage', async () => {
        const result = await neogma.queryRunner.run(
            'MATCH (i:InstallIntent {intentId: "cp-intent"}) RETURN i.plan AS plan'
        );
        const plan = InstallIntentPlanValidator.parse(JSON.parse(result.records[0]!.get('plan')));
        plan.scopesRequested.push('roster:export');
        await neogma.queryRunner.run(
            'MATCH (i:InstallIntent {intentId: "cp-intent"}) SET i.plan = $plan',
            { plan: JSON.stringify(plan) }
        );
        expect((await prepare()).missing.map(item => item.code)).toContain('SCOPE_NOT_COVERED');
    });

    it('ignores cross-ecosystem governance as evidence', async () => {
        await neogma.queryRunner.run(
            'CREATE (e:Ecosystem {id: "cp-foreign"}) WITH e MATCH (c:ConsentFlowContract {id: $id}) CREATE (e)-[:GOVERNS_CONSENT_CONTRACT]->(c)',
            { id: CONTRACT }
        );
        const snapshot = await prepare();
        expect(snapshot.satisfied).toBe(false);
        expect(snapshot.missing.map(item => item.code)).toContain('CROSS_ECOSYSTEM');
    });

    it('satisfies registry-adapter readiness without governance or consent evidence', async () => {
        await neogma.queryRunner.run(
            'MATCH (b:Binding {bindingId: "cp-binding"}) SET b.capability = "registry-adapter"'
        );
        await neogma.queryRunner.run(
            'MATCH (:Ecosystem {id: $root})-[g:GOVERNS_CONSENT_CONTRACT]->() DELETE g',
            { root: ROOT }
        );
        const snapshot = await prepare();
        expect(snapshot.satisfied).toBe(true);
        expect(snapshot.evidence).toEqual({});
    });

    it('creates immutable independent snapshots and recomputes a stable canonical hash', async () => {
        const first = await prepare();
        const second = await prepare();
        expect(second.preflightId).not.toBe(first.preflightId);
        expect(await readBindingConsentPreflight(first.preflightId)).toEqual(first);
        expect(first.hash).toBe(hashBindingConsentPreflight(first));
        expect(first.hash).toBe(
            hashBindingConsentPreflight({ ...first, evidence: { ...first.evidence } })
        );
    });

    it('never asserts operator Terms are learner consent', async () => {
        const snapshot = await prepare();
        expect(snapshot).not.toHaveProperty('consentActive');
        expect(snapshot).not.toHaveProperty('subjectProfileId');
        expect(snapshot.evidence).not.toHaveProperty('consentActiveAtDecision');
        const result = await neogma.queryRunner.run(
            'MATCH (p:Profile)-[:CREATED_BY]->(:ConsentFlowTerms)-[:CONSENTS_TO]->(c:ConsentFlowContract) WHERE c.id STARTS WITH "synthetic-dev-" RETURN DISTINCT p.profileId AS id'
        );
        expect(result.records.map(row => row.get('id'))).toEqual([OWNER]);
    });

    it('does not expand accepted authority or an existing snapshot after a grant edit', async () => {
        const first = await prepare();
        const row = (await readGovernedConsentEvidence(ROOT)).find(
            item => item.contractId === CONTRACT
        )!;
        const grant = EducationOsConsentGrantValidator.parse(JSON.parse(row.grantJson!));
        grant.grants[0]!.scopes.push('roster:export');
        await governConsentContract({
            ecosystemId: ROOT,
            contractId: CONTRACT,
            actorProfileId: OWNER,
            agreement: 'institutional-data-sharing',
            grant,
        });
        expect((await prepare()).missing.map(item => item.code)).toContain('ACCEPTANCE_MISSING');
        expect(await readBindingConsentPreflight(first.preflightId)).toEqual(first);
        const changed = (await readGovernedConsentEvidence(ROOT)).find(
            item => item.contractId === CONTRACT
        )!;
        expect(changed.acceptedGrantHash).not.toBe(hashEducationOsGrant(grant));
    });

    it('seeds idempotently without reaccepting withdrawn governance Terms', async () => {
        await seedDevGovernanceConsent();
        await setTermsProperty('status', 'withdrawn');
        await seedDevGovernanceConsent();
        const rows = await readGovernedConsentEvidence(ROOT);
        expect(rows).toHaveLength(2);
        expect(rows.find(row => row.contractId === CONTRACT)?.status).toBe('withdrawn');
    });

    it('requires explicit revision-bound acceptance after ordinary operator consent', async () => {
        await neogma.queryRunner.run('MATCH (t:ConsentFlowTerms {id: $id}) DETACH DELETE t', {
            id: TERMS,
        });
        const profile = await getProfileByProfileId(OWNER);
        const contract = await getContractById(CONTRACT);
        if (!profile || !contract) throw new Error('Missing test fixture');
        await consentToContract(
            profile,
            { contract, contractOwner: profile },
            {
                terms: ConsentFlowTermsValidator.parse({}),
                audienceVersion: Number(contract.audienceVersion ?? 0),
            },
            'localhost%3A3000'
        );
        expect((await prepare()).missing.map(item => item.code)).toContain('ACCEPTANCE_MISSING');
        const row = (await readGovernedConsentEvidence(ROOT)).find(
            item => item.contractId === CONTRACT
        )!;
        await acceptGovernanceConsentContract(
            {
                ecosystemId: ROOT,
                contractId: CONTRACT,
                termsId: row.termsId!,
                contractRevision: row.contractRevision!,
                grantHash: row.grantHash!,
            },
            OWNER
        );
        expect((await prepare()).satisfied).toBe(true);
    });

    it('does not revive an old acceptance after editing and restoring the grant', async () => {
        const row = (await readGovernedConsentEvidence(ROOT)).find(
            item => item.contractId === CONTRACT
        )!;
        const original = EducationOsConsentGrantValidator.parse(JSON.parse(row.grantJson!));
        const changed = EducationOsConsentGrantValidator.parse(original);
        changed.grants[0]!.scopes.push('roster:export');
        for (const grant of [changed, original]) {
            await governConsentContract({
                ecosystemId: ROOT,
                contractId: CONTRACT,
                actorProfileId: OWNER,
                agreement: 'institutional-data-sharing',
                grant,
            });
        }
        expect((await prepare()).missing.map(item => item.code)).toContain('ACCEPTANCE_MISSING');
        await expect(
            acceptGovernanceConsentContract(
                {
                    ecosystemId: ROOT,
                    contractId: CONTRACT,
                    termsId: TERMS,
                    contractRevision: row.contractRevision!,
                    grantHash: row.grantHash!,
                },
                OWNER
            )
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('rejects concurrent withdrawal before snapshot persistence without writing an audit', async () => {
        const run = neogma.queryRunner.run.bind(neogma.queryRunner);
        const spy = vi.spyOn(neogma.queryRunner, 'run').mockImplementation(async (...args) => {
            if (args[0].includes('CREATE (s:BindingConsentPreflight')) {
                await run(
                    'MATCH (t:ConsentFlowTerms {id: $id}) SET t.status = "withdrawn", t.mutationVersion = 1',
                    { id: TERMS }
                );
            }
            return run(...args);
        });
        try {
            await expect(prepare()).rejects.toMatchObject({ code: 'CONFLICT' });
        } finally {
            spy.mockRestore();
        }
        expect(await getInstallIntentAuditEvents({ bindingId: 'cp-binding' })).toEqual([]);
    });

    it('never reattributes a historical synthetic acceptance after ownership transfer', async () => {
        await neogma.queryRunner.run(
            'MATCH (e:Ecosystem {id: $root}) SET e.ownerProfileId = "cp-member"',
            { root: ROOT }
        );
        await expect(seedDevGovernanceConsent()).rejects.toThrow('Refusing to transfer historical');
        const rows = await readGovernedConsentEvidence(ROOT);
        expect(rows.every(row => row.profileId === OWNER && row.acceptedProfileId === OWNER)).toBe(
            true
        );
    });

    it('canonicalizes nested key ordering without changing array order', () => {
        expect(hashConsentEvidence({ b: { z: 1, a: 2 }, a: [1, 2] })).toBe(
            hashConsentEvidence({ a: [1, 2], b: { a: 2, z: 1 } })
        );
        expect(hashConsentEvidence([1, 2])).not.toBe(hashConsentEvidence([2, 1]));
    });

    it.each(['withdrawn', 'expired'])(
        'does not renew %s governance acceptance through personal Terms updates',
        async state => {
            if (state === 'withdrawn') await setTermsProperty('status', 'withdrawn');
            else
                await neogma.queryRunner.run(
                    'MATCH (t:ConsentFlowTerms {id: $id}) SET t.expiresAt = "2020-01-01T00:00:00.000Z"',
                    { id: TERMS }
                );
            const relationship = await getContractTermsById(TERMS);
            if (!relationship) throw new Error('Missing test Terms');
            await updateTerms(
                { ...relationship, terms: DbTermsValidator.parse(relationship.terms) },
                {
                    terms: ConsentFlowTermsValidator.parse({}),
                    expiresAt: '2100-01-01T00:00:00.000Z',
                    audienceVersion: Number(relationship.contract.audienceVersion ?? 0),
                },
                'localhost%3A3000'
            );
            expect((await prepare()).missing.map(item => item.code)).toContain(
                'ACCEPTANCE_MISSING'
            );
        }
    );
});
