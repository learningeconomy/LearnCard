import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { LCALearnCard } from '@learncard/lca-api-plugin';
import { ensureGitignored, parseEnv, upsertEnv, saveProject, type Project } from '../project';
import { setupSigning } from '../setup-signing';
import { out } from '../out';
import { toEnvKey, type OrgBranding, type OrgSpec } from './schema';
export { toEnvKey } from './schema';

export type OrgResource =
    | 'issuer'
    | 'signingAuthority'
    | 'profileManager'
    | 'managedProfile'
    | 'branding'
    | 'serviceAccount'
    | 'webhook';

export type OrgChangeAction =
    'created' | 'updated' | 'unchanged' | 'would-create' | 'would-update' | 'drifted';

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
    invoke: Pick<
        LCALearnCard['invoke'],
        | 'createManagedProfile'
        | 'getManagedProfiles'
        | 'getProfileManagerProfile'
        | 'updateProfileManagerProfile'
    >;
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

const inspectSecrets = async (secretsOut: string) => {
    const info = await fs.lstat(secretsOut).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined;
        throw error;
    });
    if (info && !info.isFile())
        throw new Error('Secrets output must be a regular file, not a symlink.');
    return info;
};

const hasSecret = async (secretsOut: string, name: string): Promise<boolean> => {
    if (!(await inspectSecrets(secretsOut))) return false;
    const env = parseEnv(await fs.readFile(secretsOut, 'utf8'));
    return !!env[toEnvKey(name)]?.trim();
};

/** Replace a token entry without duplicate keys, securing existing files before writing. */
const writeSecret = async (secretsOut: string, name: string, token: string): Promise<void> => {
    await fs.mkdir(path.dirname(secretsOut), { recursive: true });
    const info = await inspectSecrets(secretsOut);
    if (info) await fs.chmod(secretsOut, 0o600);
    const existing = info ? await fs.readFile(secretsOut, 'utf8') : '';
    const key = toEnvKey(name);
    const retained = existing
        .split('\n')
        .filter(line => line.match(/^\s*(?:export\s+)?([\w]+)\s*=/)?.[1] !== key)
        .join('\n');
    const next = upsertEnv(retained, { [key]: token });
    // Like saveProject, stage the replacement so a failed write cannot destroy other tokens.
    const temporary = `${secretsOut}.${randomUUID()}.tmp`;
    const handle = await fs.open(temporary, 'wx', 0o600);
    try {
        try {
            await handle.writeFile(next, 'utf8');
        } finally {
            await handle.close();
        }
        await inspectSecrets(secretsOut);
        await fs.rename(temporary, secretsOut);
    } finally {
        await fs.rm(temporary, { force: true });
    }
    await ensureGitignored(path.dirname(secretsOut), path.basename(secretsOut));
};

const GRANT_PAGE_SIZE = 100;

type Grant = NonNullable<Awaited<ReturnType<OrgLearnCard['invoke']['getAuthGrants']>>>[number];

/** Walk every page for this account's name so an older active grant is never missed and duplicated. */
const findActiveGrant = async (
    learnCard: OrgLearnCard,
    name: string
): Promise<Grant | undefined> => {
    let cursor: string | undefined;
    for (;;) {
        const page =
            (await learnCard.invoke.getAuthGrants({
                limit: GRANT_PAGE_SIZE,
                cursor,
                query: { name, status: 'active' },
            })) ?? [];
        const match = page.find(grant => grant.name === name && grant.status === 'active');
        if (match) return match;
        const last = page.at(-1);
        if (page.length < GRANT_PAGE_SIZE || !last?.createdAt || last.createdAt === cursor)
            return undefined;
        cursor = last.createdAt;
    }
};

/**
 * Serialize applies that share a secrets file: two overlapping runs would otherwise
 * both miss the grant, both create one, and overwrite each other's token.
 */
