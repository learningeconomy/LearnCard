import { buildPresentation, BuildPresentationError } from './present';
import { PresentationDefinition } from './types';

/* ---------------------------------- fixtures --------------------------------- */

const base64UrlEncode = (input: string): string =>
    Buffer.from(input, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

const buildJwtVc = (vcBody: unknown, iss = 'did:web:issuer'): string => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64UrlEncode(JSON.stringify({ vc: vcBody, iss }));
    return `${header}.${payload}.signature-placeholder`;
};

const degreeLdp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'did:web:university.example',
    credentialSubject: { id: 'did:jwk:holder', degree: { type: 'BachelorDegree' } },
    proof: { type: 'Ed25519Signature2020' },
};

const licenseLdp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'DriversLicenseCredential'],
    issuer: 'did:web:dmv.example',
    credentialSubject: { id: 'did:jwk:holder', licenseNumber: 'DL-42' },
    proof: { type: 'DataIntegrityProof' },
};

const degreeJwt = buildJwtVc({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    credentialSubject: { id: 'did:jwk:holder' },
});

/** Mirrors the shape `try-offer --save` writes: normalized W3C VC wrapping a compact JWS. */
const degreeJwtWrapped = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: { id: 'did:web:issuer' },
    credentialSubject: { id: 'did:jwk:holder' },
    proof: { type: 'JwtProof2020', jwt: degreeJwt },
};

const HOLDER = 'did:jwk:holder';

const degreeDescriptor = {
    id: 'degree',
    name: 'University Degree',
    constraints: {
        fields: [
            {
                path: ['$.type', '$.vc.type'],
                filter: { type: 'array', contains: { const: 'UniversityDegreeCredential' } },
            },
        ],
    },
};

const licenseDescriptor = {
    id: 'license',
    name: 'Drivers License',
    constraints: {
        fields: [
            {
                path: ['$.type', '$.vc.type'],
                filter: { type: 'array', contains: { const: 'DriversLicenseCredential' } },
            },
        ],
    },
};

const fixedMakeId = (seeds: string[]): (() => string) => {
    let i = 0;
    return () => seeds[i++ % seeds.length];
};

/* ------------------------------- tests: happy paths ------------------------- */

describe('buildPresentation — ldp_vp envelope', () => {
    const pd: PresentationDefinition = {
        id: 'pd-identity',
        format: { ldp_vp: { proof_type: ['Ed25519Signature2020'] } },
        input_descriptors: [degreeDescriptor, licenseDescriptor],
    };

    it('builds a VCDM-compliant unsigned VP for two ldp_vc picks', () => {
        const result = buildPresentation({
            pd,
            chosen: [
                { descriptorId: 'degree', candidate: { credential: degreeLdp } },
                { descriptorId: 'license', candidate: { credential: licenseLdp } },
            ],
            holder: HOLDER,
            makeId: fixedMakeId(['sub-id', 'pid']),
        });

        expect(result.vpFormat).toBe('ldp_vp');
        expect(result.innerFormats).toEqual(['ldp_vc', 'ldp_vc']);

        expect(result.unsignedVp['@context']).toEqual([
            'https://www.w3.org/2018/credentials/v1',
        ]);
        expect(result.unsignedVp.type).toEqual(['VerifiablePresentation']);
        expect(result.unsignedVp.holder).toBe(HOLDER);
        expect(result.unsignedVp.id).toMatch(/^urn:uuid:[0-9a-f-]+$/);

        // VCs embedded verbatim as JSON objects, in pick order.
        expect(result.unsignedVp.verifiableCredential).toEqual([degreeLdp, licenseLdp]);
    });

    it('emits a PresentationSubmission with $.verifiableCredential[N] paths', () => {
        const result = buildPresentation({
            pd,
            chosen: [
                { descriptorId: 'degree', candidate: { credential: degreeLdp } },
                { descriptorId: 'license', candidate: { credential: licenseLdp } },
            ],
            holder: HOLDER,
            submissionId: 'sub-fixed',
        });

        expect(result.submission).toEqual({
            id: 'sub-fixed',
            definition_id: 'pd-identity',
            descriptor_map: [
                {
                    id: 'degree',
                    format: 'ldp_vc',
                    path: '$.verifiableCredential[0]',
                },
                {
                    id: 'license',
                    format: 'ldp_vc',
                    path: '$.verifiableCredential[1]',
                },
            ],
        });
    });
});

