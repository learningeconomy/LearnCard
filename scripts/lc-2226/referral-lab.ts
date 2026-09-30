/** Signed HTTP acceptance lab. Creates only synthetic profiles on loopback services. */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';
import bs58 from 'bs58';
import { initLearnCard } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import type { ConsentFlowTerms, ConsentFlowWebhookMetadata, UnsignedVC } from '@learncard/types';

const require = createRequire(import.meta.url);
const loopback = (value: string): URL => {
    const url = new URL(value);
    assert(
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.protocol === 'http:',
        'Only HTTP loopback services are permitted'
    );
    return url;
};

export const runReferralLab = async () => {
    const network = loopback(process.env.LC2226_NETWORK_URL ?? 'http://localhost:4000/trpc');
    const cloud = loopback(process.env.LC2226_CLOUD_URL ?? 'http://localhost:4100/trpc');
    const api = loopback(process.env.LC2226_API_URL ?? 'http://localhost:5200/trpc');
    const didkit = readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
    );
    const suffix = randomBytes(5).toString('hex');
    const deliveries: {
        receiver: string;
        metadata?: ConsentFlowWebhookMetadata;
        transaction?: unknown;
        bearer?: string;
    }[] = [];
    const receiver = createServer(async (req, res) => {
        try {
            let body = '';
            for await (const chunk of req) body += chunk;
            const notification = JSON.parse(body);
            deliveries.push({
                receiver: req.url?.slice(1) ?? '',
                metadata: notification.data?.metadata,
                transaction: notification.data?.transaction,
                bearer: req.headers.authorization?.slice(7),
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('true');
        } catch {
            res.writeHead(400);
            res.end('false');
        }
    });
    await new Promise<void>(resolve => receiver.listen(0, '127.0.0.1', resolve));
    const address = receiver.address();
    assert(address && typeof address !== 'string');
    try {
        console.log('Initializing five synthetic profiles...');
        const roles = ['partner-a', 'partner-b', 'referrer', 'learner', 'outsider'];
        const wallets = await Promise.all(
            roles.map(async role => {
                const wallet = await initLearnCard({
                    seed: randomBytes(32).toString('hex'),
                    didkit,
                    network: network.href,
                    cloud: { url: cloud.href },
                });
                await wallet.invoke.createProfile({
                    profileId: `lc2226-${role}-${suffix}`,
                    displayName: `LC-2226 ${role}`,
                    shortBio: '',
                    bio: '',
                    notificationsWebhook: `http://127.0.0.1:${address.port}/${role}`,
                });
                return wallet.addPlugin(await getLCAPlugin(wallet, api.href));
            })
        );
        const [partnerA, partnerB, referrer, learner, outsider] = wallets;
        assert(partnerA && partnerB && referrer && learner && outsider);
        const learnerProfile = await learner.invoke.getProfile();
        const referrerProfile = await referrer.invoke.getProfile();
        assert(
            learnerProfile && 'did' in learnerProfile && referrerProfile && 'did' in referrerProfile
        );
        const uploadEncrypted = learner.store.LearnCloud.uploadEncrypted;
        assert(uploadEncrypted, 'LearnCloud encrypted upload must be installed');
        const unsigned: UnsignedVC = {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'Synthetic career outcome',
            issuer: partnerA.id.did(),
            validFrom: new Date().toISOString(),
            credentialSubject: {
                id: learnerProfile.did,
                type: ['AchievementSubject'],
                achievement: {
                    id: `urn:uuid:${randomUUID()}`,
                    type: ['Achievement'],
                    name: 'Enrolled in career services',
                    description: 'Synthetic referral acceptance lab',
                    criteria: { narrative: 'Completed synthetic enrollment' },
                },
            },
        };
        const terms: ConsentFlowTerms = {
            read: {
                personal: {},
                credentials: {
                    sharing: true,
                    shareAll: true,
                    categories: { Achievement: { sharing: true, shareAll: true, shared: [] } },
                },
            },
            write: { personal: {}, credentials: { categories: { Achievement: true } } },
        };
        const makePartner = async (wallet: typeof partnerA, label: string) => {
            console.log(`Preparing ${label} signing authority and contract...`);
            const authority = await wallet.invoke.createSigningAuthority(`lc22${suffix}`);
            assert(authority);
            await wallet.invoke.registerSigningAuthority(
                authority.endpoint,
                authority.name,
                authority.did
            );
            const boostUri = await wallet.invoke.createBoost(
                { ...unsigned, issuer: wallet.id.did() },
                { category: 'Achievement', name: `LC-2226 ${label} outcome` }
            );
            const signingAuthority = { endpoint: authority.endpoint, name: authority.name };
            const contractUri = await wallet.invoke.createContract({
                name: `LC-2226 ${label} ${suffix}`,
                recipients: [referrerProfile.profileId],
                contract: {
                    read: {
                        personal: {},
                        credentials: { categories: { Achievement: { required: false } } },
                    },
                    write: {
                        personal: {},
                        credentials: { categories: { Achievement: { required: false } } },
                    },
                },
                autoboosts: [{ boostUri, signingAuthority }],
            });
            await referrer.invoke.sendContractRequest({
                contractUri,
                targetProfileId: learnerProfile.profileId,
                externalReferenceId: `lab-${label}-${suffix}`,
                message: 'Synthetic career support invitation',
            });
            assert.equal(
                (
                    await learner.invoke.getAllContractRequestsForProfile(learnerProfile.profileId)
                ).some(
                    request => request.contract.uri === contractUri && request.status === 'pending'
                ),
                true
            );
            const details = await learner.invoke.getContract(contractUri);
            const { termsUri } = await learner.invoke.consentToContract(contractUri, {
                terms: structuredClone(terms),
                audienceVersion: details.audienceVersion,
            });
            assert.equal(
                (
                    await learner.invoke.getRequestStatusForProfile(
                        learnerProfile.profileId,
                        undefined,
                        contractUri
                    )
                )?.status,
                'accepted'
            );
            const grantId = await wallet.invoke.addAuthGrant({
                id: randomUUID(),
                name: 'Synthetic outcome writer',
                challenge: `auth-grant:${randomUUID()}`,
                status: 'active',
                createdAt: new Date().toISOString(),
                scope: 'contracts-data:write',
            });
            const token = await wallet.invoke.getAPITokenForAuthGrant(grantId);
            const response = await fetch(
                new URL('/api/consent-flow-contract/write/via-signing-authority', network),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        did: learnerProfile.did,
                        contractUri,
                        boostUri,
                        signingAuthority,
                    }),
                }
            );
            assert.equal(response.status, 200, 'Signing authority outcome issuance must succeed');
            const issuedUri = await response.json();
            assert.equal(typeof issuedUri, 'string');
            const records = (await learner.invoke.getCredentialsForContract(termsUri)).records;
            assert(
                records.some(record => record.credentialUri === issuedUri),
                'Outcome is visible to the learner'
            );
            assert(records.length >= 2, 'Autoboost and explicitly written outcome were issued');
            assert.equal(
                (await referrer.invoke.getConsentFlowData(contractUri)).records[0]?.credentials
                    .categories.Achievement?.length,
                0,
                'Issuance alone does not share the outcome'
            );
            console.log(`Claiming and encrypting ${label} outcomes for its consent audience...`);
            const sharedUris: string[] = [];
            for (const record of records) {
                await learner.invoke.acceptCredential(record.credentialUri);
                const credential = await learner.read.get(record.credentialUri);
                assert(credential);
                const personalUri = await uploadEncrypted(credential);
                await learner.index.LearnCloud.add({
                    id: randomUUID(),
                    uri: personalUri,
                    category: 'Achievement',
                });
                const sharedUri = await uploadEncrypted(credential, {
                    recipients: [
                        details.owner.did,
                        ...(details.recipients ?? []).map(profile => profile.did),
                    ],
                });
                sharedUris.push(sharedUri);
            }
            await learner.invoke.syncCredentialsToContract(
                termsUri,
                { Achievement: sharedUris },
                details.audienceVersion
            );
            const data = await referrer.invoke.getConsentFlowData(contractUri);
            assert.deepEqual(
                [...data.records[0]!.credentials.categories.Achievement!].sort(),
                [...sharedUris].sort()
            );
            assert(await referrer.read.get(sharedUris[0]!));
            assert(await wallet.read.get(sharedUris[0]!));
            let outsiderPlaintext: unknown;
            try {
                outsiderPlaintext = await outsider.read.get(sharedUris[0]!);
            } catch {
                /* Expected decrypt/access rejection. */
            }
            assert(!outsiderPlaintext, 'An outsider must not decrypt the outcome');
            return { contractUri, termsUri, details, sharedUris };
        };
        const first = await makePartner(partnerA, 'partner-a');
        const second = await makePartner(partnerB, 'partner-b');
        assert.equal(
            (await partnerA.invoke.getConsentFlowDataForDid(learnerProfile.did)).records.length,
            1
        );
        assert.equal(
            (await partnerB.invoke.getConsentFlowDataForDid(learnerProfile.did)).records.length,
            1
        );
        let crossPartnerPlaintext: unknown;
        try {
            crossPartnerPlaintext = await partnerB.read.get(first.sharedUris[0]!);
        } catch {
            /* Expected. */
        }
        assert(!crossPartnerPlaintext, 'Partner B must not decrypt Partner A outcomes');
        assert.equal((await outsider.invoke.getAllConsentFlowData()).records.length, 0);
        console.log('Checking withdrawal, reconsent, recipient removal and expiry...');
        await learner.invoke.withdrawConsent(first.termsUri);
        assert.equal(
            (await referrer.invoke.getConsentFlowData(first.contractUri)).records.length,
            0
        );
        assert.equal(
            (await referrer.invoke.getConsentFlowData(second.contractUri)).records.length,
            1
        );
        const reconsent = await learner.invoke.consentToContract(first.contractUri, {
            terms: structuredClone(terms),
            audienceVersion: first.details.audienceVersion,
        });
        await partnerA.invoke.removeContractRecipient(first.contractUri, referrerProfile.profileId);
        await assert.rejects(() => referrer.invoke.getConsentFlowData(first.contractUri));
        await assert.rejects(() =>
            learner.invoke.syncCredentialsToContract(
                reconsent.termsUri,
                { Achievement: first.sharedUris },
                first.details.audienceVersion
            )
        );
        const reduced = await learner.invoke.getContract(first.contractUri);
        const previousOutcome = await learner.read.get(first.sharedUris[0]!);
        assert(previousOutcome, 'Previously claimed outcome must remain readable to the learner');
        const ownerOnly = await uploadEncrypted(previousOutcome, {
            recipients: [reduced.owner.did],
        });
        let removedPlaintext: unknown;
        try {
            removedPlaintext = await referrer.read.get(ownerOnly);
        } catch {
            /* Expected. */
        }
        assert(!removedPlaintext, 'New ciphertext excludes the removed recipient');
        await learner.invoke.withdrawConsent(second.termsUri);
        await learner.invoke.consentToContract(second.contractUri, {
            terms: structuredClone(terms),
            audienceVersion: second.details.audienceVersion,
            expiresAt: new Date(Date.now() + 1500).toISOString(),
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        assert.equal(
            (await referrer.invoke.getConsentFlowData(second.contractUri)).records.length,
            0,
            'Expired terms must not be discoverable'
        );
        const deadline = Date.now() + 70_000;
        while (
            Date.now() < deadline &&
            !deliveries.some(
                delivery =>
                    delivery.receiver === 'referrer' &&
                    delivery.metadata?.event === 'credentials_synced' &&
                    delivery.metadata.contractUri === second.contractUri
            )
        )
            await new Promise(resolve => setTimeout(resolve, 500));
        const syncs = deliveries.filter(
            delivery =>
                delivery.receiver === 'referrer' &&
                delivery.metadata?.event === 'credentials_synced'
        );
        assert(syncs.some(delivery => delivery.metadata?.contractUri === first.contractUri));
        assert(syncs.some(delivery => delivery.metadata?.contractUri === second.contractUri));
        assert(
            syncs.every(
                delivery =>
                    delivery.metadata?.externalReferenceId?.startsWith('lab-') &&
                    delivery.metadata.requestId &&
                    delivery.metadata.eventId &&
                    delivery.metadata.deliveryKey
            )
        );
        const signed = deliveries.find(delivery => delivery.bearer);
        assert(signed?.bearer);
        const serviceDid = `did:web:${encodeURIComponent(network.host)}`;
        const header = decodeProtectedHeader(signed.bearer);
        assert(header.kid?.startsWith(`${serviceDid}#`) && header.alg === 'EdDSA');
        const document = await learner.invoke.resolveDid(serviceDid);
        const method = document.verificationMethod?.find(
            method => typeof method !== 'string' && method.id === header.kid
        );
        assert(method && typeof method !== 'string', 'JWT key must be in the service DID document');
        let jwk = method.publicKeyJwk;
        if (!jwk && method.publicKeyMultibase?.startsWith('z')) {
            const bytes = bs58.decode(method.publicKeyMultibase.slice(1));
            assert(
                bytes.length === 34 && bytes[0] === 0xed && bytes[1] === 0x01,
                'Expected Ed25519 multicodec public key'
            );
            jwk = {
                kty: 'OKP',
                crv: 'Ed25519',
                x: Buffer.from(bytes.slice(2)).toString('base64url'),
            };
        }
        assert(jwk, 'Service JWT verification method must publish an Ed25519 key');
        const key = await importJWK(jwk, header.alg);
        await jwtVerify(signed.bearer, key, { issuer: serviceDid, algorithms: ['EdDSA'] });
        const result = {
            result: 'PASS',
            contracts: [first.contractUri, second.contractUri],
            checks: [
                'signed HTTP SDK',
                'autoboost',
                'scoped signing authority outcome',
                'learner claim and encrypted sync',
                'owner/referrer decryption',
                'outsider and cross-partner rejection',
                'withdrawal independence',
                'recipient removal and stale-audience rejection',
                'expiry',
                'correlated signed webhooks',
            ],
            webhookCount: deliveries.length,
        };
        console.log(JSON.stringify(result, null, 2));
        return result;
    } finally {
        receiver.closeAllConnections();
        await new Promise<void>(resolve => receiver.close(() => resolve()));
    }
};
if ((import.meta as ImportMeta & { main?: boolean }).main) await runReferralLab();
