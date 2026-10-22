import { describe, expect, it } from 'vitest';
import {
    WorkloadPackageValidator,
    WorkloadConfigSchemaValidator,
    validateWorkloadConfig,
    WorkloadCommandValidator,
} from './workload';
import { BundleManifestValidator, VersionedBundleManifestValidator } from './education-os';
import { buildDccIssuerWorkloadPackage } from '../../../services/learn-card-network/brain-service/test/fixtures/workload/dcc-issuer';
import { buildDccStatusWorkloadPackage } from '../../../services/learn-card-network/brain-service/scripts/fixtures/dcc-workload';

const fixture = (): ReturnType<typeof buildDccIssuerWorkloadPackage> & {
    signature: { alg: string; sig: string; verificationMethod: string };
} => ({
    ...buildDccIssuerWorkloadPackage('did:key:fixture'),
    signature: { alg: 'EdDSA', sig: 'fixture', verificationMethod: 'did:key:fixture#key' },
});

describe('workload contracts', (): void => {
    const statusFixture = (): ReturnType<typeof fixture> => ({
        ...buildDccStatusWorkloadPackage('did:key:fixture'),
        signature: fixture().signature,
    });
    it('accepts the separate status workload without changing the core package', (): void => {
        expect(WorkloadPackageValidator.safeParse(statusFixture()).success).toBe(true);
    });
    it.each([
        { command: undefined },
        { user: undefined },
        { user: '0:999' },
        { healthcheck: undefined },
        {
            healthcheck: {
                kind: 'exec',
                argv: ['true'],
                timeoutMs: 1000,
                intervalMs: 1000,
                startupDeadlineMs: 1000,
            },
        },
        { ports: [{ name: 'bad', containerPort: 80, protocol: 'tcp' }] },
        { volumes: [{ name: 'bad', mountPath: '/tmp', persistent: true }] },
        { volumes: [{ name: 'bad', mountPath: '/tmp', persistent: false }] },
        { lifecycle: { kind: 'init', timeoutMs: 999 } },
        { lifecycle: { kind: 'init', timeoutMs: 900001 } },
        { lifecycle: { kind: 'init', timeoutMs: 1000, restart: true } },
    ])('rejects invalid init policy %#', (changes): void => {
        const manifest = statusFixture();
        Object.assign(
            manifest.components.find((component): boolean => component.id === 'mongo-init')!,
            changes
        );
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it.each([
        { visibility: 'public' },
        { auth: 'tenant-token' },
        { query: undefined },
        { query: { replicaSet: 'rs0', directConnection: false } },
        { query: { replicaSet: 'rs0', directConnection: true, password: 'no' } },
        { query: { replicaSet: '-rs0', directConnection: true } },
        { path: '/db?password=no' },
        { path: '/db/collection' },
        { readiness: { path: '/' } },
        { capability: 'credential-issuer' },
        { protocol: 'tcp' },
    ])('rejects invalid MongoDB policy %#', (changes): void => {
        const manifest = statusFixture();
        Object.assign(
            manifest.endpoints.find((endpoint): boolean => endpoint.id === 'mongo')!,
            changes
        );
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it('rejects cycles through init and mixed MongoDB exposure', (): void => {
        const manifest = statusFixture();
        manifest.components.find((component): boolean => component.id === 'mongo')!.dependsOn = [
            'mongo-init',
        ];
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
        const exposed = statusFixture();
        exposed.endpoints.push({
            ...exposed.endpoints[0]!,
            id: 'mongo-public',
            component: 'mongo',
            port: 'mongo',
        });
        expect(WorkloadPackageValidator.safeParse(exposed).success).toBe(false);
    });
    it('accepts literal ordered argv and enforces an explicit non-root user', (): void => {
        const command = ['mongod', '--replSet', 'rs0', '--bind_ip_all'];
        expect(WorkloadCommandValidator.parse(command)).toEqual(command);
        const manifest = fixture();
        Object.assign(manifest.components[0]!, { command, user: '999:999' });
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(true);
        delete manifest.components[0]!.user;
        expect(WorkloadPackageValidator.safeParse(manifest).success).toBe(false);
    });
    it.each([
        [],
        ['-mongod'],
        ['mongod --replSet rs0'],
        ['a'.repeat(257)],
        ['node', 'a'.repeat(4097)],
        ['node', 'a\n'],
        ['node', '\u0000'],
        ['node', '\u007f'],
        ['node', '\u0085'],
        Array.from({ length: 65 }, (): string => 'x'),
        ['node', ...Array.from({ length: 4 }, (): string => 'x'.repeat(4096))],
    ])('rejects invalid argv %#', (...argv): void => {
        expect(WorkloadCommandValidator.safeParse(argv).success).toBe(false);
    });
    it('accepts exact argv size limits and preserves literal metacharacters', (): void => {
        expect(
            WorkloadCommandValidator.safeParse([
                'x',
                'a'.repeat(4096),
                'a'.repeat(4096),
                'a'.repeat(4096),
                'a'.repeat(4095),
            ]).success
        ).toBe(true);
        expect(
            WorkloadCommandValidator.safeParse(Array.from({ length: 64 }, (): string => 'x'))
                .success
        ).toBe(true);
        expect(WorkloadCommandValidator.parse(['node', '$HOME; $(id)', '${literal}', ''])).toEqual([
            'node',
            '$HOME; $(id)',
            '${literal}',
            '',
        ]);
    });
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