describe('buildPresentation — jwt_vp_json envelope', () => {
    const pd: PresentationDefinition = {
        id: 'pd-jwt',
        format: { jwt_vp_json: { alg: ['EdDSA', 'ES256'] } },
        input_descriptors: [degreeDescriptor],
    };

    it('unwraps a W3C-wrapped JWT-VC to its compact JWS before embedding', () => {
        const result = buildPresentation({
            pd,
            chosen: [
                { descriptorId: 'degree', candidate: { credential: degreeJwtWrapped } },
            ],
            holder: HOLDER,
        });

        expect(result.vpFormat).toBe('jwt_vp_json');
        expect(result.innerFormats).toEqual(['jwt_vc_json']);
        expect(result.unsignedVp.verifiableCredential).toEqual([degreeJwt]);
    });

    it('passes a compact JWS string through unchanged', () => {
        const result = buildPresentation({
            pd,
            chosen: [
                {
                    descriptorId: 'degree',
                    candidate: { credential: degreeJwt, format: 'jwt_vc_json' },
                },
            ],
            holder: HOLDER,
        });

        expect(result.unsignedVp.verifiableCredential).toEqual([degreeJwt]);
    });

    it('emits paths rooted at $.vp.verifiableCredential[N]', () => {
        const result = buildPresentation({
            pd,
            chosen: [
                { descriptorId: 'degree', candidate: { credential: degreeJwt } },
            ],
            holder: HOLDER,
            submissionId: 'sub-jwt',
        });

        expect(result.submission.descriptor_map[0]).toEqual({
            id: 'degree',
            format: 'jwt_vc_json',
            path: '$.vp.verifiableCredential[0]',
        });
    });
});

/* ------------------------------ envelope inference -------------------------- */

describe('envelope format inference', () => {
    it('uses jwt_vp_json when pd.format declares only jwt_vp_json', () => {
        const pd: PresentationDefinition = {
            id: 'pd-jwt-only',
            format: { jwt_vp_json: { alg: ['EdDSA'] } },
            input_descriptors: [degreeDescriptor],
        };

        // Even though the candidate is ldp_vc, the PD insists on
        // jwt_vp_json so we defer to the verifier's declared format.
        // (Slice 7b will fail to sign — callers should filter their
        // candidate list against pd.format upstream.)
        const result = buildPresentation({
            pd,
            chosen: [{ descriptorId: 'degree', candidate: { credential: degreeLdp } }],
            holder: HOLDER,
        });

        expect(result.vpFormat).toBe('jwt_vp_json');
    });

    it('uses ldp_vp when pd.format declares only ldp_vp', () => {
        const pd: PresentationDefinition = {
            id: 'pd-ldp-only',
            format: { ldp_vp: { proof_type: ['Ed25519Signature2020'] } },
            input_descriptors: [degreeDescriptor],
        };

        const result = buildPresentation({
            pd,
            chosen: [{ descriptorId: 'degree', candidate: { credential: degreeJwt } }],
            holder: HOLDER,
        });

        expect(result.vpFormat).toBe('ldp_vp');
    });

    it('matches inner format when pd.format allows both VP formats', () => {
        const pd: PresentationDefinition = {
            id: 'pd-either',
            format: {
                jwt_vp_json: { alg: ['EdDSA'] },
                ldp_vp: { proof_type: ['Ed25519Signature2020'] },
            },
            input_descriptors: [degreeDescriptor],
        };

        expect(
            buildPresentation({
                pd,
                chosen: [{ descriptorId: 'degree', candidate: { credential: degreeJwt } }],
                holder: HOLDER,
            }).vpFormat
        ).toBe('jwt_vp_json');

        expect(
            buildPresentation({
                pd,
                chosen: [{ descriptorId: 'degree', candidate: { credential: degreeLdp } }],
                holder: HOLDER,
            }).vpFormat
        ).toBe('ldp_vp');
    });

    it('falls back to ldp_vp for mixed inner formats when pd.format is silent', () => {
        const pd: PresentationDefinition = {
            id: 'pd-silent',
            input_descriptors: [degreeDescriptor, licenseDescriptor],
        };

        const result = buildPresentation({
            pd,
            chosen: [
                { descriptorId: 'degree', candidate: { credential: degreeJwt } },
                { descriptorId: 'license', candidate: { credential: licenseLdp } },
            ],
            holder: HOLDER,
        });

        expect(result.vpFormat).toBe('ldp_vp');
        // Inner formats preserved per-descriptor; the outer envelope is
        // ldp_vp but the descriptor_map entries are still discriminated.
        expect(result.submission.descriptor_map.map(d => d.format)).toEqual([
            'jwt_vc_json',
            'ldp_vc',
        ]);
    });

    it('honours the explicit envelopeFormat override regardless of pd.format', () => {
        const pd: PresentationDefinition = {
            id: 'pd-override',
            format: { jwt_vp_json: { alg: ['EdDSA'] } },
            input_descriptors: [degreeDescriptor],
        };

        const result = buildPresentation({
            pd,
            chosen: [{ descriptorId: 'degree', candidate: { credential: degreeJwt } }],
            holder: HOLDER,
            envelopeFormat: 'ldp_vp',
        });

        expect(result.vpFormat).toBe('ldp_vp');
        expect(result.submission.descriptor_map[0].path).toBe(
            '$.verifiableCredential[0]'
        );
    });
});

