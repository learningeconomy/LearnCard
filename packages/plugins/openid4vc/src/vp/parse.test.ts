import {
    parseAuthorizationRequestUri,
    resolvePresentationDefinitionByReference,
    resolveAuthorizationRequest,
} from './parse';
import { VpError } from './types';

const minimalPd = {
    id: 'pd-1',
    input_descriptors: [
        {
            id: 'desc-1',
            constraints: {
                fields: [{ path: ['$.type'] }],
            },
        },
    ],
};

const buildByValueUri = (overrides: Record<string, string> = {}): string => {
    const params = new URLSearchParams({
        client_id: 'https://verifier.example.com',
        nonce: 'nonce-abc',
        response_type: 'vp_token',
        response_uri: 'https://verifier.example.com/callback',
        response_mode: 'direct_post',
        presentation_definition: JSON.stringify(minimalPd),
        ...overrides,
    });

    return `openid4vp://?${params.toString()}`;
};

describe('parseAuthorizationRequestUri', () => {
    describe('by-value requests', () => {
        it('parses a minimal well-formed openid4vp:// URI', () => {
            const parsed = parseAuthorizationRequestUri(buildByValueUri());

            expect(parsed.kind).toBe('by_value');

            if (parsed.kind !== 'by_value') throw new Error('unreachable');

            expect(parsed.request).toMatchObject({
                client_id: 'https://verifier.example.com',
                nonce: 'nonce-abc',
                response_type: 'vp_token',
                response_mode: 'direct_post',
                response_uri: 'https://verifier.example.com/callback',
            });
            expect(parsed.request.presentation_definition?.id).toBe('pd-1');
            expect(parsed.request.presentation_definition?.input_descriptors).toHaveLength(1);
        });

        it('accepts haip:// scheme (EUDI deeplinks)', () => {
            const uri = buildByValueUri().replace(/^openid4vp:/, 'haip:');

            const parsed = parseAuthorizationRequestUri(uri);

            expect(parsed.kind).toBe('by_value');
        });

        it('accepts openid-vc:// scheme (legacy Draft 11/13)', () => {
            const uri = buildByValueUri().replace(/^openid4vp:/, 'openid-vc:');

            const parsed = parseAuthorizationRequestUri(uri);

            expect(parsed.kind).toBe('by_value');
        });

        it('accepts https:// verifier URLs', () => {
            const params = new URLSearchParams({
                client_id: 'https://verifier.example.com',
                nonce: 'n',
                response_type: 'vp_token',
                response_uri: 'https://verifier.example.com/cb',
                response_mode: 'direct_post',
                presentation_definition: JSON.stringify(minimalPd),
            });

            const parsed = parseAuthorizationRequestUri(
                `https://verifier.example.com/authorize?${params.toString()}`
            );

            expect(parsed.kind).toBe('by_value');
        });

        it('preserves unknown params under `extra` for direct_post echo', () => {
            const parsed = parseAuthorizationRequestUri(
                buildByValueUri({ custom_field: 'x', another: 'y' })
            );

            if (parsed.kind !== 'by_value') throw new Error('unreachable');

            expect(parsed.request.extra).toEqual({ custom_field: 'x', another: 'y' });
        });

        it('honours legacy redirect_uri when response_uri is absent', () => {
            const params = new URLSearchParams({
                client_id: 'https://verifier.example.com',
                nonce: 'n',
                response_type: 'vp_token',
                redirect_uri: 'https://verifier.example.com/legacy',
                presentation_definition: JSON.stringify(minimalPd),
            });

            const parsed = parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`);

            if (parsed.kind !== 'by_value') throw new Error('unreachable');
            expect(parsed.request.redirect_uri).toBe('https://verifier.example.com/legacy');
            expect(parsed.request.response_uri).toBeUndefined();
        });

        it('carries presentation_definition_uri through without fetching', () => {
            const params = new URLSearchParams({
                client_id: 'https://verifier.example.com',
                nonce: 'n',
                response_type: 'vp_token',
                response_uri: 'https://verifier.example.com/cb',
                presentation_definition_uri: 'https://verifier.example.com/pd.json',
            });

            const parsed = parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`);

            if (parsed.kind !== 'by_value') throw new Error('unreachable');

            expect(parsed.request.presentation_definition).toBeUndefined();
            expect(parsed.request.presentation_definition_uri).toBe(
                'https://verifier.example.com/pd.json'
            );
        });

        it('accepts scope without a presentation_definition (SIOPv2 pre-registered)', () => {
            const params = new URLSearchParams({
                client_id: 'https://verifier.example.com',
                nonce: 'n',
                response_type: 'vp_token id_token',
                response_uri: 'https://verifier.example.com/cb',
                scope: 'openid UniversityDegree',
            });

            const parsed = parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`);

            expect(parsed.kind).toBe('by_value');
        });

        it('parses client_metadata inline JSON', () => {
            const metadata = {
                vp_formats: { jwt_vp: { alg: ['EdDSA', 'ES256'] } },
                subject_syntax_types_supported: ['did:key', 'did:jwk'],
            };

            const parsed = parseAuthorizationRequestUri(
                buildByValueUri({ client_metadata: JSON.stringify(metadata) })
            );

            if (parsed.kind !== 'by_value') throw new Error('unreachable');
            expect(parsed.request.client_metadata).toEqual(metadata);
        });
    });

    describe('signed Request Objects (Slice 7 surface)', () => {
        it('returns by_reference_request_uri when request_uri is present', () => {
            const parsed = parseAuthorizationRequestUri(
                'openid4vp://?client_id=x&request_uri=https%3A%2F%2Fverifier.example.com%2Freq.jwt'
            );

            expect(parsed.kind).toBe('by_reference_request_uri');
            if (parsed.kind !== 'by_reference_request_uri') throw new Error('unreachable');
            expect(parsed.requestUri).toBe('https://verifier.example.com/req.jwt');
        });

        it('rejects a non-https request_uri up front', () => {
            expect(() =>
                parseAuthorizationRequestUri(
                    'openid4vp://?client_id=x&request_uri=http%3A%2F%2Fverifier.example.com%2Freq'
                )
            ).toThrow(
                expect.objectContaining({
                    code: 'invalid_uri',
                    message: expect.stringContaining('https'),
                })
            );
        });

        it('returns by_reference_request_jwt when request param is inline JWS', () => {
            const parsed = parseAuthorizationRequestUri(
                'openid4vp://?client_id=x&request=eyJ.header.payload.signature'
            );

            expect(parsed.kind).toBe('by_reference_request_jwt');
            if (parsed.kind !== 'by_reference_request_jwt') throw new Error('unreachable');
            expect(parsed.jwt).toBe('eyJ.header.payload.signature');
        });

        it('skips inline-param validation when a signed Request Object is present', () => {
            // No client_id, no nonce, no response_type — but request_uri
            // means the wallet is supposed to ignore these anyway.
            const parsed = parseAuthorizationRequestUri(
                'openid4vp://?request_uri=https%3A%2F%2Fverifier.example.com%2Freq.jwt'
            );

            expect(parsed.kind).toBe('by_reference_request_uri');
        });
    });

    describe('error paths', () => {
        it('throws invalid_uri on empty input', () => {
            expect(() => parseAuthorizationRequestUri('')).toThrow(
                expect.objectContaining({ code: 'invalid_uri' })
            );
            expect(() => parseAuthorizationRequestUri('   ')).toThrow(
                expect.objectContaining({ code: 'invalid_uri' })
            );
        });

        it('throws invalid_uri when there is no query string', () => {
            expect(() => parseAuthorizationRequestUri('openid4vp://')).toThrow(
                expect.objectContaining({ code: 'invalid_uri' })
            );
        });

        it('throws missing_client_id when client_id is absent', () => {
            const params = new URLSearchParams({
                nonce: 'n',
                response_type: 'vp_token',
                response_uri: 'https://x/cb',
                presentation_definition: JSON.stringify(minimalPd),
            });

            expect(() =>
                parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`)
            ).toThrow(expect.objectContaining({ code: 'missing_client_id' }));
        });

        it('throws missing_nonce when nonce is absent', () => {
            const params = new URLSearchParams({
                client_id: 'https://x',
                response_type: 'vp_token',
                response_uri: 'https://x/cb',
                presentation_definition: JSON.stringify(minimalPd),
            });

            expect(() =>
                parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`)
            ).toThrow(expect.objectContaining({ code: 'missing_nonce' }));
        });

        it('throws missing_response_type when response_type is absent', () => {
            const params = new URLSearchParams({
                client_id: 'https://x',
                nonce: 'n',
                response_uri: 'https://x/cb',
                presentation_definition: JSON.stringify(minimalPd),
            });

            expect(() =>
                parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`)
            ).toThrow(expect.objectContaining({ code: 'missing_response_type' }));
        });

        it('throws unsupported_response_type for code / token grants', () => {
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({ response_type: 'code' })
                )
            ).toThrow(expect.objectContaining({ code: 'unsupported_response_type' }));
        });

        it('throws missing_response_target when neither response_uri nor redirect_uri present', () => {
            const params = new URLSearchParams({
                client_id: 'https://x',
                nonce: 'n',
                response_type: 'vp_token',
                presentation_definition: JSON.stringify(minimalPd),
            });

            expect(() =>
                parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`)
            ).toThrow(expect.objectContaining({ code: 'missing_response_target' }));
        });

        it('throws both_definition_and_uri when both are supplied', () => {
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({
                        presentation_definition_uri: 'https://x/pd.json',
                    })
                )
            ).toThrow(expect.objectContaining({ code: 'both_definition_and_uri' }));
        });

        it('throws missing_presentation_definition when nothing identifies a PD', () => {
            const params = new URLSearchParams({
                client_id: 'https://x',
                nonce: 'n',
                response_type: 'vp_token',
                response_uri: 'https://x/cb',
            });

            expect(() =>
                parseAuthorizationRequestUri(`openid4vp://?${params.toString()}`)
            ).toThrow(expect.objectContaining({ code: 'missing_presentation_definition' }));
        });

        it('throws invalid_json when presentation_definition is malformed', () => {
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({ presentation_definition: '{not json' })
                )
            ).toThrow(expect.objectContaining({ code: 'invalid_json' }));
        });

        it('throws invalid_presentation_definition for structural issues', () => {
            // Missing input_descriptors.
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({
                        presentation_definition: JSON.stringify({ id: 'x' }),
                    })
                )
            ).toThrow(expect.objectContaining({ code: 'invalid_presentation_definition' }));

            // Input descriptor missing id.
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({
                        presentation_definition: JSON.stringify({
                            id: 'x',
                            input_descriptors: [{ constraints: {} }],
                        }),
                    })
                )
            ).toThrow(expect.objectContaining({ code: 'invalid_presentation_definition' }));

            // Input descriptor missing constraints.
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({
                        presentation_definition: JSON.stringify({
                            id: 'x',
                            input_descriptors: [{ id: 'd' }],
                        }),
                    })
                )
            ).toThrow(expect.objectContaining({ code: 'invalid_presentation_definition' }));
        });

        it('throws invalid_json when client_metadata is malformed', () => {
            expect(() =>
                parseAuthorizationRequestUri(
                    buildByValueUri({ client_metadata: '{not json' })
                )
            ).toThrow(expect.objectContaining({ code: 'invalid_json' }));
        });
    });
});

