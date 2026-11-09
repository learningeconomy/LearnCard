import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SdJwtVcDependentLearnCard } from '@learncard/sd-jwt-vc-plugin';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import {
    createEd25519KbSigner,
    parseSdJwtVc,
    presentSdJwtVc,
    verifySdJwtVc,
    sha256Hasher,
    randomSalt,
} from '@learncard/sd-jwt-vc-plugin';
import {
    ISSUER,
    issuerPublicKey,
    fixture,
    publicJwk,
    encode,
    verifyPresentation,
} from '../../android/digital-credentials-lab/web/fixture';
import { buildAccountInventory, type DigitalCredentialWallet } from './inventory';
import { prepareAccountPresentation } from './presentation';

const URI = 'https://status.example.test/course';
// ZLIB encodings of bytes 0, 1 and 2; this browser test needs no Node compression API.
const compressedStatuses = ['eJxjAAAAAQAB', 'eJxjBAAAAgAC', 'eJxjAgAAAwAD'] as const;
afterEach(() => vi.unstubAllGlobals());

describe('signed status across LearnCard consent', () => {
    it.each(['revoked', 'suspended', 'offline'] as const)(
        'blocks %s after consent opened and checks fresh status before signing',
        async mode => {
            // Publicly known synthetic lab issuer; no real account keys or credentials.
            const issuerSeed = new Uint8Array(32).fill(7);
            const issuerKey = { kty: 'OKP', crv: 'Ed25519', x: encode(issuerPublicKey) };
            const signer = await createEd25519KbSigner({
                privateJwk: { ...issuerKey, d: encode(issuerSeed) },
            });
            const holderSeed = crypto.getRandomValues(new Uint8Array(32));
            const holderKey = { ...publicJwk(holderSeed), d: encode(holderSeed) } as {
                kty: string;
                crv: string;
                x: string;
                d: string;
            };
            const instance = new SDJwtVcInstance({
                hasher: sha256Hasher,
                hashAlg: 'sha-256',
                saltGenerator: randomSalt,
                signer,
                signAlg: 'EdDSA',
            });
            const seconds = Math.floor(Date.now() / 1000);
            const kid = `${ISSUER}#${ISSUER.slice('did:key:'.length)}`;
            const compact = await instance.issue(
                {
                    iss: ISSUER,
                    iat: seconds,
                    exp: seconds + 3600,
                    vct: fixture.template.vct,
                    cnf: { jwk: publicJwk(holderSeed) },
                    status: { status_list: { uri: URI, idx: 0 } },
                    course_name: fixture.template.claims.course_name,
                    completion_date: fixture.template.claims.completion_date,
                    learner_name: 'Private name',
                },
                { _sd: ['course_name', 'completion_date', 'learner_name'] },
                { header: { kid } }
            );
            let value: 0 | 1 | 2 = 0;
            let offline = false;
            const fetcher = vi.fn(async () => {
                if (offline) throw new Error('Temporary connection failure');
                const input = [
                    Buffer.from(JSON.stringify({ typ: 'statuslist+jwt', alg: 'EdDSA' })).toString(
                        'base64url'
                    ),
                    Buffer.from(
                        JSON.stringify({
                            iss: ISSUER,
                            sub: URI,
                            iat: seconds,
                            exp: seconds + 300,
                            ttl: 30,
                            status_list: {
                                bits: 2,
                                lst: compressedStatuses[value],
                            },
                        })
                    ).toString('base64url'),
                ].join('.');
                return new Response(`${input}.${await signer(input)}`, {
                    headers: { 'Content-Type': 'application/statuslist+jwt' },
                });
            });
            vi.stubGlobal('fetch', fetcher);
            const sdk = {
                invoke: {
                    resolveDid: async () => ({
                        id: ISSUER,
                        verificationMethod: [{ id: kid, publicKeyJwk: issuerKey }],
                        assertionMethod: [kid],
                    }),
                },
            };
            const wallet: DigitalCredentialWallet = {
                id: { did: () => 'did:example:account', keypair: () => holderKey },
                index: { LearnCloud: { get: async () => [{ uri: 'encrypted-course' }] } },
                read: { get: async () => compact },
                invoke: {
                    parseSdJwtVc,
                    verifySdJwtVc: source =>
                        verifySdJwtVc(sdk as unknown as SdJwtVcDependentLearnCard, source),
                    presentSdJwtVc: vi.fn((source, options) =>
                        presentSdJwtVc(source, {
                            ...options,
                            activeHolderPublicJwk: holderKey,
                            verify: c =>
                                verifySdJwtVc(sdk as unknown as SdJwtVcDependentLearnCard, c),
                        })
                    ),
                },
            };
            const inventory = await buildAccountInventory(wallet, undefined, 'Credential');
            expect(inventory.entries).toHaveLength(1);
            const origin = 'https://verifier.example.test';
            const prepared = await prepareAccountPresentation(
                wallet,
                inventory,
                {
                    requestId: 'test-status',
                    selectedEntryId: inventory.entries[0]!.id,
                    origin,
                    request: {
                        protocol: 'openid4vp-v1-unsigned',
                        data: {
                            nonce: 'status-nonce',
                            response_type: 'vp_token',
                            response_mode: 'dc_api',
                            dcql_query: {
                                credentials: [
                                    {
                                        id: 'course',
                                        format: 'dc+sd-jwt',
                                        meta: { vct_values: [fixture.template.vct] },
                                        claims: [
                                            { path: ['course_name'] },
                                            { path: ['completion_date'] },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
                () => true
            );
            const picks = {
                row: { course: 0 },
                disclose: {
                    'course::encrypted-course': { course_name: true, completion_date: true },
                },
            };
            value = mode === 'revoked' ? 1 : 2;
            offline = mode === 'offline';
            await expect(prepared.approve(picks)).rejects.toThrow(
                /no longer eligible|status unavailable/
            );
            expect(wallet.invoke.presentSdJwtVc).not.toHaveBeenCalled();
            const refreshed = await buildAccountInventory(wallet, inventory, 'Credential');
            expect(refreshed.entries).toHaveLength(offline ? 1 : 0);
            expect(refreshed.retryRequired).toBe(offline);
            if (mode === 'revoked') return;
            offline = false;
            value = 0;
            const response = JSON.parse(await prepared.approve(picks));
            expect(wallet.invoke.presentSdJwtVc).toHaveBeenCalledOnce();
            await expect(
                verifyPresentation(response.data.vp_token.course[0], origin, 'status-nonce')
            ).resolves.toMatchObject({ course_name: fixture.template.claims.course_name });
            expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(5);
        }
    );
});
