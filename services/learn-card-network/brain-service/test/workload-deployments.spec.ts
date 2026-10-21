import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WorkloadPlan, WorkloadPackage, BundleManifestV11 } from '@learncard/types';
import { neogma } from '@instance';
import { environment } from '@environment';
import { workloadAgentRouter } from '@routes/workload-agent';
import {
    createWorkloadDeployment,
    readWorkloadDeployment,
    queueWorkloadOperation,
    claimWorkloadOperation,
    listPendingWorkloadOperations,
} from '@accesslayer/workload-deployment/store';
import {
    applyWorkloadObservation,
    reportWorkloadObservation,
    reportDeploymentHealth,
    completeWorkloadOperation,
    observeWorkloadDeployment,
    submitWorkloadOperation,
    WORKLOAD_STALE_MS,
} from '../src/workload/lifecycle';
import { FakeWorkloadDeployer } from '../src/workload/deployer';
import {
    createInstallTargetInternal,
    deleteInstallTargetInternal,
    readInstallTargetInternal,
} from '@accesslayer/install-target/internal';
import type { WorkloadObservation } from 'types/workload-lifecycle';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { signManifestWithDidKey } from '@helpers/manifest-signature.helpers';
import { publishWorkloadPackageVersion } from '@accesslayer/workload-package/create';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { createListingVersion } from '@accesslayer/listing-version/create';
import { reconcileInstallIntent } from '../src/reconciler/install-intent-reconciler';
import { buildDccIssuerWorkloadPackage } from './fixtures/workload/dcc-issuer';
import { makeListingInput } from './helpers/app-store.helpers';
import { getClient } from './helpers/getClient';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { buildPlanFromMaterialization } from '@helpers/install-intent.helpers';

let id: string;
let plan: WorkloadPlan;
const oldToken = environment.WORKLOAD_AGENT_TOKEN;
const oldCurators = environment.WORKLOAD_CURATOR_DIDS;
const oldEnabled = environment.WORKLOAD_LOCAL_COMPOSE_ENABLED;
const observation = (healthy = true, revision = 1): WorkloadObservation => ({
    observedRevision: revision,
    components: [
        { id: 'issuer', healthy },
        { id: 'db', healthy },
    ],
    endpoints: [{ id: 'status', url: 'https://status.example:8443/v1', healthy }],
    failed: false,
});
const create = async (revision = 1): ReturnType<typeof createWorkloadDeployment> =>
    createWorkloadDeployment({
        id,
        ecosystemId: id,
        intentId: id,
        declarationId: 'issuer',
        desiredRevision: revision,
        approvedSpec: plan,
    });
const claim = async (): Promise<{ operationId: string; leaseToken: string }> => {
    const queued = await queueWorkloadOperation(id, 'APPLY');
    const claimed = await claimWorkloadOperation(queued.operationId);
    if (!claimed.leaseToken) throw new Error('Missing lease');
    return { operationId: claimed.operationId, leaseToken: claimed.leaseToken };
};

beforeEach(async (): Promise<void> => {
    id = `workload-test-${randomUUID()}`;
    environment.WORKLOAD_AGENT_TOKEN = 'test-agent-token';
    plan = {
        packageId: id,
        packageVersionId: id,
        version: '1.0.0',
        manifestHash: 'a'.repeat(64),
        publisherDid: 'did:example:curator',
        profiles: ['core'],
        components: [
            { id: 'issuer', image: 'issuer@sha256:abc', platform: 'linux/arm64' },
            { id: 'db', image: 'db@sha256:abc', platform: 'linux/arm64' },
        ],
        module: { sha256: 'b'.repeat(64), rendererVersion: '1' },
        endpoints: [
            {
                id: 'status',
                component: 'issuer',
                purpose: 'status-list',
                preserveOnRetirement: true,
            },
        ],
        supportBoundary: { retirementPlan: 'Retain status, keys and data' },
        secrets: [],
        driver: 'local-compose',
        provides: [],
        consumes: [],
        bundle: { versionId: 'bundle', manifestHash: 'c'.repeat(64) },
        platformValidation: 'DEFERRED_TO_AGENT',
    };
    await neogma.queryRunner.run(
        'CREATE (:Ecosystem {id: $id}), (:InstallIntent {intentId: $id}), (:WorkloadPackageVersion {versionId: $id})',
        { id }
    );
    await create();
});
afterEach(async (): Promise<void> => {
    environment.WORKLOAD_AGENT_TOKEN = oldToken;
    environment.WORKLOAD_CURATOR_DIDS = oldCurators;
    environment.WORKLOAD_LOCAL_COMPOSE_ENABLED = oldEnabled;
    await neogma.queryRunner.run(
        'MATCH (n) WHERE n.id = $id OR n.intentId = $id OR n.deploymentId = $id OR n.versionId = $id DETACH DELETE n',
        { id }
    );
});

