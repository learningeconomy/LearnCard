import { describe, expect, it } from 'vitest';
import {
    WorkloadPackageValidator,
    WorkloadConfigSchemaValidator,
    validateWorkloadConfig,
} from './workload';
import { BundleManifestValidator, VersionedBundleManifestValidator } from './education-os';
import { buildDccIssuerWorkloadPackage } from '../../../services/learn-card-network/brain-service/test/fixtures/workload/dcc-issuer';

const fixture = (): ReturnType<typeof buildDccIssuerWorkloadPackage> & {
    signature: { alg: string; sig: string; verificationMethod: string };
} => ({
    ...buildDccIssuerWorkloadPackage('did:key:fixture'),
    signature: { alg: 'EdDSA', sig: 'fixture', verificationMethod: 'did:key:fixture#key' },
});

describe('workload contracts', (): void => {
    it('bounds schema recursion, config strings and pattern execution', (): void => {
        const schema = {
            type: 'object',
            properties: { label: { type: 'string', pattern: '^[a-z]+$' } },
            required: ['label'],
            additionalProperties: false,
        };
        expect(validateWorkloadConfig(schema, { label: 'valid' })).toEqual({ ok: true });
        expect(validateWorkloadConfig(schema, { label: 'x'.repeat(4097) }).ok).toBe(false);
        expect(
            WorkloadConfigSchemaValidator.safeParse({
                ...schema,
                properties: { label: { type: 'string', pattern: '^(a+)+$' } },
            }).success
        ).toBe(false);
        let nested: unknown = schema;
        for (let index = 0; index < 40; index++) nested = { ...schema, properties: { nested } };
        expect(WorkloadConfigSchemaValidator.safeParse(nested).success).toBe(false);
    });
    it('rejects secret use by an undeclared consumer', (): void => {
        const manifest = fixture();
        manifest.components[3]!.env.push({
            name: 'STOLEN_KEY',
            source: { kind: 'secret', name: 'tenant-seed' },
        });
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it('parses the DCC fixture', (): void => {
        expect(WorkloadPackageValidator.safeParse(fixture()).success).toBe(true);
    });
    it.each([
        ['tag-only image', { image: 'docker.io/digitalcredentials/signing-service:1.2.0' }],
        ['shell-string healthcheck', { healthcheck: 'curl /health' }],
        ['unknown execution field', { privileged: true }],
        ['dangling dependency', { dependsOn: ['missing'] }],
        ['dependency cycle', { dependsOn: ['issuer-coordinator'] }],
    ])('rejects %s', (_name, changes): void => {
        const manifest = fixture();
        manifest.components[0] = { ...manifest.components[0]!, ...changes };
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it('rejects two core profiles and profile cycles', (): void => {
        const manifest = fixture();
        manifest.profiles[1]!.kind = 'core';
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
        manifest.profiles[1]!.kind = 'conditional';
        manifest.profiles[0]!.requiresProfiles = ['lcw-exchange'];
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it('rejects secret values, unknown signature fields and unresolved ports', (): void => {
        const manifest = fixture();
        expect(
            WorkloadPackageValidator.safeParse({
                ...manifest,
                secretRefs: [{ ...manifest.secretRefs[0], value: 'secret' }],
            }).success
        ).toBe(false);
        expect(
            WorkloadPackageValidator.safeParse({
                ...manifest,
                signature: { ...manifest.signature, execute: true },
            }).success
        ).toBe(false);
        manifest.endpoints[0]!.port = 'missing';
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it.each(['$ref', 'oneOf', 'anyOf', 'allOf', 'not', 'if', 'then', 'else'])(
        'rejects schema keyword %s recursively',
        (keyword): void => {
            const schema = fixture().configSchema;
            expect(
                WorkloadConfigSchemaValidator.safeParse({
                    ...schema,
                    properties: { nested: { ...schema, [keyword]: 'forbidden' } },
                }).success
            ).toBe(false);
        }
    );
    it('validates config without coercion and rejects extra properties', (): void => {
        const schema = fixture().configSchema;
        expect(validateWorkloadConfig(schema, { exchangeEnabled: true })).toEqual({ ok: true });
        expect(validateWorkloadConfig(schema, { exchangeEnabled: 'true' }).ok).toBe(false);
        expect(validateWorkloadConfig(schema, { exchangeEnabled: true, extra: false }).ok).toBe(
            false
        );
        expect(validateWorkloadConfig(schema, {}).ok).toBe(false);
    });
    it('supports v1.1 workload members without changing v1 parsing', (): void => {
        const base = {
            apiVersion: 'lc.bundle/v1',
            id: 'bundle',
            version: '1',
            publisherDid: 'did:key:fixture',
            signature: fixture().signature,
            contains: [
                {
                    declarationId: 'issuer',
                    targetType: 'WORKLOAD_DEPLOYMENT',
                    listingId: 'old',
                    versionId: 'v1',
                },
            ],
        };
        expect(VersionedBundleManifestValidator.parse(base)).toEqual(
            BundleManifestValidator.parse(base)
        );
        const member = {
            declarationId: 'issuer',
            targetType: 'WORKLOAD_DEPLOYMENT',
            packageId: 'dcc',
            packageVersionId: 'v1',
            manifestHash: '0'.repeat(64),
            profiles: ['core'],
        };
        const next = { ...base, apiVersion: 'lc.bundle/v1.1', contains: [member] };
        expect(VersionedBundleManifestValidator.safeParse(next).success).toBe(true);
        for (const extra of [{ listingId: 'no' }, { versionId: 'no' }])
            expect(
                VersionedBundleManifestValidator.safeParse({
                    ...next,
                    contains: [{ ...member, ...extra }],
                }).success
            ).toBe(false);
        expect(BundleManifestValidator.safeParse(next).success).toBe(false);
    });
});
