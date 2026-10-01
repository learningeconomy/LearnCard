import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { BundleManifest } from '@learncard/types';

import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createListingVersion } from '@accesslayer/listing-version/create';
import { readListingVersionById } from '@accesslayer/listing-version/read';
import { listInstallTargetsByIntentId } from '@accesslayer/install-target/internal';
import { listBindingsByEcosystem } from '@accesslayer/binding/read';
import { getIntentTargetId } from '@helpers/install-intent.helpers';
import {
    assertSignedListingVersionOrThrow,
    signManifestWithDidKey,
} from '@helpers/manifest-signature.helpers';
import { reconcileInstallIntent } from '@reconciler';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { seedDccTools } from '../scripts/seed-dcc-tools';
import { DCC_READINESS, DCC_REGISTRIES } from '../scripts/fixtures/dcc-tools';
import { getClient } from './helpers/getClient';

describe('DCC Tools catalog-only bundle', () => {
    it('seeds signed candidates and renders a hash-bound readiness plan before catalog reconciliation', async () => {
        const publisherSeed = 'b'.repeat(64);
        const seeded = await seedDccTools(publisherSeed);
        const repeated = await seedDccTools(publisherSeed);
        expect(repeated).toEqual(seeded);
        for (const [kind, listing] of [
            ['WALLET', seeded.wallet],
            ['INTEGRATION', seeded.registryAdapter],
            ['BUNDLE', seeded.bundle],
        ] as const) {
            const version = await readListingVersionById(listing.versionId);
            expect(version).not.toBeNull();
            if (!version) throw new Error('Missing seeded version');
            await expect(assertSignedListingVersionOrThrow(kind, version)).resolves.toMatchObject({
                publisherDid: seeded.bundle.manifest.publisherDid,
            });
            expect(JSON.parse(version.review_snapshot_json ?? '{}')).toMatchObject({
                reviewStatus: 'DEV_CATALOG_ONLY',
                approvedConsentTiers: [],
            });
        }
        expect(seeded.wallet.manifest).toMatchObject({
            provides: ['wallet-claim'],
            platforms: ['ios', 'android'],
            supportsApps: false,
        });
        expect(seeded.wallet.manifest.claimProtocols).not.toContain('oid4vci');
        expect(seeded.registryAdapter.manifest).toMatchObject({
            apiVersion: 'lc.integration/v1.3',
            scopes: [],
            consentRequirements: [],
            capabilities: { provided: ['registry-adapter'], consumed: [] },
            subscribes: DCC_REGISTRIES,
            consoleSurfaces: [],
        });
        expect(DCC_REGISTRIES).toHaveLength(5);
        expect(DCC_READINESS).toHaveLength(10);

        const id = randomUUID();
        const did = `did:key:dcc-test-${id}`;
        const profileId = `dcc-owner-${id}`;
        await createProfile({ profileId, did, displayName: 'DCC catalog test owner' } as Parameters<
            typeof createProfile
        >[0]);
        const ecosystem = await createEcosystem({
            name: 'DCC catalog test',
            slug: `dcc-${id}`,
            ownerProfileId: profileId,
            parentEcosystemId: null,
            description: undefined,
            settings: {},
            status: 'ACTIVE',
        });
        const client = getClient({
            did,
            isChallengeValid: true,
            scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
        });
        const request = {
            intentId: `int_dcc_${id}`,
            ecosystemId: ecosystem.id,
            listingId: seeded.bundle.listingId,
            versionId: seeded.bundle.versionId,
            requestedConfig: {},
            proposedBindings: [],
        };
        const planned = await client.installIntent.planInstallIntent(request);
        const repeatedPlan = await client.installIntent.planInstallIntent(request);
        expect(repeatedPlan.plan.planHash).toBe(planned.plan.planHash);
        expect(planned.plan.scopesRequested).toEqual([]);
        expect(planned.plan.consentTiers).toEqual([]);
        for (const gate of DCC_READINESS) {
            expect(planned.plan.infrastructureEffects).toContain(
                `Readiness [${gate.status}] ${gate.name}: ${gate.note}`
            );
        }
        expect(
            planned.plan.infrastructureEffects.filter(effect =>
                effect.startsWith('Readiness [OPEN]')
            )
        ).toHaveLength(5);

        // A new immutable, signed version changes only readiness (member pins stay fixed).
        // This is test evidence, not a claim that the actual counterpart gate is cleared.
        const changedManifest = await signManifestWithDidKey<BundleManifest>(
            {
                ...seeded.bundle.manifest,
                version: '1.0.1',
                readiness: DCC_READINESS.map((gate, index) =>
                    index === 0 ? { ...gate, status: 'Passable' } : gate
                ),
            },
            publisherSeed
        );
        const changedVersion = await createListingVersion(seeded.bundle.listingId, {
            version: '1.0.1',
            status: 'LISTED',
            manifest_json: JSON.stringify(changedManifest),
        });
        const changedPlan = await client.installIntent.planInstallIntent({
            ...request,
            versionId: changedVersion.version_id,
        });
        expect(changedPlan.plan.planHash).not.toBe(planned.plan.planHash);
        await expect(
            client.installIntent.approveInstallIntent({
                intentId: request.intentId,
                planHash: planned.plan.planHash,
                planRevision: repeatedPlan.plan.planRevision,
                consentTiers: [],
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        // Restore the original OPEN-gate catalog candidate before approval.
        const finalPlan = await client.installIntent.planInstallIntent(request);
        expect(finalPlan.plan.planHash).toBe(planned.plan.planHash);
        const approved = await client.installIntent.approveInstallIntent({
            intentId: request.intentId,
            planHash: finalPlan.plan.planHash,
            planRevision: finalPlan.plan.planRevision,
            consentTiers: [],
        });
        expect(approved.approval).toMatchObject({
            state: 'APPROVED',
            artifact: { infrastructureEffects: finalPlan.plan.infrastructureEffects },
        });
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockRejectedValue(new Error('Catalog must not call external services'));
        try {
            const applied = await client.installIntent.applyInstallIntent({
                intentId: request.intentId,
                expectedStatusRevision: approved.statusRevision,
            });
            expect(applied.status?.phase).toBe('READY');
            const reconciled = await reconcileInstallIntent(request.intentId);
            expect(reconciled.status?.phase).toBe('READY');
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fetchSpy.mockRestore();
        }

        const targets = await listInstallTargetsByIntentId(request.intentId);
        expect(targets).toHaveLength(7);
        expect(targets.every(target => target.status === 'READY')).toBe(true);
        expect(targets).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    targetType: 'WALLET_ENABLEMENT',
                    listingId: seeded.wallet.listingId,
                }),
                expect.objectContaining({
                    targetType: 'INTEGRATION_INSTALL',
                    listingId: seeded.registryAdapter.listingId,
                }),
            ])
        );
        for (const registry of DCC_REGISTRIES) {
            const declarationId = `dcc-registry-adapter:${registry.declarationId}`;
            expect(targets).toContainEqual(
                expect.objectContaining({
                    id: getIntentTargetId(request.intentId, declarationId),
                    targetType: 'REGISTRY_SUBSCRIPTION',
                })
            );
            expect(approved.spec?.targets).toContainEqual(
                expect.objectContaining({
                    targetType: 'REGISTRY_SUBSCRIPTION',
                    config: expect.objectContaining({
                        registryId: registry.registryId,
                        registryUrl: registry.registryUrl,
                        description: registry.description,
                    }),
                })
            );
        }
        const bindings = await listBindingsByEcosystem(ecosystem.id);
        expect(bindings).toHaveLength(seeded.bundle.manifest.defaultBindings.length);
        for (const proposal of approved.spec?.bindings ?? []) {
            expect(bindings).toContainEqual(
                expect.objectContaining({
                    capability: proposal.capability,
                    provider: proposal.provider,
                    consumer: proposal.consumer,
                    status: 'PROPOSED',
                })
            );
        }
    });

    // Exact task-requested TODO wording; WORKPLAN now records the authority design
    // as decided. READY above proves catalog materialization only, not invariant 1.
    it.todo(
        'provisions exactly one ServiceAccount for the registry-adapter install (ADR-007 §3.7.1 #1) — pending owner decision 2'
    );
});
