import { TRPCClientError } from '@trpc/client';
import type { inferRouterOutputs } from '@trpc/server';

import type { ConsoleRouter } from '@console-bff/trpc/router';

import { trpc } from './trpc';

export type DashboardSession = inferRouterOutputs<ConsoleRouter>['session']['get'];
export type EcosystemAccess = inferRouterOutputs<ConsoleRouter>['ecosystem']['list'][number];
export type EcosystemDetail = inferRouterOutputs<ConsoleRouter>['ecosystem']['get'];
export type Group = inferRouterOutputs<ConsoleRouter>['group']['listByEcosystem'][number];
export type GroupDetail = inferRouterOutputs<ConsoleRouter>['group']['get'];
export type CatalogListing =
    inferRouterOutputs<ConsoleRouter>['catalog']['listings']['records'][number];
export type CatalogListingDetail = inferRouterOutputs<ConsoleRouter>['catalog']['get'];
export type CatalogEnablement = inferRouterOutputs<ConsoleRouter>['catalog']['enablement']['get'];
export type CatalogBundleMember =
    inferRouterOutputs<ConsoleRouter>['catalog']['getBundleMembers'][number];
export type CatalogIntegrationManifestSummary = NonNullable<
    inferRouterOutputs<ConsoleRouter>['catalog']['getIntegrationManifestSummary']
>;
export type SkillFramework = inferRouterOutputs<ConsoleRouter>['skillFrameworks']['list'][number];
export type SkillFrameworkDetail = inferRouterOutputs<ConsoleRouter>['skillFrameworks']['get'];
export type SkillTreeNode = SkillFrameworkDetail['skills']['records'][number];
export type WorkloadDeployment =
    inferRouterOutputs<ConsoleRouter>['infra']['listDeployments'][number];
export type RegistrySubscription =
    inferRouterOutputs<ConsoleRouter>['registries']['listSubscriptions'][number];
export type BindingRecord = inferRouterOutputs<ConsoleRouter>['bindings']['list'][number];
export type EcosystemInstallTarget =
    inferRouterOutputs<ConsoleRouter>['installTargets']['list'][number];
export type EcosystemAuditEvent = inferRouterOutputs<ConsoleRouter>['activity']['list'][number];
export type ProjectedConsoleSurface = inferRouterOutputs<ConsoleRouter>['surfaces']['list'][number];

const TENANT_ID = 'learncard';
const PROVIDER_ID = 'lef-wallet';

const jsonHeaders = { 'content-type': 'application/json', 'x-tenant-id': TENANT_ID };

const base64url = (input: string): string =>
    btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Dev-only presentation for the decode-only verifier (CONSOLE_BFF_DEV_INSECURE_AUTH):
// it reads vp.holder without checking the signature, so the third segment is a stub.
const craftDevPresentation = (holderDid: string): string => {
    const header = base64url(JSON.stringify({ alg: 'ES256' }));
    const payload = base64url(JSON.stringify({ iss: holderDid, vp: { holder: holderDid } }));

    return `${header}.${payload}.dev-signature`;
};

// Stable on purpose: a random DID per login mints a new MEMBER profile every time,
// and JIT may never grant OWNER/ADMIN (ADR-001 §3.10), so an out-of-band role grant
// would be lost on every sign-out. VITE_DEV_FRESH_IDENTITY=true opts back out.
const DEV_HOLDER_DID = 'did:key:z6MkdevconsoleLocalOperator';

const holderDid = (): string =>
    import.meta.env.VITE_DEV_FRESH_IDENTITY === 'true'
        ? `did:key:z6Mkdev${Math.random().toString(36).slice(2, 10)}`
        : DEV_HOLDER_DID;

const stateFromRedirectUrl = (redirectUrl: string): string | null =>
    new URL(redirectUrl).searchParams.get('state');

