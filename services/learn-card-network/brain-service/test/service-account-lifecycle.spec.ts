import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IntegrationScopeRequest } from '@learncard/types';
import { ServiceAccountGrantValidator } from '@learncard/types';
import { neogma } from '@instance';
import { ServiceAccount, ServiceAccountGrant, IntegrationInstall } from '@models';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { getInstallIntentAuditEvents } from '@accesslayer/install-intent/audit';
import { writeInstallIntentStatus } from '@accesslayer/install-intent/intent-status';
import {
    listInstallTargetsByIntentId,
    provisionIntegrationServiceAccount,
} from '@accesslayer/install-target/internal';
import * as bindingWrites from '@accesslayer/binding/write';
import { readBindingById } from '@accesslayer/binding/read';
import {
    reconcileInstallIntent,
    resetInstallIntentReconcilerTestState,
    setInstallIntentReconcilerKillSwitch,
} from '@reconciler';
import * as targets from '@accesslayer/install-target/internal';
import { serviceAccountId } from '@helpers/service-account.helpers';
import { getIntentTargetId } from '@helpers/install-intent.helpers';
import { getClient } from './helpers/getClient';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { makeListingInput } from './helpers/app-store.helpers';
import { createSignedListingVersionForKind } from './helpers/manifest.helpers';

const treeScope: IntegrationScopeRequest = {
    resource: 'group',
    action: 'sync',
    selectorKind: 'tree',
    selectorValue: '$installEcosystemId',
    reason: 'Sync approved groups',
};

const setup = async (scopes: IntegrationScopeRequest[] = [treeScope]) => {
    const suffix = randomUUID();
    const did = `did:key:service-account-${suffix}`;
    const profileId = `sa-owner-${suffix}`;
    await createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);
    const ecosystem = await createEcosystem({
        name: 'ServiceAccount test',
        slug: `sa-${suffix}`,
        ownerProfileId: profileId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    const listingId = `listing_${suffix}`;
    const versionId = `version_${suffix}`;
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
        manifestOverrides: { scopes },
    });
    const client = getClient({ did, isChallengeValid: true, scope: AUTH_GRANT_FULL_ACCESS_SCOPE });
    const planned = await client.installIntent.planInstallIntent({
        ecosystemId: ecosystem.id,
        listingId,
        versionId,
        requestedConfig: {},
        proposedBindings: [],
    });
    const intent = await client.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: [],
    });
    const target = intent.spec?.targets.find(t => t.targetType === 'INTEGRATION_INSTALL');
    if (!target) throw new Error('Missing integration target');
    const installId = getIntentTargetId(
        intent.intentId,
        typeof target.config.declarationId === 'string'
            ? target.config.declarationId
            : `${target.targetType}_${target.listingId}`
    );
    return { ecosystem, intent, target, installId };
};

const accounts = (installId: string) =>
    ServiceAccount.findMany({ where: { installId }, plain: true });
const grants = (installId: string) =>
    ServiceAccountGrant.findMany({ where: { installId }, plain: true });

afterEach(async () => {
    vi.restoreAllMocks();
    await resetInstallIntentReconcilerTestState();
});

