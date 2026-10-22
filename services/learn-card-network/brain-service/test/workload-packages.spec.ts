import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type {
    BundleManifestV11,
    BundleWorkloadMember,
    WorkloadPackage,
    WorkloadPlan,
} from '@learncard/types';
import { VersionedBundleManifestValidator } from '@learncard/types';
import { environment } from '@environment';
import { neogma } from '@instance';
import { getLearnCard } from '@helpers/learnCard.helpers';
import {
    signManifestWithDidKey,
    computeWorkloadManifestHash,
} from '@helpers/manifest-signature.helpers';
import { publishWorkloadPackageVersion } from '@accesslayer/workload-package/create';
import { readWorkloadPackageVersion } from '@accesslayer/workload-package/read';
import { resolveWorkloadPlan } from '@helpers/workload-plan.helpers';
import {
    expandBundle,
    materializeBundlePlan,
    buildPlanFromMaterialization,
    getTargetDeclarationId,
    assertWorkloadBindingCapabilities,
} from '@helpers/install-intent.helpers';
import { buildDccIssuerWorkloadPackage } from './fixtures/workload/dcc-issuer';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { createListingVersion } from '@accesslayer/listing-version/create';
import { makeListingInput } from './helpers/app-store.helpers';
import { getClient } from './helpers/getClient';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

const seed = 'a'.repeat(64);
const oldCurators = environment.WORKLOAD_CURATOR_DIDS;
const oldDriver = environment.WORKLOAD_LOCAL_COMPOSE_ENABLED;
let signed: WorkloadPackage;
let member: BundleWorkloadMember;
const bundle = { versionId: 'bundle-v1', manifestHash: 'b'.repeat(64) };
const config = { exchangeEnabled: true };

beforeAll(async (): Promise<void> => {
    signed = await signManifestWithDidKey<WorkloadPackage>(
        buildDccIssuerWorkloadPackage((await getLearnCard(seed)).id.did()),
        seed
    );
});
beforeEach(async (): Promise<void> => {
    environment.WORKLOAD_CURATOR_DIDS = signed.publisherDid;
    environment.WORKLOAD_LOCAL_COMPOSE_ENABLED = true;
    await neogma.queryRunner.run('MATCH (p:WorkloadPackage) DETACH DELETE p');
    await neogma.queryRunner.run('MATCH (v:WorkloadPackageVersion) DETACH DELETE v');
    const version = await publishWorkloadPackageVersion(JSON.stringify(signed, null, 2));
    member = {
        declarationId: 'issuer',
        targetType: 'WORKLOAD_DEPLOYMENT',
        packageId: signed.id,
        packageVersionId: version.versionId,
        manifestHash: version.manifestHash,
        profiles: ['core', 'lcw-exchange'],
    };
});
afterAll((): void => {
    environment.WORKLOAD_CURATOR_DIDS = oldCurators;
    environment.WORKLOAD_LOCAL_COMPOSE_ENABLED = oldDriver;
});

