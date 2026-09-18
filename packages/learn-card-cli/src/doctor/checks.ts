import type { UnsignedVC } from '@learncard/types';
import {
    PRODUCTION_NETWORK,
    STAGING_NETWORK,
    resolveServices,
    type NetworkCard,
    type Project,
} from '../project';
import { describeActAs, getGrantActAs } from '../auth-grant';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

export interface CheckResult {
    status: CheckStatus;
    detail?: string;
    fix?: string;
}

/** Only the invoke methods each check actually calls, so tests can pass minimal mocks. */
export type DoctorCard = {
    invoke: Pick<
        NetworkCard['invoke'],
        | 'getProfile'
        | 'getRegisteredSigningAuthorities'
        | 'getAuthGrants'
        | 'getCredentialRefreshHistory'
        | 'issueCredential'
        | 'verifyCredential'
    >;
    id: Pick<NetworkCard['id'], 'did'>;
};

export interface DoctorContext {
    project: Project;
    services: ReturnType<typeof resolveServices>;
    learnCard: DoctorCard;
    fetch: typeof fetch;
    requiredScopes: string[];
    webhookUrl?: string;
    tenantConfig?: unknown;
}

export interface Check {
    id: string;
    title: string;
    run: (ctx: DoctorContext) => Promise<CheckResult>;
}

/** A Universal Inbox issuer needs to write/read the inbox and mint/read credentials. */
export const DEFAULT_REQUIRED_SCOPES = [
    'inbox:write',
    'inbox:read',
    'credentials:write',
    'credentials:read',
];

const DEFAULT_TIMEOUT_MS = 5000;

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/** `https://network.learncard.com/trpc` -> `https://network.learncard.com` */
const networkBase = (network: string): string => network.replace(/\/trpc$/, '');

const describeNetwork = (network: string): string => {
    if (network === PRODUCTION_NETWORK) return 'production';
    if (network === STAGING_NETWORK) return 'staging';
    return network;
};

/** Every doctor network call is time-bound so one hung endpoint cannot hang the whole preflight. */
const fetchWithTimeout = async (
    doFetch: typeof fetch,
    url: string,
    init: Parameters<typeof fetch>[1] = {},
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Awaited<ReturnType<typeof fetch>>> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await doFetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

/**
 * Does one granted scope string cover one required "resource:action" entry?
 * Mirrors brain-service's `userHasRequiredScopes` wildcard rules (a `*` resource
 * or a `*` action satisfies any concrete counterpart).
 */
const scopeCovers = (grantScope: string, required: string): boolean => {
    const granted = grantScope.split(' ').filter(Boolean);
    if (granted.includes(required)) return true;
    const [requiredResource, requiredAction] = required.split(':');
    return granted.some(entry => {
        const [resource, action] = entry.split(':');
        if (resource === '*' && action === '*') return true;
        if (resource === requiredResource && action === '*') return true;
        if (resource === '*' && action === requiredAction) return true;
        return false;
    });
};

const isLoopback = (url: string): boolean => {
    try {
        return ['localhost', '127.0.0.1', '[::1]', 'host.docker.internal'].includes(
            new URL(url).hostname
        );
    } catch {
        return false;
    }
};

const buildDoctorTestVc = (issuerDid: string): UnsignedVC => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: issuerDid,
    credentialSubject: { id: issuerDid },
    validFrom: new Date().toISOString(),
});

/** 1. `.env` has an identity, and the network agrees it's who .env says it is. */
export const identityCheck: Check = {
    id: 'identity',
    title: 'Identity',
    run: async ({ project, learnCard }): Promise<CheckResult> => {
        const fix = 'Run `npx @learncard/cli init` or `org apply`.';
        if (!project.env.SECURE_SEED || !project.env.PROFILE_ID) {
            return { status: 'fail', detail: 'Missing SECURE_SEED or PROFILE_ID in .env.', fix };
        }
        const profile = await learnCard.invoke.getProfile();
        if (!profile) {
            return {
                status: 'fail',
                detail: 'No profile found on the network for this seed.',
                fix,
            };
        }
        if (profile.profileId !== project.env.PROFILE_ID) {
            return {
                status: 'fail',
                detail: `Network profile "${profile.profileId}" does not match PROFILE_ID "${project.env.PROFILE_ID}" in .env.`,
                fix,
            };
        }
        return { status: 'pass', detail: `Signed in as "${profile.profileId}".` };
    },
};

