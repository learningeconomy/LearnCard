import { beforeEach, describe, expect, it } from 'vitest';

import { appRouter } from '../src/app';
import { Ecosystem, Group, Tenant } from '@models';
import { ensureShadowRootEcosystem, slugifyTenantId } from '@accesslayer/tenant/create';
import { getTenantById, getTenantRootEcosystem } from '@accesslayer/tenant/read';

const authedTenantClient = (tenantId: string) =>
    appRouter.createCaller({
        domain: 'localhost%3A3000',
        user: { did: 'did:key:z6MkTenantTester', isChallengeValid: true },
        tenant: { id: tenantId, emailBranding: {}, resolvedVia: 'header' },
    });

describe('Tenant shadow root Ecosystems', () => {
    beforeEach(async () => {
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
        await Tenant.delete({ detach: true, where: {} });
    });

    describe('slugifyTenantId', () => {
        it('produces a URL-safe slug from arbitrary tenant ids', () => {
            expect(slugifyTenantId('learncard')).toBe('learncard');
            expect(slugifyTenantId('My_Tenant!!')).toBe('my-tenant');
            expect(slugifyTenantId('--Weird__Name--')).toBe('weird-name');
        });
    });

    describe('ensureShadowRootEcosystem', () => {
        it('creates a Tenant, a root Ecosystem, and a SERVES binding', async () => {
            const root = await ensureShadowRootEcosystem({
                tenantId: 'vetpass',
                ownerProfileId: 'network-seed',
            });

            expect(root.id).toMatch(/^eco_/);
            expect(root.parentEcosystemId).toBeNull();
            expect(root.slug).toBe('vetpass');
            expect(root.rootEcosystemId).toBe(root.id);

            const tenant = await getTenantById('vetpass');
            expect(tenant?.rootEcosystemId).toBe(root.id);

            const tenantInstance = await Tenant.findOne({ where: { tenantId: 'vetpass' } });
            const served = await tenantInstance!.findRelationships({ alias: 'serves' });
            expect(served).toHaveLength(1);
            expect(served[0]!.target.id).toBe(root.id);
        });

        it('is idempotent — re-running returns the same root and creates no duplicates', async () => {
            const first = await ensureShadowRootEcosystem({
                tenantId: 'learncard',
                ownerProfileId: 'network-seed',
            });
            const second = await ensureShadowRootEcosystem({
                tenantId: 'learncard',
                ownerProfileId: 'network-seed',
            });

            expect(second.id).toBe(first.id);

            const ecosystems = await Ecosystem.findMany({ where: {} });
            expect(ecosystems).toHaveLength(1);

            const tenants = await Tenant.findMany({ where: {} });
            expect(tenants).toHaveLength(1);
        });

        it('honors an explicit name and slug override', async () => {
            const root = await ensureShadowRootEcosystem({
                tenantId: 'scoutpass',
                ownerProfileId: 'network-seed',
                name: 'ScoutPass',
                slug: 'scouts',
            });

            expect(root.name).toBe('ScoutPass');
            expect(root.slug).toBe('scouts');
        });
    });

    describe('getTenantRootEcosystem', () => {
        it('returns the bound root ecosystem, or null when unbound', async () => {
            expect(await getTenantRootEcosystem('unbound')).toBeNull();

            const root = await ensureShadowRootEcosystem({
                tenantId: 'vetpass',
                ownerProfileId: 'network-seed',
            });

            const resolved = await getTenantRootEcosystem('vetpass');
            expect(resolved?.id).toBe(root.id);
        });
    });

    describe('getMyTenantRoot route', () => {
        it('resolves the shadow root for the tenant on the request', async () => {
            const root = await ensureShadowRootEcosystem({
                tenantId: 'vetpass',
                ownerProfileId: 'network-seed',
            });

            const result = await authedTenantClient('vetpass').ecosystem.getMyTenantRoot({});

            expect(result?.id).toBe(root.id);
        });

        it('throws NOT_FOUND when the tenant has no shadow root', async () => {
            await expect(
                authedTenantClient('no-root').ecosystem.getMyTenantRoot({})
            ).rejects.toThrow();
        });
    });
});