const withSecretsLock = async <T>(
    secretsOut: string | undefined,
    fn: () => Promise<T>
): Promise<T> => {
    if (!secretsOut) return fn();
    await fs.mkdir(path.dirname(secretsOut), { recursive: true });
    const lockPath = path.join(path.dirname(secretsOut), `.${path.basename(secretsOut)}.lock`);
    const lock = await fs.open(lockPath, 'wx', 0o600).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST')
            throw new Error(
                `Another org apply is reconciling service accounts for ${secretsOut}. Retry when it finishes; remove a stale ${path.basename(lockPath)} only if no command is running.`
            );
        throw error;
    });
    try {
        return await fn();
    } finally {
        await lock.close();
        await fs.rm(lockPath, { force: true });
    }
};

const normalizeScope = (scope: string | undefined): string =>
    (scope ?? '').split(/\s+/).filter(Boolean).sort().join(' ');
const expiryInstant = (value: string | null | undefined): number | undefined =>
    value == null ? undefined : Date.parse(value);

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

// `send` reads these to pick template signing, so a matching registration must still
// land in .env — otherwise later sends silently fall back to the local key.
const isSignerSelected = (project: Project, name: string, endpoint: string): boolean =>
    project.env.SIGNING_AUTHORITY_NAME === name &&
    project.env.SIGNING_AUTHORITY_ENDPOINT === endpoint;

const persistSignerSelection = async (
    project: Project,
    name: string,
    endpoint: string
): Promise<void> => {
    if (isSignerSelected(project, name, endpoint)) return;
    await saveProject(project, {
        SIGNING_AUTHORITY_NAME: name,
        SIGNING_AUTHORITY_ENDPOINT: endpoint,
    });
};