const healthCheck = async (
    doFetch: typeof fetch,
    trpcUrl: string,
    label: string,
    fix: string
): Promise<CheckResult> => {
    const url = `${networkBase(trpcUrl)}/api/health-check`;
    try {
        const res = await fetchWithTimeout(doFetch, url);
        if (!res.ok) {
            return { status: 'fail', detail: `${label} health-check returned ${res.status}.`, fix };
        }
        return { status: 'pass', detail: `Connected to ${label}.` };
    } catch (error) {
        return {
            status: 'fail',
            detail: `Could not reach ${label}: ${errorMessage(error)}`,
            fix,
        };
    }
};

/** 2. The configured network's health-check answers within 5s. */
export const networkCheck: Check = {
    id: 'network',
    title: 'Network',
    run: ({ services, fetch: doFetch }): Promise<CheckResult> =>
        healthCheck(
            doFetch,
            services.network,
            describeNetwork(services.network),
            'Check --network (or NETWORK_URL in .env) points at a real LearnCard Network deployment.'
        ),
};

/** 2b. The hosted signing service (lca-api) answers, when one is configured. */
export const signingServiceCheck: Check = {
    id: 'signing-service',
    title: 'Signing service',
    run: async ({ services, fetch: doFetch }): Promise<CheckResult> => {
        if (!services.lcaAPI) {
            return {
                status: 'skip',
                detail: 'No LCA_API_URL configured; hosted signing (setup-signing, org apply) is unavailable on this network.',
            };
        }
        return healthCheck(
            doFetch,
            services.lcaAPI,
            `signing service ${services.lcaAPI}`,
            'Check LCA_API_URL in .env. If it is a local container, `docker logs` it — a port that accepts and immediately closes connections usually means the service failed env validation on boot.'
        );
    },
};

/** 3. If an API_TOKEN is configured, it maps to an active, unexpired grant with enough scope. */
export const tokenScopesCheck: Check = {
    id: 'token-scopes',
    title: 'Token scopes',
    run: async ({ project, learnCard, requiredScopes }): Promise<CheckResult> => {
        const fix = `Run \`npx @learncard/cli token --scope '${requiredScopes.join(' ')}'\``;
        const grants = (await learnCard.invoke.getAuthGrants()) ?? [];
        const active = grants.filter(grant => grant.status === 'active');

        const token = project.env.API_TOKEN;
        if (!token) {
            const covering = active.find(candidate =>
                requiredScopes.every(required => scopeCovers(candidate.scope ?? '', required))
            );
            if (covering) {
                return {
                    status: 'pass',
                    detail: `Active grant "${covering.name ?? covering.id}" covers ${requiredScopes.join(' ')} (its token is stored outside .env, e.g. your --secrets-out file); may act as: ${describeActAs(getGrantActAs(covering))}.`,
                };
            }
            return {
                status: 'warn',
                detail: 'No API_TOKEN in .env and no active grant covers the required scopes.',
                fix,
            };
        }

        const grantId = project.env.API_TOKEN_GRANT_ID;
        const grant = grantId
            ? active.find(candidate => candidate.id === grantId)
            : active.find(candidate => candidate.scope === project.env.API_TOKEN_SCOPE);
        if (!grant) {
            return {
                status: 'fail',
                detail: 'API_TOKEN does not match any active auth grant on this network.',
                fix,
            };
        }
        if (grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now()) {
            return {
                status: 'fail',
                detail: `Auth grant ${grant.id} expired ${grant.expiresAt}.`,
                fix,
            };
        }
        const scope = grant.scope ?? '';
        const missing = requiredScopes.filter(required => !scopeCovers(scope, required));
        if (missing.length) {
            return {
                status: 'fail',
                detail: `Token scope "${scope}" is missing: ${missing.join(', ')}.`,
                fix,
            };
        }
        return {
            status: 'pass',
            detail: `Token scope "${scope}" covers ${requiredScopes.join(' ')}; may act as: ${describeActAs(getGrantActAs(grant))}.`,
        };
    },
};

