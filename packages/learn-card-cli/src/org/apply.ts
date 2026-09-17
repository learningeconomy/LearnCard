import fs from 'node:fs/promises';
import type { LCALearnCard } from '@learncard/lca-api-plugin';
import { saveProject, type Project } from '../project';
import { setupSigning } from '../setup-signing';
import { out } from '../out';
import type { OrgSpec } from './schema';

export type OrgResource =
    | 'issuer'
    | 'signingAuthority'
    | 'profileManager'
    | 'managedProfile'
    | 'serviceAccount'
    | 'webhook';

export type OrgChangeAction = 'created' | 'updated' | 'unchanged' | 'would-create' | 'would-update';

export interface OrgChange {
    resource: OrgResource;
    name: string;
    action: OrgChangeAction;
    detail?: string;
}

export interface OrgApplyResult {
    changes: OrgChange[];
    outputs: {
        issuerDid: string;
        managerDid?: string;
        managed: Array<{ profileId: string; did: string }>;
        serviceAccounts: Array<{ name: string; grantId: string; created: boolean }>;
    };
}

/**
 * Managed-profile routes are manager-only on the network: the caller must
 * authenticate as `did:web:<host>:manager:<id>`, not as the issuer. Callers
 * supply this to open a second wallet bound to the manager DID.
 */
export type ManagerLearnCard = {
    invoke: Pick<LCALearnCard['invoke'], 'createManagedProfile' | 'getManagedProfiles'>;
};

export interface ApplyOrgOptions {
    dryRun?: boolean;
    secretsOut?: string;
    /** Required when the spec has `profileManager.managed` entries. */
    connectAsManager?: (managerDid: string) => Promise<ManagerLearnCard>;
}

export type OrgLearnCard = {
    id: Pick<LCALearnCard['id'], 'did'>;
    invoke: Pick<
        LCALearnCard['invoke'],
        | 'getProfile'
        | 'createProfile'
        | 'updateProfile'
        | 'createProfileManager'
        | 'getAuthGrants'
        | 'addAuthGrant'
        | 'getAPITokenForAuthGrant'
        | 'getRegisteredSigningAuthorities'
        | 'registerSigningAuthority'
        | 'setPrimaryRegisteredSigningAuthority'
        | 'getSigningAuthorities'
        | 'createSigningAuthority'
    >;
};

/** Prefer the network's did:web identity; fall back to the wallet's base DID if unavailable. */
const resolveIssuerDid = (learnCard: OrgLearnCard): string => {
    try {
        return learnCard.id.did('web');
    } catch {
        return learnCard.id.did();
    }
};

/** `ea-clr-issuer` -> `EA_CLR_ISSUER`, so the file can be sourced by a shell as well as parsed by dotenv. */
export const toEnvKey = (name: string): string => name.replace(/-/g, '_').toUpperCase();

/** Append a `NAME=token` line, creating the file with owner-only permissions if needed. */
const writeSecret = async (secretsOut: string, name: string, token: string): Promise<void> => {
    await fs.appendFile(secretsOut, `${toEnvKey(name)}=${token}\n`, { mode: 0o600 });
    await fs.chmod(secretsOut, 0o600);
};

const applyIssuerProfile = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    dryRun: boolean,
    changes: OrgChange[]
): Promise<void> => {
    const { profileId, displayName } = spec.issuer;
    const existing = await learnCard.invoke.getProfile();
    if (!existing) {
        if (dryRun) {
            changes.push({ resource: 'issuer', name: profileId, action: 'would-create' });
            return;
        }
        await learnCard.invoke.createProfile({ profileId, displayName, bio: '', shortBio: '' });
        changes.push({ resource: 'issuer', name: profileId, action: 'created' });
        return;
    }
    if (existing.displayName !== displayName) {
        if (dryRun) {
            changes.push({
                resource: 'issuer',
                name: profileId,
                action: 'would-update',
                detail: 'displayName',
            });
            return;
        }
        await learnCard.invoke.updateProfile({ displayName });
        changes.push({
            resource: 'issuer',
            name: profileId,
            action: 'updated',
            detail: 'displayName',
        });
        return;
    }
    changes.push({ resource: 'issuer', name: profileId, action: 'unchanged' });
};