describe('resolvePresentationDefinitionByReference', () => {
    const mockResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
        ({
            ok: init.ok ?? true,
            status: init.status ?? 200,
            statusText: 'OK',
            json: async () => body,
        } as unknown as Response);

    it('fetches and validates a remote presentation_definition', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(minimalPd));

        const pd = await resolvePresentationDefinitionByReference(
            'https://verifier.example.com/pd.json',
            fetchMock as unknown as typeof fetch
        );

        expect(pd.id).toBe('pd-1');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://verifier.example.com/pd.json',
            { method: 'GET' }
        );
    });

    it('rejects a non-https uri up front (no fetch call)', async () => {
        const fetchMock = jest.fn();

        await expect(
            resolvePresentationDefinitionByReference(
                'http://verifier.example.com/pd.json',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'invalid_uri' });

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces HTTP errors as presentation_definition_fetch_failed', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            mockResponse({}, { ok: false, status: 404 })
        );

        await expect(
            resolvePresentationDefinitionByReference(
                'https://verifier.example.com/pd.json',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({
            code: 'presentation_definition_fetch_failed',
            message: expect.stringContaining('404'),
        });
    });

    it('surfaces network errors as presentation_definition_fetch_failed', async () => {
        const fetchMock = jest.fn().mockRejectedValue(new Error('timeout'));

        await expect(
            resolvePresentationDefinitionByReference(
                'https://verifier.example.com/pd.json',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({
            code: 'presentation_definition_fetch_failed',
            message: expect.stringContaining('timeout'),
        });
    });

    it('surfaces invalid JSON bodies as invalid_json', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => {
                throw new Error('not json');
            },
        } as unknown as Response);

        await expect(
            resolvePresentationDefinitionByReference(
                'https://verifier.example.com/pd.json',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'invalid_json' });
    });

    it('throws invalid_presentation_definition on malformed remote PD', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse({ id: 'x' }));

        await expect(
            resolvePresentationDefinitionByReference(
                'https://verifier.example.com/pd.json',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'invalid_presentation_definition' });
    });
});