/**
 * 4. A primary hosted signer is registered over https, and a real credential can be
 * signed and verified. The network plugin has no public "issue via this signing
 * authority and hand me back the VC" method (only `sendBoost`/inbox flows exercise a
 * signing authority end to end), so this test-signs locally with the wallet's own
 * keys and says so in `detail` rather than silently pretending it hit the SA endpoint.
 */
export const signingAuthorityCheck: Check = {
    id: 'signing-authority',
    title: 'Signing authority',
    run: async ({ learnCard }): Promise<CheckResult> => {
        const fix = 'Run `npx @learncard/cli setup-signing`.';
        const authorities = await learnCard.invoke.getRegisteredSigningAuthorities();
        const primary = authorities.find(authority => authority.relationship.isPrimary);
        if (!primary) {
            return { status: 'fail', detail: 'No primary signing authority registered.', fix };
        }
        const endpoint = primary.signingAuthority.endpoint;
        if (!/^https:\/\//.test(endpoint) && !isLoopback(endpoint)) {
            return {
                status: 'fail',
                detail: `Signing authority endpoint "${endpoint}" is not https.`,
                fix: 'Re-register the signing authority with an https endpoint (plain http is only accepted for localhost).',
            };
        }
        try {
            const issuerDid = learnCard.id.did();
            const signed = await learnCard.invoke.issueCredential(buildDoctorTestVc(issuerDid));
            const result = await learnCard.invoke.verifyCredential(signed);
            if (result.errors.length) {
                return {
                    status: 'fail',
                    detail: `Test credential failed verification: ${result.errors.join('; ')}`,
                    fix,
                };
            }
            return {
                status: 'pass',
                detail: `Primary signing authority "${primary.relationship.name}" registered; verified a locally-signed test credential (this checks your keys, not the ${primary.signingAuthority.endpoint} endpoint).`,
            };
        } catch (error) {
            return { status: 'fail', detail: `Test-sign failed: ${errorMessage(error)}`, fix };
        }
    },
};

/** 5. If this profile has a did:web, its DID document actually resolves and lists a key. */
export const didWebCheck: Check = {
    id: 'did-web',
    title: 'did:web',
    run: async ({ project, services, learnCard, fetch: doFetch }): Promise<CheckResult> => {
        let did: string | undefined;
        try {
            did = learnCard.id.did('web');
        } catch {
            did = undefined;
        }
        if (!did || !did.startsWith('did:web:')) {
            return {
                status: 'warn',
                detail: 'No did:web on this profile; issuer will be did:key.',
            };
        }

        const fix = 'Re-register the signing authority to refresh the DID document.';
        const url = `${networkBase(services.network)}/users/${project.env.PROFILE_ID}/did.json`;
        let doc: unknown;
        try {
            const res = await fetchWithTimeout(doFetch, url);
            if (!res.ok) return { status: 'fail', detail: `${url} returned ${res.status}.`, fix };
            doc = await res.json();
        } catch (error) {
            return {
                status: 'fail',
                detail: `Could not fetch ${url}: ${errorMessage(error)}`,
                fix,
            };
        }
        const verificationMethod =
            doc && typeof doc === 'object'
                ? (doc as Record<string, unknown>).verificationMethod
                : undefined;
        if (!Array.isArray(verificationMethod)) {
            return {
                status: 'fail',
                detail: `${url} did not return a verificationMethod array.`,
                fix,
            };
        }

        const authorities = await learnCard.invoke.getRegisteredSigningAuthorities();
        const primary = authorities.find(authority => authority.relationship.isPrimary);
        if (primary && primary.relationship.did !== did) {
            const suffix = `#${primary.relationship.name}`;
            const hasMethod = verificationMethod.some(
                entry =>
                    entry &&
                    typeof entry === 'object' &&
                    typeof (entry as Record<string, unknown>).id === 'string' &&
                    ((entry as Record<string, unknown>).id as string).endsWith(suffix)
            );
            if (!hasMethod) {
                return {
                    status: 'warn',
                    detail: `${url} has no verificationMethod ending in "${suffix}".`,
                    fix,
                };
            }
        }
        return {
            status: 'pass',
            detail: `${did} resolves with ${verificationMethod.length} verification method(s).`,
        };
    },
};

