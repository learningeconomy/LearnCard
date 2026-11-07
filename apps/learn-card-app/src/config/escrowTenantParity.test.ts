import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
    getEscrowEmailSender,
    getTenantEscrowStrategyConfig,
    type SSSConfig,
} from 'learn-card-base/config/authConfig';
import { deepMerge } from 'learn-card-base/config/deepMerge';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';
import { tenantConfigSchema } from 'learn-card-base/config/tenantConfigSchema';

/**
 * VetPass shares LearnCard's single-tenant escrow enclave (authority tenant "learncard")
 * and one account per Firebase user, so once VetPass escrow is on at a deploy stage the two
 * apps must not drift apart there:
 *  - same key derivation and escrow mode (a client without escrow can rotate shares and
 *    strand the shared account's escrow copy);
 *  - the same enclave pins (copied by hand; update both on every image roll) and VetPass's
 *    `escrowAuthorityTenant` set to "learncard".
 * VetPass staging and production deploy separately (#1942). VetPass staging runs SSS with
 * escrow on the staging enclave; production and the sss-pilot overlay stay off until the SSS
 * switch turns them on together with LearnCard production (D20).
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

// [VetPass stage, the LearnCard stage it must match]. Alpha was retired in #1942.
const STAGES: Array<[string | undefined, string | undefined]> = [
    [undefined, undefined],
    ['staging', 'staging'],
    ['sss-pilot', 'sss-pilot'],
];

/**
 * VetPass stages whose escrow is deliberately still off. The SSS switch PR turns VetPass
 * escrow on with LearnCard production and empties this list; parity then applies everywhere.
 */
const VETPASS_ESCROW_PENDING_SWITCH = new Set<string | undefined>([]);

