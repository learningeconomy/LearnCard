/** Local-only operator acceptance proof. No database writes or agent-auth shortcuts.
 * Run again to reuse the exact approved intent; --restart checks recovery as well.
 */
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { VCValidator, VerificationItemValidator } from '@learncard/types';
import { InstallIntentRecordValidator } from '../src/types/install-intent';
import { WorkloadDeploymentValidator } from '../src/types/install-target';

const origin = 'http://localhost:5173';
const exchangeMode = process.argv.includes('--exchange');
const statusMode = exchangeMode || process.argv.includes('--status');
const packageId = exchangeMode
    ? 'org.dcc.issuer-exchange'
    : statusMode
      ? 'org.dcc.issuer-status'
      : 'org.dcc.issuer-core';
const run = promisify(execFile);
const secrets = new Set<string>();
let cookie = '';
const redact = (text: string): string => {
    for (const value of secrets) text = text.split(value).join('[REDACTED]');
    return text
        .replace(
            /https?:\/\/[^\s"<>]*(?:request\.html|\/exchange\/)[^\s"<>]*/gi,
            '[REDACTED exchange URL]'
        )
        .replace(
            /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
            '[REDACTED UUID]'
        )
        .replace(
            /^.*(?:token|seed|authorization|password|private.?key).*$/gim,
            '[REDACTED sensitive line]'
        )
        .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[REDACTED opaque value]');
};
const log = (message: string): void =>
    console.log(`${new Date().toISOString()} ${redact(message)}`);