/** 6. Only runs when a webhook URL is configured: does it accept a signed doctor ping? */
export const webhookCheck: Check = {
    id: 'webhook',
    title: 'Webhook',
    run: async ({ webhookUrl, fetch: doFetch }): Promise<CheckResult> => {
        if (!webhookUrl) {
            return { status: 'skip', detail: 'No --webhook-url or WEBHOOK_URL configured.' };
        }
        const fix = 'Check the webhook endpoint is deployed and reachable.';
        try {
            const res = await fetchWithTimeout(doFetch, webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-LearnCard-Doctor': '1' },
                body: JSON.stringify({ type: 'DOCTOR_PING', timestamp: new Date().toISOString() }),
            });
            if (res.ok) {
                return {
                    status: 'pass',
                    detail: `${webhookUrl} accepted the ping (${res.status}).`,
                };
            }
            if (res.status >= 400 && res.status < 500) {
                return {
                    status: 'warn',
                    detail: `${webhookUrl} rejected the ping (${res.status}).`,
                    fix: 'Confirm the webhook endpoint accepts POST requests with an X-LearnCard-Doctor header.',
                };
            }
            return { status: 'fail', detail: `${webhookUrl} returned ${res.status}.`, fix };
        } catch (error) {
            return {
                status: 'fail',
                detail: `Could not reach ${webhookUrl}: ${errorMessage(error)}`,
                fix,
            };
        }
    },
};

/**
 * 7. Managed credential refresh is a network-wide feature toggle. Probing a
 * syntactically valid but unknown refreshId distinguishes "feature is off" (NOT_FOUND
 * whose message says the feature is not available) from "feature is on, this id just
 * doesn't exist" (NOT_FOUND "Credential refresh not found") without allocating anything.
 * Any other error (transport, auth) is inconclusive and reported as a warning.
 */
export const refreshEnabledCheck: Check = {
    id: 'refresh-enabled',
    title: 'Credential refresh',
    run: async ({ learnCard }): Promise<CheckResult> => {
        try {
            await learnCard.invoke.getCredentialRefreshHistory({
                refreshId: '00000000-0000-4000-8000-000000000000',
                limit: 1,
            });
            return { status: 'pass', detail: 'Credential refresh is enabled on this network.' };
        } catch (error) {
            const message = errorMessage(error);
            if (/not available/i.test(message)) {
                return {
                    status: 'fail',
                    detail: message,
                    fix: "Credential refresh isn't enabled on this network; use `--network staging` or contact LearnCard.",
                };
            }
            if (/credential refresh not found/i.test(message)) {
                return {
                    status: 'pass',
                    detail: 'Credential refresh is enabled on this network.',
                };
            }
            return {
                status: 'warn',
                detail: `Could not determine whether credential refresh is enabled: ${message}`,
                fix: 'Check network reachability and your API token, then rerun `doctor`.',
            };
        }
    },
};

/**
 * 8. There is no query method for Trusted Registry membership on the network plugin
 * (only unrelated federation/boost-authenticity "trusted" concepts exist in
 * `learn-card-network`'s plugin.ts) — this stays a manual step.
 */
export const trustedRegistryCheck: Check = {
    id: 'trusted-registry',
    title: 'Trusted Registry',
    run: async (): Promise<CheckResult> => ({
        status: 'skip',
        detail: 'manual: ask LearnCard to add this profile to the Trusted Registry to address recipients by phone or state_student_id',
    }),
};

export const CHECKS: Check[] = [
    identityCheck,
    networkCheck,
    signingServiceCheck,
    tokenScopesCheck,
    signingAuthorityCheck,
    didWebCheck,
    webhookCheck,
    refreshEnabledCheck,
    trustedRegistryCheck,
];
