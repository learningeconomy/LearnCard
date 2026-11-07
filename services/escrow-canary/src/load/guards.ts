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

/** Known production Firebase projects (app Firebase config). Refused by default. */
export const PRODUCTION_FIREBASE_PROJECTS = new Set(['learncard', 'scoutpass-9a67e']);

/**
 * The one production Firebase project that may be used, and only with
 * `--shared-production-firebase <same id>`: staging lca-api verifies sign-ins
 * from `learncard`, which production also uses (staging has no Firebase
 * project of its own). Every other production project stays refused.
 */
export const SHARED_PRODUCTION_FIREBASE_PROJECT = 'learncard';

/** Printed with the refusal so the operator sees the flag and its risks. */
export const SHARED_PRODUCTION_FIREBASE_HINT =
    `"${SHARED_PRODUCTION_FIREBASE_PROJECT}" is the PRODUCTION Firebase project; staging lca-api ` +
    'also verifies sign-ins from it. To create test users there anyway, add ' +
    `--shared-production-firebase ${SHARED_PRODUCTION_FIREBASE_PROJECT}. Risks: the users sit ` +
    'beside real production accounts, count toward monthly active users (billing), run any ' +
    'Auth-triggered extensions or functions, and are removed only by `cleanup --manifest`. ' +
    'See README "Load testing (staging only)".';

/**
 * The canary's receive-only SES inbox zone (`infra/escrow-canary-inbox`, e.g.
 * `canary.notify.learncard.com`). Only its subdomains are accepted as `--domain`.
 */
export const INBOX_PARENT_DOMAIN = 'notify.learncard.com';

/**
 * Organisation mail domains (from app/tenant config under `apps/<app>/environments`):
 * real staff and user mailboxes. Refused explicitly, with their own reason.
 */
export const ORG_MAIL_DOMAINS = new Set([
    'learningeconomy.io',
    'learncard.com',
    'learncard.app',
    'learncard.ai',
    'learncloud.ai',
    'vetpass.app',
    'scoutnetwork.org',
    INBOX_PARENT_DOMAIN,
]);

const HOSTNAME =
    /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * The lca-api REST base must be https, its host must equal the operator's
 * explicit `--staging-host`, carry a `staging` (or `staging-*`) DNS label, and not be a known
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
    if (!host.split('.').some(label => label === 'staging' || label.startsWith('staging-')))
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
 * and must not be (or look like) production, except the shared project
 * (`SHARED_PRODUCTION_FIREBASE_PROJECT`) when `sharedProduction` (the
 * `--shared-production-firebase` value) names it exactly. The flag is refused
 * for any other project, so it cannot be left on by habit.
 */
export const checkFirebaseProject = (
    expected: string | undefined,
    credentialProject: string,
    sharedProduction?: string
): { sharedProduction: boolean } => {
    if (!expected) throw refuse('firebase_project_required');
    if (!/^[a-z0-9][a-z0-9-]{3,62}$/.test(expected)) throw refuse('firebase_project_format');
    if (expected !== credentialProject) throw refuse('firebase_project_mismatch');
    // Never allowed, flag or not.
    if (
        PRODUCTION_FIREBASE_PROJECTS.has(expected) &&
        expected !== SHARED_PRODUCTION_FIREBASE_PROJECT
    )
        throw refuse('firebase_project_production');
    if (sharedProduction !== undefined) {
        if (sharedProduction !== expected) throw refuse('shared_production_firebase_mismatch');
        if (expected !== SHARED_PRODUCTION_FIREBASE_PROJECT)
            throw refuse('shared_production_firebase_not_shared');
        return { sharedProduction: true };
    }
    if (expected === SHARED_PRODUCTION_FIREBASE_PROJECT)
        throw refuse('firebase_project_production', SHARED_PRODUCTION_FIREBASE_HINT);
    if (/(^|-)prod(uction)?(-|$)/.test(expected)) throw refuse('firebase_project_production');
    return { sharedProduction: false };
};

/**
 * Allowlist: must be a subdomain of the canary inbox zone. Bare organisation
 * domains are refused by name; anything else (public providers included) is
 * simply not allowlisted.
 */
export const checkDomain = (domain: string | undefined): string => {
    if (!domain) throw refuse('domain_required');
    const value = domain.toLowerCase();
    if (!HOSTNAME.test(value)) throw refuse('domain_format');
    if (ORG_MAIL_DOMAINS.has(value)) throw refuse('domain_org_mailbox');
    if (!value.endsWith(`.${INBOX_PARENT_DOMAIN}`)) throw refuse('domain_not_allowlisted');
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
