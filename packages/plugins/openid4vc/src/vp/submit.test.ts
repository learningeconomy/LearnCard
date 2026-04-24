import { submitPresentation, VpSubmitError } from './submit';
import { PresentationSubmission } from './select';

/* ---------------------------------- fixtures --------------------------------- */

const RESPONSE_URI = 'https://verifier.example/openid4vc/verify/session-123';

const submission: PresentationSubmission = {
    id: 'sub-1',
    definition_id: 'pd-1',
    descriptor_map: [
        {
            id: 'degree',
            format: 'jwt_vc_json',
            path: '$.verifiableCredential[0]',
        },
    ],
};

type FetchArgs = { input: string; init: RequestInit };

const mockFetchOk = (
    body: unknown,
    init: { contentType?: string; status?: number } = {}
): { fetchImpl: typeof fetch; calls: FetchArgs[] } => {
    const calls: FetchArgs[] = [];
    const fetchImpl = jest.fn(async (input: RequestInfo | URL, reqInit?: RequestInit) => {
        calls.push({ input: String(input), init: reqInit ?? {} });

        const contentType = init.contentType ?? 'application/json';
        const text =
            body === undefined
                ? ''
                : typeof body === 'string'
                ? body
                : JSON.stringify(body);

        return {
            ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
            status: init.status ?? 200,
            statusText: 'OK',
            headers: new Headers({ 'content-type': contentType }),
            text: async () => text,
        } as Response;
    }) as unknown as typeof fetch;

    return { fetchImpl, calls };
};

const parseForm = (body: string): Record<string, string> =>
    Object.fromEntries(new URLSearchParams(body).entries());

/* ------------------------------------ tests --------------------------------- */

describe('submitPresentation — happy paths', () => {
    it('POSTs form-urlencoded vp_token (string) + presentation_submission + state', async () => {
        const { fetchImpl, calls } = mockFetchOk({ redirect_uri: 'openid4vp://ok' });

        const result = await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: 'header.payload.signature',
            submission,
            state: 'session-state-xyz',
            fetchImpl,
        });

        expect(calls).toHaveLength(1);
        expect(calls[0].input).toBe(RESPONSE_URI);
        expect(calls[0].init.method).toBe('POST');
        expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBe(
            'application/x-www-form-urlencoded'
        );

        const form = parseForm(calls[0].init.body as string);
        expect(form.vp_token).toBe('header.payload.signature');
        expect(JSON.parse(form.presentation_submission)).toEqual(submission);
        expect(form.state).toBe('session-state-xyz');

        expect(result.status).toBe(200);
        expect(result.redirectUri).toBe('openid4vp://ok');
        expect(result.body).toEqual({ redirect_uri: 'openid4vp://ok' });
    });

    it('JSON-stringifies object-shaped vp_tokens (ldp_vp path)', async () => {
        const { fetchImpl, calls } = mockFetchOk({});

        const ldpVp = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: 'did:jwk:holder',
            verifiableCredential: [],
            proof: { type: 'Ed25519Signature2020', proofValue: 'z-fake' },
        };

        await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: ldpVp as unknown as import('./sign').VpToken,
            submission,
            fetchImpl,
        });

        const form = parseForm(calls[0].init.body as string);
        expect(JSON.parse(form.vp_token)).toEqual(ldpVp);
    });

    it('omits state when none is supplied', async () => {
        const { fetchImpl, calls } = mockFetchOk(undefined);

        await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: 'h.p.s',
            submission,
            fetchImpl,
        });

        const form = parseForm(calls[0].init.body as string);
        expect(form).not.toHaveProperty('state');
    });

    it('returns body=undefined on 200 with empty response', async () => {
        const { fetchImpl } = mockFetchOk(undefined);

        const result = await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: 'h.p.s',
            submission,
            fetchImpl,
        });

        expect(result.status).toBe(200);
        expect(result.body).toBeUndefined();
        expect(result.redirectUri).toBeUndefined();
    });

    it('opportunistically parses JSON even when content-type is wrong', async () => {
        const { fetchImpl } = mockFetchOk(
            { redirect_uri: 'https://verifier.example/done' },
            { contentType: 'text/plain' }
        );

        const result = await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: 'h.p.s',
            submission,
            fetchImpl,
        });

        expect(result.redirectUri).toBe('https://verifier.example/done');
    });

    it('preserves non-JSON bodies verbatim as strings', async () => {
        const { fetchImpl } = mockFetchOk('plain text success', { contentType: 'text/plain' });

        const result = await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: 'h.p.s',
            submission,
            fetchImpl,
        });

        expect(result.body).toBe('plain text success');
        expect(result.redirectUri).toBeUndefined();
    });

    it('sets an Accept header advertising JSON preference', async () => {
        const { fetchImpl, calls } = mockFetchOk(undefined);

        await submitPresentation({
            responseUri: RESPONSE_URI,
            vpToken: 'h.p.s',
            submission,
            fetchImpl,
        });

        expect((calls[0].init.headers as Record<string, string>).Accept).toMatch(/json/);
    });
});

/* ----------------------------- error handling ------------------------------- */

describe('submitPresentation — error handling', () => {
    it('throws invalid_input for an empty responseUri', async () => {
        await expect(
            submitPresentation({
                responseUri: '',
                vpToken: 'h.p.s',
                submission,
            })
        ).rejects.toMatchObject({ code: 'invalid_input' });
    });

    it('throws no_fetch when fetch is unavailable and not supplied', async () => {
        const originalFetch = globalThis.fetch;
        (globalThis as { fetch?: typeof fetch }).fetch = undefined;

        try {
            await expect(
                submitPresentation({
                    responseUri: RESPONSE_URI,
                    vpToken: 'h.p.s',
                    submission,
                })
            ).rejects.toMatchObject({ code: 'no_fetch' });
        } finally {
            (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
        }
    });

    it('throws network_error when fetch rejects', async () => {
        const fetchImpl: typeof fetch = jest.fn(async () => {
            throw new Error('ECONNRESET');
        }) as unknown as typeof fetch;

        await expect(
            submitPresentation({
                responseUri: RESPONSE_URI,
                vpToken: 'h.p.s',
                submission,
                fetchImpl,
            })
        ).rejects.toMatchObject({ code: 'network_error' });
    });

    it('throws server_error with status + body on a 4xx response', async () => {
        const { fetchImpl } = mockFetchOk(
            { error: 'invalid_presentation', error_description: 'bad signature' },
            { status: 400 }
        );

        try {
            await submitPresentation({
                responseUri: RESPONSE_URI,
                vpToken: 'h.p.s',
                submission,
                fetchImpl,
            });
            throw new Error('expected submitPresentation to throw');
        } catch (e) {
            expect(e).toBeInstanceOf(VpSubmitError);
            const err = e as VpSubmitError;
            expect(err.code).toBe('server_error');
            expect(err.status).toBe(400);
            expect(err.body).toEqual({
                error: 'invalid_presentation',
                error_description: 'bad signature',
            });
        }
    });

    it('throws server_error with status on a 500 with empty body', async () => {
        const { fetchImpl } = mockFetchOk(undefined, { status: 500 });

        try {
            await submitPresentation({
                responseUri: RESPONSE_URI,
                vpToken: 'h.p.s',
                submission,
                fetchImpl,
            });
            throw new Error('expected submitPresentation to throw');
        } catch (e) {
            const err = e as VpSubmitError;
            expect(err.code).toBe('server_error');
            expect(err.status).toBe(500);
        }
    });
});