/** An already-primary registration is only `unchanged` once .env also selects it. */
const reportSignerSelection = async (
    project: Project,
    name: string,
    endpoint: string,
    dryRun: boolean,
    changes: OrgChange[]
): Promise<void> => {
    if (isSignerSelected(project, name, endpoint)) {
        changes.push({ resource: 'signingAuthority', name, action: 'unchanged' });
        return;
    }
    if (!dryRun) await persistSignerSelection(project, name, endpoint);
    changes.push({
        resource: 'signingAuthority',
        name,
        action: dryRun ? 'would-update' : 'updated',
        detail: 'SIGNING_AUTHORITY_NAME and SIGNING_AUTHORITY_ENDPOINT in .env',
    });
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
        await reportSignerSelection(
            project,
            signingAuthority.name,
            match.signingAuthority.endpoint,
            dryRun,
            changes
        );
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
    // The network keys a registration by name + DID, so a rotated DID at the same
    // endpoint cannot be updated in place; surface it instead of silently keeping the old signer.
    if (match.relationship.did !== did) {
        const detail = `Signing authority "${name}" is registered at ${endpoint} with DID ${match.relationship.did}, but the spec declares ${did}. Register the rotated signer under a new name, or update the spec's did to match.`;
        if (!dryRun) throw new Error(detail);
        changes.push({ resource: 'signingAuthority', name, action: 'drifted', detail });
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
        await persistSignerSelection(project, name, endpoint);
        changes.push({
            resource: 'signingAuthority',
            name,
            action: 'updated',
            detail: 'set primary',
        });
        return;
    }
    await reportSignerSelection(project, name, endpoint, dryRun, changes);
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
    let managerCard: ManagerLearnCard | undefined;
    if (project.env.ORG_PROFILE_MANAGER_DID) {
        managerDid = project.env.ORG_PROFILE_MANAGER_DID;
        if (!connectAsManager)
            throw new Error('A profile manager requires a manager connection (connectAsManager).');
        managerCard = await connectAsManager(managerDid);
        const existingManager = await managerCard.invoke.getProfileManagerProfile();
        if (existingManager && existingManager.displayName !== displayName) {
            if (!dryRun) await managerCard.invoke.updateProfileManagerProfile({ displayName });
            changes.push({
                resource: 'profileManager',
                name: displayName,
                action: dryRun ? 'would-update' : 'updated',
                detail: 'displayName',
            });
        } else {
            changes.push({ resource: 'profileManager', name: displayName, action: 'unchanged' });
        }
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
    managerCard ??= await connectAsManager(managerDid);

    const existingManaged = new Map<string, { did: string; displayName?: string }>();
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
        const page = await managerCard.invoke.getManagedProfiles({ limit: 100, cursor });
        for (const profile of page.records)
            existingManaged.set(profile.profileId, {
                did: profile.did,
                displayName: profile.displayName,
            });
        hasMore = page.hasMore;
        cursor = page.cursor;
        if (hasMore && !cursor) break;
    }

    for (const managedSpec of managedSpecs) {
        const existing = existingManaged.get(managedSpec.profileId);
        if (existing) {
            managed.push({ profileId: managedSpec.profileId, did: existing.did });
            const needsRename = existing.displayName !== managedSpec.displayName;
            if ((needsRename || managedSpec.branding) && !connectAsManaged)
                throw new Error(
                    'Updating a managed profile (displayName or branding) requires connectAsManaged.'
                );
            const openManaged = () => connectAsManaged!(existing.did);
            if (needsRename) {
                if (!dryRun) {
                    const card = await openManaged();
                    await card.invoke.updateProfile({ displayName: managedSpec.displayName });
                }
                changes.push({
                    resource: 'managedProfile',
                    name: managedSpec.profileId,
                    action: dryRun ? 'would-update' : 'updated',
                    detail: 'displayName',
                });
            } else {
                changes.push({
                    resource: 'managedProfile',
                    name: managedSpec.profileId,
                    action: 'unchanged',
                });
            }
            if (managedSpec.branding) {
                await applyBranding(
                    managedSpec.profileId,
                    managedSpec.branding,
                    await openManaged(),
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

const applyServiceAccounts = async (
    spec: OrgSpec,
    learnCard: OrgLearnCard,
    dryRun: boolean,
    secretsOut: string | undefined,
    changes: OrgChange[],
    serviceAccounts: Array<{ name: string; grantId: string; created: boolean }>
): Promise<void> => {
    if (!spec.serviceAccounts?.length) return;

    await withSecretsLock(dryRun ? undefined : secretsOut, async () => {
        for (const account of spec.serviceAccounts ?? []) {
            const existing = await findActiveGrant(learnCard, account.name);
            if (existing) {
                if (!existing.id)
                    throw new Error(
                        `Service account "${account.name}" returned a grant without an ID; cannot safely reconcile it.`
                    );
                serviceAccounts.push({
                    name: account.name,
                    grantId: existing.id,
                    created: false,
                });
                const drift = [
                    normalizeScope(existing.scope) !== normalizeScope(account.scopes.join(' ')) &&
                        'scope',
                    expiryInstant(existing.expiresAt) !== expiryInstant(account.expiresAt) &&
                        'expiresAt',
                ].filter(Boolean);
                if (drift.length) {
                    const detail = `Service account "${account.name}" grant has drifted (${drift.join(', ')}). Run npx @learncard/cli token --revoke ${existing.id} then re-run org apply.`;
                    if (!dryRun) throw new Error(detail);
                    changes.push({
                        resource: 'serviceAccount',
                        name: account.name,
                        action: 'drifted',
                        detail,
                    });
                } else if (secretsOut && !(await hasSecret(secretsOut, account.name))) {
                    if (!dryRun) {
                        const token = await learnCard.invoke.getAPITokenForAuthGrant(existing.id);
                        await writeSecret(secretsOut, account.name, token);
                    }
                    changes.push({
                        resource: 'serviceAccount',
                        name: account.name,
                        action: dryRun ? 'would-update' : 'updated',
                        detail: dryRun ? 'token would be re-issued' : 'token re-issued',
                    });
                } else {
                    changes.push({
                        resource: 'serviceAccount',
                        name: account.name,
                        action: 'unchanged',
                    });
                }
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
                    `Pass --secrets-out ./secrets.env (any path; keep it beside .env and out of git) to create service account "${account.name}" — the token is written to this file and not stored elsewhere by the CLI.`
                );
            const grantId = await learnCard.invoke.addAuthGrant({
                name: account.name,
                scope: account.scopes.join(' '),
                ...(account.expiresAt
                    ? { expiresAt: new Date(account.expiresAt).toISOString() }
                    : {}),
            });
            const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);
            await writeSecret(secretsOut, account.name, token);
            out.log(`Token for "${account.name}" written to ${secretsOut}`);
            serviceAccounts.push({ name: account.name, grantId, created: true });
            changes.push({ resource: 'serviceAccount', name: account.name, action: 'created' });
        }
    });
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
