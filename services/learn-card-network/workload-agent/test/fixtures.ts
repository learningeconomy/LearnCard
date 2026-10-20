import type { WorkloadPlan } from '../../../../packages/learn-card-types/src/education-os';
import type {
    WorkloadComponent,
    WorkloadEndpointDeclaration,
    WorkloadSecretDeclaration,
} from '../../../../packages/learn-card-types/src/workload';
import type { AgentConfig } from '../src/config';
import type { Operation } from '../src/types';

export const image = `docker.io/hashicorp/http-echo@sha256:${'a'.repeat(64)}`;
export const config = (root = '/tmp/lcn-workload-agent-test'): AgentConfig => ({
    WORKLOAD_LOCAL_COMPOSE_ENABLED: 'true',
    WORKLOAD_AGENT_TOKEN: 'test-agent-token-123456',
    BRAIN_URL: 'http://localhost:4000',
    WORKLOAD_AGENT_POLL_MS: 1000,
    WORKLOAD_SECRETS_DIR: root,
    WORKLOAD_IMAGE_ALLOWLIST: 'docker.io/hashicorp/',
    WORKLOAD_MAX_CPU_MILLIS: 1000,
    WORKLOAD_MAX_MEMORY_MIB: 256,
    WORKLOAD_MAX_PIDS: 64,
    WORKLOAD_AGENT_CONTAINER: 'lcn-workload-agent',
});
export const component = (): WorkloadComponent => ({
    id: 'web',
    image,
    platform: 'linux/arm64',
    ports: [{ name: 'http', containerPort: 5678, protocol: 'tcp' }],
    healthcheck: {
        kind: 'http',
        port: 'http',
        path: '/',
        expectStatus: 200,
        timeoutMs: 1000,
        intervalMs: 1000,
        startupDeadlineMs: 10000,
    },
    dependsOn: [],
    resources: { cpuMillis: 100, memoryMiB: 64, pids: 32 },
    volumes: [{ name: 'data', mountPath: '/data', persistent: true }],
    env: [],
});
export const endpoint = (): WorkloadEndpointDeclaration => ({
    id: 'web',
    component: 'web',
    port: 'http',
    path: '/',
    protocol: 'http',
    visibility: 'public',
    auth: 'none',
    purpose: 'test',
    preserveOnRetirement: false,
});
export const secret = (): WorkloadSecretDeclaration => ({
    name: 'key',
    purpose: 'test',
    consumers: ['web'],
    required: true,
    provisioning: { kind: 'generate', format: 'ed25519-seed' },
});
export const plan = (): WorkloadPlan => {
    const web = component();
    return {
        packageId: 'test',
        packageVersionId: 'test-v1',
        version: '1.0.0',
        manifestHash: 'b'.repeat(64),
        publisherDid: 'did:key:test',
        profiles: ['core'],
        components: [{ id: web.id, image: web.image, platform: web.platform }],
        execution: { components: [web], secretRefs: [], config: {} },
        module: { sha256: 'b'.repeat(64), rendererVersion: '1.0.0' },
        endpoints: [endpoint()],
        supportBoundary: {},
        secrets: [],
        driver: 'local-compose',
        provides: [],
        consumes: [],
        bundle: { versionId: 'bundle-v1', manifestHash: 'b'.repeat(64) },
        platformValidation: 'DEFERRED_TO_AGENT',
    };
};
export const operation = (): Operation => ({
    operationId: 'test:1:APPLY',
    deploymentId: 'test',
    action: 'APPLY',
    specRevision: 1,
    status: 'CLAIMED',
    leaseToken: '11111111-1111-4111-8111-111111111111',
    leaseExpiresAt: new Date(Date.now() + 60000).toISOString(),
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedSpec: JSON.stringify(plan()),
});