const approvedIntent = async (
    optional: boolean
): Promise<{ intentId: string; deploymentId: string }> => {
    const seed = 'a'.repeat(64);
    const publisherDid = (await getLearnCard(seed)).id.did();
    environment.WORKLOAD_CURATOR_DIDS = publisherDid;
    environment.WORKLOAD_LOCAL_COMPOSE_ENABLED = true;
    const draft = buildDccIssuerWorkloadPackage(publisherDid);
    draft.id = id;
    const signed = await signManifestWithDidKey<WorkloadPackage>(draft, seed);
    const version = await publishWorkloadPackageVersion(JSON.stringify(signed));
    const did = `did:key:operator-${id}`;
    await createProfile({ profileId: id, did, displayName: 'Workload operator' } as Parameters<
        typeof createProfile
    >[0]);
    const listing = await createAppStoreListing(makeListingInput({ kind: 'BUNDLE' }));
    const ecosystem = await createEcosystem({
        name: 'Workload lifecycle',
        slug: id,
        ownerProfileId: id,
        parentEcosystemId: null,
        description: undefined,
        status: 'ACTIVE',
        settings: {},
    });
    const bundle = await signManifestWithDidKey<BundleManifestV11>(
        {
            apiVersion: 'lc.bundle/v1.1',
            id: listing.listing_id,
            version: '1.0.0',
            publisherDid,
            contains: [
                {
                    declarationId: 'issuer',
                    targetType: 'WORKLOAD_DEPLOYMENT',
                    packageId: signed.id,
                    packageVersionId: version.versionId,
                    manifestHash: version.manifestHash,
                    profiles: ['core'],
                    optional,
                },
            ],
            defaultBindings: [],
            preflight: [],
        },
        seed
    );
    const listingVersion = await createListingVersion(listing.listing_id, {
        version: '1.0.0',
        status: 'LISTED',
        manifest_json: JSON.stringify(bundle),
    });
    const client = getClient({ did, isChallengeValid: true, scope: AUTH_GRANT_FULL_ACCESS_SCOPE });
    const planned = await client.installIntent.planInstallIntent({
        ecosystemId: ecosystem.id,
        listingId: listing.listing_id,
        versionId: listingVersion.version_id,
        requestedConfig: { issuer: { exchangeEnabled: false } },
        proposedBindings: [],
    });
    await client.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: [],
    });
    return { intentId: planned.intentId, deploymentId: `target_${planned.intentId}_issuer` };
};

