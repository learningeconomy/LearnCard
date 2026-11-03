import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getEscrowEmailSender } from 'learn-card-base/config/authConfig';
import { deepMerge } from 'learn-card-base/config/deepMerge';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';
import { tenantConfigSchema } from 'learn-card-base/config/tenantConfigSchema';

/**
 * VetPass shares LearnCard's single-tenant escrow enclave (authority tenant "learncard")
 * and one account per Firebase user, so the two apps must not drift apart per deploy stage:
 *  - same key derivation and escrow mode (a client without escrow can rotate shares and
 *    strand the shared account's escrow copy);
 *  - when escrow is on, the same enclave pins (copied by hand; update both on every image
 *    roll) and VetPass's `escrowAuthorityTenant` set to "learncard".
 * Local stages are excluded: LearnCard local runs a software enclave, VetPass local is off.
 */
const ENVIRONMENTS = resolve(__dirname, '../../environments');

const resolveTenant = (tenant: string, stage?: string) => {
    let merged = deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        JSON.parse(readFileSync(resolve(ENVIRONMENTS, tenant, 'config.json'), 'utf-8'))
    );
    if (stage) {
        const overlay = resolve(ENVIRONMENTS, tenant, `config.${stage}.json`);
        if (existsSync(overlay))
            merged = deepMerge(merged, JSON.parse(readFileSync(overlay, 'utf-8')));
    }
    return tenantConfigSchema.parse(merged);
};

// [VetPass stage, the LearnCard stage it must match]. Alpha runs on production APIs.
const STAGES: Array<[string | undefined, string | undefined]> = [
    [undefined, undefined],
    ['staging', 'staging'],
    ['sss-pilot', 'sss-pilot'],
    ['alpha', undefined],
];

describe('VetPass / LearnCard escrow parity', () => {
    it.each(STAGES)('vetpass %s matches learncard %s', (vetpassStage, learncardStage) => {
        const vetpass = resolveTenant('vetpass', vetpassStage);
        const learncard = resolveTenant('learncard', learncardStage);
        const vSss = vetpass.auth.sss!;
        const lSss = learncard.auth.sss!;

        expect(vetpass.tenantId).toBe('vetpass');
        expect(vetpass.auth.keyDerivation).toBe(learncard.auth.keyDerivation);
        expect(vSss.escrowEnclaveMode).toBe(lSss.escrowEnclaveMode);

        if (vSss.escrowEnclaveMode === 'off') return;

        expect(vSss.escrowAuthorityTenant).toBe('learncard');
        expect(lSss.escrowAuthorityTenant ?? learncard.tenantId).toBe('learncard');
        expect(vSss.escrowEnclaveMeasurements).toEqual(lSss.escrowEnclaveMeasurements);
        expect(vSss.escrowEnclaveRootSha256).toBe(lSss.escrowEnclaveRootSha256);
        expect(vSss.escrowEnclavePublicKeys).toEqual(lSss.escrowEnclavePublicKeys);
    });

    // Option A: the enclave's emails say "LearnCard", so VetPass must show the in-app note.
    // Resolves the real configs through the same helper the provider uses.
    it.each(STAGES)('vetpass %s names LearnCard as the escrow email sender', vetpassStage => {
        const vetpass = resolveTenant('vetpass', vetpassStage);
        if (vetpass.auth.sss?.escrowEnclaveMode === 'off') return;
        expect(getEscrowEmailSender(vetpass, vetpass.auth.sss!)).toEqual({
            sender: 'LearnCard',
            brand: 'VetPass',
        });
    });

    it.each(STAGES)('learncard %s shows no escrow email sender note', (_v, learncardStage) => {
        const learncard = resolveTenant('learncard', learncardStage);
        expect(getEscrowEmailSender(learncard, learncard.auth.sss ?? {})).toBeUndefined();
    });

    // The SSS switch PR turns production escrow on for both apps and removes this check.
    it('leaves production VetPass escrow off until the SSS switch turns it on', () => {
        expect(resolveTenant('vetpass').auth.sss?.escrowEnclaveMode).toBe('off');
    });
});
