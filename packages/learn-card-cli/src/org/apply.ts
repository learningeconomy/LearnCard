import fs from 'node:fs/promises';
import path from 'node:path';
import type { LCALearnCard } from '@learncard/lca-api-plugin';
import { ensureGitignored, saveProject, type Project } from '../project';
import { setupSigning } from '../setup-signing';
import { out } from '../out';
import { getGrantActAs, type AuthGrantWithActAs } from '../auth-grant';
import type { OrgBranding, OrgServiceAccountSpec, OrgSpec } from './schema';

export type OrgResource =
    | 'issuer'
    | 'signingAuthority'
    | 'profileManager'
    | 'managedProfile'
    | 'branding'
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

export type ProfileCard = {
    invoke: Pick<LCALearnCard['invoke'], 'getProfile' | 'updateProfile'>;
};

export interface ApplyOrgOptions {
    dryRun?: boolean;
    secretsOut?: string;
    /** Required when the spec has `profileManager.managed` entries. */
    connectAsManager?: (managerDid: string) => Promise<ManagerLearnCard>;
    /** Required when a managed profile declares `branding`; opens a wallet bound to that profile's did:web. */
    connectAsManaged?: (managedDid: string) => Promise<ProfileCard>;
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
        | 'updateAuthGrant'
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
    await fs.mkdir(path.dirname(secretsOut), { recursive: true });
    await fs.appendFile(secretsOut, `${toEnvKey(name)}=${token}\n`, { mode: 0o600 });
    await fs.chmod(secretsOut, 0o600);
    await ensureGitignored(path.dirname(secretsOut), path.basename(secretsOut));
};

type BrandingUpdate = Partial<OrgBranding> & { display?: Record<string, unknown> };

/**
 * Only fields the spec sets are compared; `display` is merged so a spec that
 * names two colours never wipes a third one set elsewhere.
 */
export const brandingDiff = (
    branding: OrgBranding,
    existing: Record<string, unknown>
): { update: BrandingUpdate; changed: string[] } => {
    const update: BrandingUpdate = {};
    const changed: string[] = [];
    const { display, ...scalars } = branding;

    for (const [key, value] of Object.entries(scalars)) {
        if (value === undefined) continue;
        if (existing[key] !== value) {
            (update as Record<string, unknown>)[key] = value;
            changed.push(key);
        }
    }

    if (display) {
        const current = (existing.display ?? {}) as Record<string, unknown>;
        const merged = { ...current };
        for (const [key, value] of Object.entries(display)) {
            if (value === undefined) continue;
            if (current[key] !== value) {
                merged[key] = value;
                changed.push(`display.${key}`);
            }
        }
        if (changed.some(name => name.startsWith('display.'))) update.display = merged;
    }

    return { update, changed };
};

const applyBranding = async (
    name: string,
    branding: OrgBranding | undefined,
    card: ProfileCard,
    dryRun: boolean,
    changes: OrgChange[]
): Promise<void> => {
    if (!branding) return;
    const existing = (await card.invoke.getProfile()) as Record<string, unknown> | undefined;
    if (!existing) return;
    const { update, changed } = brandingDiff(branding, existing);
    if (!changed.length) {
        changes.push({ resource: 'branding', name, action: 'unchanged' });
        return;
    }
    if (dryRun) {
        changes.push({
            resource: 'branding',
            name,
            action: 'would-update',
            detail: changed.join(', '),
        });
        return;
    }
    await card.invoke.updateProfile(
        update as Parameters<ProfileCard['invoke']['updateProfile']>[0]
    );
    changes.push({ resource: 'branding', name, action: 'updated', detail: changed.join(', ') });
};

const applyIssuerProfile = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    dryRun: boolean,
    changes: OrgChange[]
): Promise<boolean> => {
    const { profileId, displayName } = spec.issuer;
    const existing = await learnCard.invoke.getProfile();
    if (!existing) {
        if (dryRun) {
            changes.push({ resource: 'issuer', name: profileId, action: 'would-create' });
            return false;
        }
        await learnCard.invoke.createProfile({ profileId, displayName, bio: '', shortBio: '' });
        changes.push({ resource: 'issuer', name: profileId, action: 'created' });
        return true;
    }
    if (existing.displayName !== displayName) {
        if (dryRun) {
            changes.push({
                resource: 'issuer',
                name: profileId,
                action: 'would-update',
                detail: 'displayName',
            });
            return true;
        }
        await learnCard.invoke.updateProfile({ displayName });
        changes.push({
            resource: 'issuer',
            name: profileId,
            action: 'updated',
            detail: 'displayName',
        });
        return true;
    }
    changes.push({ resource: 'issuer', name: profileId, action: 'unchanged' });
    return true;
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
    connectAsManaged: ApplyOrgOptions['connectAsManaged'],
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
            if (managedSpec.branding) {
                if (!connectAsManaged)
                    throw new Error('Managed-profile branding requires connectAsManaged.');
                await applyBranding(
                    managedSpec.profileId,
                    managedSpec.branding,
                    await connectAsManaged(existingDid),
                    dryRun,
                    changes
                );
            }
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
        const { display, ...brandingScalars } = managedSpec.branding ?? {};
        const newDid = await managerCard.invoke.createManagedProfile({
            profileId: managedSpec.profileId,
            displayName: managedSpec.displayName,
            bio: '',
            shortBio: '',
            ...brandingScalars,
            ...(display && { display }),
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

/** `'*'` stays `'*'`; a profileId list joins with `,` to match the grant's flat `actAs` string. */
const actAsValue = (actAs: OrgServiceAccountSpec['actAs']): string | undefined =>
    actAs === undefined ? undefined : actAs === '*' ? '*' : actAs.join(',');

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
        const actAs = actAsValue(account.actAs);
        const existing = grants.find(g => g.name === account.name && g.status === 'active');
        if (existing) {
            serviceAccounts.push({
                name: account.name,
                grantId: existing.id ?? '',
                created: false,
            });
            if (getGrantActAs(existing) !== actAs) {
                // `updateAuthGrant` exists on the network plugin, so reconcile for real.
                if (dryRun) {
                    changes.push({
                        resource: 'serviceAccount',
                        name: account.name,
                        action: 'would-update',
                        detail: 'actAs',
                    });
                    continue;
                }
                const update: AuthGrantWithActAs = { actAs };
                await learnCard.invoke.updateAuthGrant(existing.id ?? '', update);
                changes.push({
                    resource: 'serviceAccount',
                    name: account.name,
                    action: 'updated',
                    detail: 'actAs',
                });
                continue;
            }
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
                `Pass --secrets-out ./secrets.env (any path; keep it beside .env and out of git) to create service account "${account.name}" — its token can only be retrieved once.`
            );
        const payload: AuthGrantWithActAs = {
            name: account.name,
            scope: account.scopes.join(' '),
            ...(account.expiresAt ? { expiresAt: new Date(account.expiresAt).toISOString() } : {}),
            ...(actAs !== undefined ? { actAs } : {}),
        };
        const grantId = await learnCard.invoke.addAuthGrant(payload);
        const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);
        await writeSecret(secretsOut, account.name, token);
        out.log(`Token for "${account.name}" written to ${secretsOut}`);
        serviceAccounts.push({ name: account.name, grantId, created: true });
        changes.push({ resource: 'serviceAccount', name: account.name, action: 'created' });
    }
};

