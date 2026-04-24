import {
    selectCredentials,
    buildPresentationSubmission,
    inferCredentialFormat,
} from './select';
import { PresentationDefinition } from './types';

/* ---------------------------------- fixtures --------------------------------- */

const degreeVc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'did:web:university.example.com',
    credentialSubject: {
        id: 'did:jwk:holder',
        degree: { type: 'BachelorDegree' },
    },
    proof: { type: 'Ed25519Signature2020' },
};

const licenseVc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'DriversLicenseCredential'],
    issuer: 'did:web:dmv.example.com',
    credentialSubject: {
        id: 'did:jwk:holder',
        licenseNumber: 'DL-42',
    },
    proof: { type: 'DataIntegrityProof' },
};

const employeeVc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'EmployeeCredential'],
    issuer: 'did:web:employer.example.com',
    credentialSubject: {
        id: 'did:jwk:holder',
        employer: 'Acme',
    },
    proof: { type: 'Ed25519Signature2020' },
};

/** Build a compact JWT-VC wrapping the given VC body per VCDM §6.3.1. */
const buildJwtVc = (vcBody: unknown): string => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64UrlEncode(JSON.stringify({ vc: vcBody, iss: 'did:web:issuer' }));
    return `${header}.${payload}.signature-placeholder`;
};

