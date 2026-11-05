import { refuse } from './errors';
import type { LoadPlan } from './plan';

/**
 * Fail-closed guards for the staging load test. Every check runs before any
 * network call (including `--dry-run`); nothing defaults to "allowed".
 */

/** Known production API hosts (from app/tenant config). Refused even if allowlisted. */
export const PRODUCTION_API_HOSTS = new Set([
    'api.learncard.app',
    'api.scoutnetwork.org',
    'learncard.app',
    'network.learncard.com',
    'vetpass.app',
]);

/** Known production Firebase projects (app Firebase config). Refused outright. */
export const PRODUCTION_FIREBASE_PROJECTS = new Set(['learncard', 'scoutpass-9a67e']);

/** Public mailbox providers: synthetic addresses there could reach real people. */
const PUBLIC_MAIL_DOMAINS = new Set([
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'yahoo.com',
    'icloud.com',
    'me.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
]);

const HOSTNAME =
    /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * The lca-api REST base must be https, its host must equal the operator's
 * explicit `--staging-host`, carry a `staging` DNS label, and not be a known
 * production host.
 */
export const checkServerUrl = (serverUrl: string, stagingHost: string | undefined): void => {
    if (!stagingHost) throw refuse('staging_host_required');
    let url: URL;
    try {
        url = new URL(serverUrl);
    } catch {
        throw refuse('server_url');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
        throw refuse('server_url');
    const host = url.hostname.toLowerCase();
    if (host !== stagingHost.toLowerCase()) throw refuse('staging_host_mismatch');
    if (PRODUCTION_API_HOSTS.has(host)) throw refuse('production_host');
    if (!host.split('.').some(label => label === 'staging' || label.startsWith('staging')))
        throw refuse('host_not_staging');
};

/** Parses only `type` and `project_id` from a service-account JSON; nothing else is kept. */
export const credentialProjectId = (json: string): string => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw refuse('credentials_malformed');
    }
    if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('type' in parsed) ||
        parsed.type !== 'service_account' ||
        !('project_id' in parsed) ||
        typeof parsed.project_id !== 'string'
    )
        throw refuse('credentials_not_service_account');
    return parsed.project_id;
};

/**
 * `--firebase-project` is required, must equal the service account's project,
 * and must not be (or look like) production.
 */
export const checkFirebaseProject = (
    expected: string | undefined,
    credentialProject: string
): void => {
    if (!expected) throw refuse('firebase_project_required');
    if (!/^[a-z0-9][a-z0-9-]{3,62}$/.test(expected)) throw refuse('firebase_project_format');
    if (expected !== credentialProject) throw refuse('firebase_project_mismatch');
    if (PRODUCTION_FIREBASE_PROJECTS.has(expected)) throw refuse('firebase_project_production');
    if (/(^|-)prod(uction)?(-|$)/.test(expected)) throw refuse('firebase_project_production');
};

/** Must be the canary receive-only inbox domain. Public mail providers are refused. */
export const checkDomain = (domain: string | undefined): string => {
    if (!domain) throw refuse('domain_required');
    const value = domain.toLowerCase();
    if (!HOSTNAME.test(value)) throw refuse('domain_format');
    if (PUBLIC_MAIL_DOMAINS.has(value)) throw refuse('domain_public_mailbox');
    return value;
};

export const checkPrefix = (prefix: string): void => {
    if (!/^[a-z0-9][a-z0-9._-]{0,31}$/.test(prefix)) throw refuse('prefix_format');
};

export const checkRunId = (runId: string): void => {
    if (!/^[a-z0-9]{6,16}$/.test(runId)) throw refuse('run_id_format');
};

const nonNegativeInt = (value: string | undefined, missing: string): number => {
    if (value === undefined) throw refuse(missing);
    if (!/^[0-9]{1,9}$/.test(value)) throw refuse(`${missing.replace(/_required$/, '')}_format`);
    return Number(value);
};

export const parseMaxUsers = (value: string | undefined): number => {
    const n = nonNegativeInt(value, 'max_users_required');
    if (n < 1) throw refuse('max_users_format');
    return n;
};

export const parseMaxEmails = (value: string | undefined): number =>
    nonNegativeInt(value, 'max_emails_required');

/** Hard caps: refuse rather than truncate the plan. */
export const checkBudgets = (plan: LoadPlan, maxUsers: number, maxEmails: number): void => {
    if (plan.users > maxUsers) throw refuse('max_users_exceeded');
    if (plan.maxEmails > maxEmails) throw refuse('max_emails_exceeded');
};

export const checkRoughtimeAck = (acknowledged: boolean | undefined): void => {
    if (acknowledged !== true) throw refuse('roughtime_ack_required');
};
