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
import { InstallIntentRecordValidator } from '../src/types/install-intent';
import { WorkloadDeploymentValidator } from '../src/types/install-target';

const origin = 'http://localhost:5173';
const statusMode = process.argv.includes('--status');
const packageId = statusMode ? 'org.dcc.issuer-status' : 'org.dcc.issuer-core';
const run = promisify(execFile);
const secrets = new Set<string>();
let cookie = '';
const redact = (text: string): string => {
    for (const value of secrets) text = text.split(value).join('[REDACTED]');
    return text
        .replace(
            /^.*(?:token|seed|authorization|password|private.?key).*$/gim,
            '[REDACTED sensitive line]'
        )
        .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[REDACTED opaque value]');
};
const log = (message: string): void => console.log(`${new Date().toISOString()} ${message}`);
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
            version.version === (process.env.DCC_BUNDLE_VERSION ?? (statusMode ? '1.3.1' : '1.2.0'))
    )?.version_id;
    if (!versionId) throw new Error('Requested bundle version not published');
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
    const existing = z
        .array(InstallIntentRecordValidator)
        .parse(await rpc('installIntents.listInstallIntents', { ecosystemId }));
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
    log(
        `PROOF READY (local ${statusMode ? 'status-enabled' : 'signing core'} only; production gates remain OPEN)`
    );
};
main().catch((error: unknown): void => {
    log(`BLOCKED ${redact(error instanceof Error ? error.message : 'Unknown error')}`);
    process.exitCode = 1;
});