const applySigningAuthority = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    project: Project,
    dryRun: boolean,
    changes: OrgChange[]
): Promise<void> => {
    const signingAuthority = spec.issuer.signingAuthority;
    const registered = await learnCard.invoke.getRegisteredSigningAuthorities();

    if (signingAuthority.type === 'learncard-hosted') {
        const match = registered.find(a => a.relationship.name === signingAuthority.name);
        if (!match) {
            if (dryRun) {
                changes.push({
                    resource: 'signingAuthority',
                    name: signingAuthority.name,
                    action: 'would-create',
                });
                return;
            }
            await setupSigning(project, learnCard, signingAuthority.name, { persist: true });
            changes.push({
                resource: 'signingAuthority',
                name: signingAuthority.name,
                action: 'created',
            });
            return;
        }
        if (!match.relationship.isPrimary) {
            if (dryRun) {
                changes.push({
                    resource: 'signingAuthority',
                    name: signingAuthority.name,
                    action: 'would-update',
                    detail: 'set primary',
                });
                return;
            }
            await setupSigning(project, learnCard, signingAuthority.name, { persist: true });
            changes.push({
                resource: 'signingAuthority',
                name: signingAuthority.name,
                action: 'updated',
                detail: 'set primary',
            });
            return;
        }
        changes.push({
            resource: 'signingAuthority',
            name: signingAuthority.name,
            action: 'unchanged',
        });
        return;
    }

    const { name, endpoint, did } = signingAuthority;
    const match = registered.find(
        a => a.relationship.name === name && a.signingAuthority.endpoint === endpoint
    );
    if (!match) {
        if (dryRun) {
            changes.push({ resource: 'signingAuthority', name, action: 'would-create' });
            return;
        }
        if (!(await learnCard.invoke.registerSigningAuthority(endpoint, name, did)))
            throw new Error(`Could not register signing authority "${name}".`);
        if (!(await learnCard.invoke.setPrimaryRegisteredSigningAuthority(endpoint, name)))
            throw new Error(`Could not set "${name}" as the primary signing authority.`);
        await saveProject(project, {
            SIGNING_AUTHORITY_NAME: name,
            SIGNING_AUTHORITY_ENDPOINT: endpoint,
        });
        changes.push({ resource: 'signingAuthority', name, action: 'created' });
        return;
    }
    if (!match.relationship.isPrimary) {
        if (dryRun) {
            changes.push({
                resource: 'signingAuthority',
                name,
                action: 'would-update',
                detail: 'set primary',
            });
            return;
        }
        if (!(await learnCard.invoke.setPrimaryRegisteredSigningAuthority(endpoint, name)))
            throw new Error(`Could not set "${name}" as the primary signing authority.`);
        changes.push({
            resource: 'signingAuthority',
            name,
            action: 'updated',
            detail: 'set primary',
        });
        return;
    }
    changes.push({ resource: 'signingAuthority', name, action: 'unchanged' });
};

