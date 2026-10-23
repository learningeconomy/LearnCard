import { describe, expect, it } from 'vitest';
import { once } from 'node:events';
import {
    createServer,
    request,
    type IncomingMessage,
    type Server,
    type ServerResponse,
} from 'node:http';
import { Script } from 'node:vm';
import {
    WorkloadPackageValidator,
    WorkloadConfigSchemaValidator,
    validateWorkloadConfig,
    WorkloadCommandValidator,
} from './workload';
import { BundleManifestValidator, VersionedBundleManifestValidator } from './education-os';
import { buildDccIssuerWorkloadPackage } from '../../../services/learn-card-network/brain-service/test/fixtures/workload/dcc-issuer';
import {
    buildDccStatusWorkloadPackage,
    buildDccExchangeWorkloadPackage,
    buildDccCoreWorkloadPackage,
    DCC_TRANSACTION_SERVICE_IMAGE,
    DCC_STATUS_GATEWAY_SCRIPT,
} from '../../../services/learn-card-network/brain-service/scripts/fixtures/dcc-workload';

const fixture = (): ReturnType<typeof buildDccIssuerWorkloadPackage> & {
    signature: { alg: string; sig: string; verificationMethod: string };
} => ({
    ...buildDccIssuerWorkloadPackage('did:key:fixture'),
    signature: { alg: 'EdDSA', sig: 'fixture', verificationMethod: 'did:key:fixture#key' },
});