describe('VetPass / LearnCard escrow parity', () => {
    it.each(STAGES)('vetpass %s matches learncard %s', (vetpassStage, learncardStage) => {
        const vetpass = resolveTenant('vetpass', vetpassStage);
        const learncard = resolveTenant('learncard', learncardStage);
        const vSss = vetpass.auth.sss!;
        const lSss = learncard.auth.sss!;

        expect(vetpass.tenantId).toBe('vetpass');

        if (VETPASS_ESCROW_PENDING_SWITCH.has(vetpassStage)) {
            // Turning escrow on here must come with the whole parity block below.
            expect(vSss.escrowEnclaveMode).toBe('off');
            return;
        }

        expect(vetpass.auth.keyDerivation).toBe(learncard.auth.keyDerivation);
        expect(vSss.escrowEnclaveMode).toBe(lSss.escrowEnclaveMode);
        // D21: both apps seal their brand or neither does (a shared DID's brand is
        // "last app to enroll/replace"); turned on together after the image roll.
        expect(!!vSss.escrowSealEmailBrand).toBe(!!lSss.escrowSealEmailBrand);
        // ...and LearnCard then names VetPass in its note (a LearnCard user on a DID last
        // written by VetPass gets VetPass-branded enclave emails).
        if (lSss.escrowSealEmailBrand)
            expect(lSss.escrowSharedEmailBrands ?? []).toContain(vetpass.branding.name);

        if (vSss.escrowEnclaveMode === 'off') return;

        expect(vSss.escrowAuthorityTenant).toBe('learncard');
        expect(lSss.escrowAuthorityTenant ?? learncard.tenantId).toBe('learncard');
        expect(vSss.escrowEnclaveMeasurements).toEqual(lSss.escrowEnclaveMeasurements);
        expect(vSss.escrowEnclaveRootSha256).toBe(lSss.escrowEnclaveRootSha256);
        expect(vSss.escrowEnclavePublicKeys).toEqual(lSss.escrowEnclavePublicKeys);
    });

    // Option A: the enclave's emails say "LearnCard", so VetPass must show the in-app note.
    // Resolves the real configs through the same helper the provider uses, with the
    // authority tenant the switch will set.
    it.each(STAGES)('vetpass %s names LearnCard as the escrow email sender', vetpassStage => {
        const vetpass = resolveTenant('vetpass', vetpassStage);
        expect(
            getEscrowEmailSender(vetpass, {
                escrowAuthorityTenant: 'learncard',
                escrowSealEmailBrand: vetpass.auth.sss?.escrowSealEmailBrand,
            })
        ).toEqual({
            sender: 'LearnCard',
            brand: 'VetPass',
            mixed: !!vetpass.auth.sss?.escrowSealEmailBrand,
        });
    });

    // D21: once VetPass seals its brand, the note must still be shown (older blobs and
    // LearnCard-enrolled shared DIDs keep the LearnCard brand), worded as "either".
    it.each(STAGES)('vetpass %s keeps a mixed note when sealing its brand', vetpassStage => {
        const vetpass = resolveTenant('vetpass', vetpassStage);
        expect(
            getEscrowEmailSender(vetpass, {
                escrowAuthorityTenant: 'learncard',
                escrowSealEmailBrand: true,
            })
        ).toEqual({ sender: 'LearnCard', brand: 'VetPass', mixed: true });
    });

    // D21: LearnCard's enclave emails carry its own brand, so it needs no note while sealing
    // is off. Once sealing is on, a shared DID last enrolled from VetPass gets VetPass-branded
    // emails, so LearnCard must name VetPass (from `escrowSharedEmailBrands`).
    it.each(STAGES)('learncard %s notes VetPass only while sealing', (_v, learncardStage) => {
        const learncard = resolveTenant('learncard', learncardStage);
        const sss = learncard.auth.sss;
        const note = getEscrowEmailSender(learncard, sss ?? {});
        if (!sss?.escrowSealEmailBrand) expect(note).toBeUndefined();
        else
            expect(note).toEqual({
                sender: 'VetPass',
                brand: 'LearnCard',
                mixed: true,
                shared: true,
            });
    });

    it.each(STAGES)('learncard %s names VetPass once both seal', (vetpassStage, learncardStage) => {
        const learncard = resolveTenant('learncard', learncardStage);
        const vetpass = resolveTenant('vetpass', vetpassStage);
        expect(
            getEscrowEmailSender(learncard, {
                ...learncard.auth.sss,
                escrowSealEmailBrand: true,
                escrowSharedEmailBrands: [vetpass.branding.name!],
            })
        ).toEqual({ sender: 'VetPass', brand: 'LearnCard', mixed: true, shared: true });
    });

    // The providers' `sss` factory wiring: the resolved tenant's `branding.name` becomes the
    // sealed `escrow.emailBrand` when the flag is on, and nothing is sealed when it is off.
    it.each(STAGES)('vetpass %s seals its branding.name as the email brand', vetpassStage => {
        const vetpass = resolveTenant('vetpass', vetpassStage);
        const learncard = resolveTenant('learncard', 'staging');
        const sss = (escrowSealEmailBrand: boolean): SSSConfig => ({
            serverUrl: '',
            escrowRelayPublicKey: '',
            escrowRelayKeyId: '',
            escrowEnclaveMode: 'nitro',
            escrowEnclavePublicKeys: [],
            escrowEnclaveMeasurements: learncard.auth.sss!.escrowEnclaveMeasurements ?? [],
            escrowAuthorityTenant: 'learncard',
            escrowSealEmailBrand,
            enableEmailBackupShare: false,
            requireEmailForPhoneUsers: false,
        });
        const options = { tenantId: 'vetpass', stage: 'staging' as const };
        expect(getTenantEscrowStrategyConfig(sss(true), vetpass, options)).toMatchObject({
            enabled: true,
            authorityTenant: 'learncard',
            emailBrand: 'VetPass',
        });
        expect(getTenantEscrowStrategyConfig(sss(false), vetpass, options)).not.toHaveProperty(
            'emailBrand'
        );
        expect(getTenantEscrowStrategyConfig(sss(true), undefined, options)).not.toHaveProperty(
            'emailBrand'
        );
    });
});
