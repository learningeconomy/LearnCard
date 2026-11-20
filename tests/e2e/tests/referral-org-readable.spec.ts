/**
 * #2108 + #2037 service proof. Requires both branches and the built CLI/SDK.
 * One test: the shared harness clears all databases after each test.
 * Learner approval and subsequent sharing use real SDK calls, not the browser UI.
 * Signed delivery is required; no skip or public receiver fallback is permitted.
 */
import { describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import {
    ACT_AS_HEADER,
    IntegrationEventValidator,
    ReadableDeliveryPageValidator,
    VCValidator,
} from '@learncard/types';
import { initLearnCard } from '@learncard/init';
import { getLearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

const NETWORK = 'http://localhost:4000/trpc';
const API = 'http://localhost:4000/api';
const CLI = resolvePath(__dirname, '../../../packages/learn-card-cli/dist/index.js');

// The generated fixtures contain single-line, shell-safe seed, token, and signing-secret values.
const readPrivateEnv = (file: string): Record<string, string> =>
    Object.fromEntries(
        readFileSync(file, 'utf8')
            .split('\n')
            .flatMap(line => {
                const match = /^([A-Z][A-Z0-9_]*)=(?:"([A-Za-z0-9_.-]+)"|([A-Za-z0-9_.-]+))$/.exec(
                    line.trim()
                );
                return match ? [[match[1]!, (match[2] ?? match[3])!]] : [];
            })
    );

interface CapturedWebhook {
    body: Buffer;
    headers: IncomingHttpHeaders;
    receivedAt: number;
}

/** Only an external boundary: records the unmodified bytes sent by the real Brain service. */
const startReceiver = async () => {
    const path = `/referral-${randomBytes(16).toString('hex')}`;
    const received: CapturedWebhook[] = [];
    const server = createServer((request, response) => {
        if (request.method !== 'POST' || request.url !== path) {
            response.writeHead(404).end();
            return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        request.on('error', () => response.destroy());
        request.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > 64 * 1024 || received.length >= 100) {
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on('end', () => {
            received.push({
                body: Buffer.concat(chunks),
                headers: request.headers,
                receivedAt: Date.now(),
            });
            response.writeHead(204).end();
        });
    });
    server.requestTimeout = 10_000;
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        // The disposable Linux Docker bridge must reach this host listener.
        server.listen(0, '0.0.0.0', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Receiver did not bind');
    return {
        received,
        url: `http://host.docker.internal:${address.port}${path}`,
        close: async (): Promise<void> => {
            await new Promise<void>((resolve, reject) => {
                server.close(error =>
                    error ? reject(new Error('Receiver cleanup failed')) : resolve()
                );
                server.closeAllConnections();
            });
            received.length = 0;
        },
    };
};

const verifyWebhook = (capture: CapturedWebhook, secret: string) => {
    const header = capture.headers['x-learncard-signature'];
    const match = typeof header === 'string' && /^t=(\d+),v1=([a-f0-9]{64})$/.exec(header);
    expect(Boolean(match), 'signature header format').toBe(true);
    if (!match) throw new Error('Invalid signature header');
    const expected = createHmac('sha256', secret)
        .update(`${match[1]}.`, 'utf8')
        .update(capture.body)
        .digest();
    // Compare booleans so failed assertions cannot print signing material.
    expect(timingSafeEqual(expected, Buffer.from(match[2]!, 'hex')), 'raw-body HMAC').toBe(true);
    expect(Math.abs(capture.receivedAt / 1000 - Number(match[1]))).toBeLessThan(300);
    const event = IntegrationEventValidator.parse(JSON.parse(capture.body.toString('utf8')));
    expect(capture.headers['x-learncard-event-id'] === event.eventId).toBe(true);
    expect(capture.headers['x-learncard-delivery'] === event.deliveryKey).toBe(true);
    return event;
};

describe('Referral org apply: hosted signer, readable recipient and signed events', () => {
    test('delivers the exact signed outcome after learner approval and sharing', async () => {
        // This must fail on an unbuilt/restack-incomplete checkout, never silently skip.
        if (!existsSync(CLI))
            throw new Error('Build the CLI and SDK from the final #2108 + #2037 restack first');
        const dir = mkdtempSync(join(tmpdir(), 'lc-referral-e2e-'));
        let receiver: Awaited<ReturnType<typeof startReceiver>> | undefined;
        let stage = 'receiver setup';
        try {
            receiver = await startReceiver();
            const suffix = randomBytes(5).toString('hex');
            const partnerId = `ref-partner-${suffix}`;
            const writerId = `ref-writer-${suffix}`;
            const recipientId = `ref-recipient-${suffix}`;
            const learnerId = `ref-learner-${suffix}`;
            const program = `Referral E2E ${suffix}`;
            const secretsPath = join(dir, 'handoff.env');
            writeFileSync(
                join(dir, 'org.yaml'),
                `issuer:
    profileId: ${partnerId}
    displayName: Referral E2E Partner
    signingAuthority: { type: learncard-hosted, name: outcomes }
profileManager:
    displayName: Referral E2E Issuers
    managed:
        - { profileId: ${writerId}, displayName: Referral E2E Writer }
referralRecipients:
    - { profileId: ${recipientId}, displayName: Referral E2E Recipient }
referralPrograms:
    - name: ${program}
      partner: ${partnerId}
      referrers: [${recipientId}]
      outcomes: { issuer: ${writerId}, category: Work History }
      delivery:
          readable: true
          webhookEnv: REFERRAL_E2E_WEBHOOK_URL
`
            );

            stage = 'built CLI org apply';
            // Direct built CLI, fresh cwd, local endpoints, no inherited credentials/proxies.
            // Never let execFileSync's error (which contains stdout/stderr) escape this test.
            const output = JSON.parse(
                execFileSync(
                    process.execPath,
                    [
                        CLI,
                        'org',
                        'apply',
                        'org.yaml',
                        '--secrets-out',
                        secretsPath,
                        '--network',
                        NETWORK,
                        '--yes',
                        '--json',
                    ],
                    {
                        cwd: dir,
                        encoding: 'utf8',
                        stdio: ['ignore', 'pipe', 'pipe'],
                        timeout: 120_000,
                        env: {
                            PATH: process.env.PATH,
                            HOME: dir,
                            NODE_ENV: 'test',
                            SKIP_DIDKIT_NAPI: '1',
                            CLOUD_URL: 'http://localhost:4100/trpc',
                            LCA_API_URL: 'http://localhost:5200/api',
                            REFERRAL_E2E_WEBHOOK_URL: receiver.url,
                        },
                    }
                )
            );
            const handoffs = output.outputs.referrals;
            expect(handoffs.length).toBe(1);
            const handoff = handoffs[0];
            expect(handoff.recipient === recipientId && handoff.program === program).toBe(true);
            expect(handoff.network === NETWORK).toBe(true);
            const contractUri: string = handoff.contractUri;
            const secrets = readPrivateEnv(secretsPath);
            const token = secrets[handoff.tokenKey];
            const webhookSecret = secrets[handoff.webhookSecretKey];
            expect(Boolean(token && webhookSecret?.startsWith('whsec_'))).toBe(true);
            expect(statSync(secretsPath).mode & 0o777).toBe(0o600);
            const project = readPrivateEnv(join(dir, '.env'));
            const seed = project.SECURE_SEED;
            expect(Boolean(seed)).toBe(true);
            if (!seed || !token || !webhookSecret) throw new Error('Missing private handoff');
            expect(
                [seed, token, webhookSecret].some(value => JSON.stringify(output).includes(value))
            ).toBe(false);

            stage = 'persisted contract and version 2 disclosure';
            const partner = await getLearnCard(seed);
            const writerDid = `did:web:localhost%3A4000:users:${writerId}`;
            const writer = await getLearnCard(seed, writerDid);
            const recipient = await initLearnCard({
                apiKey: token,
                network: NETWORK,
                didkit: readFileSync(
                    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
                ),
            });
            const learner = await getLearnCard(randomBytes(32).toString('hex'));
            await learner.invoke.createProfile({
                profileId: learnerId,
                displayName: 'Referral E2E Learner',
                bio: '',
                shortBio: '',
            });
            const learnerDid = `did:web:localhost%3A4000:users:${learnerId}`;
            const contract = await learner.invoke.getContract(contractUri);
            expect(contract.owner.profileId).toBe(partnerId);
            expect(contract.writers?.some(profile => profile.profileId === writerId)).toBe(true);
            expect(contract.readableDeliveryRecipients).toContainEqual(
                expect.objectContaining({
                    profileId: recipientId,
                    enabled: true,
                    disclosureVersion: '2',
                })
            );
            expect(contract.contract.read.credentials.categories['Work History']).toBeDefined();
            expect(contract.contract.write.credentials.categories['Work History']).toBeDefined();

            stage = 'recipient request and real learner approval';
            const externalReferenceId = `referral-case-${suffix}`;
            const request = await recipient.invoke.sendContractRequest({
                contractUri,
                targetProfileId: learnerId,
                externalReferenceId,
            });
            expect(request.status).toBe('pending');
            expect(await partner.invoke.verifyConsent(contractUri, learnerId)).toBe(false);
            const { termsUri } = await learner.invoke.consentToContract(contractUri, {
                audienceVersion: contract.audienceVersion,
                expectedRequestId: request.requestId,
                terms: {
                    read: {
                        anonymize: false,
                        personal: {},
                        credentials: {
                            shareAll: false,
                            sharing: true,
                            categories: {
                                'Work History': { shareAll: true, sharing: true, shared: [] },
                            },
                        },
                    },
                    write: { personal: {}, credentials: { categories: { 'Work History': true } } },
                },
            });
            expect(await partner.invoke.verifyConsent(contractUri, learnerId)).toBe(true);

            stage = 'configured hosted outcome issuance';
            const authority = await writer.invoke.getPrimaryRegisteredSigningAuthority();
            expect(authority?.relationship.name).toBe('outcomes');
            expect(authority?.signingAuthority.endpoint).toBe('http://localhost:5200/api');
            if (!authority) throw new Error('Configured signer missing');
            const boostUri = await writer.invoke.createBoost(
                {
                    ...testUnsignedBoost,
                    name: `Referral outcome ${suffix}`,
                    evidence: [
                        {
                            id: `urn:uuid:${suffix}`,
                            type: ['Evidence'],
                            narrative: 'Completed the referral program.',
                        },
                    ],
                },
                { category: 'Work History', name: `Referral outcome ${suffix}` }
            );
            const client = await writer.invoke.getLCNClient();
            const issuedUri =
                await client.contracts.writeCredentialToContractViaSigningAuthority.mutate({
                    did: learnerDid,
                    contractUri,
                    boostUri,
                    signingAuthority: {
                        name: authority.relationship.name,
                        endpoint: authority.signingAuthority.endpoint,
                    },
                });
            const delivered = await learner.invoke.getCredentialsForContract(termsUri);
            expect(
                delivered.records.some(
                    record =>
                        record.credentialUri === issuedUri && record.category === 'Work History'
                )
            ).toBe(true);
            // Preserve the original response, including every issuer field and proof.
            const original = await learner.read.get(issuedUri);
            const credential = VCValidator.parse(original);
            expect(credential.proof).toBeDefined();
            expect(credential.issuer).toEqual({ id: writerDid });
            expect(credential.credentialSubject).toMatchObject({ id: learnerDid });
            expect(credential.evidence).toBeDefined();

            stage = 'learner encrypted sharing and intended recipient token read';
            // Same encryption audience as the app: owner + disclosed recipient DIDs.
            // DID resolution includes #2037's delegated encryption key; do not inject it here.
            const sharedUri = await learner.store.LearnCloud.uploadEncrypted!(credential, {
                recipients: [
                    contract.owner.did,
                    ...(contract.recipients ?? []).map(profile => profile.did),
                ],
            });
            await learner.invoke.syncCredentialsToContract(
                termsUri,
                { 'Work History': [sharedUri] },
                contract.audienceVersion
            );
            const response = await fetch(`${API}/readable-delivery/data`, {
                method: 'POST',
                redirect: 'error',
                signal: AbortSignal.timeout(20_000),
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    [ACT_AS_HEADER]: recipientId,
                },
                body: JSON.stringify({ contractUri, did: learnerDid, limit: 1 }),
            });
            expect(response.status).toBe(200);
            const page = ReadableDeliveryPageValidator.parse(await response.json());
            expect(page.records.length).toBe(1);
            expect(page.hasMore).toBe(false);
            expect(page.records[0]).toMatchObject({
                uri: sharedUri,
                category: 'Work History',
                status: 'readable',
            });
            expect(page.records[0]?.credential?.verification.proof).toBe('valid');
            expect(
                isDeepStrictEqual(page.records[0]?.fullCredential, original),
                'exact original fullCredential including proof and evidence'
            ).toBe(true);

            stage = 'signed webhook HMAC and referral correlation';
            const captures = receiver.received;
            const findEvent = (type: string) =>
                captures.find(capture => {
                    try {
                        const event = JSON.parse(capture.body.toString('utf8'));
                        return (
                            event.type === type &&
                            event.contractUri === contractUri &&
                            (type === 'request_accepted'
                                ? event.requestId === request.requestId
                                : event.termsUri === termsUri)
                        );
                    } catch {
                        return false;
                    }
                });
            await expect
                .poll(
                    () => Boolean(findEvent('request_accepted') && findEvent('credentials_synced')),
                    { timeout: 60_000, interval: 500 }
                )
                .toBe(true);
            const accepted = verifyWebhook(findEvent('request_accepted')!, webhookSecret);
            expect(accepted.requestId).toBe(request.requestId);
            expect(accepted.externalReferenceId).toBe(externalReferenceId);
            expect(accepted.subject).toMatchObject({ profileId: learnerId, did: learnerDid });
            const synced = verifyWebhook(findEvent('credentials_synced')!, webhookSecret);
            expect(synced.subject).toMatchObject({ profileId: learnerId, did: learnerDid });
            expect(synced.role).toBe('recipient');
            const feed = await recipient.invoke.getIntegrationEvents(handoff.integrationId, {
                limit: 100,
            });
            for (const event of [accepted, synced]) {
                expect(
                    feed.records.some(record => isDeepStrictEqual(record, event)),
                    'signed event matches durable recipient feed'
                ).toBe(true);
            }
        } catch {
            // SDK/CLI errors may embed authorization headers, seeds or handoff output.
            // Fixed stage labels are sufficient to locate the failed boundary safely in CI.
            throw new Error(`Referral E2E failed during: ${stage}. Raw diagnostics withheld.`);
        } finally {
            try {
                await receiver?.close();
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        }
    }, 240_000);
});