const applyProfileManager = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    project: Project,
    dryRun: boolean,
    connectAsManager: ApplyOrgOptions['connectAsManager'],
    changes: OrgChange[],
    managed: Array<{ profileId: string; did: string }>
): Promise<string | undefined> => {
    if (!spec.profileManager) return undefined;
    const { displayName, managed: managedSpecs } = spec.profileManager;

    let managerDid: string | undefined;
    if (project.env.ORG_PROFILE_MANAGER_DID) {
        managerDid = project.env.ORG_PROFILE_MANAGER_DID;
        changes.push({ resource: 'profileManager', name: displayName, action: 'unchanged' });
    } else if (dryRun) {
        changes.push({ resource: 'profileManager', name: displayName, action: 'would-create' });
    } else {
        managerDid = await learnCard.invoke.createProfileManager({ displayName });
        await saveProject(project, { ORG_PROFILE_MANAGER_DID: managerDid });
        changes.push({ resource: 'profileManager', name: displayName, action: 'created' });
    }

    if (!managedSpecs.length) return managerDid;

    if (!managerDid) {
        for (const managedSpec of managedSpecs) {
            changes.push({
                resource: 'managedProfile',
                name: managedSpec.profileId,
                action: 'would-create',
            });
        }
        return managerDid;
    }

    if (!connectAsManager)
        throw new Error('Managed profiles require a manager connection (connectAsManager).');
    const managerCard = await connectAsManager(managerDid);

    const existingManaged = new Map<string, string>();
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
        const page = await managerCard.invoke.getManagedProfiles({ limit: 100, cursor });
        for (const profile of page.records) existingManaged.set(profile.profileId, profile.did);
        hasMore = page.hasMore;
        cursor = page.cursor;
        if (hasMore && !cursor) break;
    }

    for (const managedSpec of managedSpecs) {
        const existingDid = existingManaged.get(managedSpec.profileId);
        if (existingDid) {
            managed.push({ profileId: managedSpec.profileId, did: existingDid });
            changes.push({
                resource: 'managedProfile',
                name: managedSpec.profileId,
                action: 'unchanged',
            });
            continue;
        }
        if (dryRun) {
            changes.push({
                resource: 'managedProfile',
                name: managedSpec.profileId,
                action: 'would-create',
            });
            continue;
        }
        const newDid = await managerCard.invoke.createManagedProfile({
            profileId: managedSpec.profileId,
            displayName: managedSpec.displayName,
            bio: '',
            shortBio: '',
        });
        managed.push({ profileId: managedSpec.profileId, did: newDid });
        changes.push({
            resource: 'managedProfile',
            name: managedSpec.profileId,
            action: 'created',
        });
    }

    return managerDid;
};

const applyServiceAccounts = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    dryRun: boolean,
    secretsOut: string | undefined,
    changes: OrgChange[],
    serviceAccounts: Array<{ name: string; grantId: string; created: boolean }>
): Promise<void> => {
    if (!spec.serviceAccounts?.length) return;

    const grants = (await learnCard.invoke.getAuthGrants()) ?? [];
    for (const account of spec.serviceAccounts) {
        const existing = grants.find(g => g.name === account.name && g.status === 'active');
        if (existing) {
            serviceAccounts.push({
                name: account.name,
                grantId: existing.id ?? '',
                created: false,
            });
            changes.push({ resource: 'serviceAccount', name: account.name, action: 'unchanged' });
            continue;
        }
        if (dryRun) {
            changes.push({
                resource: 'serviceAccount',
                name: account.name,
                action: 'would-create',
            });
            continue;
        }
        if (!secretsOut)
            throw new Error(
                `Pass --secrets-out <path> to create service account "${account.name}" (its token can only be retrieved once).`
            );
        const grantId = await learnCard.invoke.addAuthGrant({
            name: account.name,
            scope: account.scopes.join(' '),
            ...(account.expiresAt ? { expiresAt: new Date(account.expiresAt).toISOString() } : {}),
        });
        const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);
        await writeSecret(secretsOut, account.name, token);
        out.log(`Token for "${account.name}" written to ${secretsOut}`);
        serviceAccounts.push({ name: account.name, grantId, created: true });
        changes.push({ resource: 'serviceAccount', name: account.name, action: 'created' });
    }
};

const applyWebhooks = (spec: OrgSpec, changes: OrgChange[]): void => {
    for (const webhook of spec.webhooks ?? []) {
        changes.push({
            resource: 'webhook',
            name: webhook.url,
            action: 'unchanged',
            detail: 'informational only; no network call',
        });
    }
};

export const applyOrg = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    project: Project,
    opts: ApplyOrgOptions = {}
): Promise<OrgApplyResult> => {
    const dryRun = !!opts.dryRun;
    const changes: OrgChange[] = [];
    const managed: Array<{ profileId: string; did: string }> = [];
    const serviceAccounts: Array<{ name: string; grantId: string; created: boolean }> = [];

    await applyIssuerProfile(spec, learnCard, dryRun, changes);
    const issuerDid = resolveIssuerDid(learnCard);

    await applySigningAuthority(spec, learnCard, project, dryRun, changes);

    const managerDid = await applyProfileManager(
        spec,
        learnCard,
        project,
        dryRun,
        opts.connectAsManager,
        changes,
        managed
    );

    await applyServiceAccounts(spec, learnCard, dryRun, opts.secretsOut, changes, serviceAccounts);

    applyWebhooks(spec, changes);

    return { changes, outputs: { issuerDid, managerDid, managed, serviceAccounts } };
};
