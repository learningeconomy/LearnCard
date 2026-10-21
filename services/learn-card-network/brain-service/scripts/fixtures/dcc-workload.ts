import { createHash } from 'node:crypto';
import type { WorkloadComponent, WorkloadPackage } from '@learncard/types';

/**
 * DCC core-only issuer WorkloadPackage builder.
 *
 * Scope is the owner-directed "signing core" only: issuer-coordinator +
 * signing-service, a single `core` profile. This is intentionally narrower than the
 * exploratory six-component/three-profile fixture in
 * `test/fixtures/workload/dcc-issuer.ts` (status-service-db, mongo,
 * workflow-coordinator, dcc-admin-dashboard, plus lcw-exchange/admin-ui profiles).
 * See `../../workload-agent/DCC-PHASE-5-RESULT.md` ("5A result") for why those are
 * omitted here rather than just left unpublished:
 *
 * - `status-db` (status-service-db) is omitted: the pinned
 *   `@digitalcredentials/credential-status-manager-db` image calls Mongo
 *   `executeTransaction` / `session.withTransaction`, which requires a Mongo
 *   **replica set** ("Transaction numbers are only allowed on a replica set member
 *   or mongos"). A standalone Mongo ping is not sufficient acceptance evidence, and
 *   the component schema has no command/init declaration yet — a reviewed, hash-bound
 *   replica-set startup/init design is pending phase 5B contract work ("New blocker:
 *   the pinned status manager requires Mongo transactions").
 * - `lcw-exchange` (workflow-coordinator) is omitted: workflow-coordinator checks a
 *   transaction service that has not been packaged as a workload component
 *   ("Logging and optional profile dependencies need explicit treatment").
 *
 * Pinned digests are the linux/arm64 manifest digests resolved via
 * `docker buildx imagetools inspect` in DCC-PHASE-5-RESULT.md's "Resolved images"
 * table (2026-10-20), run and health-checked as non-root (`1000:1000`),
 * `read_only`/`cap_drop: ALL` in that same follow-up's "Core image hardening
 * preflight" section (signer `GET /healthz` 200, issuer `GET /` 200; issuer needs a
 * 16 MiB `/app/logs` tmpfs, signer needs no writable mount).
 *
 * This is a signable contract fixture, not deployment or production-readiness
 * evidence; `supportBoundary` fields below are explicit OPEN placeholders pending
 * named owners and LEF sign-off.
 */

export const DCC_ISSUER_CORE_IMAGE =
    'docker.io/digitalcredentials/issuer-coordinator@sha256:ecc5cd955fdf0587b0959482fb7b701d1ec7bd44ee411ceb9b9d5721c518dbfa';
export const DCC_SIGNING_SERVICE_IMAGE =
    'docker.io/digitalcredentials/signing-service@sha256:446bed585c34417968cb28f52b3618295d84009de19f8b7aec37faadde07d141';

const issuerCoordinator: WorkloadComponent = {
    id: 'issuer-coordinator',
    image: DCC_ISSUER_CORE_IMAGE,
    platform: 'linux/arm64',
    user: '1000:1000',
    tmpfs: [{ path: '/app/logs', sizeMiB: 16 }],
    ports: [{ name: 'service', containerPort: 4005, protocol: 'tcp' }],
    healthcheck: {
        kind: 'http',
        port: 'service',
        path: '/',
        timeoutMs: 2000,
        intervalMs: 5000,
        startupDeadlineMs: 120_000,
    },
    dependsOn: ['signing-service'],
    resources: { cpuMillis: 500, memoryMiB: 512, pids: 128 },
    volumes: [],
    env: [
        // Core profile has no status-service component; disable the issuer's
        // dependency on it rather than pointing it at an undeclared endpoint.
        { name: 'ENABLE_STATUS_SERVICE', source: { kind: 'literal', value: 'false' } },
        {
            name: 'SIGNING_SERVICE',
            source: { kind: 'endpoint', endpointId: 'signing-service', part: 'hostport' },
        },
        { name: 'TENANT_TOKEN_EDU', source: { kind: 'secret', name: 'tenant-token-edu' } },
        { name: 'PORT', source: { kind: 'literal', value: '4005' } },
    ],
};

const signingService: WorkloadComponent = {
    id: 'signing-service',
    image: DCC_SIGNING_SERVICE_IMAGE,
    platform: 'linux/arm64',
    user: '1000:1000',
    ports: [{ name: 'service', containerPort: 4006, protocol: 'tcp' }],
    healthcheck: {
        kind: 'http',
        port: 'service',
        path: '/healthz',
        timeoutMs: 2000,
        intervalMs: 5000,
        startupDeadlineMs: 120_000,
    },
    dependsOn: [],
    resources: { cpuMillis: 250, memoryMiB: 256, pids: 64 },
    volumes: [],
    env: [
        {
            name: 'TENANT_SEED_EDU',
            source: { kind: 'secret', name: 'tenant-seed-edu' },
        },
        // Development-only DID method; not the managed institution did:web custody
        // seam (DCC-PHASE-5-RESULT.md leaves that OPEN).
        { name: 'TENANT_DIDMETHOD_EDU', source: { kind: 'literal', value: 'key' } },
        { name: 'PORT', source: { kind: 'literal', value: '4006' } },
    ],
};

