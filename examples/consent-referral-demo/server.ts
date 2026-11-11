import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initLearnCard } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';
import bs58 from 'bs58';
import { z } from 'zod';
import type { ConsentFlowTerms, ConsentFlowContractDetails, UnsignedVC } from '@learncard/types';

const directory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const network = 'http://localhost:4000/trpc';
const cloud = 'http://localhost:4100/trpc';
const api = 'http://localhost:5200/trpc';
const roleNames = {
    referrer: 'Hire Heroes USA',
    learner: 'Alex Morgan',
    partner: 'Hiring Our Heroes',
};
type Role = keyof typeof roleNames;
const makeWallet = async () => {
    const wallet = await initLearnCard({
        seed: randomBytes(32).toString('hex'),
        network,
        cloud: { url: cloud },
        didkit: readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
        ),
    });
    return wallet.addPlugin(await getLCAPlugin(wallet, api));
};
type Wallet = Awaited<ReturnType<typeof makeWallet>>;
type Actor = { wallet: Wallet; profileId: string; did: string };
const choicesSchema = z.object({
    name: z.boolean(),
    email: z.boolean(),
    receiveOutcomes: z.boolean(),
    shareOutcomes: z.boolean(),
});
type Choices = z.infer<typeof choicesSchema>;
const defaultChoices: Choices = {
    name: true,
    email: false,
    receiveOutcomes: true,
    shareOutcomes: true,
};