describe('observation-driven workload lifecycle', (): void => {
    it('binds user, tmpfs, endpoint parts and seed formats into the approval plan hash', (): void => {
        const manifest = buildDccIssuerWorkloadPackage('did:example:curator');
        plan.execution = {
            components: manifest.components,
            secretRefs: manifest.secretRefs,
            config: {},
        };
        const hash = (workload: WorkloadPlan): string =>
            buildPlanFromMaterialization({
                scopeSummary: 'DCC',
                planRevision: 1,
                bindings: [],
                infrastructureEffects: [],
                targets: [
                    {
                        targetType: 'WORKLOAD_DEPLOYMENT',
                        listingId: '',
                        versionId: '',
                        scopes: [],
                        consentTiers: [],
                        config: {},
                        entitlementRequirements: [],
                        workload,
                    },
                ],
            }).planHash;
        const original = hash(plan);
        const mutations: Array<(candidate: WorkloadPlan) => void> = [
            (candidate): void => {
                candidate.execution!.components[0]!.user = '999:999';
            },
            (candidate): void => {
                candidate.execution!.components[0]!.tmpfs = [{ path: '/tmp', sizeMiB: 64 }];
            },
            (candidate): void => {
                candidate.execution!.components[0]!.env = [
                    {
                        name: 'SERVICE',
                        source: { kind: 'endpoint', endpointId: 'status', part: 'hostport' },
                    },
                ];
            },
            (candidate): void => {
                candidate.execution!.secretRefs[0]!.provisioning = {
                    kind: 'generate',
                    format: 'ed25519-seed-multibase',
                };
            },
        ];
        for (const mutate of mutations) {
            const candidate = structuredClone(plan);
            mutate(candidate);
            expect(hash(candidate)).not.toBe(original);
        }
    });
    it('does not make the intent READY until a healthy observation', async (): Promise<void> => {
        const intent = await approvedIntent(false);
        const applying = await reconcileInstallIntent(intent.intentId);
        expect(applying.status?.phase).toBe('APPLYING');
        const deployment = await readWorkloadDeployment(intent.deploymentId);
        if (!deployment?.approvedSpec) throw new Error('Missing deployment');
        const driver = new FakeWorkloadDeployer();
        const operation = await queueWorkloadOperation(intent.deploymentId, 'APPLY');
        await driver.apply(operation);
        const health = await driver.status(operation.operationId);
        if (!health) throw new Error('Missing health');
        await applyWorkloadObservation(intent.deploymentId, health);
        expect((await reconcileInstallIntent(intent.intentId)).status?.phase).toBe('READY');
    });
    it.each([true, false])(
        'surfaces failure without failing optional members: optional=%s',
        async (optional): Promise<void> => {
            const intent = await approvedIntent(optional);
            await reconcileInstallIntent(intent.intentId);
            const deployment = await readWorkloadDeployment(intent.deploymentId);
            if (!deployment?.desiredRevision) throw new Error('Missing deployment');
            await applyWorkloadObservation(intent.deploymentId, {
                observedRevision: deployment.desiredRevision,
                components: [],
                endpoints: [],
                failed: true,
            });
            expect((await reconcileInstallIntent(intent.intentId)).status?.phase).toBe(
                optional ? 'READY' : 'FAILED'
            );
            expect((await readWorkloadDeployment(intent.deploymentId))?.status).toBe('FAILED');
        }
    );
    it('stays PENDING then APPLYING until a healthy FakeDeployer observation', async (): Promise<void> => {
        expect((await readWorkloadDeployment(id))?.status).toBe('PENDING');
        await submitWorkloadOperation(id, 'APPLY');
        expect((await readWorkloadDeployment(id))?.status).toBe('APPLYING');
        const driver = new FakeWorkloadDeployer();
        const op = await queueWorkloadOperation(id, 'APPLY');
        await driver.apply(op);
        driver.mode = 'partial';
        const partial = await driver.status(op.operationId);
        if (!partial) throw new Error('Missing observation');
        await applyWorkloadObservation(id, partial);
        expect((await readWorkloadDeployment(id))?.status).toBe('APPLYING');
        driver.mode = 'healthy';
        const healthy = await driver.status(op.operationId);
        if (!healthy) throw new Error('Missing observation');
        await applyWorkloadObservation(id, healthy);
        expect((await readWorkloadDeployment(id))?.status).toBe('READY');
    });
    it('requires every endpoint as well as every selected component', async (): Promise<void> => {
        await submitWorkloadOperation(id, 'APPLY');
        await applyWorkloadObservation(id, { ...observation(), endpoints: [] });
        expect((await readWorkloadDeployment(id))?.status).toBe('APPLYING');
    });
    it('degrades after three unhealthy observations and recovers', async (): Promise<void> => {
        await applyWorkloadObservation(id, observation());
        for (let index = 0; index < 2; index++)
            await applyWorkloadObservation(id, observation(false));
        expect((await readWorkloadDeployment(id))?.status).toBe('READY');
        await applyWorkloadObservation(id, observation(false));
        expect((await readWorkloadDeployment(id))?.status).toBe('DEGRADED');
        await applyWorkloadObservation(id, observation());
        expect((await readWorkloadDeployment(id))?.status).toBe('READY');
    });
    it('marks a silent agent stale without recreating the deployment', async (): Promise<void> => {
        await applyWorkloadObservation(id, observation());
        const stale = await observeWorkloadDeployment(
            id,
            new Date(Date.now() + WORKLOAD_STALE_MS + 1000)
        );
        expect(stale).toMatchObject({ id, status: 'DEGRADED', failureCode: 'AGENT_STALE' });
    });
    it('queues operations idempotently', async (): Promise<void> => {
        const operations = await Promise.all([
            queueWorkloadOperation(id, 'APPLY'),
            queueWorkloadOperation(id, 'APPLY'),
        ]);
        expect(operations[0]).toEqual(operations[1]);
        expect(operations[0]?.operationId).toBe(`${id}:1:APPLY`);
    });
    it('rejects stale leases and fences the previous claimant', async (): Promise<void> => {
        const first = await claim();
        await neogma.queryRunner.run(
            'MATCH (o:WorkloadOperation {operationId: $operationId}) SET o.leaseExpiresAt = $expired',
            { ...first, expired: '2000-01-01T00:00:00.000Z' }
        );
        await expect(
            completeWorkloadOperation({ ...first, status: 'SUCCEEDED' })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        const second = await claimWorkloadOperation(first.operationId);
        expect(second.leaseToken).not.toBe(first.leaseToken);
        await expect(
            reportWorkloadObservation({ ...first, observation: observation() })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
    it('accepts deployment health only after completion, not via the completed lease', async (): Promise<void> => {
        const lease = await claim();
        await expect(
            reportDeploymentHealth({ deploymentId: id, ...observation() })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        await completeWorkloadOperation({ ...lease, status: 'SUCCEEDED' });
        expect((await readWorkloadDeployment(id))?.status).not.toBe('READY');
        await reportDeploymentHealth({ deploymentId: id, ...observation() });
        expect((await readWorkloadDeployment(id))?.status).toBe('READY');
        await expect(
            reportWorkloadObservation({ ...lease, observation: observation() })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
    it('serializes retirement behind apply and retains node and status-list obligations', async (): Promise<void> => {
        const applying = await claim();
        await submitWorkloadOperation(id, 'RETIRE');
        expect((await readWorkloadDeployment(id))?.status).toBe('RETIRING');
        const retiring = await queueWorkloadOperation(id, 'RETIRE');
        await expect(claimWorkloadOperation(retiring.operationId)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await completeWorkloadOperation({ ...applying, status: 'SUCCEEDED' });
        const claimed = await claimWorkloadOperation(retiring.operationId);
        if (!claimed.leaseToken) throw new Error('Missing lease');
        await completeWorkloadOperation({
            operationId: claimed.operationId,
            leaseToken: claimed.leaseToken,
            status: 'SUCCEEDED',
        });
        expect(await readWorkloadDeployment(id)).toMatchObject({
            status: 'RETIRED',
            retainedObligations: expect.arrayContaining(['status-list', 'issuer-key', 'data']),
        });
        await expect(
            deleteInstallTargetInternal({ id, targetType: 'WORKLOAD_DEPLOYMENT' })
        ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    });
    it('still deletes non-workload targets', async (): Promise<void> => {
        const target = {
            apiVersion: 'lc.install-target/v1' as const,
            id: `${id}-app`,
            intentId: id,
            ecosystemId: id,
            targetType: 'APP_AVAILABILITY' as const,
            status: 'READY' as const,
            createdAt: new Date().toISOString(),
        };
        await createInstallTargetInternal(target);
        await deleteInstallTargetInternal(target);
        expect(await readInstallTargetInternal(target)).toBeNull();
    });
    it('rejects undeclared endpoint ids', async (): Promise<void> => {
        await expect(
            applyWorkloadObservation(id, {
                ...observation(),
                endpoints: [{ id: 'rogue', healthy: true, url: 'https://example.com' }],
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
    it('strips credentials without imposing host, port or path mappings', async (): Promise<void> => {
        await applyWorkloadObservation(id, {
            ...observation(),
            endpoints: [
                {
                    id: 'status',
                    healthy: true,
                    url: 'https://user:password@remote.example:9876/other?access_token=secret&apiKey=secret&version=2#secret',
                },
            ],
        });
        expect(JSON.parse((await readWorkloadDeployment(id))?.endpointsObserved ?? '[]')).toEqual([
            { id: 'status', healthy: true, url: 'https://remote.example:9876/other?version=2' },
        ]);
    });
    it.each(['file:///etc/passwd', 'javascript:alert(1)'])(
        'rejects unsafe endpoint %s',
        async (url): Promise<void> => {
            await expect(
                applyWorkloadObservation(id, {
                    ...observation(),
                    endpoints: [{ id: 'status', url, healthy: true }],
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        }
    );
    it('discovers queued and expired leases but not active or completed operations', async (): Promise<void> => {
        const queued = await queueWorkloadOperation(id, 'APPLY');
        expect(
            (await listPendingWorkloadOperations(100)).some(
                (op): boolean => op.operationId === queued.operationId
            )
        ).toBe(true);
        const lease = await claim();
        expect(
            (await listPendingWorkloadOperations(100)).some(
                (op): boolean => op.operationId === queued.operationId
            )
        ).toBe(false);
        await completeWorkloadOperation({ ...lease, status: 'SUCCEEDED' });
        expect(
            (await listPendingWorkloadOperations(100)).some(
                (op): boolean => op.operationId === queued.operationId
            )
        ).toBe(false);
    });
    it('upgrades revision and rejects old health', async (): Promise<void> => {
        const first = await claim();
        await create(2);
        const upgrade = await queueWorkloadOperation(id, 'UPGRADE');
        expect(upgrade.operationId).toBe(`${id}:2:UPGRADE`);
        await expect(claimWorkloadOperation(upgrade.operationId)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await completeWorkloadOperation({ ...first, status: 'SUCCEEDED' });
        await expect(applyWorkloadObservation(id, observation())).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        const next = await claimWorkloadOperation(upgrade.operationId);
        if (!next.leaseToken) throw new Error('Missing lease');
        await completeWorkloadOperation({
            operationId: next.operationId,
            leaseToken: next.leaseToken,
            status: 'SUCCEEDED',
        });
        await reportDeploymentHealth({ deploymentId: id, ...observation(true, 2) });
        expect(await readWorkloadDeployment(id)).toMatchObject({
            status: 'READY',
            desiredRevision: 2,
            observedRevision: 2,
        });
    });
    it.each([undefined, 'wrong-token'])(
        'rejects absent/wrong agent token %s',
        async (workloadAgentToken): Promise<void> => {
            const caller = workloadAgentRouter.createCaller({
                domain: 'localhost',
                tenant: resolveTenantFromRequest({}),
                workloadAgentToken,
            });
            await expect(caller.listPendingWorkloadOperations({ limit: 10 })).rejects.toMatchObject(
                { code: 'UNAUTHORIZED' }
            );
            await expect(
                caller.reportDeploymentHealth({ deploymentId: id, ...observation() })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        }
    );
});
