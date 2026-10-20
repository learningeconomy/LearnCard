import type { WorkloadComponent, WorkloadPackage } from '@learncard/types';

// PLACEHOLDER digest — phase 5 pins real digests (signing-service 1.2.0, issuer-coordinator 1.0.0, status-service-db 0.1.0, workflow-coordinator 1.0.1, dcc-admin-dashboard 1.0.1)
const digest = '0'.repeat(64);
const component = (id: string, port: number, dependsOn: string[] = []): WorkloadComponent => ({
    id,
    image: `${id === 'mongo' ? 'docker.io/library/mongo' : `docker.io/digitalcredentials/${id}`}@sha256:${digest}`,
    platform: 'linux/amd64',
    ports: [{ name: 'service', containerPort: port, protocol: 'tcp' }],
    healthcheck: {
        kind: 'tcp',
        port: 'service',
        timeoutMs: 2000,
        intervalMs: 5000,
        startupDeadlineMs: 120000,
    },
    dependsOn,
    resources: { cpuMillis: 500, memoryMiB: 512, pids: 128 },
    volumes: id === 'mongo' ? [{ name: 'data', mountPath: '/data/db', persistent: true }] : [],
    env: [],
});

/** Unsigned contract fixture only; neither deployable nor production readiness evidence. */
export const buildDccIssuerWorkloadPackage = (
    publisherDid: string
): Omit<WorkloadPackage, 'signature'> => {
    const issuer = component('issuer-coordinator', 4005, ['signing-service', 'status-service-db']);
    const signer = component('signing-service', 4006);
    const status = component('status-service-db', 4008, ['mongo']);
    issuer.env = [
        { name: 'TENANT_TOKEN_EXAMPLE', source: { kind: 'secret', name: 'tenant-token' } },
        { name: 'STATUS_SERVICE', source: { kind: 'endpoint', endpointId: 'status', part: 'url' } },
    ];
    signer.env = [{ name: 'TENANT_SEED_EXAMPLE', source: { kind: 'secret', name: 'tenant-seed' } }];
    status.env = [
        {
            name: 'CRED_STATUS_DB_URL',
            source: { kind: 'endpoint', endpointId: 'mongo', part: 'url' },
        },
    ];
    return {
        apiVersion: 'lc.workload/v1',
        id: 'dcc-issuer',
        version: '1.0.0',
        publisherDid,
        upstream: [
            {
                name: 'DCC issuer',
                repository: 'https://github.com/digitalcredentials/issuer-coordinator',
                license: 'MIT',
                ref: 'v1.0.0',
            },
        ],
        artifacts: {
            module: {
                kind: 'compose',
                ref: { uri: `https://example.invalid/sha256/${digest}`, sha256: digest },
                rendererVersion: '1.0.0',
            },
        },
        components: [
            issuer,
            signer,
            status,
            component('mongo', 27017),
            component('workflow-coordinator', 4005, ['issuer-coordinator']),
            component('dcc-admin-dashboard', 3000, ['issuer-coordinator']),
        ],
        profiles: [
            {
                id: 'core',
                kind: 'core',
                components: ['issuer-coordinator', 'signing-service', 'status-service-db', 'mongo'],
                requiresProfiles: [],
            },
            {
                id: 'lcw-exchange',
                kind: 'conditional',
                components: ['workflow-coordinator'],
                requiresProfiles: ['core'],
                condition: { configPath: 'exchangeEnabled', equals: true },
            },
            {
                id: 'admin-ui',
                kind: 'optional',
                components: ['dcc-admin-dashboard'],
                requiresProfiles: ['core'],
            },
        ],
        configSchema: {
            type: 'object',
            properties: { exchangeEnabled: { type: 'boolean' } },
            required: ['exchangeEnabled'],
            additionalProperties: false,
        },
        secretRefs: [
            {
                name: 'tenant-token',
                purpose: 'Tenant API authentication',
                consumers: ['issuer-coordinator'],
                required: true,
                provisioning: { kind: 'generate', format: 'token', bytes: 32 },
            },
            {
                name: 'tenant-seed',
                purpose: 'Dedicated issuer assertion key',
                consumers: ['signing-service'],
                required: true,
                provisioning: { kind: 'generate', format: 'ed25519-seed', bytes: 32 },
            },
        ],
        provides: [{ capability: 'credential-issuer', profiles: ['core'] }],
        consumes: [{ capability: 'wallet-claim', profiles: ['lcw-exchange'] }],
        endpoints: [
            // Issuance route is /instance/{tenant}/credentials/issue; only its base is declared.
            {
                id: 'credential-issuer',
                component: 'issuer-coordinator',
                port: 'service',
                path: '/instance',
                protocol: 'http',
                visibility: 'ecosystem',
                auth: 'tenant-token',
                capability: 'credential-issuer',
                purpose: 'issuance',
                preserveOnRetirement: false,
            },
            {
                id: 'status',
                component: 'status-service-db',
                port: 'service',
                path: '/',
                protocol: 'http',
                visibility: 'public',
                auth: 'none',
                purpose: 'status-list',
                preserveOnRetirement: true,
            },
            {
                id: 'exchange',
                component: 'workflow-coordinator',
                port: 'service',
                path: '/exchange',
                protocol: 'http',
                visibility: 'ecosystem',
                auth: 'tenant-token',
                purpose: 'credential-exchange',
                preserveOnRetirement: false,
            },
            {
                id: 'mongo',
                component: 'mongo',
                port: 'service',
                path: '/',
                protocol: 'tcp',
                visibility: 'internal',
                auth: 'none',
                purpose: 'private-status-database',
                preserveOnRetirement: true,
            },
        ],
        targets: [{ driver: 'local-compose', platforms: ['linux/amd64'] }],
        sizing: [
            {
                id: 'development',
                profiles: ['core'],
                resources: { cpuMillis: 2000, memoryMiB: 2048, pids: 512 },
            },
        ],
        // OPEN readiness items: placeholder team contacts and policies must be approved before deployment.
        supportBoundary: {
            patchOwner: 'OPEN DCC curation team <patch@example.invalid>',
            pageOwner: 'OPEN pilot operations <oncall@example.invalid>',
            slo: 'OPEN development only; no production SLO',
            upgradePolicy: 'OPEN reviewed digest pin upgrades',
            backup: 'OPEN encrypted Mongo and assertion-key backups',
            retirementPlan: 'OPEN retain status publication, keys and Mongo data; disable issuance',
        },
    };
};