/** Only synthetic identities are created. Their signing material stays in this process. */
export const startDemo = async ({
    port = 8812,
    webhookPort = 8813,
}: { port?: number; webhookPort?: number } = {}) => {
    let actors: Record<Role, Actor> | undefined;
    let contract: ConsentFlowContractDetails | undefined;
    let termsUri: string | undefined;
    let choices = { ...defaultChoices };
    let dismissed = false;
    let sharingActive = false;
    let reference = '';
    let boostUri = '';
    let signingAuthority: { endpoint: string; name: string } | undefined;
    let outcome: { uri: string; claimed: boolean; shared: boolean; sharedUri?: string } | undefined;
    let busy = false;
    const webhookEvents: {
        role: Role;
        event: string;
        at: string;
        verified: boolean;
        reference?: string;
        deliveryKey?: string;
        requestId?: string;
    }[] = [];
    const activity: { message: string; at: string }[] = [];
    const record = (message: string) => {
        activity.unshift({ message, at: new Date().toISOString() });
        activity.splice(50);
    };
    const token = randomBytes(24).toString('hex');
    const requireActors = () => {
        if (!actors) throw new Error('Set up the demo first.');
        return actors;
    };

    const verifyService = async (bearer: string) => {
        const serviceDid = 'did:web:localhost%3A4000';
        const header = decodeProtectedHeader(bearer);
        if (header.alg !== 'EdDSA' || !header.kid?.startsWith(`${serviceDid}#`))
            throw new Error('Unexpected webhook signer.');
        const document = await requireActors().learner.wallet.invoke.resolveDid(serviceDid);
        const method = document.verificationMethod?.find(
            method => typeof method !== 'string' && method.id === header.kid
        );
        if (!method || typeof method === 'string') throw new Error('Unknown webhook key.');
        let jwk = method.publicKeyJwk;
        if (!jwk && method.publicKeyMultibase?.startsWith('z')) {
            const bytes = bs58.decode(method.publicKeyMultibase.slice(1));
            if (bytes.length !== 34 || bytes[0] !== 0xed || bytes[1] !== 0x01)
                throw new Error('Unexpected webhook key format.');
            jwk = {
                kty: 'OKP',
                crv: 'Ed25519',
                x: Buffer.from(bytes.slice(2)).toString('base64url'),
            };
        }
        if (!jwk) throw new Error('Missing webhook public key.');
        await jwtVerify(bearer, await importJWK(jwk, 'EdDSA'), {
            issuer: serviceDid,
            algorithms: ['EdDSA'],
        });
    };
    const receiver = createServer(async (req, res) => {
        try {
            const role = req.url?.slice(1) as Role;
            if (req.method !== 'POST' || !Object.hasOwn(roleNames, role)) {
                res.writeHead(404);
                res.end();
                return;
            }
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (body.length > 1_000_000) throw new Error('Webhook too large.');
            }
            const bearer = req.headers.authorization?.replace(/^Bearer /, '');
            if (!bearer) throw new Error('Missing webhook signature.');
            await verifyService(bearer);
            const notification = JSON.parse(body);
            if (notification.to?.profileId !== requireActors()[role].profileId)
                throw new Error('Wrong webhook recipient.');
            const metadata = notification.data?.metadata;
            if (metadata?.contractUri === contract?.uri) {
                if (
                    !webhookEvents.some(
                        event =>
                            event.role === role &&
                            event.deliveryKey &&
                            event.deliveryKey === metadata.deliveryKey
                    )
                ) {
                    webhookEvents.unshift({
                        role,
                        event: String(metadata.event ?? 'notification'),
                        at: new Date().toISOString(),
                        verified: true,
                        reference: metadata.externalReferenceId,
                        deliveryKey: metadata.deliveryKey,
                        requestId: metadata.requestId,
                    });
                    webhookEvents.splice(100);
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('true');
        } catch {
            res.writeHead(400);
            res.end('false');
        }
    });
    await new Promise<void>((resolve, reject) => {
        receiver.once('error', reject);
        receiver.listen(webhookPort, '0.0.0.0', resolve);
    });

    const snapshot = async () => {
        if (!actors || !contract) return { ready: false, activity, webhooks: webhookEvents };
        const { learner, partner, referrer } = actors;
        const details = await learner.wallet.invoke.getContract(contract.uri);
        const request = await learner.wallet.invoke.getRequestStatusForProfile(
            learner.profileId,
            undefined,
            contract.uri
        );
        const read = async (actor: Actor) => {
            try {
                const data = await actor.wallet.invoke.getConsentFlowData(contract!.uri);
                const row = data.records[0];
                const credentials = [];
                for (const uri of row?.credentials.categories.Achievement ?? []) {
                    const credential = await actor.wallet.read.get(uri);
                    if (!credential) throw new Error('Could not decrypt the shared outcome.');
                    credentials.push({ name: 'Career services enrollment', decrypted: true });
                }
                return {
                    allowed: true,
                    personal: row?.personal ?? {},
                    credentials,
                    records: data.records.length,
                };
            } catch (error) {
                const code = (error as { data?: { code?: string } }).data?.code;
                if (code !== 'UNAUTHORIZED' && code !== 'FORBIDDEN') throw error;
                return { allowed: false, personal: {}, credentials: [], records: 0 };
            }
        };
        const [partnerData, referrerData] = await Promise.all([read(partner), read(referrer)]);
        return {
            ready: true,
            actors: Object.fromEntries(
                Object.entries(actors).map(([role, actor]) => [
                    role,
                    { name: roleNames[role as Role], profileId: actor.profileId },
                ])
            ),
            contract: {
                uri: details.uri,
                name: details.name,
                audienceVersion: details.audienceVersion,
                audience: [details.owner, ...(details.recipients ?? [])].map(profile => ({
                    name: profile.displayName,
                    profileId: profile.profileId,
                })),
            },
            request,
            reference,
            dismissed,
            sharingActive,
            choices,
            outcome,
            data: { partner: partnerData, referrer: referrerData },
            activity,
            webhooks: webhookEvents,
        };
    };
    const createScenario = async () => {
        const { partner, learner, referrer } = requireActors();
        const unsigned: UnsignedVC = {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'Career services enrollment',
            issuer: partner.did,
            validFrom: new Date().toISOString(),
            credentialSubject: {
                id: learner.did,
                type: ['AchievementSubject'],
                achievement: {
                    id: `urn:uuid:${randomUUID()}`,
                    type: ['Achievement'],
                    name: 'Career services enrollment',
                    description: 'Synthetic enrollment recorded by Hiring Our Heroes.',
                    criteria: { narrative: 'Joined this local career support demonstration.' },
                },
            },
        };
        boostUri = await partner.wallet.invoke.createBoost(unsigned, {
            category: 'Achievement',
            name: 'Career services enrollment',
        });
        const uri = await partner.wallet.invoke.createContract({
            name: 'Hiring Our Heroes career support',
            description: 'Personalized career support and resources for your next chapter.',
            recipients: [referrer.profileId],
            contract: {
                read: {
                    anonymize: false,
                    personal: { name: { required: false }, email: { required: false } },
                    credentials: { categories: { Achievement: { required: false } } },
                },
                write: {
                    personal: {},
                    credentials: { categories: { Achievement: { required: false } } },
                },
            },
        });
        contract = await learner.wallet.invoke.getContract(uri);
        termsUri = undefined;
        choices = { ...defaultChoices };
        sharingActive = false;
        outcome = undefined;
        dismissed = false;
        reference = `demo-referral-${randomBytes(4).toString('hex')}`;
        webhookEvents.length = 0;
        record(
            'Fresh partner contract created. Hire Heroes USA is a named data recipient. No learner consent yet.'
        );
    };
    const makeTerms = (selected: Choices): ConsentFlowTerms => ({
        read: {
            personal: {
                ...(selected.name ? { name: 'Alex Morgan' } : {}),
                ...(selected.email ? { email: 'alex@example.test' } : {}),
            },
            credentials: {
                sharing: selected.shareOutcomes,
                shareAll: selected.shareOutcomes,
                categories: {
                    Achievement: {
                        sharing: selected.shareOutcomes,
                        shareAll: selected.shareOutcomes,
                        shared:
                            selected.shareOutcomes && outcome?.sharedUri ? [outcome.sharedUri] : [],
                    },
                },
            },
        },
        write: {
            personal: {},
            credentials: { categories: { Achievement: selected.receiveOutcomes } },
        },
    });
    const requireContract = () => {
        if (!contract) throw new Error('Set up the demo first.');
        return contract;
    };
    const actionSchema = z.discriminatedUnion('action', [
        z.object({ action: z.literal('setup') }),
        z.object({ action: z.literal('fresh') }),
        z.object({ action: z.literal('send') }),
        z.object({ action: z.literal('seen') }),
        z.object({ action: z.literal('dismiss') }),
        z.object({ action: z.literal('reopen') }),
        z.object({ action: z.literal('decline') }),
        z.object({ action: z.literal('cancel') }),
        z.object({ action: z.literal('withdraw') }),
        z.object({ action: z.literal('issue') }),
        z.object({ action: z.literal('claim') }),
        z.object({ action: z.literal('removeRecipient') }),
        z.object({
            action: z.literal('accept'),
            choices: choicesSchema,
            expectedRequestId: z.string().min(1),
            audienceVersion: z.number().int().nonnegative(),
        }),
        z.object({ action: z.literal('permissions'), choices: choicesSchema }),
    ]);
    const act = async (input: z.infer<typeof actionSchema>) => {
        if (input.action === 'setup') {
            if (contract) return;
            const suffix = randomBytes(4).toString('hex');
            if (!actors) {
                const pairs = await Promise.all(
                    (Object.keys(roleNames) as Role[]).map(async role => {
                        const wallet = await makeWallet();
                        const profileId = `demo-${role}-${suffix}`;
                        await wallet.invoke.createProfile({
                            profileId,
                            displayName: roleNames[role],
                            shortBio: '',
                            bio: '',
                            notificationsWebhook: `http://host.docker.internal:${webhookPort}/${role}`,
                        });
                        return [role, { wallet, profileId, did: wallet.id.did() }] as const;
                    })
                );
                actors = Object.fromEntries(pairs) as Record<Role, Actor>;
            }
            if (!signingAuthority) {
                const authority = await actors.partner.wallet.invoke.createSigningAuthority(
                    `demo${suffix}`
                );
                if (!authority) throw new Error('Could not create the local signing authority.');
                await actors.partner.wallet.invoke.registerSigningAuthority(
                    authority.endpoint,
                    authority.name,
                    authority.did
                );
                signingAuthority = { endpoint: authority.endpoint, name: authority.name };
            }
            await createScenario();
            return;
        }
        const { partner, learner, referrer } = requireActors();
        const current = requireContract();
        switch (input.action) {
            case 'fresh':
                await createScenario();
                break;
            case 'send':
                await referrer.wallet.invoke.sendContractRequest({
                    contractUri: current.uri,
                    targetProfileId: learner.profileId,
                    externalReferenceId: reference,
                    message:
                        'Get personalized career support and access resources through Hiring Our Heroes.',
                });
                record('Hire Heroes USA sent a referral to Alex for Hiring Our Heroes.');
                break;
            case 'seen':
                await learner.wallet.invoke.markContractRequestAsSeen(
                    current.uri,
                    learner.profileId
                );
                break;
            case 'dismiss':
                dismissed = true;
                record('Alex dismissed the alert. The referral is still pending.');
                break;
            case 'reopen':
                dismissed = false;
                record('Alex recovered the pending invitation.');
                break;
            case 'decline':
                await learner.wallet.invoke.denyContractRequest(current.uri);
                record('Alex declined. The saved decision remains available to the referrer.');
                break;
            case 'cancel':
                await partner.wallet.invoke.cancelContractRequest(current.uri, learner.profileId);
                record('Hiring Our Heroes cancelled the invitation.');
                break;
            case 'accept': {
                const consent = {
                    terms: makeTerms(input.choices),
                    audienceVersion: input.audienceVersion,
                    expectedRequestId: input.expectedRequestId,
                };
                const result = await learner.wallet.invoke.consentToContract(current.uri, consent);
                termsUri = result.termsUri;
                choices = input.choices;
                sharingActive = true;
                record(
                    'Alex confirmed the selected permissions. Both named organizations can read only approved data.'
                );
                break;
            }
            case 'permissions': {
                if (!termsUri) throw new Error('Accept the referral first.');
                const selected = input.choices;
                const fresh = await learner.wallet.invoke.getContract(current.uri);
                await learner.wallet.invoke.updateContractTerms(termsUri, {
                    terms: makeTerms(selected),
                    audienceVersion: fresh.audienceVersion,
                });
                choices = selected;
                record(
                    'Alex updated sharing permissions. Read the live organization snapshots to check the result.'
                );
                break;
            }
            case 'withdraw':
                if (!termsUri) throw new Error('Accept the referral first.');
                await learner.wallet.invoke.withdrawConsent(termsUri);
                sharingActive = false;
                record(
                    'Alex stopped sharing. Future authorized data reads return no consented records. Previously delivered copies cannot be recalled.'
                );
                break;
            case 'issue': {
                if (!signingAuthority) throw new Error('Set up the demo first.');
                if (outcome)
                    throw new Error(
                        'An outcome already exists for this scenario. Start a fresh scenario to repeat.'
                    );
                const grantId = await partner.wallet.invoke.addAuthGrant({
                    name: 'Demo outcome writer',
                    scope: 'contracts-data:write',
                });
                const key = await partner.wallet.invoke.getAPITokenForAuthGrant(grantId);
                try {
                    const response = await fetch(
                        'http://localhost:4000/api/consent-flow-contract/write/via-signing-authority',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${key}`,
                            },
                            body: JSON.stringify({
                                contractUri: current.uri,
                                did: learner.did,
                                boostUri,
                                signingAuthority,
                            }),
                        }
                    );
                    if (!response.ok)
                        throw new Error(
                            'The partner could not issue an outcome. Check that current consent permits receiving career outcomes.'
                        );
                    const uri = await response.json();
                    if (typeof uri !== 'string') throw new Error('Unexpected outcome response.');
                    outcome = { uri, claimed: false, shared: false };
                    record(
                        'Hiring Our Heroes recorded enrollment. The credential is pending for Alex and is not yet shared.'
                    );
                } finally {
                    await partner.wallet.invoke.revokeAuthGrant(grantId);
                }
                break;
            }
            case 'claim': {
                if (!outcome || !termsUri || !sharingActive)
                    throw new Error('An active consent and pending outcome are required.');
                const uploadEncrypted = learner.wallet.store.LearnCloud.uploadEncrypted;
                if (!uploadEncrypted)
                    throw new Error('Encrypted storage is not available. Restart the local demo.');
                if (!outcome.claimed) {
                    await learner.wallet.invoke.acceptCredential(outcome.uri);
                    const credential = await learner.wallet.read.get(outcome.uri);
                    if (!credential) throw new Error('Could not load the outcome.');
                    const personalUri = await uploadEncrypted(credential);
                    await learner.wallet.index.LearnCloud.add({
                        id: randomUUID(),
                        uri: personalUri,
                        category: 'Achievement',
                    });
                    outcome.claimed = true;
                }
                if (choices.shareOutcomes && !outcome.shared) {
                    const fresh = await learner.wallet.invoke.getContract(current.uri);
                    const credential = await learner.wallet.read.get(outcome.uri);
                    if (!credential) throw new Error('Could not load the outcome.');
                    const sharedUri = await uploadEncrypted(credential, {
                        recipients: [
                            fresh.owner.did,
                            ...(fresh.recipients ?? []).map(profile => profile.did),
                        ],
                    });
                    await learner.wallet.invoke.syncCredentialsToContract(
                        termsUri,
                        { Achievement: [sharedUri] },
                        fresh.audienceVersion
                    );
                    outcome.shared = true;
                    outcome.sharedUri = sharedUri;
                    record(
                        'Alex claimed the outcome and shared an encrypted copy with the current, approved audience.'
                    );
                } else if (!choices.shareOutcomes)
                    record(
                        'Alex claimed the outcome. Outcome sharing is off, so it remains private.'
                    );
                break;
            }
            case 'removeRecipient':
                await partner.wallet.invoke.removeContractRecipient(
                    current.uri,
                    referrer.profileId
                );
                record(
                    'The partner removed Hire Heroes USA from the audience. Its future data reads are denied.'
                );
                break;
        }
    };
    const files = new Map([
        ['/', 'index.html'],
        ['/app.js', 'app.js'],
        ['/style.css', 'style.css'],
    ]);
    let server;
    try {
        server = Bun.serve({
            port,
            hostname: '127.0.0.1',
            async fetch(req) {
                const url = new URL(req.url);
                const host = req.headers.get('host');
                if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`)
                    return new Response('Invalid host', { status: 403 });
                if (url.pathname === '/api/state' && req.method === 'GET') {
                    try {
                        return Response.json(await snapshot(), {
                            headers: { 'Cache-Control': 'no-store' },
                        });
                    } catch {
                        return Response.json(
                            {
                                error: 'The local APIs could not be read. Check the running demo services.',
                            },
                            { status: 503 }
                        );
                    }
                }
                if (url.pathname === '/api/action' && req.method === 'POST') {
                    if (
                        req.headers.get('origin') !== url.origin ||
                        req.headers.get('x-demo-token') !== token
                    )
                        return Response.json(
                            { error: 'Open this action from the local demo.' },
                            { status: 403 }
                        );
                    if (busy)
                        return Response.json(
                            { error: 'Another demo action is finishing. Try again shortly.' },
                            { status: 409 }
                        );
                    const input = actionSchema.safeParse(await req.json().catch(() => null));
                    if (!input.success)
                        return Response.json({ error: 'Invalid demo action.' }, { status: 400 });
                    busy = true;
                    try {
                        await act(input.data);
                        return Response.json(await snapshot(), {
                            headers: { 'Cache-Control': 'no-store' },
                        });
                    } catch (error) {
                        const code = (error as { data?: { code?: string } }).data?.code;
                        const message =
                            code === 'CONFLICT'
                                ? 'This invitation or sharing audience changed. No new consent was recorded. Start a fresh scenario or review the current invitation.'
                                : code === 'FORBIDDEN' || code === 'UNAUTHORIZED'
                                  ? 'Current permissions do not allow this action.'
                                  : error instanceof Error
                                    ? error.message
                                    : 'The action could not finish. Please try again.';
                        return Response.json(
                            { error: message.slice(0, 350) },
                            { status: code === 'CONFLICT' ? 409 : 400 }
                        );
                    } finally {
                        busy = false;
                    }
                }
                const filename = files.get(url.pathname);
                if (!filename || req.method !== 'GET')
                    return new Response('Not found', { status: 404 });
                if (filename === 'index.html')
                    return new Response(
                        (await readFile(join(directory, filename), 'utf8')).replace(
                            '__DEMO_TOKEN__',
                            token
                        ),
                        { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } }
                    );
                return new Response(Bun.file(join(directory, filename)), {
                    headers: { 'Cache-Control': 'no-store' },
                });
            },
        });
    } catch (error) {
        receiver.close();
        throw error;
    }
    return {
        url: `http://localhost:${port}`,
        stop: () => {
            server.stop(true);
            receiver.closeAllConnections();
            receiver.close();
        },
    };
};