describe('workload registry', (): void => {
    it('allows only one winner for conflicting first publications', async (): Promise<void> => {
        const first = await signManifestWithDidKey<WorkloadPackage>(
            { ...signed, version: '2.0.0' },
            seed
        );
        const second = await signManifestWithDidKey<WorkloadPackage>(
            { ...first, supportBoundary: { ...first.supportBoundary, backup: 'Changed policy' } },
            seed
        );
        const results = await Promise.allSettled(
            [first, second].map((manifest): ReturnType<typeof publishWorkloadPackageVersion> =>
                publishWorkloadPackageVersion(JSON.stringify(manifest))
            )
        );
        expect(results.filter((result): boolean => result.status === 'fulfilled')).toHaveLength(1);
        const rejected = results.find((result): boolean => result.status === 'rejected');
        if (rejected?.status !== 'rejected') throw new Error('Expected one conflict');
        expect(rejected.reason).toMatchObject({ code: 'CONFLICT' });
    });
    it('publishes verified raw JSON as-is and republishes idempotently', async (): Promise<void> => {
        const first = await readWorkloadPackageVersion(member.packageVersionId);
        expect(first?.status).toBe('PUBLISHED');
        expect(first?.manifestJson).toBe(JSON.stringify(signed, null, 2));
        expect(await publishWorkloadPackageVersion(JSON.stringify(signed))).toEqual(first);
    });
    it('rejects tampered signatures', async (): Promise<void> => {
        await expect(
            publishWorkloadPackageVersion(JSON.stringify({ ...signed, version: '2.0.0' }))
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
    it('rejects valid but non-curated publishers', async (): Promise<void> => {
        environment.WORKLOAD_CURATOR_DIDS = 'did:example:other';
        await expect(publishWorkloadPackageVersion(JSON.stringify(signed))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });
    it('rejects immutable version conflicts', async (): Promise<void> => {
        const changed = await signManifestWithDidKey<WorkloadPackage>(
            {
                ...signed,
                supportBoundary: { ...signed.supportBoundary, patchOwner: 'Another team' },
            },
            seed
        );
        await expect(publishWorkloadPackageVersion(JSON.stringify(changed))).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect((await readWorkloadPackageVersion(member.packageVersionId))?.manifestHash).toBe(
            computeWorkloadManifestHash(signed)
        );
    });
    it('serializes concurrent identical publication', async (): Promise<void> => {
        const fresh = await signManifestWithDidKey<WorkloadPackage>(
            { ...signed, version: '2.0.0' },
            seed
        );
        const versions = await Promise.all(
            Array.from(
                { length: 3 },
                (): Promise<Awaited<ReturnType<typeof publishWorkloadPackageVersion>>> =>
                    publishWorkloadPackageVersion(JSON.stringify(fresh))
            )
        );
        expect(new Set(versions.map((version): string => version.versionId)).size).toBe(1);
    });
});

const materialize = (workload: WorkloadPlan): ReturnType<typeof materializeBundlePlan> => {
    const manifest = VersionedBundleManifestValidator.parse({
        apiVersion: 'lc.bundle/v1.1',
        id: 'bundle',
        version: '1.0.0',
        publisherDid: signed.publisherDid,
        signature: signed.signature,
        contains: [member],
    });
    return materializeBundlePlan({
        intentId: 'intent',
        ecosystemId: 'ecosystem',
        expandedBundle: expandBundle(manifest),
        listingById: {},
        listingVersionsById: {},
        requestedConfig: { issuer: config },
        workloadsByDeclarationId: { issuer: workload },
    });
};
const hash = (workload: WorkloadPlan, operatorConfig = config): string => {
    const result = materialize(workload);
    result.targets[0]!.config = operatorConfig;
    return buildPlanFromMaterialization({
        ...result,
        scopeSummary: 'Workload review',
        planRevision: 1,
    }).planHash;
};

describe('workload planning', (): void => {
    it('selects the declared core kind, even when an optional profile has the ID core', async (): Promise<void> => {
        const draft = buildDccIssuerWorkloadPackage(signed.publisherDid);
        draft.version = '2.0.0';
        for (const profile of draft.profiles) {
            if (profile.id === 'core') profile.id = 'base';
            else if (profile.id === 'admin-ui') profile.id = 'core';
            profile.requiresProfiles = profile.requiresProfiles.map((id): string =>
                id === 'core' ? 'base' : id
            );
        }
        for (const entry of [...draft.provides, ...draft.consumes, ...draft.sizing]) {
            entry.profiles = entry.profiles.map((id): string => (id === 'core' ? 'base' : id));
        }
        const version = await publishWorkloadPackageVersion(
            JSON.stringify(await signManifestWithDidKey<WorkloadPackage>(draft, seed))
        );
        const plan = await resolveWorkloadPlan(
            {
                ...member,
                packageVersionId: version.versionId,
                manifestHash: version.manifestHash,
                profiles: ['core'],
            },
            config,
            bundle
        );
        expect(plan.profiles).toEqual(['base', 'core']);
        expect(plan.components).toHaveLength(5);
    });
    it('rejects missing profile dependency closure instead of solving it', async (): Promise<void> => {
        const draft = buildDccIssuerWorkloadPackage(signed.publisherDid);
        draft.version = '2.0.0';
        draft.profiles
            .find((profile): boolean => profile.id === 'lcw-exchange')!
            .requiresProfiles.push('admin-ui');
        const version = await publishWorkloadPackageVersion(
            JSON.stringify(await signManifestWithDidKey<WorkloadPackage>(draft, seed))
        );
        await expect(
            resolveWorkloadPlan(
                {
                    ...member,
                    packageVersionId: version.versionId,
                    manifestHash: version.manifestHash,
                },
                config,
                bundle
            )
        ).rejects.toThrow('requires profile admin-ui');
    });
    it('rejects selected components referencing an unselected endpoint', async (): Promise<void> => {
        const draft = buildDccIssuerWorkloadPackage(signed.publisherDid);
        draft.version = '2.0.0';
        draft.components[0]!.env.push({
            name: 'EXCHANGE',
            source: { kind: 'endpoint', endpointId: 'exchange', part: 'url' },
        });
        const version = await publishWorkloadPackageVersion(
            JSON.stringify(await signManifestWithDidKey<WorkloadPackage>(draft, seed))
        );
        await expect(
            resolveWorkloadPlan(
                {
                    ...member,
                    packageVersionId: version.versionId,
                    manifestHash: version.manifestHash,
                    profiles: ['core'],
                },
                config,
                bundle
            )
        ).rejects.toThrow('Missing selected endpoint exchange');
    });
    it('validates operator-proposed workload capabilities against selected profiles', async (): Promise<void> => {
        const plan = await resolveWorkloadPlan({ ...member, profiles: ['core'] }, config, bundle);
        const { targets } = materialize(plan);
        for (const role of ['provider', 'consumer'] as const) {
            const workloadEndpoint = {
                resourceType: 'WORKLOAD_DEPLOYMENT' as const,
                resourceId: 'target_intent_issuer',
                ecosystemId: 'eco',
            };
            const ecosystemEndpoint = {
                resourceType: 'ECOSYSTEM' as const,
                resourceId: 'eco',
                ecosystemId: 'eco',
            };
            expect((): void =>
                assertWorkloadBindingCapabilities('intent', targets, [
                    {
                        capability: 'wallet-claim',
                        provider: role === 'provider' ? workloadEndpoint : ecosystemEndpoint,
                        consumer: role === 'consumer' ? workloadEndpoint : ecosystemEndpoint,
                    },
                ])
            ).toThrow('does not support wallet-claim');
        }
    });
    it.each(['signature', 'hash'] as const)(
        'rejects corrupted stored %s during planning',
        async (corruption): Promise<void> => {
            if (corruption === 'hash') {
                await neogma.queryRunner.run(
                    'MATCH (v:WorkloadPackageVersion {versionId: $id}) SET v.manifestHash = $hash',
                    { id: member.packageVersionId, hash: 'f'.repeat(64) }
                );
            } else {
                await neogma.queryRunner.run(
                    'MATCH (v:WorkloadPackageVersion {versionId: $id}) SET v.manifestJson = $json',
                    {
                        id: member.packageVersionId,
                        json: JSON.stringify({
                            ...signed,
                            signature: { ...signed.signature, sig: 'invalid' },
                        }),
                    }
                );
            }
            await expect(resolveWorkloadPlan(member, config, bundle)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        }
    );
    it('publishes, expands, plans and approves through routers without treating packages as listings', async (): Promise<void> => {
        const id = randomUUID();
        const did = `did:key:operator-${id}`;
        const profileId = `operator-${id}`;
        await createProfile({ profileId, did, displayName: 'Operator' } as Parameters<
            typeof createProfile
        >[0]);
        const listing = await createAppStoreListing(makeListingInput({ kind: 'BUNDLE' }));
        const ecosystem = await createEcosystem({
            name: 'Workload test',
            slug: `workload-${id}`,
            ownerProfileId: profileId,
            parentEcosystemId: null,
            description: undefined,
            status: 'ACTIVE',
            settings: { catalogPolicy: { allowedListings: [listing.listing_id] } },
        });
        const manifest = await signManifestWithDidKey<BundleManifestV11>(
            {
                apiVersion: 'lc.bundle/v1.1',
                id: listing.listing_id,
                version: '1.0.0',
                contains: [member],
                defaultBindings: [],
                preflight: [],
                publisherDid: signed.publisherDid,
            },
            seed
        );
        const version = await createListingVersion(listing.listing_id, {
            version: '1.0.0',
            status: 'LISTED',
            manifest_json: JSON.stringify(manifest),
        });
        const client = getClient({
            did,
            isChallengeValid: true,
            scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
        });
        expect(
            (
                await client.workloadPackage.publishWorkloadPackageVersion({
                    manifestJson: JSON.stringify(signed),
                })
            ).versionId
        ).toBe(member.packageVersionId);
        expect(
            (
                await client.workloadPackage.getWorkloadPackageVersion({
                    packageVersionId: member.packageVersionId,
                })
            ).id
        ).toBe(signed.id);
        await expect(
            client.installIntent.planInstallIntent({
                intentId: 'int_binding-check',
                ecosystemId: ecosystem.id,
                listingId: listing.listing_id,
                versionId: version.version_id,
                requestedConfig: { issuer: config },
                proposedBindings: [
                    {
                        capability: 'wallet-claim',
                        provider: {
                            resourceType: 'WORKLOAD_DEPLOYMENT',
                            resourceId: 'target_int_binding-check_issuer',
                            ecosystemId: ecosystem.id,
                        },
                        consumer: {
                            resourceType: 'ECOSYSTEM',
                            resourceId: ecosystem.id,
                            ecosystemId: ecosystem.id,
                        },
                    },
                ],
            })
        ).rejects.toThrow('does not support wallet-claim');
        const planned = await client.installIntent.planInstallIntent({
            ecosystemId: ecosystem.id,
            listingId: listing.listing_id,
            versionId: version.version_id,
            requestedConfig: { issuer: config },
            proposedBindings: [],
        });
        expect(planned.plan.targets?.[0]?.workload?.packageVersionId).toBe(member.packageVersionId);
        const approved = await client.installIntent.approveInstallIntent({
            intentId: planned.intentId,
            planHash: planned.plan.planHash,
            planRevision: planned.plan.planRevision,
            consentTiers: [],
        });
        expect(approved.approval.state).toBe('APPROVED');
        // No apply: workload reconciliation and provisioning intentionally belong to phase 3+.
    });
    it('keeps v1 platform metadata authoritative over operator config', async (): Promise<void> => {
        const listing = await createAppStoreListing(makeListingInput());
        const version = await createListingVersion(listing.listing_id, {
            version: '1.0.0',
            status: 'LISTED',
        });
        const expandedBundle = expandBundle({
            contains: [
                {
                    declarationId: 'platform',
                    targetType: 'APP_AVAILABILITY',
                    listingId: listing.listing_id,
                    versionId: version.version_id,
                },
            ],
            defaultBindings: [],
            preflight: [],
        });
        const result = materializeBundlePlan({
            intentId: 'intent',
            ecosystemId: 'eco',
            expandedBundle,
            listingById: { [listing.listing_id]: listing },
            listingVersionsById: { [version.version_id]: version },
            requestedConfig: {
                platform: {
                    declarationId: 'attacker',
                    targetType: 'WORKLOAD_DEPLOYMENT',
                    listingKind: 'BUNDLE',
                    optional: true,
                },
            },
        });
        expect(result.targets[0]).toMatchObject({
            declarationId: 'platform',
            targetType: 'APP_AVAILABILITY',
            config: { listingKind: 'APP', optional: false },
        });
        expect(result.targets[0]?.config).not.toHaveProperty('declarationId');
        expect(result.targets[0]?.config).not.toHaveProperty('targetType');
    });
    it('materializes a v1.1 DCC package without a listing and includes review evidence', async (): Promise<void> => {
        const workload = await resolveWorkloadPlan(member, config, bundle);
        const result = materialize(workload);
        expect(result.targets[0]).toMatchObject({
            declarationId: 'issuer',
            targetType: 'WORKLOAD_DEPLOYMENT',
            workload: { profiles: ['core', 'lcw-exchange'], driver: 'local-compose' },
        });
        expect(workload.components).toHaveLength(5);
        expect(workload.secrets.map((secret): string => secret.name)).toEqual([
            'tenant-seed',
            'tenant-token',
        ]);
        expect(
            buildPlanFromMaterialization({ ...result, scopeSummary: 'Review', planRevision: 1 })
                .targets?.[0]?.workload
        ).toEqual(workload);
    });
    it('blocks disabled drivers clearly', async (): Promise<void> => {
        environment.WORKLOAD_LOCAL_COMPOSE_ENABLED = false;
        await expect(resolveWorkloadPlan(member, config, bundle)).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringContaining('WORKLOAD_LOCAL_COMPOSE_ENABLED'),
        });
    });
    it('rejects mismatched member hashes', async (): Promise<void> => {
        await expect(
            resolveWorkloadPlan({ ...member, manifestHash: 'f'.repeat(64) }, config, bundle)
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
    it('rejects unknown profiles', async (): Promise<void> => {
        await expect(
            resolveWorkloadPlan({ ...member, profiles: ['unknown'] }, config, bundle)
        ).rejects.toThrow('Unknown workload profile');
    });
    it('always includes core, even if only exchange was requested', async (): Promise<void> => {
        expect(
            (await resolveWorkloadPlan({ ...member, profiles: ['lcw-exchange'] }, config, bundle))
                .profiles
        ).toEqual(['core', 'lcw-exchange']);
    });
    it('rejects unmet conditional profiles', async (): Promise<void> => {
        await expect(
            resolveWorkloadPlan(member, { exchangeEnabled: false }, bundle)
        ).rejects.toThrow('Condition');
    });
    it('returns configuration validation errors', async (): Promise<void> => {
        await expect(
            resolveWorkloadPlan(member, { exchangeEnabled: 'yes' }, bundle)
        ).rejects.toThrow('Expected boolean');
    });
    it('rejects inline secret material before it can enter a workload plan', async (): Promise<void> => {
        await expect(
            resolveWorkloadPlan(member, { ...config, 'tenant-seed': 'never-persist-this' }, bundle)
        ).rejects.toThrow('Inline secret');
        const workload = await resolveWorkloadPlan(member, config, bundle);
        const result = materialize(workload);
        result.targets.push({
            declarationId: 'app',
            targetType: 'APP_AVAILABILITY',
            listingId: 'app',
            versionId: 'v1',
            scopes: [],
            consentTiers: [],
            entitlementRequirements: [],
            config: { apiToken: 'secret' },
        });
        // Credential keys in mixed bundles cannot silently become new approval evidence.
        expect((): unknown =>
            buildPlanFromMaterialization({ ...result, scopeSummary: 'Review', planRevision: 1 })
        ).toThrow('Inline secret');
    });
    it('does not accept platform metadata as workload operator config', async (): Promise<void> => {
        await expect(
            resolveWorkloadPlan(
                member,
                { ...config, declarationId: 'attacker', targetType: 'APP_AVAILABILITY' },
                bundle
            )
        ).rejects.toThrow('Unknown property');
    });
    it('rejects revoked versions separately from listing policy', async (): Promise<void> => {
        await neogma.queryRunner.run(
            'MATCH (v:WorkloadPackageVersion {versionId: $id}) SET v.status = "REVOKED"',
            { id: member.packageVersionId }
        );
        await expect(resolveWorkloadPlan(member, config, bundle)).rejects.toThrow('PUBLISHED');
    });
    it('rechecks curator eligibility at planning', async (): Promise<void> => {
        environment.WORKLOAD_CURATOR_DIDS = '';
        await expect(resolveWorkloadPlan(member, config, bundle)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });
    it('hashes every review-bearing workload field and canonical config, not revision/time', async (): Promise<void> => {
        const workload = await resolveWorkloadPlan(member, config, bundle);
        const original = hash(workload);
        expect(workload.executionSemanticsVersion).toBe(2);
        expect(hash({ ...workload, executionSemanticsVersion: undefined })).not.toBe(original);
        const withCommand = (command: string[]): WorkloadPlan => ({
            ...workload,
            execution: {
                ...workload.execution!,
                components: workload.execution!.components.map(
                    (component): Record<string, unknown> => ({
                        ...component,
                        user: '999:999',
                        command,
                    })
                ),
            },
        });
        const commanded = hash(withCommand(['mongod', '--replSet', 'rs0']));
        expect(commanded).not.toBe(original);
        expect(hash(withCommand(['mongod', 'rs0', '--replSet']))).not.toBe(commanded);
        expect(hash(withCommand(['mongod', '--replSet', 'rs1']))).not.toBe(commanded);
        const mutations: Record<string, unknown>[] = [
            { lifecycle: { kind: 'service' } },
            { lifecycle: { kind: 'init', timeoutMs: 1000 } },
            { lifecycle: { kind: 'init', timeoutMs: 2000 } },
        ];
        const lifecycleHashes = mutations.map((mutation): string =>
            hash({
                ...workload,
                execution: {
                    ...workload.execution!,
                    components: workload.execution!.components.map(
                        (component): Record<string, unknown> => ({ ...component, ...mutation })
                    ),
                },
            })
        );
        expect(new Set([original, ...lifecycleHashes]).size).toBe(4);
        const endpointHashes = [
            { protocol: 'mongodb' },
            { path: '/other' },
            { query: { replicaSet: 'rs0', directConnection: true } },
            { query: { replicaSet: 'rs1', directConnection: true } },
            { query: { replicaSet: 'rs0', directConnection: false } },
        ].map((mutation): string =>
            hash({
                ...workload,
                endpoints: workload.endpoints.map((endpoint): Record<string, unknown> => ({
                    ...endpoint,
                    ...mutation,
                })),
            })
        );
        expect(new Set([original, ...endpointHashes]).size).toBe(6);
        const withReadiness: WorkloadPlan = {
            ...workload,
            endpoints: workload.endpoints.map((endpoint): WorkloadPlan['endpoints'][number] => ({
                ...endpoint,
                readiness: { path: '/' },
            })),
        };
        expect(hash(withReadiness)).not.toBe(original);
        expect(
            hash({
                ...withReadiness,
                endpoints: withReadiness.endpoints.map(
                    (endpoint): WorkloadPlan['endpoints'][number] => ({
                        ...endpoint,
                        readiness: { path: '/healthz' },
                    })
                ),
            })
        ).not.toBe(hash(withReadiness));
        const changes: WorkloadPlan[] = [
            { ...workload, profiles: ['core'] },
            {
                ...workload,
                components: workload.components.map(
                    (component): WorkloadPlan['components'][number] => ({
                        ...component,
                        image: component.image.replace(/0/g, '1'),
                    })
                ),
            },
            { ...workload, module: { ...workload.module, sha256: 'f'.repeat(64) } },
            { ...workload, module: { ...workload.module, rendererVersion: '2.0.0' } },
            { ...workload, bundle: { ...bundle, versionId: 'bundle-v2' } },
            { ...workload, bundle: { ...bundle, manifestHash: 'f'.repeat(64) } },
            { ...workload, packageVersionId: 'wpv_other' },
            { ...workload, manifestHash: 'f'.repeat(64) },
            { ...workload, supportBoundary: { ...workload.supportBoundary, backup: 'changed' } },
            { ...workload, endpoints: [] },
            { ...workload, secrets: [{ name: 'new', provisioningKind: 'generate' }] },
        ];
        for (const changed of changes) expect(hash(changed)).not.toBe(original);
        expect(hash(workload, { exchangeEnabled: false })).not.toBe(original);
        const result = materialize(workload);
        expect(
            buildPlanFromMaterialization({
                ...result,
                scopeSummary: 'Workload review',
                planRevision: 999,
            }).planHash
        ).toBe(original);
    });
    it('prefers platform declarationId while preserving legacy target identity', (): void => {
        const target = {
            targetType: 'WORKLOAD_DEPLOYMENT' as const,
            listingId: 'old',
            config: { declarationId: 'legacy' },
        };
        expect(getTargetDeclarationId(target)).toBe('legacy');
        expect(getTargetDeclarationId({ ...target, declarationId: 'platform' })).toBe('platform');
    });
});
