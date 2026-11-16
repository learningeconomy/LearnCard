import { describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, jwtVerify } from 'jose';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { sdJwtVcCourseCompletion } from '../../../../credential-library/src/fixtures/sd-jwt-vc/course-completion';
import { createEd25519KbSigner } from '../../../sd-jwt-vc/src/signer';
import { sha256Hasher } from '../../../sd-jwt-vc/src/hasher';
import { randomSalt } from '../../../sd-jwt-vc/src/salt';
import { presentSdJwtVc } from '../../../sd-jwt-vc/src/present';
import { parseSdJwtVc } from '../../../sd-jwt-vc/src/parse';
import { selectCredentialsForDcql } from '../dcql/select';
import { getOpenID4VCPlugin } from '../plugin';
import type { OpenID4VCDependentLearnCard } from '../types';
import { createDcApiResponse, DcApiError, parseDcApiRequest, type DcApiRequest } from './dcApi';
import { parseAuthorizationRequestUri } from './parse';

const ORIGIN = 'https://verifier.example';
const fixture = sdJwtVcCourseCompletion.template;
const request = (overrides: Record<string, unknown> = {}): DcApiRequest => ({
    protocol: 'openid4vp-v1-unsigned',
    data: {
        response_type: 'vp_token',
        response_mode: 'dc_api',
        nonce: 'course-nonce',
        dcql_query: {
            credentials: [
                {
                    id: 'course',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: [fixture.vct] },
                    claims: [{ path: ['course_name'] }, { path: ['completion_date'] }],
                },
            ],
        },
        ...overrides,
    },
});

const setup = async () => {
    const issuer = await generateKeyPair('EdDSA', { extractable: true });
    const holder = await generateKeyPair('EdDSA', { extractable: true });
    const privateJwk = await exportJWK(holder.privateKey);
    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer: await createEd25519KbSigner({ privateJwk: await exportJWK(issuer.privateKey) }),
        signAlg: 'EdDSA',
        verifier: async (data, signature) => {
            await jwtVerify(`${data}.${signature}`, issuer.publicKey);
            return true;
        },
        kbVerifier: async (data, signature) => {
            await jwtVerify(`${data}.${signature}`, holder.publicKey, {
                audience: `origin:${ORIGIN}`,
            });
            return true;
        },
    });
    const compact = await instance.issue(
        {
            iss: 'https://issuer.example',
            vct: fixture.vct,
            iat: Math.floor(Date.now() / 1000),
            ...fixture.claims,
            cnf: { jwk: await exportJWK(holder.publicKey) },
        },
        { _sd: fixture.selectivelyDisclosable }
    );
    const presenter = vi.fn((value: string, options: Parameters<typeof presentSdJwtVc>[1]) =>
        presentSdJwtVc(value, {
            ...options,
            verify: async source => {
                await instance.verify(source);
                return { checks: [], warnings: [], errors: [] };
            },
        })
    );
    const learnCard = {
        id: { did: () => 'did:example:holder', keypair: () => privateJwk },
        invoke: { presentSdJwtVc: presenter },
    } as unknown as OpenID4VCDependentLearnCard;
    const fetchImpl = vi.fn<typeof fetch>();
    const plugin = getOpenID4VCPlugin(learnCard, { fetch: fetchImpl });
    const chosen = [
        {
            credentialQueryId: 'course',
            candidate: { credential: compact },
            disclose: { course_name: true, completion_date: true },
        },
    ];
    return { learnCard, plugin, chosen, instance, presenter, fetchImpl, holder };
};