const base64UrlEncode = (input: string): string =>
    Buffer.from(input, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

/* --------------------------------- basic PD --------------------------------- */

// Union paths cover both shapes of credential PEX might see:
// - ldp_vc → the W3C VC object is the matching subject → type at `$.type`
// - jwt_vc_json → the JWT payload is the subject → type at `$.vc.type`
// Real-world verifier PDs (Sphereon, walt.id multi-format templates, EUDI)
// routinely declare both paths in `field.path[]` for exactly this reason.
const degreeDescriptor = {
    id: 'degree',
    name: 'University Degree',
    constraints: {
        fields: [
            {
                path: ['$.type', '$.vc.type'],
                filter: {
                    type: 'array',
                    contains: { const: 'UniversityDegreeCredential' },
                },
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
                filter: {
                    type: 'array',
                    contains: { const: 'DriversLicenseCredential' },
                },
            },
        ],
    },
};

/* ---------------------------------- tests ----------------------------------- */

describe('selectCredentials', () => {
    describe('no submission_requirements (PEX §7 default)', () => {
        const pd: PresentationDefinition = {
            id: 'pd-1',
            input_descriptors: [degreeDescriptor, licenseDescriptor],
        };

        it('matches multiple descriptors against multiple candidates', () => {
            const result = selectCredentials(
                [{ credential: degreeVc }, { credential: licenseVc }, { credential: employeeVc }],
                pd
            );

            expect(result.canSatisfy).toBe(true);
            expect(result.descriptors).toHaveLength(2);

            const degreeMatches = result.descriptors[0];
            expect(degreeMatches.descriptorId).toBe('degree');
            expect(degreeMatches.candidates).toHaveLength(1);
            expect(degreeMatches.candidates[0].candidateIndex).toBe(0);

            const licenseMatches = result.descriptors[1];
            expect(licenseMatches.candidates).toHaveLength(1);
            expect(licenseMatches.candidates[0].candidateIndex).toBe(1);
        });

        it('canSatisfy=false when any descriptor has zero matches', () => {
            const result = selectCredentials([{ credential: degreeVc }], pd);

            expect(result.canSatisfy).toBe(false);
            expect(result.reason).toMatch(/license/i);
            expect(result.descriptors[1].candidates).toHaveLength(0);
            expect(result.descriptors[1].reason).toMatch(/Drivers License/);
        });

        it('canSatisfy=false for empty wallet, with a helpful reason', () => {
            const result = selectCredentials([], pd);

            expect(result.canSatisfy).toBe(false);
            expect(result.descriptors.every(d => d.candidates.length === 0)).toBe(true);
            expect(result.descriptors[0].reason).toMatch(/no credentials/i);
        });

        it('surfaces multiple unsatisfied descriptors in the reason', () => {
            const result = selectCredentials([{ credential: employeeVc }], pd);

            expect(result.canSatisfy).toBe(false);
            expect(result.reason).toMatch(/degree/);
            expect(result.reason).toMatch(/license/);
        });
    });

    describe('format designation matching', () => {
        it('filters candidates by descriptor.format when declared', () => {
            const pd: PresentationDefinition = {
                id: 'pd-jwt-only',
                input_descriptors: [
                    {
                        ...degreeDescriptor,
                        format: { jwt_vc_json: { alg: ['EdDSA'] } },
                    },
                ],
            };

            // ldp_vc (degreeVc) should be filtered out; only JWT VCs match.
            const jwtDegree = buildJwtVc(degreeVc);

            const result = selectCredentials(
                [{ credential: degreeVc }, { credential: jwtDegree }],
                pd
            );

            expect(result.canSatisfy).toBe(true);
            expect(result.descriptors[0].candidates).toHaveLength(1);
            expect(result.descriptors[0].candidates[0].candidate.format).toBe('jwt_vc_json');
        });

        it('falls back to pd.format when descriptor has none', () => {
            const pd: PresentationDefinition = {
                id: 'pd-ldp-only',
                format: { ldp_vc: { proof_type: ['Ed25519Signature2020'] } },
                input_descriptors: [degreeDescriptor],
            };

            const jwtDegree = buildJwtVc(degreeVc);

            const result = selectCredentials(
                [{ credential: degreeVc }, { credential: jwtDegree }],
                pd
            );

            expect(result.descriptors[0].candidates).toHaveLength(1);
            expect(result.descriptors[0].candidates[0].candidate.format).toBe('ldp_vc');
        });

        it('decodes JWT-VCs for JSONPath matching', () => {
            const jwtDegree = buildJwtVc(degreeVc);

            const pd: PresentationDefinition = {
                id: 'pd-jwt',
                input_descriptors: [
                    {
                        ...degreeDescriptor,
                        format: { jwt_vc_json: {} },
                    },
                ],
            };

            const result = selectCredentials([{ credential: jwtDegree }], pd);

            expect(result.canSatisfy).toBe(true);
            expect(result.descriptors[0].candidates).toHaveLength(1);
        });

        it('rejects credentials whose inferred format is absent from designation', () => {
            // `proof.type: 'Unknown'` means `inferCredentialFormat` returns
            // 'ldp_vc' — which isn't in the `jwt_vc_json` designation.
            const pd: PresentationDefinition = {
                id: 'pd-jwt-strict',
                input_descriptors: [
                    { ...degreeDescriptor, format: { jwt_vc_json: {} } },
                ],
            };

            const result = selectCredentials([{ credential: degreeVc }], pd);
            expect(result.canSatisfy).toBe(false);
            expect(result.descriptors[0].candidates).toHaveLength(0);
        });
    });

    describe('submission_requirements rule="all"', () => {
        const pd: PresentationDefinition = {
            id: 'pd-sr-all',
            submission_requirements: [
                { name: 'Identity Pack', rule: 'all', from: 'identity' },
            ],
            input_descriptors: [
                { ...degreeDescriptor, group: ['identity'] },
                { ...licenseDescriptor, group: ['identity'] },
            ],
        };

        it('requires every descriptor in the group to be matched', () => {
            const ok = selectCredentials(
                [{ credential: degreeVc }, { credential: licenseVc }],
                pd
            );
            expect(ok.canSatisfy).toBe(true);

            const missing = selectCredentials([{ credential: degreeVc }], pd);
            expect(missing.canSatisfy).toBe(false);
            expect(missing.reason).toMatch(/Identity Pack/);
            expect(missing.reason).toMatch(/rule=all/);
        });

        it('returns canSatisfy=false with helpful reason when the group is unknown', () => {
            const invalidPd: PresentationDefinition = {
                id: 'pd-bad-group',
                submission_requirements: [{ rule: 'all', from: 'nonexistent' }],
                input_descriptors: [{ ...degreeDescriptor, group: ['identity'] }],
            };

            const result = selectCredentials([{ credential: degreeVc }], invalidPd);
            expect(result.canSatisfy).toBe(false);
            expect(result.reason).toMatch(/unknown group/);
        });
    });

    describe('submission_requirements rule="pick"', () => {
        const pd: PresentationDefinition = {
            id: 'pd-sr-pick',
            submission_requirements: [
                { name: 'Any two', rule: 'pick', count: 2, from: 'identity' },
            ],
            input_descriptors: [
                { ...degreeDescriptor, group: ['identity'] },
                { ...licenseDescriptor, group: ['identity'] },
                {
                    id: 'employee',
                    name: 'Employee',
                    group: ['identity'],
                    constraints: {
                        fields: [
                            {
                                path: ['$.type'],
                                filter: {
                                    type: 'array',
                                    contains: { const: 'EmployeeCredential' },
                                },
                            },
                        ],
                    },
                },
            ],
        };

        it('is satisfied when the count threshold is met', () => {
            const result = selectCredentials(
                [
                    { credential: degreeVc },
                    { credential: licenseVc },
                    { credential: employeeVc },
                ],
                pd
            );
            expect(result.canSatisfy).toBe(true);
        });

        it('is unsatisfied when fewer than count descriptors match', () => {
            const result = selectCredentials([{ credential: degreeVc }], pd);
            expect(result.canSatisfy).toBe(false);
            expect(result.reason).toMatch(/count=2/);
        });

        it('honours `min` when present instead of `count`', () => {
            const minPd: PresentationDefinition = {
                id: 'pd-sr-min',
                submission_requirements: [
                    { rule: 'pick', min: 2, from: 'identity' },
                ],
                input_descriptors: pd.input_descriptors,
            };

            const ok = selectCredentials(
                [{ credential: degreeVc }, { credential: licenseVc }],
                minPd
            );
            expect(ok.canSatisfy).toBe(true);

            const missing = selectCredentials([{ credential: degreeVc }], minPd);
            expect(missing.canSatisfy).toBe(false);
            expect(missing.reason).toMatch(/min=2/);
        });

        it('treats `pick` with no count/min as "at least one"', () => {
            const laxPd: PresentationDefinition = {
                id: 'pd-sr-lax',
                submission_requirements: [{ rule: 'pick', from: 'identity' }],
                input_descriptors: pd.input_descriptors,
            };

            const ok = selectCredentials([{ credential: degreeVc }], laxPd);
            expect(ok.canSatisfy).toBe(true);

            const none = selectCredentials([], laxPd);
            expect(none.canSatisfy).toBe(false);
        });
    });

    describe('submission_requirements from_nested', () => {
        const pd: PresentationDefinition = {
            id: 'pd-nested',
            submission_requirements: [
                {
                    name: 'Either-Or',
                    rule: 'pick',
                    count: 1,
                    from_nested: [
                        { rule: 'all', from: 'degree' },
                        { rule: 'all', from: 'license' },
                    ],
                },
            ],
            input_descriptors: [
                { ...degreeDescriptor, group: ['degree'] },
                { ...licenseDescriptor, group: ['license'] },
            ],
        };

        it('is satisfied when at least one nested requirement resolves', () => {
            const ok = selectCredentials([{ credential: degreeVc }], pd);
            expect(ok.canSatisfy).toBe(true);
        });

        it('is unsatisfied when no nested requirement resolves', () => {
            const result = selectCredentials([{ credential: employeeVc }], pd);
            expect(result.canSatisfy).toBe(false);
        });
    });
});

describe('walt.id real-world PD shape (regression)', () => {
    // Reproduces the exact input_descriptor shape returned by
    // https://verifier.demo.walt.id/openid4vc/pd/<session>:
    //
    //     { "path": ["$.vc.type"],
    //       "filter": { "type": "string", "pattern": "AlpsTourReservation" } }
    //
    // This shape is subtle in two ways the pre-fix matcher got wrong:
    //   1. `$.vc.type` requires the full JWT payload as the subject, not the
    //      unwrapped `.vc` object.
    //   2. `type: "string"` + `pattern` applied to a JSON-LD `type` array
    //      only matches if the matcher iterates array elements (the
    //      Sphereon PEX / Credo-TS convention).
    //
    // Before Slice 6's PEX JWT fix, this returned `canSatisfy: false`
    // against a credential the verifier clearly wanted.
    const waltIdAlpsDescriptor = {
        id: 'AlpsTourReservation',
        format: { jwt_vc_json: { alg: ['EdDSA'] } },
        constraints: {
            fields: [
                {
                    path: ['$.vc.type'],
                    filter: { type: 'string', pattern: 'AlpsTourReservation' },
                },
            ],
        },
    };

    const pd: PresentationDefinition = {
        id: 'walt-id-alps',
        input_descriptors: [waltIdAlpsDescriptor],
    };

    const alpsJwt = buildJwtVc({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'AlpsTourReservation'],
        credentialSubject: { id: 'did:jwk:holder', bookingId: 'B-42' },
    });

    it('matches a compact-JWS candidate', () => {
        const result = selectCredentials([{ credential: alpsJwt }], pd);

        expect(result.canSatisfy).toBe(true);
        expect(result.descriptors[0].candidates).toHaveLength(1);
    });

    it('matches a W3C-wrapped JWT candidate (the shape try-offer --save writes)', () => {
        const wrapped = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential', 'AlpsTourReservation'],
            credentialSubject: { id: 'did:jwk:holder', bookingId: 'B-42' },
            proof: { type: 'JwtProof2020', jwt: alpsJwt },
        };

        const result = selectCredentials([{ credential: wrapped }], pd);

        expect(result.canSatisfy).toBe(true);
        expect(result.descriptors[0].candidates).toHaveLength(1);
    });

    it('still rejects when the type array does not contain a matching element', () => {
        const otherJwt = buildJwtVc({
            type: ['VerifiableCredential', 'SomeOtherCredential'],
        });

        const result = selectCredentials([{ credential: otherJwt }], pd);

        expect(result.canSatisfy).toBe(false);
        expect(result.descriptors[0].candidates).toHaveLength(0);
    });
});