describe('ServiceAccount install aggregate', () => {
    it('provisions one non-operational principal, ACTS_FOR and precisely the approved resolved grants', async () => {
        const { intent, installId, ecosystem } = await setup();
        const result = await reconcileInstallIntent(intent.intentId);
        expect(result.status?.phase).toBe('READY');
        const [account] = await accounts(installId);
        expect(await accounts(installId)).toHaveLength(1);
        expect(account).toMatchObject({
            id: serviceAccountId(intent.intentId, installId, intent.specRevision),
            installId,
            ecosystemId: ecosystem.id,
            status: 'PROVISIONED',
            credentialGeneration: 0,
        });
        expect(await grants(installId)).toEqual([
            expect.objectContaining({
                serviceAccountId: account?.id,
                installId,
                resource: 'group',
                action: 'sync',
                selectorKind: 'tree',
                selectorValue: ecosystem.id,
            }),
        ]);
        const graph = await neogma.queryRunner.run(
            `MATCH (target:IntegrationInstall {id: $id})-[:HAS_SERVICE_ACCOUNT]->(sa)
            MATCH (sa)-[:ACTS_FOR]->(eco:Ecosystem) RETURN eco.id AS id`,
            { id: installId }
        );
        expect(graph.records.map(row => row.get('id'))).toEqual([ecosystem.id]);
    });

    it('replays partial apply and converged apply without duplicate accounts or grants', async () => {
        const { intent, installId, target, ecosystem } = await setup();
        const applying = await writeInstallIntentStatus({
            intentId: intent.intentId,
            expectedStatusRevision: intent.statusRevision,
            phase: 'APPLYING',
        });
        const input = {
            apiVersion: 'lc.install-target/v1' as const,
            id: installId,
            intentId: intent.intentId,
            ecosystemId: ecosystem.id,
            targetType: 'INTEGRATION_INSTALL' as const,
            listingId: target.listingId,
            status: 'READY' as const,
            createdAt: new Date().toISOString(),
        };
        await Promise.all([
            provisionIntegrationServiceAccount(input, applying, target),
            provisionIntegrationServiceAccount(input, applying, target),
        ]);
        await reconcileInstallIntent(intent.intentId);
        const before = await accounts(installId);
        const beforeGrants = await grants(installId);
        await reconcileInstallIntent(intent.intentId);
        expect(await accounts(installId)).toEqual(before);
        expect(before).toHaveLength(1);
        expect(await grants(installId)).toEqual(beforeGrants);
        expect(beforeGrants).toHaveLength(1);
    });

    it('rejects an out-of-tree id selector atomically', async () => {
        const outside = await setup([]);
        const groupId = `group_${randomUUID()}`;
        await neogma.queryRunner.run('CREATE (:Group {id: $id, ownerEcosystemId: $owner})', {
            id: groupId,
            owner: outside.ecosystem.id,
        });
        const { intent, installId } = await setup([
            { ...treeScope, selectorKind: 'id', selectorValue: groupId },
        ]);
        const result = await reconcileInstallIntent(intent.intentId);
        expect(result.status).toMatchObject({ phase: 'FAILED', cause: 'AUTH' });
        expect(result.status?.message).toMatch(/outside install ecosystem tree/);
        expect(await accounts(installId)).toHaveLength(0);
        expect(await listInstallTargetsByIntentId(intent.intentId)).toHaveLength(0);
    });

    it('resolves an id selector owned by a descendant ecosystem', async () => {
        const groupId = `group_${randomUUID()}`;
        const { intent, installId, ecosystem } = await setup([
            { ...treeScope, selectorKind: 'id', selectorValue: groupId },
        ]);
        const child = await createEcosystem({
            name: 'Child',
            slug: `child-${randomUUID()}`,
            ownerProfileId: ecosystem.ownerProfileId,
            parentEcosystemId: ecosystem.id,
            description: undefined,
            settings: {},
            status: 'ACTIVE',
        });
        await neogma.queryRunner.run('CREATE (:Group {id: $id, ownerEcosystemId: $owner})', {
            id: groupId,
            owner: child.id,
        });
        expect((await reconcileInstallIntent(intent.intentId)).status?.phase).toBe('READY');
        expect(await grants(installId)).toEqual([
            expect.objectContaining({ selectorKind: 'id', selectorValue: groupId }),
        ]);
    });

    it.each([{ action: '*' }, { resource: '*' }, { selectorValue: '*' }])(
        'cannot provision wildcard scope %j',
        async fields => {
            expect(
                ServiceAccountGrantValidator.safeParse({
                    id: 'g',
                    serviceAccountId: 's',
                    installId: 'i',
                    ...treeScope,
                    selectorValue: 'eco',
                    ...fields,
                }).success
            ).toBe(false);
        }
    );

    it('fails apply for an unknown integration verb', async () => {
        const { intent, installId } = await setup([{ ...treeScope, action: 'admin' }]);
        expect((await reconcileInstallIntent(intent.intentId)).status).toMatchObject({
            phase: 'FAILED',
            cause: 'AUTH',
        });
        expect(await accounts(installId)).toHaveLength(0);
    });

    it('revokes accounts and grants before Bindings, retries a partial failure, then deletes targets without resurrection', async () => {
        const { intent, installId, ecosystem, target } = await setup();
        await reconcileInstallIntent(intent.intentId);
        const binding = await bindingWrites.createBinding({
            apiVersion: 'lc.binding/v1',
            bindingId: `bind_${randomUUID()}`,
            ecosystemId: ecosystem.id,
            capability: 'roster-source',
            status: 'PROPOSED',
            provider: {
                resourceType: 'INTEGRATION_INSTALL',
                resourceId: installId,
                ecosystemId: ecosystem.id,
            },
            consumer: {
                resourceType: 'ECOSYSTEM',
                resourceId: ecosystem.id,
                ecosystemId: ecosystem.id,
            },
        });
        const revoke = bindingWrites.revokeBinding;
        let failed = false;
        const order: string[] = [];
        vi.spyOn(bindingWrites, 'revokeBinding').mockImplementation(async (...args) => {
            expect(await accounts(installId)).toEqual([
                expect.objectContaining({
                    status: 'REVOKED',
                    credentialGeneration: 1,
                    revokedAt: expect.any(String),
                }),
            ]);
            expect(await grants(installId)).toHaveLength(0);
            expect(await listInstallTargetsByIntentId(intent.intentId)).toHaveLength(1);
            order.push('bindings');
            if (!failed) {
                failed = true;
                throw new Error('Partial binding revocation failure');
            }
            return revoke(...args);
        });
        const deleteTarget = IntegrationInstall.delete.bind(IntegrationInstall);
        vi.spyOn(IntegrationInstall, 'delete').mockImplementation(async (...args) => {
            expect((await readBindingById(binding.bindingId))?.status).toBe('REVOKED');
            order.push('target');
            return deleteTarget(...args);
        });
        await expect(
            reconcileInstallIntent(intent.intentId, { operation: 'remove' })
        ).rejects.toThrow(/Partial binding/);
        const tombstone = await accounts(installId);
        expect((await reconcileInstallIntent(intent.intentId)).status?.phase).toBe('REMOVED');
        expect(order).toEqual(['bindings', 'bindings', 'target']);
        expect(await accounts(installId)).toEqual(tombstone);
        expect(
            (await reconcileInstallIntent(intent.intentId, { operation: 'apply' })).status?.phase
        ).toBe('REMOVED');
        expect(await listInstallTargetsByIntentId(intent.intentId)).toHaveLength(0);
        expect(await grants(installId)).toHaveLength(0);
        // Even a stale direct provisioning invocation cannot revive the tombstone.
        await expect(
            provisionIntegrationServiceAccount(
                {
                    apiVersion: 'lc.install-target/v1',
                    id: installId,
                    intentId: intent.intentId,
                    ecosystemId: ecosystem.id,
                    targetType: 'INTEGRATION_INSTALL',
                    listingId: target.listingId,
                    status: 'READY',
                    createdAt: new Date().toISOString(),
                },
                intent,
                target
            )
        ).rejects.toThrow(/no longer applying/);
    });

    it('revokes authority even with the kill switch enabled', async () => {
        const { intent, installId } = await setup();
        await reconcileInstallIntent(intent.intentId);
        await setInstallIntentReconcilerKillSwitch(true);
        expect(
            (await reconcileInstallIntent(intent.intentId, { operation: 'remove' })).status?.phase
        ).toBe('REMOVED');
        expect(await accounts(installId)).toEqual([
            expect.objectContaining({ status: 'REVOKED', credentialGeneration: 1 }),
        ]);
        expect(await grants(installId)).toHaveLength(0);
    });

    it('does not let a stale apply failure overwrite REMOVING', async () => {
        const { intent } = await setup();
        const provision = targets.provisionIntegrationServiceAccount;
        vi.spyOn(targets, 'provisionIntegrationServiceAccount').mockImplementationOnce(
            async (input, applying, target) => {
                await writeInstallIntentStatus({
                    intentId: intent.intentId,
                    expectedStatusRevision: applying.statusRevision,
                    phase: 'REMOVING',
                });
                return provision(input, applying, target);
            }
        );
        expect((await reconcileInstallIntent(intent.intentId)).status?.phase).toBe('REMOVING');
        expect((await reconcileInstallIntent(intent.intentId)).status?.phase).toBe('REMOVED');
    });

    it('rejects tampered stored scopes that are not hash-bound to approval', async () => {
        const { intent, installId } = await setup();
        const spec = structuredClone(intent.spec);
        if (!spec?.targets[0]) throw new Error('Missing spec');
        spec.targets[0].scopes = ['boost:issue:tree:$installEcosystemId'];
        await neogma.queryRunner.run(
            'MATCH (intent:InstallIntent {intentId: $id}) SET intent.spec = $spec',
            { id: intent.intentId, spec: JSON.stringify(spec) }
        );
        expect((await reconcileInstallIntent(intent.intentId)).status?.message).toMatch(
            /approved plan hash/
        );
        expect(await accounts(installId)).toHaveLength(0);
    });

    it.each([
        'second account',
        'wrong ACTS_FOR',
        'out-of-tree grant',
        'shared account',
        'unapproved verb',
        'missing grant',
        'missing HAS_GRANT',
        'missing INSTALLS',
    ] as const)('disables, records drift and audits %s without repairing it', async corruption => {
        const { intent, installId } = await setup();
        await reconcileInstallIntent(intent.intentId);
        const [account] = await accounts(installId);
        if (!account) throw new Error('Missing account');
        const outside = await setup([]);
        if (corruption === 'second account') {
            await neogma.queryRunner.run(
                `MATCH (target:IntegrationInstall {id: $installId})
                    CREATE (target)-[:HAS_SERVICE_ACCOUNT]->(:ServiceAccount {id: $id, installId: $installId, status: 'ENABLED', credentialGeneration: 0})`,
                { installId, id: randomUUID() }
            );
        } else if (corruption === 'wrong ACTS_FOR') {
            await neogma.queryRunner.run(
                `MATCH (sa:ServiceAccount {id: $id})-[r:ACTS_FOR]->() DELETE r
                    WITH sa MATCH (eco:Ecosystem {id: $eco}) CREATE (sa)-[:ACTS_FOR]->(eco)`,
                { id: account.id, eco: outside.ecosystem.id }
            );
        } else if (corruption === 'out-of-tree grant') {
            await neogma.queryRunner.run(
                'MATCH (g:ServiceAccountGrant {installId: $installId}) SET g.selectorValue = $eco',
                { installId, eco: outside.ecosystem.id }
            );
        } else if (corruption === 'shared account') {
            await neogma.queryRunner.run(
                `MATCH (sa:ServiceAccount {id: $id})
                    CREATE (:IntegrationInstall {id: $other})-[:HAS_SERVICE_ACCOUNT]->(sa)`,
                { id: account.id, other: randomUUID() }
            );
        } else if (corruption === 'unapproved verb') {
            await neogma.queryRunner.run(
                "MATCH (g:ServiceAccountGrant {installId: $installId}) SET g.resource = 'boost', g.action = 'issue'",
                { installId }
            );
        } else if (corruption === 'missing grant') {
            await neogma.queryRunner.run(
                'MATCH (g:ServiceAccountGrant {installId: $installId}) DETACH DELETE g',
                { installId }
            );
        } else if (corruption === 'missing HAS_GRANT') {
            await neogma.queryRunner.run(
                'MATCH (:ServiceAccount {id: $id})-[r:HAS_GRANT]->() DELETE r',
                { id: account.id }
            );
        } else {
            await neogma.queryRunner.run(
                'MATCH ()-[r:INSTALLS {installId: $installId}]->() DELETE r',
                { installId }
            );
        }
        const observed = await reconcileInstallIntent(intent.intentId, { operation: 'health' });
        expect(observed.status).toMatchObject({ phase: 'DEGRADED', cause: 'HEALTH' });
        expect(observed.status?.message).toMatch(/ServiceAccount invariant violation/);
        expect((await accounts(installId)).every(sa => sa.status === 'DISABLED')).toBe(true);
        expect(await getInstallIntentAuditEvents({ intentId: intent.intentId })).toContainEqual(
            expect.objectContaining({
                action: 'SERVICE_ACCOUNT_INVARIANT_VIOLATION',
                authorityChangesSummary: observed.status?.message,
            })
        );
        expect(
            (await reconcileInstallIntent(intent.intentId, { operation: 'health' })).status?.phase
        ).toBe('DEGRADED');
    });
});