describe('unsigned DC API response profile', () => {
    it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
        'matches and verifies a response for the valid query ID %s',
        async id => {
            const context = await setup();
            const input = request({
                dcql_query: {
                    credentials: [
                        {
                            id,
                            format: 'dc+sd-jwt',
                            meta: { vct_values: [fixture.vct] },
                            claims: [{ path: ['course_name'] }, { path: ['completion_date'] }],
                        },
                    ],
                },
            });
            const parsed = parseDcApiRequest(input, ORIGIN);
            const selection = await selectCredentialsForDcql(
                [context.chosen[0]!.candidate],
                parsed.query,
                { sdJwtParser: parseSdJwtVc }
            );
            expect(selection.canSatisfy).toBe(true);
            expect(Object.hasOwn(selection.matches, id)).toBe(true);
            const response = await context.plugin.methods.createDcApiResponse(
                context.learnCard,
                input,
                ORIGIN,
                [
                    {
                        ...context.chosen[0]!,
                        credentialQueryId: id,
                        candidate: selection.matches[id]!.candidates[0]!,
                    },
                ]
            );
            expect(Object.keys(response.vp_token)).toEqual([id]);
            const serialized = JSON.parse(JSON.stringify(response));
            expect(Object.hasOwn(serialized.vp_token, id)).toBe(true);
            const compact = serialized.vp_token[id][0];
            const verified = await context.instance.verify(compact, {
                keyBindingNonce: parsed.nonce,
            });
            expect(verified.payload.course_name).toBe(fixture.claims.course_name);
            expect(verified.payload.learner_name).toBeUndefined();
        }
    );

    it('matches and presents every claim in the documented Course Completion DCQL request', async () => {
        const context = await setup();
        // LC-1879 Phase 0's documented query includes the array-valued skills claim.
        // https://welibrary.atlassian.net/wiki/spaces/LC/pages/1013219330
        const input = request({
            dcql_query: {
                credentials: [
                    {
                        id: 'course_completion',
                        format: 'dc+sd-jwt',
                        meta: {
                            vct_values: ['https://credentials.learncard.com/vct/course-completion'],
                        },
                        claims: [
                            { path: ['course_name'] },
                            { path: ['completion_date'] },
                            { path: ['skills'] },
                        ],
                    },
                ],
            },
        });
        const parsed = parseDcApiRequest(input, ORIGIN);
        const selection = await selectCredentialsForDcql(
            [context.chosen[0]!.candidate],
            parsed.query,
            { sdJwtParser: parseSdJwtVc }
        );
        expect(selection.canSatisfy).toBe(true);
        expect(selection.matches.course_completion?.candidates).toHaveLength(1);

        const response = await context.plugin.methods.createDcApiResponse(
            context.learnCard,
            input,
            ORIGIN,
            [
                {
                    credentialQueryId: 'course_completion',
                    candidate: selection.matches.course_completion!.candidates[0]!,
                    disclose: { course_name: true, completion_date: true, skills: true },
                },
            ]
        );
        expect(JSON.parse(JSON.stringify(response))).toEqual(response);
        expect(Object.keys(response)).toEqual(['vp_token']);
        expect(Object.keys(response.vp_token)).toEqual(['course_completion']);
        expect(response.vp_token.course_completion).toHaveLength(1);
        const compact = response.vp_token.course_completion![0];
        if (typeof compact !== 'string') throw new Error('Missing SD-JWT presentation');
        const verified = await context.instance.verify(compact, {
            keyBindingNonce: parsed.nonce,
        });
        expect(verified.payload.course_name).toBe(fixture.claims.course_name);
        expect(verified.payload.completion_date).toBe(fixture.claims.completion_date);
        expect(verified.payload.skills).toEqual(fixture.claims.skills);
        expect(verified.payload.learner_name).toBeUndefined();
        expect(context.fetchImpl).not.toHaveBeenCalled();
    });

    it('rejects SD-JWT requests when the host cannot present them', async () => {
        const context = await setup();

        await expect(
            createDcApiResponse(
                parseDcApiRequest(request(), ORIGIN),
                context.chosen,
                context.learnCard.id.did(),
                undefined
            )
        ).rejects.toMatchObject({ code: 'missing_sd_jwt_presenter' });
        expect(context.presenter).not.toHaveBeenCalled();
        expect(context.fetchImpl).not.toHaveBeenCalled();
    });

    it.each([
        undefined,
        {},
        { course_name: true },
        { course_name: true, completion_date: true, learner_name: true },
        { course_name: { private: true }, completion_date: true },
    ])(
        'rejects omitted, incomplete, nested or extra consent frames before signing: %j',
        async disclose => {
            const context = await setup();
            await expect(
                context.plugin.methods.createDcApiResponse(
                    context.learnCard,
                    request(),
                    ORIGIN,
                    // Exercise untyped JS callers too: an omitted frame must fail at runtime.
                    [{ ...context.chosen[0]!, disclose }] as typeof context.chosen
                )
            ).rejects.toMatchObject({ code: 'invalid_request' });
            expect(context.presenter).not.toHaveBeenCalled();
        }
    );

    it.each([undefined, [{ path: ['address', 'street'] }], [{ path: ['address', null] }]])(
        'rejects whole-credential, nested and wildcard requests: %j',
        async claims => {
            const context = await setup();
            const input = request({
                dcql_query: {
                    credentials: [
                        {
                            id: 'course',
                            format: 'dc+sd-jwt',
                            meta: { vct_values: [fixture.vct] },
                            ...(claims ? { claims } : {}),
                        },
                    ],
                },
            });
            await expect(
                context.plugin.methods.createDcApiResponse(
                    context.learnCard,
                    input,
                    ORIGIN,
                    context.chosen
                )
            ).rejects.toMatchObject({ code: 'unsupported_profile' });
            expect(context.presenter).not.toHaveBeenCalled();
        }
    );

    it('accepts a canonical native certificate origin supplied by the trusted transport', () => {
        const origin = `android:apk-key-hash:${Buffer.alloc(32, 1).toString('base64url')}`;
        expect(parseDcApiRequest(request(), origin).audience).toBe(`origin:${origin}`);
    });

    it.each([
        'android:apk-key-hash:short',
        `android:apk-key-hash:${'A'.repeat(42)}B`,
        `android:apk-key-hash:${'A'.repeat(43)}=`,
    ])('rejects malformed certificate origin %s', origin => {
        expect(() => parseDcApiRequest(request(), origin)).toThrow(DcApiError);
    });

    it('returns course completion JSON, ignores request origins, binds nonce/audience, and never fetches', async () => {
        const context = await setup();
        const result = await context.plugin.methods.createDcApiResponse(
            context.learnCard,
            request({
                origin: 'https://attacker.example',
                verifiedOrigin: 'https://attacker.example',
                client_id: 'https://attacker.example',
                response_uri: 'https://attacker.example/post',
            }),
            ORIGIN,
            context.chosen
        );
        expect(Object.keys(result)).toEqual(['vp_token']);
        const compact = result.vp_token.course?.[0];
        expect(typeof compact).toBe('string');
        if (typeof compact !== 'string') throw new Error('Missing SD-JWT presentation');
        const verified = await context.instance.verify(compact, {
            keyBindingNonce: 'course-nonce',
        });
        expect(verified.payload.course_name).toBe(fixture.claims.course_name);
        expect(verified.payload.learner_name).toBeUndefined();
        await expect(
            context.instance.verify(compact, { keyBindingNonce: 'wrong-nonce' })
        ).rejects.toThrow();
        const kbJwt = compact.split('~').at(-1)!;
        await expect(
            jwtVerify(kbJwt, context.holder.publicKey, {
                audience: 'origin:https://attacker.example',
            })
        ).rejects.toThrow();
        expect(context.fetchImpl).not.toHaveBeenCalled();
    });

    it.each([
        undefined,
        '',
        'null',
        'not a URL',
        'http://verifier.example',
        'https://verifier.example/',
        'https://user:pass@verifier.example',
        'https://verifier.example/path',
        'https://verifier.example?x=1',
        'https://verifier.example#fragment',
    ])('rejects invalid trusted origin %s', origin => {
        expect(() => parseDcApiRequest(request({ origin: ORIGIN }), origin!)).toThrow(DcApiError);
        try {
            parseDcApiRequest(request(), origin!);
        } catch (error) {
            expect(error).toMatchObject({ code: 'invalid_origin' });
        }
    });

    it.each([
        { response_type: 'vp_token id_token' },
        { response_mode: 'dc_api.jwt' },
        { response_mode: 'direct_post' },
        { nonce: '' },
        { nonce: ' ' },
        { nonce: undefined },
        { dcql_query: undefined },
        { dcql_query: {} },
        { request: 'signed.jwt' },
        { request_uri: 'https://verifier.example/request' },
        { presentation_definition: {} },
        { transaction_data: ['data'] },
        {
            dcql_query: {
                credentials: [{ id: 'mdoc', format: 'mso_mdoc', meta: { doctype_value: 'test' } }],
            },
        },
        { client_metadata: { authorization_encrypted_response_alg: 'ECDH-ES' } },
    ])('rejects invalid or unsupported profile data %j', overrides => {
        expect(() => parseDcApiRequest(request(overrides), ORIGIN)).toThrow(DcApiError);
    });

    it('rejects signed protocol and malformed envelopes', () => {
        for (const input of [
            null,
            {},
            { ...request(), protocol: 'openid4vp-v1-signed' },
            { ...request(), data: 'encrypted' },
        ]) {
            expect(() => parseDcApiRequest(input, ORIGIN)).toThrow(DcApiError);
        }
    });

    it('accepts target-less DC API data without weakening URI response-target requirements', () => {
        expect(parseDcApiRequest(request(), ORIGIN).audience).toBe(`origin:${ORIGIN}`);
        for (const mode of ['direct_post', 'direct_post.jwt', 'fragment', 'query']) {
            const params = new URLSearchParams({
                client_id: ORIGIN,
                nonce: 'nonce',
                response_type: 'vp_token',
                response_mode: mode,
                dcql_query: JSON.stringify(request().data.dcql_query),
            });
            expect(() => parseAuthorizationRequestUri(`openid4vp://?${params}`)).toThrow(
                expect.objectContaining({ code: 'missing_response_target' })
            );
        }
    });

    it('cancels before signing without fetching', async () => {
        const context = await setup();
        const controller = new AbortController();
        controller.abort();
        await expect(
            context.plugin.methods.createDcApiResponse(
                context.learnCard,
                request(),
                ORIGIN,
                context.chosen,
                { signal: controller.signal }
            )
        ).rejects.toMatchObject({ code: 'cancelled' });
        expect(context.presenter).not.toHaveBeenCalled();
        expect(context.fetchImpl).not.toHaveBeenCalled();
    });

    it('withholds the response if cancelled while signing', async () => {
        const context = await setup();
        const controller = new AbortController();
        context.presenter.mockImplementationOnce(async () => {
            controller.abort();
            return { compact: 'withheld' };
        });
        await expect(
            context.plugin.methods.createDcApiResponse(
                context.learnCard,
                request(),
                ORIGIN,
                context.chosen,
                { signal: controller.signal }
            )
        ).rejects.toMatchObject({ code: 'cancelled' });
        expect(context.fetchImpl).not.toHaveBeenCalled();
    });
});