const applyWebhooks = async (
    spec: OrgSpec,
    project: Project,
    dryRun: boolean,
    changes: OrgChange[]
): Promise<void> => {
    const [primary, ...extra] = spec.webhooks ?? [];
    if (!primary) return;

    const current = project.env.WEBHOOK_URL;
    if (current === primary.url) {
        changes.push({ resource: 'webhook', name: primary.url, action: 'unchanged' });
    } else {
        const action = current ? 'updated' : 'created';
        if (dryRun) {
            changes.push({
                resource: 'webhook',
                name: primary.url,
                action: current ? 'would-update' : 'would-create',
                detail: 'WEBHOOK_URL in .env',
            });
        } else {
            await saveProject(project, { WEBHOOK_URL: primary.url });
            changes.push({
                resource: 'webhook',
                name: primary.url,
                action,
                detail: 'set WEBHOOK_URL in .env; pass it as configuration.webhookUrl on each inbox issue',
            });
        }
    }

    for (const webhook of extra) {
        changes.push({
            resource: 'webhook',
            name: webhook.url,
            action: 'unchanged',
            detail: 'only the first webhook becomes WEBHOOK_URL; use this one per-issuance',
        });
    }
};

const planFreshOrg = (spec: OrgSpec, project: Project, changes: OrgChange[]): void => {
    const note = 'after the issuer profile is created';
    changes.push({
        resource: 'signingAuthority',
        name: spec.issuer.signingAuthority.name,
        action: 'would-create',
        detail: note,
    });
    if (spec.issuer.branding)
        changes.push({
            resource: 'branding',
            name: spec.issuer.profileId,
            action: 'would-update',
            detail: note,
        });
    if (spec.profileManager) {
        changes.push({
            resource: 'profileManager',
            name: spec.profileManager.displayName,
            action: 'would-create',
            detail: note,
        });
        for (const entry of spec.profileManager.managed ?? [])
            changes.push({
                resource: 'managedProfile',
                name: entry.profileId,
                action: 'would-create',
                detail: note,
            });
    }
    for (const account of spec.serviceAccounts ?? [])
        changes.push({
            resource: 'serviceAccount',
            name: account.name,
            action: 'would-create',
            detail: note,
        });
    const [primary, ...extra] = spec.webhooks ?? [];
    if (primary)
        changes.push({
            resource: 'webhook',
            name: primary.url,
            action: project.env.WEBHOOK_URL === primary.url ? 'unchanged' : 'would-create',
            detail: 'WEBHOOK_URL in .env',
        });
    for (const webhook of extra)
        changes.push({ resource: 'webhook', name: webhook.url, action: 'unchanged' });
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

    const issuerExists = await applyIssuerProfile(spec, learnCard, dryRun, changes);
    const issuerDid = resolveIssuerDid(learnCard);

    if (!issuerExists) {
        planFreshOrg(spec, project, changes);
        return {
            changes,
            outputs: { issuerDid, managerDid: undefined, managed: [], serviceAccounts: [] },
        };
    }

    await applyBranding(spec.issuer.profileId, spec.issuer.branding, learnCard, dryRun, changes);

    await applySigningAuthority(spec, learnCard, project, dryRun, changes);

    const managerDid = await applyProfileManager(
        spec,
        learnCard,
        project,
        dryRun,
        opts.connectAsManager,
        opts.connectAsManaged,
        changes,
        managed
    );

    await applyServiceAccounts(spec, learnCard, dryRun, opts.secretsOut, changes, serviceAccounts);

    await applyWebhooks(spec, project, opts.dryRun ?? false, changes);

    return { changes, outputs: { issuerDid, managerDid, managed, serviceAccounts } };
};