// The local-compose renderer builds its compose YAML directly from these signed
// component declarations; there is no separate published compose-module artifact to
// pin for `artifacts.module.ref`. Derive a deterministic placeholder from the two
// pinned images instead of an arbitrary/all-zero digest.
const moduleSha256 = createHash('sha256')
    .update(`${DCC_ISSUER_CORE_IMAGE}|${DCC_SIGNING_SERVICE_IMAGE}`)
    .digest('hex');

/** Unsigned contract fixture only; neither deployable nor production-readiness evidence. */
export const buildDccCoreWorkloadPackage = (
    publisherDid: string
): Omit<WorkloadPackage, 'signature'> => ({
    apiVersion: 'lc.workload/v1',
    id: 'org.dcc.issuer-core',
    version: '1.0.0',
    publisherDid,
    upstream: [
        {
            name: 'DCC issuer-coordinator',
            repository: 'https://github.com/digitalcredentials/issuer-coordinator',
            license: 'MIT',
            // Docker tag used to resolve the pinned digest above (DCC-PHASE-5-RESULT.md
            // "Resolved images"), not a claim of LEF sign-off on that release.
            ref: '1.0.0',
        },
        {
            name: 'DCC signing-service',
            repository: 'https://github.com/digitalcredentials/signing-service',
            license: 'MIT',
            ref: '1.2.0',
        },
    ],
    artifacts: {
        module: {
            kind: 'compose',
            ref: { uri: `https://example.invalid/sha256/${moduleSha256}`, sha256: moduleSha256 },
            rendererVersion: '1.0.0',
        },
    },
    components: [issuerCoordinator, signingService],
    profiles: [
        {
            id: 'core',
            kind: 'core',
            components: ['issuer-coordinator', 'signing-service'],
            requiresProfiles: [],
        },
    ],
    // No conditional/optional profiles in this core-only package, so there is nothing
    // for operator config to gate.
    configSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    secretRefs: [
        {
            name: 'tenant-token-edu',
            purpose: 'Tenant API authentication for the EDU tenant issuance route',
            consumers: ['issuer-coordinator'],
            required: true,
            provisioning: { kind: 'generate', format: 'token', bytes: 32 },
        },
        {
            name: 'tenant-seed-edu',
            purpose: 'Dedicated EDU tenant assertion key used by signing-service',
            consumers: ['signing-service'],
            required: true,
            provisioning: { kind: 'generate', format: 'ed25519-seed-multibase', bytes: 32 },
        },
    ],
    provides: [{ capability: 'credential-issuer', profiles: ['core'] }],
    consumes: [],
    endpoints: [
        // Issuance route is /instance/{tenant}/credentials/issue; only its base is
        // declared. readiness probes the unauthenticated '/' instead (the base itself
        // is not a successful anonymous GET — DCC-PHASE-5-RESULT.md "Blocking
        // endpoint-readiness mismatch"); the advertised/bound URL stays '/instance'.
        {
            id: 'issuer',
            component: 'issuer-coordinator',
            port: 'service',
            path: '/instance',
            protocol: 'http',
            readiness: { path: '/' },
            visibility: 'ecosystem',
            auth: 'tenant-token',
            capability: 'credential-issuer',
            purpose: 'issuance',
            preserveOnRetirement: false,
        },
        // Internal-only: exists so issuer-coordinator's SIGNING_SERVICE env can
        // resolve this endpoint's hostport (WorkloadEnvSource 'endpoint' part
        // 'hostport'). Never exposed to the ecosystem.
        {
            id: 'signing-service',
            component: 'signing-service',
            port: 'service',
            path: '/',
            protocol: 'http',
            readiness: { path: '/healthz' },
            visibility: 'internal',
            auth: 'none',
            purpose: 'internal-signing',
            preserveOnRetirement: false,
        },
    ],
    targets: [{ driver: 'local-compose', platforms: ['linux/arm64'] }],
    sizing: [
        {
            id: 'development',
            profiles: ['core'],
            // Sum of the two components' resources above. compose-workloads.yaml's
            // WORKLOAD_MAX_* ceilings must stay >= this sum.
            resources: { cpuMillis: 750, memoryMiB: 768, pids: 192 },
        },
    ],
    // OPEN readiness items: placeholder team contacts and policies must be reviewed
    // and approved before any real deployment. None of these are cleared merely by
    // this fixture, its digests, or its signature existing.
    supportBoundary: {
        patchOwner: 'OPEN DCC curation team <patch@example.invalid>',
        pageOwner: 'OPEN pilot operations <oncall@example.invalid>',
        slo: 'OPEN development only; no production SLO',
        upgradePolicy: 'OPEN reviewed digest pin upgrades',
        backup: 'OPEN encrypted assertion-key backup policy',
        retirementPlan: 'OPEN retain assertion keys; disable issuance',
    },
});
