import { describe, expect, it } from 'vitest';
import { LoadRefusal } from './errors';
import {
    checkBudgets,
    checkDomain,
    checkFirebaseProject,
    checkPrefix,
    checkRoughtimeAck,
    checkRunId,
    checkServerUrl,
    credentialProjectId,
    parseMaxEmails,
    parseMaxUsers,
} from './guards';
import { buildPlan } from './plan';

const refusal = (fn: () => unknown): string | undefined => {
    try {
        fn();
    } catch (error) {
        if (error instanceof LoadRefusal) return error.reason;
        throw error;
    }
    return undefined;
};

describe('checkServerUrl', () => {
    it('accepts an explicitly allowlisted staging host', () => {
        expect(
            refusal(() =>
                checkServerUrl('https://staging.api.learncard.app/api', 'staging.api.learncard.app')
            )
        ).toBeUndefined();
        expect(
            refusal(() =>
                checkServerUrl(
                    'https://Staging.API.scoutnetwork.org/api',
                    'staging.api.scoutnetwork.org'
                )
            )
        ).toBeUndefined();
    });
    it.each([
        ['https://api.learncard.app/api', 'api.learncard.app', 'production_host'],
        ['https://api.scoutnetwork.org/api', 'api.scoutnetwork.org', 'production_host'],
        ['https://api.learncard.app/api', 'staging.api.learncard.app', 'staging_host_mismatch'],
        ['https://staging.api.learncard.app/api', undefined, 'staging_host_required'],
        ['https://staging.api.learncard.app/api', '', 'staging_host_required'],
        ['https://lca.example.org/api', 'lca.example.org', 'host_not_staging'],
        ['https://notstaging.example.org/api', 'notstaging.example.org', 'host_not_staging'],
        ['http://staging.api.learncard.app/api', 'staging.api.learncard.app', 'server_url'],
        ['https://u:p@staging.api.learncard.app/api', 'staging.api.learncard.app', 'server_url'],
        ['https://staging.api.learncard.app/api?x=1', 'staging.api.learncard.app', 'server_url'],
        ['not a url', 'staging.api.learncard.app', 'server_url'],
        [
            'https://staging.api.learncard.app.evil.test/api',
            'staging.api.learncard.app',
            'staging_host_mismatch',
        ],
    ])('refuses %s (allow %s)', (url, host, reason) => {
        expect(refusal(() => checkServerUrl(url, host))).toBe(reason);
    });
});

describe('Firebase project', () => {
    const credentials = (projectId: unknown, type = 'service_account') =>
        JSON.stringify({ type, project_id: projectId, private_key: 'secret' });

    it('reads only the project id of a service account', () => {
        expect(credentialProjectId(credentials('lc-staging'))).toBe('lc-staging');
        expect(refusal(() => credentialProjectId('{'))).toBe('credentials_malformed');
        expect(refusal(() => credentialProjectId(credentials('x', 'authorized_user')))).toBe(
            'credentials_not_service_account'
        );
        expect(refusal(() => credentialProjectId(credentials(7)))).toBe(
            'credentials_not_service_account'
        );
    });
    it('requires an explicit, matching, non-production project', () => {
        expect(refusal(() => checkFirebaseProject('lc-staging', 'lc-staging'))).toBeUndefined();
        expect(refusal(() => checkFirebaseProject(undefined, 'lc-staging'))).toBe(
            'firebase_project_required'
        );
        expect(refusal(() => checkFirebaseProject('lc-staging', 'lc-staging-2'))).toBe(
            'firebase_project_mismatch'
        );
        expect(refusal(() => checkFirebaseProject('Bad_Id', 'Bad_Id'))).toBe(
            'firebase_project_format'
        );
        for (const id of ['learncard', 'scoutpass-9a67e', 'lc-prod', 'prod-auth', 'lc-production'])
            expect(refusal(() => checkFirebaseProject(id, id))).toBe('firebase_project_production');
        expect(refusal(() => checkFirebaseProject('product-test', 'product-test'))).toBeUndefined();
    });
});

describe('addresses', () => {
    it('accepts only subdomains of the canary inbox zone', () => {
        expect(checkDomain('Canary.Notify.LearnCard.com')).toBe('canary.notify.learncard.com');
        expect(checkDomain('load.canary.notify.learncard.com')).toBe(
            'load.canary.notify.learncard.com'
        );
        expect(refusal(() => checkDomain(undefined))).toBe('domain_required');
        for (const domain of [
            'learningeconomy.io',
            'learncard.com',
            'LearnCard.app',
            'learncard.ai',
            'learncloud.ai',
            'vetpass.app',
            'scoutnetwork.org',
            'notify.learncard.com',
        ])
            expect(refusal(() => checkDomain(domain))).toBe('domain_org_mailbox');
        for (const domain of [
            'gmail.com',
            'canary.example.org',
            'mail.learncard.com',
            'notify.learncard.com.evil.test',
            'evilnotify.learncard.com',
        ])
            expect(refusal(() => checkDomain(domain))).toBe('domain_not_allowlisted');
        expect(refusal(() => checkDomain('localhost'))).toBe('domain_format');
        expect(refusal(() => checkDomain('a@b.org'))).toBe('domain_format');
    });
    it('validates prefix and run id', () => {
        expect(refusal(() => checkPrefix('escrow-load'))).toBeUndefined();
        expect(refusal(() => checkPrefix('a+b'))).toBe('prefix_format');
        expect(refusal(() => checkPrefix(''))).toBe('prefix_format');
        expect(refusal(() => checkRunId('a1b2c3d4'))).toBeUndefined();
        expect(refusal(() => checkRunId('abc'))).toBe('run_id_format');
        expect(refusal(() => checkRunId('ABC123'))).toBe('run_id_format');
    });
});

describe('budgets and acknowledgements', () => {
    it('parses the hard caps and requires both', () => {
        expect(parseMaxUsers('100')).toBe(100);
        expect(refusal(() => parseMaxUsers(undefined))).toBe('max_users_required');
        expect(refusal(() => parseMaxUsers('0'))).toBe('max_users_format');
        expect(refusal(() => parseMaxUsers('1e3'))).toBe('max_users_format');
        expect(parseMaxEmails('0')).toBe(0);
        expect(refusal(() => parseMaxEmails(undefined))).toBe('max_emails_required');
        expect(refusal(() => parseMaxEmails('-1'))).toBe('max_emails_format');
    });
    it('refuses plans over the user or email budget (email upper bound)', () => {
        const plan = buildPlan({
            stages: [{ rate: 1, durationSec: 100 }],
            pinRatio: 0.1,
            pinPool: 5,
            enrolWithPin: false,
        });
        expect(plan).toMatchObject({ users: 95, expectedEmails: 20, maxEmails: 30 });
        expect(refusal(() => checkBudgets(plan, 95, 30))).toBeUndefined();
        expect(refusal(() => checkBudgets(plan, 94, 30))).toBe('max_users_exceeded');
        expect(refusal(() => checkBudgets(plan, 95, 20))).toBe('max_emails_exceeded');
    });
    it('requires the Roughtime acknowledgement', () => {
        expect(refusal(() => checkRoughtimeAck(true))).toBeUndefined();
        expect(refusal(() => checkRoughtimeAck(false))).toBe('roughtime_ack_required');
        expect(refusal(() => checkRoughtimeAck(undefined))).toBe('roughtime_ack_required');
    });
});