const docker = async (args: string[]): Promise<string> => {
    try {
        const result = await run('docker', args, { timeout: 30_000, maxBuffer: 1024 * 1024 });
        return `${result.stdout}${result.stderr}`.trim();
    } catch {
        throw new Error(`Docker ${args[0]} failed (output withheld)`);
    }
};
const request = async (path: string, body?: unknown): Promise<Response> => {
    const response = await fetch(`${origin}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'learncard', cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
    });
    if (!response.ok)
        throw new Error(
            `${path.split('?')[0]} HTTP ${response.status}: ${redact(await response.text())}`
        );
    return response;
};
const rpc = async (path: string, input: unknown, mutation = false): Promise<unknown> => {
    const response = await request(
        `/trpc/${path}${mutation || input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`}`,
        mutation ? input : undefined
    );
    return z.object({ result: z.object({ data: z.unknown() }) }).parse(await response.json()).result
        .data;
};
const login = async (): Promise<void> => {
    const providerId = 'lef-wallet';
    const begin = await request('/auth/login', { providerId, redirectUri: `${origin}/callback` });
    const { redirectUrl } = z.object({ redirectUrl: z.string() }).parse(await begin.json());
    const state = new URL(redirectUrl).searchParams.get('state');
    if (!state) throw new Error('Missing login state');
    const holder = 'did:key:z6MkdevconsoleLocalOperator';
    const encode = (value: unknown): string =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
    const vp = `${encode({ alg: 'ES256' })}.${encode({ iss: holder, vp: { holder } })}.dev-signature`;
    const callback = await request('/auth/callback', { providerId, params: { state, vp } });
    cookie = callback.headers.get('set-cookie')?.split(';')[0] ?? '';
    if (!cookie) throw new Error('Missing session cookie');
    secrets.add(cookie);
};
type Deployment = z.infer<typeof WorkloadDeploymentValidator>;
const endpointsSchema = z.array(
    z.object({ id: z.string(), url: z.string(), healthy: z.boolean() })
);
const valuesDirectory = (id: string): string => {
    // Same stable encoding as workload-agent/src/render.ts; secret filenames are
    // logical names, NOT their consuming environment variable names.
    const safe = `${id
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .slice(0, 35)}-${createHash('sha256').update(id).digest('hex').slice(0, 12)}`;
    return join(
        process.env.WORKLOAD_HOST_SECRETS_DIR ?? join(homedir(), '.lcn-workloads/secrets'),
        `lcnwl-${safe}`,
        'values'
    );
};
const snapshot = async (deployment: Deployment): Promise<string> => {
    const directory = valuesDirectory(deployment.id);
    const hashes: Record<string, string> = {};
    for (const name of (await readdir(directory)).sort()) {
        const value = await readFile(join(directory, name), 'utf8');
        secrets.add(value);
        hashes[name] = createHash('sha256').update(value).digest('hex').slice(0, 8);
    }
    const containers = await docker([
        'ps',
        '-a',
        '--filter',
        `label=org.learncard.workload.deployment=${deployment.id}`,
        '--format',
        statusMode ? '{{.Names}}' : '{{.Names}} {{.ID}}',
    ]);
    return JSON.stringify({
        deploymentId: deployment.id,
        containers: containers.split('\n').sort(),
        secretHashes: hashes,
    });
};
const poll = async (
    ecosystemId: string,
    intentId: string,
    checkedAfter = 0
): Promise<Deployment> => {
    const deadline = Date.now() + 12 * 60_000;
    while (Date.now() < deadline) {
        const intent = InstallIntentRecordValidator.parse(
            await rpc('installIntents.getInstallIntent', { intentId })
        );
        const targets = z
            .array(z.unknown())
            .parse(await rpc('installTargets.list', { ecosystemId }));
        const deployments = targets.map(target => WorkloadDeploymentValidator.safeParse(target));
        const deployment = deployments
            .flatMap(result => (result.success ? [result.data] : []))
            .find(target => target.intentId === intentId && target.packageId === packageId);
        log(
            `intent=${intentId} phase=${intent.status?.phase} workload=${deployment?.status ?? 'PENDING'} deployment=${deployment?.id ?? '-'} failureCode=${deployment?.failureCode ?? '-'}`
        );
        if (deployment?.status === 'FAILED') {
            const names = await docker([
                'ps',
                '-a',
                '--filter',
                `label=org.learncard.workload.deployment=${deployment.id}`,
                '--format',
                '{{.Names}}',
            ]);
            for (const name of names.split('\n').filter(Boolean))
                log(`${name}\n${redact(await docker(['logs', '--tail', '40', name]))}`);
            throw new Error(`Workload FAILED: ${deployment.failureCode ?? 'unknown'}`);
        }
        if (deployment?.status === 'READY' && Date.parse(deployment.checkedAt ?? '') > checkedAfter)
            return deployment;
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error('Workload did not reach READY within 12 minutes');
};
const waitForRetirement = async (ecosystemId: string, intentId: string): Promise<void> => {
    const deadline = Date.now() + 5 * 60_000;
    while (Date.now() < deadline) {
        const targets = z
            .array(z.unknown())
            .parse(await rpc('installTargets.list', { ecosystemId }));
        const deployment = targets
            .map(target => WorkloadDeploymentValidator.safeParse(target))
            .flatMap(result => (result.success ? [result.data] : []))
            .find(target => target.intentId === intentId);
        log(`RESET workload=${deployment?.status ?? 'absent'}`);
        if (!deployment || deployment.status === 'RETIRED') return;
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error('Failed workload did not retire within 5 minutes');
};
const smoke = async (deployment: Deployment): Promise<string> => {
    const endpoints = endpointsSchema.parse(JSON.parse(deployment.endpointsObserved ?? '[]'));
    log(`endpoints=${JSON.stringify(endpoints)}`);
    const issuer = endpoints.find(endpoint => endpoint.id === 'issuer' && endpoint.healthy);
    if (!issuer) throw new Error('No healthy issuer endpoint');
    const url = new URL(`${issuer.url.replace(/\/$/, '')}/edu/credentials/issue`);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password)
        throw new Error('Refusing to send tenant credential outside local loopback');
    const token = await readFile(join(valuesDirectory(deployment.id), 'tenant-token-edu'), 'utf8');
    secrets.add(token);
    const response = await fetch(url, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        // DCC issuer-coordinator reads the unsigned credential as the whole body, not a VC-API
        // { credential } envelope (issuer-coordinator src/app.js: `const unSignedVC = req.body`).
        body: JSON.stringify({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            id: `urn:uuid:${randomUUID()}`,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'Local DCC acceptance proof',
            issuer: {
                id: 'urn:uuid:00000000-0000-4000-8000-000000000000',
                type: ['Profile'],
                name: 'Local DCC acceptance issuer',
            },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:example:dcc-proof',
                    type: ['Achievement'],
                    name: 'Local proof',
                    description: 'Synthetic local acceptance only',
                    criteria: { narrative: 'Run the local proof' },
                },
            },
        }),
    });
    if (!response.ok) throw new Error(`Issuance HTTP ${response.status} (response withheld)`);
    const credential = z
        .object({
            issuer: z.union([z.string(), z.object({ id: z.string() })]),
            credentialStatus: z.unknown().optional(),
            proof: z.union([
                z.object({ type: z.string() }),
                z.array(z.object({ type: z.string() })).nonempty(),
            ]),
        })
        .parse(await response.json());
    const did = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    if (!did.startsWith('did:key:')) throw new Error('Issuer is not did:key');
    const proof = Array.isArray(credential.proof) ? credential.proof[0] : credential.proof;
    log(`SMOKE issuer=${did} proofType=${proof.type}`);
    if (
        statusMode &&
        (!credential.credentialStatus ||
            typeof credential.credentialStatus !== 'object' ||
            Object.keys(credential.credentialStatus).length === 0)
    )
        throw new Error('Signed credential has no non-empty credentialStatus');
    if (statusMode) log('STATUS credentialStatus present');
    return did;
};
const statusState = async (
    deployment: Deployment
): Promise<{ attempt: string; volumes: string }> => {
    const names = await docker([
        'ps',
        '-a',
        '--filter',
        `label=org.learncard.workload.deployment=${deployment.id}`,
        '--format',
        '{{.Names}}',
    ]);
    const containers = z
        .array(
            z.object({
                State: z.object({ Status: z.string(), ExitCode: z.number() }),
                Config: z.object({ Labels: z.record(z.string(), z.string()) }),
                Mounts: z.array(z.object({ Type: z.string(), Name: z.string().optional() })),
            })
        )
        .parse(JSON.parse(await docker(['inspect', ...names.split('\n').filter(Boolean)])));
    const init = containers.find(
        (container): boolean =>
            container.Config.Labels['org.learncard.workload.component'] === 'mongo-init'
    );
    if (!init || init.State.Status !== 'exited' || init.State.ExitCode !== 0)
        throw new Error('Current init has not succeeded');
    const attempt = init.Config.Labels['org.learncard.workload.attempt'];
    if (!attempt) throw new Error('Init attempt label missing');
    const mongo = containers.find(
        (container): boolean =>
            container.Config.Labels['org.learncard.workload.component'] === 'mongo'
    );
    const volumes = mongo?.Mounts.flatMap((mount): string[] =>
        mount.Type === 'volume' && mount.Name ? [mount.Name] : []
    ).sort();
    if (!volumes || volumes.length !== 2) throw new Error('Mongo volumes missing');
    return {
        attempt,
        volumes: await docker([
            'volume',
            'inspect',
            '--format',
            '{{.Name}} {{.CreatedAt}}',
            ...volumes,
        ]),
    };
};

