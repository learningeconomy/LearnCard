#!/usr/bin/env bun
/**
 * EducationOS MVP walkthrough proof (WORKPLAN §1a), against the local dev stack. Prereqs:
 * the stack is up (brain with INTEGRATION_HEALTH_ALLOW_LOCALHOST_HTTP=true, console-bff,
 * console on :5173, api on :5100) and `seed:demo-lms` has run.
 *
 *   bun run prove:demo-lms -- --learner <profileId>
 *
 * Console (BFF) steps, as the dev operator: plan → approve → apply the Demo LMS in the
 * district; propose → preflight → approve the record-provisioning Binding.
 * DIRECT steps (no console route yet, labelled in the log): issue the service-account
 * credential and write examples/demo-lms/.env.local (mode 0600, gitignored).
 * Then start the demo LMS (`bun start` in examples/demo-lms) and mark a course complete;
 * `--submit` does that from here and reports the release and issuance outcome.
 */
import { chmod, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { RecordProvisioningBindingMetadata } from '@learncard/types';
import { InstallIntentRecordValidator } from '../src/types/install-intent';

const origin = process.env.CONSOLE_ORIGIN ?? 'http://localhost:5173';
const brainOrigin = process.env.BRAIN_ORIGIN ?? 'http://localhost:4000';
const demoLmsOrigin = process.env.DEMO_LMS_ORIGIN ?? 'http://localhost:4321';
const secrets = new Set<string>();
let cookie = '';

const redact = (text: string): string => {
    for (const value of secrets) text = text.split(value).join('[REDACTED]');
    return text;
};
const log = (message: string): void =>
    console.log(`${new Date().toISOString()} ${redact(message)}`);
const arg = (name: string): string | undefined => {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : undefined;
};

const request = async (path: string, body?: unknown): Promise<Response> => {
    const response = await fetch(`${origin}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'learncard', cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
    });
    if (!response.ok) {
        throw new Error(
            `${path.split('?')[0]} HTTP ${response.status}: ${redact(await response.text())}`
        );
    }
    return response;
};
const rpc = async (path: string, input: unknown, mutation = false): Promise<unknown> => {
    const query =
        mutation || input === undefined
            ? ''
            : `?input=${encodeURIComponent(JSON.stringify(input))}`;
    const response = await request(`/trpc/${path}${query}`, mutation ? input : undefined);
    return z.object({ result: z.object({ data: z.unknown() }) }).parse(await response.json()).result
        .data;
};
// Same dev console login as prove:dcc-workload.
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

const brainRpc = async (path: string, input: unknown): Promise<unknown> => {
    const response = await fetch(`${brainOrigin}/trpc/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
    });
    const body = z
        .object({
            result: z.object({ data: z.unknown() }).optional(),
            error: z.unknown().optional(),
        })
        .parse(await response.json());
    if (!body.result) throw new Error(`${path} failed: ${redact(JSON.stringify(body.error))}`);
    return body.result.data;
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const main = async (): Promise<void> => {
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    // SEED must equal brain's (compose-local `a`); the package script sets it explicitly.
    const learnerId = arg('learner');
    if (!learnerId) throw new Error('Pass --learner <profileId>.');

    const { neogma } = await import('@instance');
    const { getChildEcosystems } = await import('@accesslayer/ecosystem/read');
    const { readServiceAccount, issueServiceAccountCredential } =
        await import('@accesslayer/service-account/auth');

    const district = (await getChildEcosystems('eco_dev_root')).find(
        e => e.slug === 'demo-district'
    );
    if (!district) throw new Error('Run seed:demo-lms first.');
    const issuer = await neogma.queryRunner.run(
        `MATCH (g:Group {slug: 'demo-district-issuer', ownerEcosystemId: $ecosystemId})
         RETURN g.id AS groupId, g.identityProfileId AS profileId`,
        { ecosystemId: district.id }
    );
    const issuerGroupId = String(issuer.records[0]?.get('groupId'));
    const issuerIdentityProfileId = String(issuer.records[0]?.get('profileId'));

    await login();
    log('CONSOLE login as dev operator');

    const listings = z
        .object({
            records: z.array(z.object({ listing_id: z.string(), slug: z.string().optional() })),
        })
        .parse(await rpc('catalog.listings', { limit: 100 }));
    const listingId = listings.records.find(listing => listing.slug === 'demo-lms')?.listing_id;
    if (!listingId) throw new Error('Demo LMS listing is not visible to the operator.');
    const detail = z
        .object({ versions: z.array(z.object({ version: z.string(), version_id: z.string() })) })
        .parse(await rpc('catalog.get', { listingId }));
    const versionId = detail.versions[0]?.version_id;
    if (!versionId) throw new Error('Demo LMS has no published version.');
    // Visibility in the district itself proves the inherited state enablement (ADR-010).
    const districtCatalog = z
        .object({ records: z.array(z.object({ listing_id: z.string() }).passthrough()) })
        .parse(await rpc('catalog.listingsForEcosystem', { ecosystemId: district.id, limit: 100 }));
    if (!districtCatalog.records.some(listing => listing.listing_id === listingId)) {
        throw new Error('Demo LMS is not available in the district catalog.');
    }
    log(`CATALOG Demo LMS available in district ${district.id} (inherited state enablement)`);

    const existing = z
        .array(InstallIntentRecordValidator)
        .parse(await rpc('installIntents.listInstallIntents', { ecosystemId: district.id }))
        .find(
            intent =>
                intent.proposal.source.listingId === listingId && intent.status?.phase !== 'REMOVED'
        );
    let intent =
        existing ??
        InstallIntentRecordValidator.parse(
            await rpc(
                'installIntents.planInstallIntent',
                {
                    ecosystemId: district.id,
                    listingId,
                    versionId,
                    requestedConfig: {},
                    proposedBindings: [],
                },
                true
            )
        );
    log(
        `PLAN intent=${intent.intentId} scopes=${intent.plan.scopesRequested.join(',')} tiers=${intent.plan.consentTiers.join(',')}`
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
        log('APPROVED install');
        await rpc(
            'installIntents.applyInstallIntent',
            { intentId: intent.intentId, expectedStatusRevision: intent.statusRevision },
            true
        );
        log('APPLIED install');
    }

    let installId: string | undefined;
    for (let attempt = 0; attempt < 30 && !installId; attempt++) {
        const targets = z
            .array(
                z
                    .object({
                        id: z.string(),
                        targetType: z.string(),
                        intentId: z.string().optional(),
                    })
                    .passthrough()
            )
            .parse(await rpc('installTargets.list', { ecosystemId: district.id }));
        installId = targets.find(
            target =>
                target.targetType === 'INTEGRATION_INSTALL' && target.intentId === intent.intentId
        )?.id;
        if (!installId) await sleep(2000);
    }
    if (!installId) throw new Error('Integration install target did not materialize.');
    log(`INSTALL target=${installId}`);

    const accountRow = await neogma.queryRunner.run(
        'MATCH (sa:ServiceAccount {installId: $installId}) RETURN sa.id AS id',
        { installId }
    );
    const account = await readServiceAccount(String(accountRow.records[0]?.get('id')));
    if (!account) throw new Error('Service account was not provisioned.');
    // Reissuing advances the credential generation, so --submit keeps the running LMS's secret.
    const submit = process.argv.includes('--submit');
    if (!submit) {
        const district0 = await neogma.queryRunner.run(
            'MATCH (e:Ecosystem {id: $id}) RETURN e.ownerProfileId AS owner',
            { id: district.id }
        );
        const issued = await issueServiceAccountCredential(
            account.id,
            String(district0.records[0]?.get('owner'))
        );
        secrets.add(issued.secret);
        log('DIRECT service-account credential issued (no console route yet)');
        await brainRpc('installIntent.exchangeServiceAccountToken', {
            serviceAccountId: account.id,
            secret: issued.secret,
        });
        log('VERIFIED token exchange against running brain (SEED matches)');

        const jwk = z
            .object({ kty: z.string(), crv: z.string(), x: z.string() })
            .parse(await brainRpc('installIntent.integrationSigningKey', {}));
        const envPath = join(
            dirname(fileURLToPath(import.meta.url)),
            '../../../../examples/demo-lms/.env.local'
        );
        await writeFile(
            envPath,
            [
                `BRAIN_URL=${brainOrigin}`,
                `DEMO_LMS_HEALTH_URL=${demoLmsOrigin}/health`,
                `SERVICE_ACCOUNT_ID=${account.id}`,
                `SERVICE_ACCOUNT_SECRET=${issued.secret}`,
                `INSTALL_ID=${installId}`,
                `ECOSYSTEM_ID=${district.id}`,
                `PLATFORM_JWK=${JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x })}`,
                '',
            ].join('\n'),
            { mode: 0o600 }
        );
        await chmod(envPath, 0o600);
        log('DIRECT wrote examples/demo-lms/.env.local (0600)');
    } else log('REUSE existing service-account credential (examples/demo-lms/.env.local)');

    const metadata: RecordProvisioningBindingMetadata = {
        capability: 'record-provisioning',
        mode: 'TRANSACTIONAL',
        recordClass: 'academic',
        legalBasis:
            'DEMO: FERPA school-official exception, declared by the district (not established).',
        identityBinding: 'roster-mapped',
        transactional: {
            triggerAuthority: 'system-event',
            purpose: 'Issue a course completion credential to the learner.',
            fields: ['completionId', 'courseId', 'courseTitle', 'completedAt'],
            idempotencyKeyField: 'completionId',
            timeoutMs: 5000,
            maxRetries: 2,
            retentionDays: 30,
        },
        issuance: {
            issuerGroupId,
            issuerIdentityProfileId,
            template: {
                kind: 'obv3-achievement',
                achievementType: 'Course',
                criteria: 'Completed every module of the course in the Demo LMS.',
                fieldMap: {
                    achievementId: 'courseId',
                    name: 'courseTitle',
                    completedAt: 'completedAt',
                },
            },
        },
    };
    const bindings = z
        .array(
            z.object({
                bindingId: z.string(),
                status: z.string(),
                capability: z.string(),
                provider: z.object({ resourceId: z.string() }),
            })
        )
        .parse(await rpc('bindings.list', { ecosystemId: district.id }));
    let active = bindings.find(
        binding =>
            binding.capability === 'record-provisioning' &&
            binding.provider.resourceId === installId &&
            binding.status === 'ACTIVE'
    );
    if (!active) {
        const proposed = z.object({ bindingId: z.string() }).parse(
            await rpc(
                'bindings.propose',
                {
                    ecosystemId: district.id,
                    capability: 'record-provisioning',
                    provider: {
                        resourceType: 'INTEGRATION_INSTALL',
                        resourceId: installId,
                        ecosystemId: district.id,
                    },
                    consumer: {
                        resourceType: 'ECOSYSTEM',
                        resourceId: district.id,
                        ecosystemId: district.id,
                    },
                    capabilityMetadata: metadata,
                },
                true
            )
        );
        const preflight = z
            .object({
                preflightId: z.string(),
                hash: z.string(),
                bindingRevision: z.number(),
                satisfied: z.boolean(),
                missing: z.array(z.object({ code: z.string(), message: z.string() })),
            })
            .parse(
                await rpc(
                    'bindings.prepareConsentPreflight',
                    { bindingId: proposed.bindingId },
                    true
                )
            );
        if (!preflight.satisfied) {
            throw new Error(`Binding preflight unsatisfied: ${JSON.stringify(preflight.missing)}`);
        }
        active = z
            .object({
                bindingId: z.string(),
                status: z.string(),
                capability: z.string(),
                provider: z.object({ resourceId: z.string() }),
            })
            .parse(
                await rpc(
                    'bindings.approve',
                    {
                        bindingId: proposed.bindingId,
                        expectedRevision: preflight.bindingRevision,
                        preflightId: preflight.preflightId,
                        preflightHash: preflight.hash,
                    },
                    true
                )
            );
    }
    log(`BINDING ${active.bindingId} ${active.status} (record-provisioning → Platform Issuance)`);

    if (!submit) {
        log('NEXT start examples/demo-lms (bun start), then re-run with --submit or use its page');
        await neogma.driver.close();
        return;
    }

    let enabled = false;
    // The reconciler's health sweep runs every 5 minutes by default; wait out one full pass.
    for (let attempt = 0; attempt < 84 && !enabled; attempt++) {
        enabled = (await readServiceAccount(account.id))?.status === 'ENABLED';
        if (!enabled) await sleep(5000);
    }
    log(
        `SERVICE ACCOUNT ${enabled ? 'ENABLED (health probe passed)' : 'NOT ENABLED (is demo-lms running?)'}`
    );
    if (!enabled) throw new Error('Service account did not pass its health probe.');

    const form = new FormData();
    form.set('learner', learnerId);
    form.set('course', 'course-101');
    const page = await (
        await fetch(`${demoLmsOrigin}/complete`, { method: 'POST', body: form })
    ).text();
    const outcome = page.match(/<p class="(ok|err)">([^<]*)<\/p>/);
    log(
        `DEMO LMS submit → ${outcome?.[1] === 'ok' ? 'RELEASED' : 'DENIED'}: ${outcome?.[2] ?? 'no result'}`
    );

    const record = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {subjectProfileId: $learnerId, bindingId: $bindingId})
         RETURN r.issuanceStatus AS status, r.credentialUri AS uri ORDER BY r.receivedAt DESC LIMIT 1`,
        { learnerId, bindingId: active.bindingId }
    );
    log(
        `ISSUANCE ${record.records[0]?.get('status') ?? 'no record'} ${record.records[0]?.get('uri') ?? ''}`
    );
    await neogma.driver.close();
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(`\n❌ ${redact(error instanceof Error ? error.message : String(error))}`);
        process.exit(1);
    });