describe('resolveAuthorizationRequest', () => {
    const mockResponse = (body: unknown) =>
        ({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => body,
        } as unknown as Response);

    it('returns the by-value request unchanged when presentation_definition is inline', async () => {
        const fetchMock = jest.fn();

        const request = await resolveAuthorizationRequest(
            buildByValueUri(),
            fetchMock as unknown as typeof fetch
        );

        expect(request.presentation_definition?.id).toBe('pd-1');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches presentation_definition_uri and inlines the PD', async () => {
        const fetchMock = jest.fn().mockResolvedValue(mockResponse(minimalPd));

        const params = new URLSearchParams({
            client_id: 'https://x',
            nonce: 'n',
            response_type: 'vp_token',
            response_uri: 'https://x/cb',
            presentation_definition_uri: 'https://verifier.example.com/pd.json',
        });

        const request = await resolveAuthorizationRequest(
            `openid4vp://?${params.toString()}`,
            fetchMock as unknown as typeof fetch
        );

        expect(request.presentation_definition?.id).toBe('pd-1');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://verifier.example.com/pd.json',
            { method: 'GET' }
        );
    });

    it('routes signed Request Objects through verifyAndDecodeRequestObject (Slice 7.5)', async () => {
        // request_uri path: the resolver should now attempt to fetch
        // the JWS. Our mock returns a non-JWS body, so the Slice 7.5
        // module surfaces a typed RequestObjectError — NOT the old
        // request_object_not_supported VpError.
        const fetchMock = jest.fn(
            async () =>
                ({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({ 'content-type': 'text/plain' }),
                    text: async () => 'not-a-jws',
                } as Response)
        ) as unknown as typeof fetch;

        await expect(
            resolveAuthorizationRequest(
                'openid4vp://?request_uri=https%3A%2F%2Fverifier.example.com%2Freq.jwt',
                fetchMock
            )
        ).rejects.toMatchObject({
            name: 'RequestObjectError',
            code: 'invalid_request_object',
        });

        // Inline `request=<jws>` path: the string "eyJ.header.payload.sig"
        // is not a structurally valid compact JWS (non-base64url chars),
        // so the module rejects it before any crypto work.
        await expect(
            resolveAuthorizationRequest(
                'openid4vp://?request=eyJ.header.payload.sig',
                fetchMock
            )
        ).rejects.toMatchObject({
            name: 'RequestObjectError',
            code: 'invalid_request_object',
        });
    });
});

describe('VpError shape', () => {
    it('attaches a stable code field', () => {
        try {
            parseAuthorizationRequestUri('');
        } catch (e) {
            expect(e).toBeInstanceOf(VpError);
            expect((e as VpError).code).toBe('invalid_uri');
            expect((e as VpError).name).toBe('VpError');
        }
    });
});