/* ------------------------------ error handling ----------------------------- */

describe('buildPresentation — input validation', () => {
    const pd: PresentationDefinition = {
        id: 'pd-1',
        input_descriptors: [degreeDescriptor],
    };

    it('throws no_selections on an empty pick list', () => {
        expect(() =>
            buildPresentation({ pd, chosen: [], holder: HOLDER })
        ).toThrow(BuildPresentationError);

        try {
            buildPresentation({ pd, chosen: [], holder: HOLDER });
        } catch (e) {
            expect((e as BuildPresentationError).code).toBe('no_selections');
        }
    });

    it('throws unknown_descriptor when a pick references a missing id', () => {
        expect(() =>
            buildPresentation({
                pd,
                chosen: [
                    { descriptorId: 'not-in-pd', candidate: { credential: degreeLdp } },
                ],
                holder: HOLDER,
            })
        ).toThrow(/unknown descriptor "not-in-pd"/);
    });

    it('throws unknown_credential_format when the format cannot be inferred', () => {
        expect(() =>
            buildPresentation({
                pd,
                chosen: [
                    {
                        descriptorId: 'degree',
                        // No proof → inferCredentialFormat returns undefined.
                        candidate: { credential: { type: ['VerifiableCredential'] } },
                    },
                ],
                holder: HOLDER,
            })
        ).toThrow(/no detectable format/);
    });

    it('throws invalid_jwt_vc when a jwt_vc_json candidate has no extractable JWS', () => {
        expect(() =>
            buildPresentation({
                pd,
                chosen: [
                    {
                        descriptorId: 'degree',
                        candidate: {
                            // Declared jwt_vc_json but shape is neither a JWS
                            // string nor has a proof.jwt — nothing to embed.
                            credential: { foo: 'bar' },
                            format: 'jwt_vc_json',
                        },
                    },
                ],
                holder: HOLDER,
            })
        ).toThrow(/no compact JWS/);
    });
});

/* ----------------------------- id generation ------------------------------- */

describe('buildPresentation — id generation', () => {
    const pd: PresentationDefinition = {
        id: 'pd-ids',
        input_descriptors: [degreeDescriptor],
    };

    it('respects submissionId and presentationId overrides', () => {
        const result = buildPresentation({
            pd,
            chosen: [{ descriptorId: 'degree', candidate: { credential: degreeLdp } }],
            holder: HOLDER,
            submissionId: 'my-submission',
            presentationId: 'urn:uuid:11111111-1111-1111-1111-111111111111',
        });

        expect(result.submission.id).toBe('my-submission');
        expect(result.unsignedVp.id).toBe(
            'urn:uuid:11111111-1111-1111-1111-111111111111'
        );
    });

    it('auto-generates a v4-shaped UUID for the presentation id', () => {
        const result = buildPresentation({
            pd,
            chosen: [{ descriptorId: 'degree', candidate: { credential: degreeLdp } }],
            holder: HOLDER,
        });

        // Canonical v4 UUID shape: 8-4-4-4-12 hex digits, version nibble
        // `4`, variant nibble 8 | 9 | a | b.
        expect(result.unsignedVp.id).toMatch(
            /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
    });
});