describe('workload contracts', (): void => {
    it('invokes the gateway program with node -e', (): void => {
        const gateway = buildDccExchangeWorkloadPackage('did:key:fixture').components.find(
            (component): boolean => component.id === 'status-gateway'
        );
        expect(gateway?.command).toEqual(['node', '-e', DCC_STATUS_GATEWAY_SCRIPT]);
    });
    it('accepts the exchange fixture without mutating existing published fixtures', (): void => {
        const core = buildDccCoreWorkloadPackage('did:key:fixture');
        const status = buildDccStatusWorkloadPackage('did:key:fixture');
        const before = JSON.stringify({ core, status });
        const exchange = buildDccExchangeWorkloadPackage('did:key:fixture');
        expect(exchange.version).toBe('1.0.2');
        expect(
            exchange.components.find((component): boolean => component.id === 'status-gateway')
        ).toMatchObject({
            image: DCC_TRANSACTION_SERVICE_IMAGE,
            command: ['node', '-e', DCC_STATUS_GATEWAY_SCRIPT],
            user: '1000:1000',
            dependsOn: ['status-service-db'],
        });
        expect(
            exchange.endpoints.find((endpoint): boolean => endpoint.id === 'status-service')
                ?.visibility
        ).toBe('internal');
        expect(
            exchange.endpoints.find((endpoint): boolean => endpoint.id === 'status-public')
        ).toMatchObject({ component: 'status-gateway', visibility: 'ecosystem', auth: 'none' });
        expect(
            exchange.components
                .find((component): boolean => component.id === 'status-service-db')
                ?.env.find((entry): boolean => entry.name === 'STATUS_CRED_SITE_ORIGIN')?.source
        ).toEqual({
            kind: 'endpoint',
            endpointId: 'status-public',
            part: 'origin',
            address: 'published',
        });
        expect(
            WorkloadPackageValidator.parse({ ...exchange, signature: fixture().signature }).id
        ).toBe('org.dcc.issuer-exchange');
        expect(JSON.stringify({ core, status })).toBe(before);
        expect(buildDccCoreWorkloadPackage('did:key:fixture')).toEqual(core);
        expect(buildDccStatusWorkloadPackage('did:key:fixture')).toEqual(status);
        expect(exchange.sizing[0]!.resources).toEqual(
            exchange.components.reduce(
                (sum, component): typeof sum => ({
                    cpuMillis: sum.cpuMillis + component.resources.cpuMillis,
                    memoryMiB: sum.memoryMiB + component.resources.memoryMiB,
                    pids: sum.pids + component.resources.pids,
                }),
                { cpuMillis: 0, memoryMiB: 0, pids: 0 }
            )
        );
    });
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
    it('accepts published addresses only for ecosystem/public HTTP(S) endpoints', (): void => {
        const withSource = (endpointId: string, extra: Record<string, unknown>): boolean => {
            const manifest = statusFixture();
            manifest.components
                .find((component): boolean => component.id === 'issuer-coordinator')!
                .env.push({
                    name: 'PUBLIC_ORIGIN',
                    source: { kind: 'endpoint', endpointId, part: 'origin', ...extra },
                });
            return WorkloadPackageValidator.safeParse(manifest).success;
        };
        expect(withSource('issuer', { address: 'published' })).toBe(true);
        expect(withSource('status-service', { address: 'published' })).toBe(false);
        expect(withSource('mongo', { address: 'published' })).toBe(false);
        expect(withSource('issuer', {})).toBe(false);
        expect(withSource('issuer', { address: 'private' })).toBe(false);
        expect(withSource('issuer', { address: 'external' })).toBe(false);
        expect(withSource('issuer', { address: 'published', value: 'https://evil' })).toBe(false);
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

describe('fixed DCC status gateway program', (): void => {
    it('rejects invalid upstream configuration before listening', (): void => {
        expect((): void => {
            new Script(DCC_STATUS_GATEWAY_SCRIPT).runInNewContext({
                require: (): object => ({}),
                process: {
                    env: { STATUS_UPSTREAM: 'http://elsewhere/path' },
                    exit: (code: number): never => {
                        throw new Error(`exit ${code}`);
                    },
                },
            });
        }).toThrow('exit 1');
    });

    it('serves only bounded read-only single-segment status requests', async (): Promise<void> => {
        const calls: {
            method: string | undefined;
            accept: string | undefined;
            privateHeader: string | string[] | undefined;
        }[] = [];
        const upstream = createServer((req, res): void => {
            calls.push({
                method: req.method,
                accept: req.headers.accept,
                privateHeader: req.headers['x-private'],
            });
            if (req.url === '/stall') return;
            if (req.url === '/broken') {
                req.socket.destroy();
                return;
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Upstream-Private', 'must-not-forward');
            if (req.url === '/large') {
                res.write(Buffer.alloc(1048576));
                res.end('x');
                return;
            }
            if (req.url === '/limit') {
                res.end(Buffer.alloc(1048576));
                return;
            }
            res.statusCode = req.url === '/missing' ? 404 : 200;
            res.end('{"status":"ok"}');
        });
        const gateway = createServer();
        try {
            upstream.listen(0);
            await once(upstream, 'listening');
            const address = upstream.address();
            if (!address || typeof address === 'string') throw new Error('Missing upstream port');
            new Script(DCC_STATUS_GATEWAY_SCRIPT).runInNewContext({
                require: (name: string): object => {
                    expect(name).toBe('node:http');
                    return {
                        request,
                        createServer: (
                            listener: (req: IncomingMessage, res: ServerResponse) => void
                        ): object => {
                            gateway.on('request', listener);
                            return {
                                listen: (port: number): Server => {
                                    expect(port).toBe(4010);
                                    return gateway.listen(0, '127.0.0.1');
                                },
                            };
                        },
                    };
                },
                process: { env: { STATUS_UPSTREAM: `localhost:${address.port}` } },
                Buffer,
                setTimeout,
                clearTimeout,
            });
            await once(gateway, 'listening');
            const publicAddress = gateway.address();
            if (!publicAddress || typeof publicAddress === 'string')
                throw new Error('Missing gateway port');
            const origin = `http://127.0.0.1:${publicAddress.port}`;
            for (const [method, path, status] of [
                ['GET', '/', 200],
                ['HEAD', '/', 200],
                ['POST', '/credentials/status/allocate', 405],
                ['POST', '/credentials/status', 405],
                ['PUT', '/list', 405],
                ['DELETE', '/list', 405],
                ['GET', '/credentials', 404],
                ['GET', '/credentials/x', 404],
                ['GET', '/%63redentials', 404],
                ['GET', '/list?x=1', 404],
                ['GET', '/a.b', 404],
                ['GET', `/${'a'.repeat(129)}`, 404],
            ] as const) {
                const response = await fetch(origin + path, { method });
                expect(response.status).toBe(status);
                await response.arrayBuffer();
            }
            expect(calls).toHaveLength(0);
            const response = await fetch(origin + '/Status_123-abc', {
                headers: { Accept: 'application/json', 'X-Private': 'must-not-forward' },
            });
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');
            expect(response.headers.has('x-upstream-private')).toBe(false);
            expect(await response.text()).toBe('{"status":"ok"}');
            expect(calls[0]).toEqual({
                method: 'GET',
                accept: 'application/json',
                privateHeader: undefined,
            });
            const head = await fetch(origin + '/Status_123-abc', { method: 'HEAD' });
            expect(head.status).toBe(200);
            expect(await head.text()).toBe('');
            expect(calls[1]?.method).toBe('HEAD');
            const limit = await fetch(origin + '/limit');
            expect(limit.status).toBe(200);
            expect((await limit.arrayBuffer()).byteLength).toBe(1048576);
            for (const [path, status] of [
                ['/missing', 404],
                ['/large', 502],
                ['/broken', 502],
                ['/stall', 502],
            ] as const) {
                const result = await fetch(origin + path);
                expect(result.status).toBe(status);
                await result.arrayBuffer();
            }
        } finally {
            gateway.closeAllConnections();
            upstream.closeAllConnections();
            await Promise.all(
                [gateway, upstream].map(
                    (server): Promise<void> =>
                        new Promise((resolve): void => {
                            server.close((): void => resolve());
                        })
                )
            );
        }
    }, 15000);
});
