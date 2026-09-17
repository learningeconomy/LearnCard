import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCTION_NETWORK, STAGING_NETWORK } from './project';
import {
    assertSecretsOutForPromote,
    assertSourceNetwork,
    planPromotion,
    PROMOTE_CHECKLIST,
} from './promote';

describe('planPromotion', () => {
    it('resolves staging -> production and targets a project folder named after it', () => {
        const plan = planPromotion('staging', 'production');
        expect(plan.fromNetwork).toBe(STAGING_NETWORK);
        expect(plan.toNetwork).toBe(PRODUCTION_NETWORK);
        expect(plan.targetDir.endsWith(`${path.sep}production`)).toBe(true);
    });

    it('names the target folder after the hostname for a custom network URL', () => {
        const plan = planPromotion('staging', 'https://network.example.org:8443/trpc');
        expect(plan.toNetwork).toBe('https://network.example.org:8443/trpc');
        expect(plan.targetDir.endsWith(`${path.sep}network.example.org`)).toBe(true);
    });

    it('throws when --from and --to resolve to the same network', () => {
        expect(() => planPromotion('staging', 'staging')).toThrow('same network');
        expect(() => planPromotion('production', PRODUCTION_NETWORK)).toThrow('same network');
    });
});

describe('PROMOTE_CHECKLIST', () => {
    it('lists the per-network resources that must be recreated on the target', () => {
        expect(PROMOTE_CHECKLIST).toContain('API tokens');
        expect(PROMOTE_CHECKLIST).toContain('Signing authority registrations');
    });
});

describe('assertSecretsOutForPromote', () => {
    it('requires --secrets-out and names the target network when the spec has service accounts', () => {
        expect(() =>
            assertSecretsOutForPromote(true, 'production', { secretsOut: undefined, dryRun: false })
        ).toThrow('--secrets-out is required: promoting creates new API tokens on production.');
    });

    it('does not throw for --dry-run, without service accounts, or once --secrets-out is set', () => {
        expect(() =>
            assertSecretsOutForPromote(true, 'production', { dryRun: true })
        ).not.toThrow();
        expect(() => assertSecretsOutForPromote(false, 'production', {})).not.toThrow();
        expect(() =>
            assertSecretsOutForPromote(true, 'production', { secretsOut: './secrets.env' })
        ).not.toThrow();
    });
});

describe('assertSourceNetwork', () => {
    it('accepts a staging .env for --from staging (alias or full URL)', () => {
        expect(() =>
            assertSourceNetwork({ NETWORK_URL: 'staging' }, 'staging', STAGING_NETWORK)
        ).not.toThrow();
        expect(() =>
            assertSourceNetwork({ NETWORK_URL: STAGING_NETWORK }, 'staging', STAGING_NETWORK)
        ).not.toThrow();
    });

    it('accepts an .env with no NETWORK_URL for --from production', () => {
        expect(() => assertSourceNetwork({}, 'production', PRODUCTION_NETWORK)).not.toThrow();
    });

    it('throws when the source folder is on a different network than --from', () => {
        expect(() => assertSourceNetwork({}, 'staging', STAGING_NETWORK)).toThrow(
            `--from staging does not match this folder's network (${PRODUCTION_NETWORK})`
        );
    });
});