export async function login(): Promise<{ profileId: string; expiresAt: string }> {
    const beginRes = await fetch('/auth/login', {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({
            providerId: PROVIDER_ID,
            redirectUri: `${window.location.origin}/callback`,
        }),
    });

    if (!beginRes.ok) throw new Error(`login begin failed (${beginRes.status})`);

    const { redirectUrl } = (await beginRes.json()) as { redirectUrl: string };
    const state = stateFromRedirectUrl(redirectUrl);

    if (!state) throw new Error('login begin did not return a state');

    const vp = craftDevPresentation(holderDid());

    const callbackRes = await fetch('/auth/callback', {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({ providerId: PROVIDER_ID, params: { vp, state } }),
    });

    if (!callbackRes.ok) throw new Error(`login callback failed (${callbackRes.status})`);

    return (await callbackRes.json()) as { profileId: string; expiresAt: string };
}

export async function getSession(): Promise<DashboardSession | null> {
    try {
        return await trpc.session.get.query();
    } catch (error) {
        if (error instanceof TRPCClientError && error.data?.httpStatus === 401) return null;

        throw error;
    }
}

export async function logout(): Promise<void> {
    const res = await fetch('/auth/logout', { method: 'POST', credentials: 'include' });

    if (!res.ok) throw new Error(`logout failed (${res.status})`);
}

export async function listEcosystems() {
    return trpc.ecosystem.list.query();
}

export async function getEcosystemDetail(id: string) {
    return trpc.ecosystem.get.query({ id });
}

export async function grantEcosystemMembership(input: {
    id: string;
    profileId: string;
    role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}) {
    return trpc.ecosystem.grantMembership.mutate(input);
}

export async function revokeEcosystemMembership(input: { id: string; profileId: string }) {
    return trpc.ecosystem.revokeMembership.mutate(input);
}

export async function createEcosystem(input: {
    parentEcosystemId: string;
    name: string;
    slug: string;
    description?: string;
}) {
    return trpc.ecosystem.create.mutate(input);
}

export async function listGroupsByEcosystem(ecosystemId: string) {
    return trpc.group.listByEcosystem.query({ ecosystemId });
}

export async function getGroupDetail(id: string) {
    return trpc.group.get.query({ id });
}

export async function createGroup(input: {
    ownerEcosystemId: string;
    name: string;
    slug: string;
    type: 'geographic' | 'administrative' | 'programmatic' | 'functional' | 'cohort' | 'custom';
    description?: string;
}) {
    return trpc.group.create.mutate(input);
}

export async function addGroupMember(input: { id: string; profileId: string }) {
    return trpc.group.addMember.mutate(input);
}

export async function removeGroupMember(input: { id: string; profileId: string }) {
    return trpc.group.removeMember.mutate(input);
}

export async function createOrgProfile(input: {
    name: string;
    type: 'institution' | 'employer';
    groupId?: string;
}) {
    return trpc.group.createOrgProfile.mutate(input);
}

export async function listCatalogListings(
    input: { limit?: number; cursor?: string; category?: string } = {}
) {
    return trpc.catalog.listings.query(input);
}

export async function getCatalogListing(input: { listingId: string }) {
    return trpc.catalog.get.query(input);
}

export async function getCatalogBundleMembers(input: { listingId: string }) {
    return trpc.catalog.getBundleMembers.query(input);
}

export async function getCatalogIntegrationManifestSummary(input: { listingId: string }) {
    return trpc.catalog.getIntegrationManifestSummary.query(input);
}

export async function listCatalogListingsForEcosystem(input: {
    ecosystemId: string;
    limit?: number;
    cursor?: string;
    category?: string;
}) {
    return trpc.catalog.listingsForEcosystem.query(input);
}

export async function getCatalogEnablement(input: { ecosystemId: string }) {
    return trpc.catalog.enablement.get.query(input);
}

export async function enableCatalogListing(input: { ecosystemId: string; listingId: string }) {
    return trpc.catalog.enablement.enable.mutate(input);
}

export async function disableCatalogListing(input: { ecosystemId: string; listingId: string }) {
    return trpc.catalog.enablement.disable.mutate(input);
}

export async function listSkillFrameworks(input: { limit?: number } = {}) {
    return trpc.skillFrameworks.list.query(input);
}

export async function getSkillFramework(input: { id: string }) {
    return trpc.skillFrameworks.get.query(input);
}

export async function listWorkloadDeployments(input: { ecosystemId: string }) {
    return trpc.infra.listDeployments.query(input);
}

export async function listRegistrySubscriptions(input: { ecosystemId: string }) {
    return trpc.registries.listSubscriptions.query(input);
}
