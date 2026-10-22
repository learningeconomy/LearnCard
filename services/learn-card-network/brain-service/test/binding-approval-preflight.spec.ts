import { beforeEach, describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { seedDevGovernanceConsent } from '@accesslayer/consentflowcontract/dev-seed';
import { prepareBindingConsentPreflight } from '@accesslayer/binding/consent-preflight';
import {
    approveBindingWithPreflight,
    ApproveBindingInputValidator,
} from '@accesslayer/binding/approval';
import { approveBinding } from '@accesslayer/binding/write';
import { suspendLegacySubjectBindings } from '@accesslayer/binding/migrate-preflight';
import { readBindingById } from '@accesslayer/binding/read';
import type { BindingConsentPreflight } from '@learncard/types';

const ROOT = 'eco_dev_root';
const OWNER = 'approval-owner';
const TERMS = 'synthetic-dev-institutional-data-sharing-operator-terms';
const prepare = (): Promise<BindingConsentPreflight> =>
    prepareBindingConsentPreflight({ bindingId: 'approval-binding', actorProfileId: OWNER });
const approve = (
    snapshot: BindingConsentPreflight
): ReturnType<typeof approveBindingWithPreflight> =>
    approveBindingWithPreflight(
        {
            bindingId: 'approval-binding',
            expectedRevision: snapshot.bindingRevision,
            preflightId: snapshot.preflightId,
            preflightHash: snapshot.hash,
        },
        OWNER
    );

const expectUnchanged = async (): Promise<void> => {
    expect((await readBindingById('approval-binding'))?.status).toBe('PROPOSED');
    const result = await neogma.queryRunner.run(`MATCH (b:Binding {bindingId: 'approval-binding'})
        OPTIONAL MATCH (b)-[r:APPROVED_WITH]->(s) RETURN count(r) AS count`);
    expect(Number(result.records[0]?.get('count'))).toBe(0);
    const audit = await neogma.queryRunner.run(
        `MATCH (a:InstallIntentAuditEvent {bindingId: 'approval-binding', action: 'BINDING_APPROVED'}) RETURN a`
    );
    expect(audit.records).toHaveLength(0);
};

describe('atomic binding approval preflight', () => {
    beforeEach(async (): Promise<void> => {
        await neogma.queryRunner.run(
            `MATCH (n) WHERE n.id = $root OR n.id STARTS WITH 'synthetic-dev-' OR
            n.profileId STARTS WITH 'approval-' OR n.bindingId STARTS WITH 'approval-' OR
            n.id STARTS WITH 'approval-' OR n.intentId = 'approval-intent' DETACH DELETE n`,
            { root: ROOT }
        );
        const now = new Date().toISOString();
        const authorityChanges = {
            summary: 'Roster',
            addedScopes: [],
            removedScopes: [],
            affectedCapabilities: ['roster-source'],
        };
        const plan = {
            apiVersion: 'lc.install-plan/v1',
            renderedAt: now,
            planHash: 'approval-plan',
            planRevision: 1,
            scopesRequested: [`group:sync:tree:${ROOT}`],
            consentTiers: ['roster'],
            infrastructureEffects: [],
            authorityChanges,
            dispositionPolicy: { mode: 'RETAIN' },
        };
        const approval = {
            apiVersion: 'lc.install-approval/v1',
            state: 'APPROVED',
            artifact: {
                apiVersion: 'lc.approval-artifact/v1',
                planHash: plan.planHash,
                planRevision: 1,
                approvedBy: OWNER,
                approvedAt: now,
                authorityChanges,
                consentTiers: ['roster'],
                proposedBindings: [],
                infrastructureEffects: [],
                dispositionPolicy: { mode: 'RETAIN' },
            },
        };
        await neogma.queryRunner.run(
            `CREATE (:Profile {profileId: $owner})
            CREATE (:Profile {profileId: 'approval-admin'})-[:MEMBER_OF {role: 'ADMIN'}]->
                (e:Ecosystem {id: $root, ownerProfileId: $owner})
            CREATE (:IntegrationInstall {id: 'approval-provider', ecosystemId: $root,
                targetType: 'INTEGRATION_INSTALL', intentId: 'approval-intent'})
            CREATE (:InstallIntent {intentId: 'approval-intent', ecosystemId: $root, plan: $plan, approval: $approval})
            CREATE (b:Binding {bindingId: 'approval-binding', apiVersion: 'lc.binding/v1', ecosystemId: $root,
                capability: 'roster-source', provider: $provider, consumer: $consumer, status: 'PROPOSED',
                revision: 0.0, revisions: '{"bindingRevision":0}', createdAt: $now, updatedAt: $now})`,
            {
                root: ROOT,
                owner: OWNER,
                now,
                plan: JSON.stringify(plan),
                approval: JSON.stringify(approval),
                provider: JSON.stringify({
                    resourceId: 'approval-provider',
                    resourceType: 'INTEGRATION_INSTALL',
                    ecosystemId: ROOT,
                }),
                consumer: JSON.stringify({
                    resourceId: ROOT,
                    resourceType: 'ECOSYSTEM',
                    ecosystemId: ROOT,
                }),
            }
        );
        await seedDevGovernanceConsent();
    });

    it('activates with APPROVED_WITH, consumed snapshot and approval audit in one transaction', async (): Promise<void> => {
        const snapshot = await prepare();
        expect(snapshot.satisfied).toBe(true);
        expect((await approve(snapshot)).status).toBe('ACTIVE');
        const result = await neogma.queryRunner
            .run(`MATCH (:Binding {bindingId: 'approval-binding'})-[:APPROVED_WITH]->(s)
            MATCH (a:InstallIntentAuditEvent {bindingId: 'approval-binding', action: 'BINDING_APPROVED'})
            RETURN s.consumedAt AS consumedAt, a.afterSummary AS summary`);
        expect(result.records).toHaveLength(1);
        expect(result.records[0]?.get('consumedAt')).toBeTruthy();
        expect(JSON.parse(result.records[0]?.get('summary'))).toMatchObject({
            preflightId: snapshot.preflightId,
            preflightHash: snapshot.hash,
        });
    });

    it('rejects a tampered hash without writes', async (): Promise<void> => {
        const snapshot = await prepare();
        await expect(approve({ ...snapshot, hash: '0'.repeat(64) })).rejects.toThrow(
            /PREFLIGHT_STALE.*HASH/
        );
        await expectUnchanged();
    });

    it('rejects a snapshot for another binding', async (): Promise<void> => {
        const snapshot = await prepare();
        await neogma.queryRunner.run(
            `MATCH (b:Binding {bindingId: 'approval-binding'}) CREATE (other:Binding) SET other = b {.*, bindingId: 'approval-other'}`
        );
        await expect(
            approveBindingWithPreflight(
                {
                    bindingId: 'approval-other',
                    expectedRevision: 0,
                    preflightId: snapshot.preflightId,
                    preflightHash: snapshot.hash,
                },
                OWNER
            )
        ).rejects.toThrow(/PREFLIGHT_STALE/);
        await expectUnchanged();
    });

    it.each([
        [
            'withdrawn Terms',
            `MATCH (t:ConsentFlowTerms {id: $terms}) SET t.status = 'withdrawn'`,
            'CONTRACT_NOT_LIVE',
        ],
        [
            'Terms mutation',
            `MATCH (t:ConsentFlowTerms {id: $terms}) SET t.mutationVersion = t.mutationVersion + 1`,
            'ACCEPTANCE_MISSING',
        ],
        [
            'acceptor demoted',
            `MATCH (e:Ecosystem {id: $root}) SET e.ownerProfileId = 'approval-admin'`,
            'ACCEPTOR_NOT_AUTHORIZED',
        ],
        [
            'grant hash changed',
            `MATCH (c:ConsentFlowContract {id: 'synthetic-dev-institutional-data-sharing'}) SET c.educationOsGrantHash = 'changed'`,
            'ACCEPTANCE_MISSING',
        ],
    ])(
        'rejects %s after preparation and rolls back all writes',
        async (_name, query, code): Promise<void> => {
            const snapshot = await prepare();
            await neogma.queryRunner.run(query, { terms: TERMS, root: ROOT });
            await expect(
                approveBindingWithPreflight(
                    {
                        bindingId: 'approval-binding',
                        expectedRevision: 0,
                        preflightId: snapshot.preflightId,
                        preflightHash: snapshot.hash,
                    },
                    'approval-admin'
                )
            ).rejects.toThrow(new RegExp(`PREFLIGHT_STALE.*${code}`));
            await expectUnchanged();
        }
    );

    it('rejects snapshot reuse', async (): Promise<void> => {
        const snapshot = await prepare();
        await approve(snapshot);
        await expect(approve(snapshot)).rejects.toThrow(/PREFLIGHT_STALE.*CONSUMED/);
    });

    it('rejects old asserted-consent input by schema and direct subject approval bypass', async (): Promise<void> => {
        expect(
            ApproveBindingInputValidator.safeParse({
                bindingId: 'approval-binding',
                expectedRevision: 0,
                consentPreflight: { consentActive: true },
            }).success
        ).toBe(false);
        await expect(approveBinding('approval-binding', 0, OWNER)).rejects.toThrow(
            /PREFLIGHT_REQUIRED/
        );
    });

    it('approves reference-only registry-adapter without preflight', async (): Promise<void> => {
        await neogma.queryRunner.run(
            `MATCH (b:Binding {bindingId: 'approval-binding'}) SET b.capability = 'registry-adapter'`
        );
        expect(
            (
                await approveBindingWithPreflight(
                    { bindingId: 'approval-binding', expectedRevision: 0 },
                    OWNER
                )
            ).status
        ).toBe('ACTIVE');
    });

    it('suspends legacy ACTIVE/APPROVED bindings idempotently and permits fresh approval', async (): Promise<void> => {
        await neogma.queryRunner
            .run(`MATCH (b:Binding {bindingId: 'approval-binding'}) SET b.status = 'ACTIVE'
            CREATE (other:Binding) SET other = b {.*, bindingId: 'approval-other', status: 'APPROVED'}
            CREATE (registry:Binding) SET registry = b {.*, bindingId: 'approval-registry', capability: 'registry-adapter'}`);
        expect(await suspendLegacySubjectBindings()).toBe(2);
        expect(await suspendLegacySubjectBindings()).toBe(0);
        expect((await readBindingById('approval-binding'))?.status).toBe('SUSPENDED');
        expect((await readBindingById('approval-registry'))?.status).toBe('ACTIVE');
        const audits = await neogma.queryRunner.run(
            `MATCH (a:InstallIntentAuditEvent {bindingId: 'approval-binding', action: 'BINDING_SUSPENDED'}) RETURN a.afterSummary AS summary`
        );
        expect(audits.records).toHaveLength(1);
        expect(JSON.parse(audits.records[0]?.get('summary')).reason).toBe(
            'LEGACY_CALLER_ASSERTED_CONSENT'
        );
        expect((await approve(await prepare())).status).toBe('ACTIVE');
        expect(await suspendLegacySubjectBindings()).toBe(0);
    });
});