/** v0.4.0 returns a VPR link separately from the direct (VPR-bypassing) link. */
const requestUrlFromLink = (link: string): URL => {
    const parsed = new URL(link);
    const direct = parsed.searchParams.get('vc_request_url');
    if (direct) return new URL(direct);
    const request = parsed.searchParams.get('request');
    if (!request) throw new Error('Wallet link has no credential request');
    const nested = z.object({ vc_request_url: z.string() }).parse(JSON.parse(request));
    return new URL(nested.vc_request_url);
};

const exchangeProof = async (deployment: Deployment, issuerDid: string): Promise<boolean> => {
    for (const component of ['transaction-service', 'workflow-coordinator', 'status-gateway']) {
        const name = await docker([
            'ps',
            '--filter',
            `label=org.learncard.workload.deployment=${deployment.id}`,
            '--filter',
            `label=org.learncard.workload.component=${component}`,
            '--format',
            '{{.Names}}',
        ]);
        if (!name || name.includes('\n'))
            throw new Error('Expected exactly one running exchange component');
        const hardening = await docker([
            'inspect',
            '--format',
            '{{.Config.User}} {{.HostConfig.ReadonlyRootfs}} {{json .HostConfig.CapDrop}}',
            name,
        ]);
        if (hardening !== '1000:1000 true ["ALL"]')
            throw new Error('Exchange component hardening mismatch');
        log(`HARDENING ${component} user=1000:1000 read_only=true cap_drop=ALL running`);
    }
    const endpoint = endpointsSchema
        .parse(JSON.parse(deployment.endpointsObserved ?? '[]'))
        .find((entry): boolean => entry.id === 'exchange' && entry.healthy);
    if (!endpoint) throw new Error('No healthy exchange endpoint');
    const published = new URL(endpoint.url);
    if (
        published.protocol !== 'http:' ||
        published.hostname !== '127.0.0.1' ||
        published.username ||
        published.password
    )
        throw new Error('Refusing exchange authentication outside local loopback');
    const post = async (url: URL, body: unknown, token?: string): Promise<Response> => {
        if (url.origin !== published.origin || url.username || url.password)
            throw new Error('Exchange request escaped published origin');
        return fetch(url, {
            method: 'POST',
            redirect: 'error',
            signal: AbortSignal.timeout(30000),
            headers: {
                'content-type': 'application/json',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });
    };
    const token = await readFile(join(valuesDirectory(deployment.id), 'tenant-token-edu'), 'utf8');
    secrets.add(token);
    const retrievalId = randomUUID();
    secrets.add(retrievalId);
    const setup = await post(
        new URL('/exchange/setup', published),
        {
            tenantName: 'edu',
            data: [
                {
                    retrievalId,
                    // The public setup route forwards data items intact; deletion is opt-in upstream.
                    deleteWhenCollected: true,
                    vc: {
                        '@context': [
                            'https://www.w3.org/2018/credentials/v1',
                            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        ],
                        id: `urn:uuid:${randomUUID()}`,
                        type: ['VerifiableCredential', 'OpenBadgeCredential'],
                        name: 'Local DCC exchange proof',
                        issuer: {
                            id: issuerDid,
                            type: ['Profile'],
                            name: 'Local DCC acceptance issuer',
                        },
                        issuanceDate: new Date().toISOString(),
                        credentialSubject: {
                            type: ['AchievementSubject'],
                            achievement: {
                                id: 'urn:example:dcc-exchange-proof',
                                type: ['Achievement'],
                                name: 'Local exchange proof',
                                description: 'Synthetic local acceptance only',
                                criteria: { narrative: 'Claim through DIDAuth' },
                            },
                        },
                    },
                },
            ],
        },
        token
    );
    if (!setup.ok) throw new Error(`Exchange setup HTTP ${setup.status} (response withheld)`);
    const links = z
        .array(
            z.object({
                retrievalId: z.string(),
                vprDeepLink: z.string(),
                directDeepLink: z.string(),
                chapiVPR: z.unknown(),
            })
        )
        .parse(await setup.json());
    const link = links.find((entry): boolean => entry.retrievalId === retrievalId);
    if (!link) throw new Error('Setup did not return the requested record');
    secrets.add(link.vprDeepLink);
    secrets.add(link.directDeepLink);
    log('EXCHANGE setup passed (deleteWhenCollected=true)');
    const requestUrl = requestUrlFromLink(link.vprDeepLink);
    secrets.add(requestUrl.href);
    if (requestUrl.origin !== published.origin)
        throw new Error('Wallet request does not use published origin');
    log('EXCHANGE vc_request_url uses published origin');
    const initial = await post(requestUrl, {});
    if (!initial.ok) throw new Error(`Exchange initiation HTTP ${initial.status}`);
    const { verifiablePresentationRequest: vpr } = z
        .object({
            verifiablePresentationRequest: z.object({
                query: z.array(z.object({ type: z.string() })),
                challenge: z.string().min(1),
                domain: z.string(),
                interact: z.object({
                    service: z.array(
                        z.object({ type: z.string(), serviceEndpoint: z.string().optional() })
                    ),
                }),
            }),
        })
        .parse(await initial.json());
    secrets.add(vpr.challenge);
    if (
        !vpr.query.some((query): boolean => query.type === 'DIDAuthentication') ||
        vpr.domain !== published.origin
    )
        throw new Error('Unexpected DIDAuth query or domain');
    const service = vpr.interact.service.find(
        (entry): boolean => entry.type === 'UnmediatedPresentationService2021'
    );
    if (!service?.serviceEndpoint) throw new Error('Missing DIDAuth continuation endpoint');
    const continuation = new URL(service.serviceEndpoint);
    secrets.add(continuation.href);
    if (continuation.origin !== published.origin)
        throw new Error('Continuation does not use published origin');
    log('EXCHANGE DIDAuthentication request received');
    // Standalone wallet: do not import Brain's database environment validator.
    const { initLearnCard } = await import('@learncard/init');
    const didkit = await readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
    );
    const wallet = await initLearnCard({ seed: 'c'.repeat(64), didkit });
    const vp = await wallet.invoke.getDidAuthVp({
        challenge: vpr.challenge,
        domain: vpr.domain,
        proofPurpose: 'authentication',
    });
    if (typeof vp === 'string') throw new Error('Expected JSON-LD DIDAuth VP');
    log('WALLET LearnCard DIDAuth VP signed (authentication)');
    // Pinned coordinator expects the raw VP and returns the signed VC directly.
    const claimed = await post(continuation, vp);
    if (!claimed.ok) throw new Error(`Exchange claim HTTP ${claimed.status} (response withheld)`);
    const vc = VCValidator.parse(await claimed.json());
    const subject = z.object({ id: z.string() }).parse(vc.credentialSubject);
    const receivedIssuer = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id;
    if (
        !vc.proof ||
        (Array.isArray(vc.proof) && vc.proof.length === 0) ||
        subject.id !== wallet.id.did() ||
        receivedIssuer !== issuerDid
    )
        throw new Error('Received credential proof, subject or issuer mismatch');
    if (
        !vc.credentialStatus ||
        typeof vc.credentialStatus !== 'object' ||
        Object.keys(vc.credentialStatus).length === 0
    )
        throw new Error('Exchange credential missing status');
    log('EXCHANGE signed credential received; holder, issuer and credentialStatus matched');
    const statusEndpoint = endpointsSchema
        .parse(JSON.parse(deployment.endpointsObserved ?? '[]'))
        .find((entry): boolean => entry.id === 'status-public' && entry.healthy);
    if (!statusEndpoint) throw new Error('Missing healthy public status gateway');
    const statusOrigin = new URL(statusEndpoint.url);
    if (
        statusOrigin.protocol !== 'http:' ||
        statusOrigin.hostname !== '127.0.0.1' ||
        statusOrigin.username ||
        statusOrigin.password
    )
        throw new Error('Status gateway is not local loopback');
    const statuses = z
        .array(z.object({ statusListCredential: z.string().url() }))
        .nonempty()
        .parse(Array.isArray(vc.credentialStatus) ? vc.credentialStatus : [vc.credentialStatus]);
    for (const status of statuses) {
        const list = new URL(status.statusListCredential);
        if (
            list.origin !== statusOrigin.origin ||
            !/^\/[A-Za-z0-9_-]{1,128}$/.test(list.pathname) ||
            list.search ||
            list.hash ||
            list.username ||
            list.password
        )
            throw new Error('Credential status list does not use the published gateway');
    }
    log('STATUS statusListCredential uses published status-public origin');
    for (const [method, path, expected] of [
        ['POST', '/credentials/status/allocate', 405],
        ['POST', '/credentials/status', 405],
        ['GET', '/credentials/x', 404],
        ['GET', '/credentials', 404],
    ] as const) {
        const rejected = await fetch(new URL(path, statusOrigin), {
            method,
            redirect: 'error',
            signal: AbortSignal.timeout(10000),
        });
        await rejected.arrayBuffer();
        if (rejected.status !== expected)
            throw new Error('Status gateway allowed a forbidden route');
        log(`GATEWAY ${method} ${path} rejected HTTP ${expected}`);
    }
    const checks = z
        .array(VerificationItemValidator)
        .parse(await wallet.invoke.verifyCredential(vc, {}, true));
    for (const check of checks)
        log(`VERIFY ${check.status} ${check.check}: ${check.message ?? check.details ?? ''}`);
    const nonSuccess = checks.filter((check): boolean => check.status !== 'Success');
    const knownSizeError = /^Status list bitstring is too small: 100000\. Minimum entries: 131072$/;
    const labelledStatus =
        nonSuccess.length > 0 &&
        nonSuccess.every(
            (check): boolean =>
                check.status === 'Failed' &&
                knownSizeError.test(check.check) &&
                (check.message === undefined || knownSizeError.test(check.message)) &&
                (check.details === undefined || knownSizeError.test(check.details))
        );
    if (
        !checks.some((check): boolean => check.check === 'proof' && check.status === 'Success') ||
        (!labelledStatus &&
            (nonSuccess.length > 0 ||
                !checks.some(
                    (check): boolean => check.check === 'status' && check.status === 'Success'
                )))
    )
        throw new Error(
            'Credential verification must pass proof and status without errors or warnings'
        );
    if (labelledStatus) {
        log(
            'STATUS NON-CONFORMANT list size 100000 < 131072 (upstream credential-status-manager-db; labelled, not accepted)'
        );
    } else log('VERIFY proof and status passed; no errors or warnings');
    const registryResponse = await fetch(
        'https://digitalcredentials.github.io/sandbox-registry/registry.json',
        { redirect: 'error', signal: AbortSignal.timeout(30000) }
    );
    if (!registryResponse.ok) throw new Error(`Registry HTTP ${registryResponse.status}`);
    const registry = z
        .object({ registry: z.record(z.string(), z.unknown()) })
        .parse(await registryResponse.json());
    const listed = Object.hasOwn(registry.registry, issuerDid);
    log(`REGISTRY issuer listed=${listed}`);
    if (!listed)
        log(
            'REGISTRY issuer not listed (expected for local dev did:key; production trust gate OPEN)'
        );
    const second = await post(continuation, vp);
    log(`SINGLE_USE second claim HTTP ${second.status} (response withheld)`);
    const gone = z.object({
        serviceResponseStatus: z.literal(404),
        serviceResponseError: z.object({
            code: z.literal(404),
            message: z.literal('Unknown exchangeId.'),
        }),
    });
    if (second.ok || !gone.safeParse(await second.json()).success)
        throw new Error('Second claim was not rejected as an unknown exchange');
    // Coordinator may translate the transaction service 404 into 500. Confirm the
    // record itself is gone, rather than interpreting an arbitrary 500 as single-use.
    const replay = await post(requestUrl, {});
    const replayError = gone.safeParse(await replay.json());
    if (replay.ok || !replayError.success)
        throw new Error('Exchange record rejection was not confirmed');
    log(`SINGLE_USE initiation after claim HTTP ${replay.status}; exchange rejected`);
    log('CONSENT not gated (wallet-claim-choice deferred)');
    return labelledStatus;
};
const main = async (): Promise<void> => {
    await login();
    const session = z
        .object({ activeEcosystemId: z.string().optional() })
        .parse(await rpc('session.get', undefined));
    const ecosystemId = process.env.DCC_ECOSYSTEM_ID ?? session.activeEcosystemId;
    if (!ecosystemId) throw new Error('Set DCC_ECOSYSTEM_ID');
    const listings = z
        .object({
            records: z.array(
                z.object({
                    listing_id: z.string(),
                    slug: z.string().optional(),
                    display_name: z.string(),
                })
            ),
        })
        .parse(await rpc('catalog.listings', { limit: 100 }));
    const bundle = listings.records.find(
        listing => listing.slug === 'dcc-tools' || listing.display_name === 'DCC Tools'
    );
    if (!bundle) throw new Error('DCC Tools listing not found');
    const listingId = bundle.listing_id;
    const detail = z
        .object({ versions: z.array(z.object({ version: z.string(), version_id: z.string() })) })
        .parse(await rpc('catalog.get', { listingId }));
    const versionId = detail.versions.find(
        version =>
            version.version ===
            (process.env.DCC_BUNDLE_VERSION ??
                (exchangeMode ? '1.4.2' : statusMode ? '1.3.1' : '1.2.0'))
    )?.version_id;
    if (!versionId) throw new Error('Requested bundle version not published');
    const existing = z
        .array(InstallIntentRecordValidator)
        .parse(await rpc('installIntents.listInstallIntents', { ecosystemId }));
    const bundleVersion = (id: string | undefined): string =>
        detail.versions.find((version): boolean => version.version_id === id)?.version ?? 'unknown';
    if (process.argv.includes('--inspect') || process.argv.includes('--retire-stale-dcc')) {
        const targets = z
            .array(z.unknown())
            .parse(await rpc('installTargets.list', { ecosystemId }));
        const deployments = targets.flatMap((target): Deployment[] => {
            const parsed = WorkloadDeploymentValidator.safeParse(target);
            return parsed.success ? [parsed.data] : [];
        });
        for (const candidate of existing.filter(
            (entry): boolean => entry.proposal.source.listingId === listingId
        )) {
            const workload = candidate.plan.targets?.find((target): boolean =>
                Boolean(target.workload)
            )?.workload;
            const deployment = deployments.find(
                (entry): boolean => entry.intentId === candidate.intentId
            );
            const tag = createHash('sha256').update(candidate.intentId).digest('hex').slice(0, 12);
            log(
                `INSPECT intentTag=${tag} bundle=${bundleVersion(candidate.proposal.source.versionId)} selected=${candidate.proposal.source.versionId === versionId} package=${workload?.packageId}@${workload?.version} components=${workload?.components.length ?? 0} phase=${candidate.status?.phase} workload=${deployment?.status ?? 'absent'} failure=${deployment?.failureCode ?? '-'}`
            );
        }
        if (process.argv.includes('--inspect')) return;
    }
    if (process.argv.includes('--retire-stale-dcc')) {
        if (!exchangeMode) throw new Error('Stale DCC retirement requires --exchange');
        const staleVersions = new Set(['1.2.0', '1.3.0', '1.3.1', '1.4.0', '1.4.1']);
        for (const previous of existing.filter(
            (candidate): boolean =>
                candidate.proposal.source.listingId === listingId &&
                candidate.proposal.source.versionId !== versionId &&
                staleVersions.has(bundleVersion(candidate.proposal.source.versionId)) &&
                candidate.status?.phase !== 'REMOVED'
        )) {
            if (previous.status?.phase !== 'REMOVING')
                await rpc(
                    'installIntents.revokeInstallIntent',
                    {
                        intentId: previous.intentId,
                        expectedStatusRevision: previous.statusRevision,
                        phase: 'REMOVING',
                    },
                    true
                );
            await waitForRetirement(ecosystemId, previous.intentId);
            log(
                `RETIRED stale DCC bundle=${bundleVersion(previous.proposal.source.versionId)} intentTag=${createHash('sha256').update(previous.intentId).digest('hex').slice(0, 12)}`
            );
        }
        // Cleanup is an explicit operator action, not an implicit install or proof retry.
        return;
    }
    const members = z
        .array(z.object({ listingId: z.string().optional() }))
        .parse(await rpc('catalog.getBundleMembers', { listingId }));
    for (const id of new Set([
        listingId,
        ...members.flatMap(member => (member.listingId ? [member.listingId] : [])),
    ])) {
        await rpc('catalog.enablement.enable', { ecosystemId, listingId: id }, true);
        log(`ENABLED listing=${id}`);
    }
    if (process.argv.includes('--retire-previous-exchange')) {
        if (!exchangeMode) throw new Error('Previous exchange retirement requires --exchange');
        const previousVersionId = detail.versions.find(
            (version): boolean => version.version === '1.4.0'
        )?.version_id;
        if (versionId === previousVersionId)
            throw new Error('Cannot retire the selected bundle version');
        for (const previous of existing.filter(
            (candidate): boolean =>
                candidate.proposal.source.listingId === listingId &&
                candidate.proposal.source.versionId === previousVersionId &&
                candidate.status?.phase !== 'REMOVED' &&
                Boolean(
                    candidate.plan.targets?.some(
                        (target): boolean =>
                            target.workload?.packageId === packageId &&
                            target.workload.version === '1.0.0'
                    )
                )
        )) {
            if (previous.status?.phase !== 'REMOVING')
                await rpc(
                    'installIntents.revokeInstallIntent',
                    {
                        intentId: previous.intentId,
                        expectedStatusRevision: previous.statusRevision,
                        phase: 'REMOVING',
                    },
                    true
                );
            await waitForRetirement(ecosystemId, previous.intentId);
            log('RETIRED previous exchange 1.0.0 through operator revoke path');
        }
    }
    let intent = existing.find(
        candidate =>
            candidate.proposal.source.listingId === listingId &&
            candidate.proposal.source.versionId === versionId &&
            candidate.status?.phase !== 'REMOVED'
    );
    if (intent && process.argv.includes('--reset')) {
        await rpc(
            'installIntents.revokeInstallIntent',
            {
                intentId: intent.intentId,
                expectedStatusRevision: intent.statusRevision,
                phase: 'REMOVING',
            },
            true
        );
        log(`RESET revoked intent=${intent.intentId}; waiting for workload retirement`);
        await waitForRetirement(ecosystemId, intent.intentId);
        intent = undefined;
    }
    if (!intent)
        intent = InstallIntentRecordValidator.parse(
            await rpc(
                'installIntents.planInstallIntent',
                {
                    ecosystemId,
                    listingId,
                    versionId,
                    requestedConfig: {},
                    proposedBindings: [],
                },
                true
            )
        );
    // The signed v1.2.0 member selects core; do not invent an unsigned profile override.
    const workload = intent.plan.targets?.find(
        target => target.workload?.packageId === packageId
    )?.workload;
    if (!workload || workload.profiles.join(',') !== 'core')
        throw new Error('Expected core workload missing from review');
    log(
        `SELECTED bundle=${bundleVersion(versionId)} package=${workload.packageId}@${workload.version} components=${workload.components.length}`
    );
    log(
        `REVIEW ${workload.packageId}@${workload.version} profiles=${workload.profiles.join(',')} components=${workload.components.map(component => `${component.id}@${component.image.split('sha256:')[1]?.slice(0, 12)}`).join(',')} endpoints=${JSON.stringify(workload.endpoints)}`
    );
    if (intent.approval.state === 'PENDING_ADOPTION') {
        intent = InstallIntentRecordValidator.parse(
            await rpc(
                'installIntents.approveInstallIntent',
                {
                    intentId: intent.intentId,
                    planHash: intent.plan.planHash,
                    planRevision: intent.plan.planRevision,
                    consentTiers: intent.plan.consentTiers,
                },
                true
            )
        );
        log(`APPROVED intent=${intent.intentId}`);
        await rpc(
            'installIntents.applyInstallIntent',
            { intentId: intent.intentId, expectedStatusRevision: intent.statusRevision },
            true
        );
        log(`APPLIED intent=${intent.intentId}`);
    } else log(`REUSE intent=${intent.intentId} approval=${intent.approval.state}`);
    let deployment = await poll(ecosystemId, intent.intentId);
    const before = await snapshot(deployment);
    log(`SNAPSHOT ${before}`);
    const issuerBefore = await smoke(deployment);
    const statusBefore = statusMode ? await statusState(deployment) : undefined;
    if (process.argv.includes('--restart') || statusMode) {
        const restartedAt = Date.now();
        await docker(['restart', 'lcn-brain-service']);
        await new Promise<void>((resolve): void => {
            setTimeout(resolve, 10000);
        });
        await docker(['restart', 'lcn-workload-agent']);
        await new Promise(resolve => setTimeout(resolve, 30_000));
        deployment = await poll(ecosystemId, intent.intentId, restartedAt);
        const after = await snapshot(deployment);
        log(`AFTER_RESTART ${after}`);
        if (before !== after)
            throw new Error('Restart changed deployment, containers or secret hashes');
        log('IDEMPOTENCY restart unchanged');
        if (statusBefore) {
            const afterState = await statusState(deployment);
            if (afterState.attempt === statusBefore.attempt)
                throw new Error('Init did not rerun after restart');
            if (afterState.volumes !== statusBefore.volumes)
                throw new Error('Mongo volumes changed');
            log(
                `RECOVERY init succeeded with new attempt=${afterState.attempt}; Mongo volumes preserved`
            );
        }
    }
    log(
        await docker([
            'ps',
            '--filter',
            `label=org.learncard.workload.deployment=${deployment.id}`,
            '--format',
            '{{.Names}} {{.Status}} {{.Ports}}',
        ])
    );
    if ((await smoke(deployment)) !== issuerBefore) throw new Error('Issuer DID changed');
    if (exchangeMode) {
        const labelledStatus = await exchangeProof(deployment, issuerBefore);
        log(
            labelledStatus
                ? 'PROOF COMPLETE WITH LABELS (local exchange; revocation present but non-conformant list size; NOT consent-gated; production gates remain OPEN)'
                : 'PROOF READY (local exchange; NOT consent-gated; production gates remain OPEN)'
        );
        return;
    }
    log(
        `PROOF READY (local ${statusMode ? 'status-enabled' : 'signing core'} only; production gates remain OPEN)`
    );
};
main().catch((error: unknown): void => {
    log(`BLOCKED ${redact(error instanceof Error ? error.message : 'Unknown error')}`);
    process.exitCode = 1;
});