describe('buildPresentationSubmission', () => {
    const pd: PresentationDefinition = {
        id: 'pd-1',
        input_descriptors: [degreeDescriptor, licenseDescriptor],
    };

    it('produces a DIF PEX v2 descriptor_map', () => {
        const submission = buildPresentationSubmission(
            pd,
            [
                {
                    descriptorId: 'degree',
                    format: 'ldp_vc',
                    path: '$.verifiableCredential[0]',
                },
                {
                    descriptorId: 'license',
                    format: 'ldp_vc',
                    path: '$.verifiableCredential[1]',
                },
            ],
            { submissionId: 'sub-1' }
        );

        expect(submission).toEqual({
            id: 'sub-1',
            definition_id: 'pd-1',
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

    it('emits path_nested for envelope-wrapped credentials', () => {
        const submission = buildPresentationSubmission(
            pd,
            [
                {
                    descriptorId: 'degree',
                    format: 'jwt_vc_json',
                    path: '$.verifiableCredential[0]',
                    pathNested: '$',
                },
            ],
            { submissionId: 'sub-nested' }
        );

        expect(submission.descriptor_map[0]).toEqual({
            id: 'degree',
            format: 'jwt_vc_json',
            path: '$.verifiableCredential[0]',
            path_nested: {
                id: 'degree',
                format: 'jwt_vc_json',
                path: '$',
            },
        });
    });

    it('generates a submission id when none supplied', () => {
        const submission = buildPresentationSubmission(pd, [], {
            makeId: () => 'mock-id-42',
        });

        expect(submission.id).toBe('mock-id-42');
    });
});

describe('inferCredentialFormat', () => {
    it('returns jwt_vc_json for a compact JWS string', () => {
        expect(inferCredentialFormat(buildJwtVc({ type: ['VC'] }))).toBe('jwt_vc_json');
    });

    it('returns undefined for a non-JWS string', () => {
        expect(inferCredentialFormat('not-a-jwt')).toBeUndefined();
    });

    it('returns jwt_vc_json when proof.type === JwtProof2020', () => {
        expect(
            inferCredentialFormat({ proof: { type: 'JwtProof2020', jwt: 'eyJ...' } })
        ).toBe('jwt_vc_json');
    });

    it('returns ldp_vc for Data Integrity / legacy LDP proofs', () => {
        expect(inferCredentialFormat(degreeVc)).toBe('ldp_vc');
        expect(inferCredentialFormat(licenseVc)).toBe('ldp_vc');
    });

    it('returns undefined when no recognized shape', () => {
        expect(inferCredentialFormat({})).toBeUndefined();
        expect(inferCredentialFormat(null)).toBeUndefined();
        expect(inferCredentialFormat(42)).toBeUndefined();
    });
});
