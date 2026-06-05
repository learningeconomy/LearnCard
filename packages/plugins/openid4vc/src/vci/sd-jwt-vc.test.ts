import {
    SD_JWT_VC_FORMAT,
    SD_JWT_VC_FORMAT_LEGACY,
    deriveNameFromVct,
    deriveTypeFromVct,
    extractSdJwtVct,
    isSdJwtFormat,
    synthesizeSdJwtVc,
} from './sd-jwt-vc';
import { VciError } from './errors';

const FAKE_COMPACT = 'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.payload-segment.sig~';

const HOLDER_JWK = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'fXYZ-test-only-not-a-real-key-value',
};

const makeParsed = (overrides: Record<string, unknown> = {}) => ({
    vct: 'https://example.com/credentials/test-cert',
    issuer: 'did:web:issuer.example.com',
    issuedAt: new Date('2024-01-01T00:00:00.000Z'),
    claims: {
        iss: 'did:web:issuer.example.com',
        iat: 1704067200,
        vct: 'https://example.com/credentials/test-cert',
        _sd_alg: 'sha-256',
        given_name: 'Ada',
        degree: { type: 'BachelorDegree', name: 'BSc' },
    },
    header: { alg: 'EdDSA', typ: 'dc+sd-jwt', kid: 'did:web:issuer.example.com#key-1' },
    rawSdJwt: FAKE_COMPACT,
    hasKeyBinding: false,
    ...overrides,
});

const makeLearnCard = (
    parsed: unknown,
    throws?: Error,
    verifyResult: { errors?: string[]; warnings?: string[]; checks?: string[] } = {
        errors: [],
        warnings: [],
        checks: ['parse', 'issuer_signature'],
    }
) =>
    ({
        invoke: {
            parseSdJwtVc: jest.fn(async () => {
                if (throws) throw throws;
                return parsed;
            }),
            verifySdJwtVc: jest.fn(async () => verifyResult),
        },
    } as unknown as Parameters<typeof synthesizeSdJwtVc>[2]);

describe('isSdJwtFormat', () => {
    it('recognizes the canonical and legacy format strings', () => {
        expect(isSdJwtFormat(SD_JWT_VC_FORMAT)).toBe(true);
        expect(isSdJwtFormat(SD_JWT_VC_FORMAT_LEGACY)).toBe(true);
        expect(isSdJwtFormat('dc+sd-jwt')).toBe(true);
        expect(isSdJwtFormat('vc+sd-jwt')).toBe(true);
    });

    it('rejects unrelated format strings', () => {
        expect(isSdJwtFormat('jwt_vc_json')).toBe(false);
        expect(isSdJwtFormat('ldp_vc')).toBe(false);
        expect(isSdJwtFormat('')).toBe(false);
    });
});

describe('synthesizeSdJwtVc', () => {
    it('produces a W3C-VC-shaped object with the SD-JWT preserved under proof.jwt', async () => {
        const parsed = makeParsed();
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        expect(result.rawFormat).toBe(SD_JWT_VC_FORMAT);
        expect(result.jwt).toBe(FAKE_COMPACT);
        expect(result.vc.type).toEqual(['VerifiableCredential', 'SdJwtVcCredential', 'TestCert']);
        expect((result.vc as { name?: unknown }).name).toBe('Test Cert');
        expect(result.vc.issuer).toBe('did:web:issuer.example.com');
        expect(result.vc.validFrom).toBe('2024-01-01T00:00:00.000Z');
        expect((result.vc.proof as { jwt: string }).jwt).toBe(FAKE_COMPACT);
        expect((result.vc.proof as { type: string }).type).toBe('SdJwtCompactProof');
        expect((result.vc.proof as { verificationMethod: string }).verificationMethod).toBe(
            'did:web:issuer.example.com#key-1'
        );

        expect(result.format).toBe('dc+sd-jwt');
        expect(result.rawWireForm).toBe(FAKE_COMPACT);
        expect(result.semanticType).toBe('https://example.com/credentials/test-cert');
    });

    it('tags SD-JWT credentials with format=vc+sd-jwt when the issuer used the legacy format string', async () => {
        const parsed = makeParsed({
            header: { alg: 'EdDSA', typ: 'vc+sd-jwt', kid: 'did:web:issuer.example.com#key-1' },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT_LEGACY, learnCard);

        expect(result.format).toBe('vc+sd-jwt');
        expect(result.rawWireForm).toBe(FAKE_COMPACT);
        expect(result.semanticType).toBe('https://example.com/credentials/test-cert');
    });

    it('exposes the SD-JWT vct as the sdJwtVct extension on the synthesized VC', async () => {
        const learnCard = makeLearnCard(makeParsed());
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        expect((result.vc as Record<string, unknown>).sdJwtVct).toBe(
            'https://example.com/credentials/test-cert'
        );
    });

    it('strips SD-JWT protocol metadata from credentialSubject', async () => {
        const learnCard = makeLearnCard(makeParsed());
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        const subject = result.vc.credentialSubject as Record<string, unknown>;
        expect(subject.iss).toBeUndefined();
        expect(subject.iat).toBeUndefined();
        expect(subject.vct).toBeUndefined();
        expect(subject._sd_alg).toBeUndefined();
        expect(subject.given_name).toBe('Ada');
        expect(subject.degree).toEqual({ type: 'BachelorDegree', name: 'BSc' });
    });

    it('anchors a fragment-only kid to the issuer DID', async () => {
        const parsed = makeParsed({
            header: { alg: 'EdDSA', typ: 'dc+sd-jwt', kid: '#key-1' },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        expect((result.vc.proof as { verificationMethod: string }).verificationMethod).toBe(
            'did:web:issuer.example.com#key-1'
        );
    });

    it('omits proof.verificationMethod when the issuer is an HTTPS URL (not a DID)', async () => {
        const parsed = makeParsed({
            issuer: 'https://issuer.example.com',
            header: { alg: 'EdDSA', typ: 'dc+sd-jwt' },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        expect(
            (result.vc.proof as { verificationMethod?: string }).verificationMethod
        ).toBeUndefined();
    });

    it('omits proof.verificationMethod when issuer is a DID but the SD-JWT header has no kid', async () => {
        const parsed = makeParsed({
            issuer: 'did:web:issuer.example.com',
            header: { alg: 'EdDSA', typ: 'dc+sd-jwt' },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        const vm = (result.vc.proof as { verificationMethod?: string }).verificationMethod;
        expect(vm).toBeUndefined();
    });

    it('synthesizes a did:jwk for credentialSubject.id when cnf.jwk is present', async () => {
        const parsed = makeParsed({ holderPublicKey: HOLDER_JWK });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        const subjectId = (result.vc.credentialSubject as { id?: string }).id;
        expect(subjectId).toMatch(/^did:jwk:/);
    });

    it('produces a deterministic did:jwk regardless of JWK property insertion order (RFC 8785 JCS)', async () => {
        const orderingA: Record<string, unknown> = {
            kty: 'OKP',
            crv: 'Ed25519',
            x: 'fXYZ-test-only-not-a-real-key-value',
        };
        const orderingB: Record<string, unknown> = {
            x: 'fXYZ-test-only-not-a-real-key-value',
            crv: 'Ed25519',
            kty: 'OKP',
        };

        const resultA = await synthesizeSdJwtVc(
            FAKE_COMPACT,
            SD_JWT_VC_FORMAT,
            makeLearnCard(makeParsed({ holderPublicKey: orderingA }))
        );
        const resultB = await synthesizeSdJwtVc(
            FAKE_COMPACT,
            SD_JWT_VC_FORMAT,
            makeLearnCard(makeParsed({ holderPublicKey: orderingB }))
        );

        const subjectA = (resultA.vc.credentialSubject as { id?: string }).id;
        const subjectB = (resultB.vc.credentialSubject as { id?: string }).id;
        expect(subjectA).toBe(subjectB);
    });

    it('strips private JWK fields before synthesizing did:jwk', async () => {
        const parsed = makeParsed({
            holderPublicKey: {
                ...HOLDER_JWK,
                d: 'private-key-bytes-MUST-NOT-leak-into-did',
            },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        const subjectId = (result.vc.credentialSubject as { id?: string }).id ?? '';
        const encoded = subjectId.replace(/^did:jwk:/, '');
        const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
        const json = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
            'utf-8'
        );
        expect(json).not.toContain('private-key-bytes-MUST-NOT-leak-into-did');
        expect(json).not.toMatch(/"d":/);
    });

    it('leaves credentialSubject.id undefined when no cnf claim is present', async () => {
        const parsed = makeParsed();
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        expect((result.vc.credentialSubject as { id?: string }).id).toBeUndefined();
    });

    it('throws when the OID4VCI format and the SD-JWT JOSE header typ disagree', async () => {
        const parsed = makeParsed({
            header: { alg: 'EdDSA', typ: 'vc+sd-jwt', kid: 'did:web:issuer.example.com#key-1' },
        });
        const learnCard = makeLearnCard(parsed);
        await expect(
            synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
        ).rejects.toMatchObject({
            code: 'unsupported_format',
            message: expect.stringMatching(/dc\+sd-jwt.*vc\+sd-jwt/),
        });
    });

    it('accepts a legacy vc+sd-jwt credential when format and typ agree', async () => {
        const parsed = makeParsed({
            header: { alg: 'EdDSA', typ: 'vc+sd-jwt', kid: 'did:web:issuer.example.com#key-1' },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT_LEGACY, learnCard);

        expect(result.rawFormat).toBe(SD_JWT_VC_FORMAT_LEGACY);
        expect(result.vc.type).toEqual(['VerifiableCredential', 'SdJwtVcCredential', 'TestCert']);
    });

    it("accepts credentials whose JOSE header omits typ (issuer didn't set it)", async () => {
        const parsed = makeParsed({
            header: { alg: 'EdDSA', kid: 'did:web:issuer.example.com#key-1' },
        });
        const learnCard = makeLearnCard(parsed);
        const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

        expect(result.rawFormat).toBe(SD_JWT_VC_FORMAT);
    });

    describe('receipt-time signature verification', () => {
        it('rejects credentials whose issuer signature does not verify', async () => {
            const parsed = makeParsed();
            const learnCard = makeLearnCard(parsed, undefined, {
                errors: ['signature_invalid: bad sig'],
                warnings: [],
                checks: ['parse'],
            });

            await expect(
                synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
            ).rejects.toMatchObject({
                code: 'unsupported_format',
                message: expect.stringContaining('signature_invalid'),
            });
        });

        it('rejects credentials with disclosure hash mismatches', async () => {
            const parsed = makeParsed();
            const learnCard = makeLearnCard(parsed, undefined, {
                errors: ['disclosure_hash_mismatch: tampered claim'],
                warnings: [],
                checks: [],
            });

            await expect(
                synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
            ).rejects.toMatchObject({ code: 'unsupported_format' });
        });

        it('aggregates multiple verification errors into a single rejection', async () => {
            const parsed = makeParsed();
            const learnCard = makeLearnCard(parsed, undefined, {
                errors: ['expired: …', 'signature_invalid: …'],
                warnings: [],
                checks: [],
            });

            await expect(
                synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
            ).rejects.toMatchObject({
                message: expect.stringMatching(
                    /expired.*signature_invalid|signature_invalid.*expired/
                ),
            });
        });

        it('passes when verification returns only warnings (e.g., status_check_deferred)', async () => {
            const parsed = makeParsed();
            const learnCard = makeLearnCard(parsed, undefined, {
                errors: [],
                warnings: ['status_check_deferred: TSL is Slice 4'],
                checks: ['parse', 'issuer_signature'],
            });

            const result = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);
            expect(result.rawFormat).toBe(SD_JWT_VC_FORMAT);
        });

        it('fails closed when verifySdJwtVc is not available (refuses to store unverified)', async () => {
            const parsed = makeParsed();
            const learnCard = {
                invoke: {
                    parseSdJwtVc: jest.fn(async () => parsed),
                },
            } as unknown as Parameters<typeof synthesizeSdJwtVc>[2];

            await expect(
                synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
            ).rejects.toMatchObject({ code: 'unsupported_format' });
        });

        it('passes { skipStatusCheck: true } to receipt-time verification (revocation freshness is a display-time concern)', async () => {
            const parsed = makeParsed();
            const verifyFn = jest.fn().mockResolvedValue({
                checks: ['issuer_signature'],
                warnings: [],
                errors: [],
            });
            const learnCard = {
                invoke: {
                    parseSdJwtVc: jest.fn(async () => parsed),
                    verifySdJwtVc: verifyFn,
                },
            } as unknown as Parameters<typeof synthesizeSdJwtVc>[2];

            await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);

            expect(verifyFn).toHaveBeenCalledWith(FAKE_COMPACT, { skipStatusCheck: true });
        });
    });

    it('emits validUntil only when the credential has an exp', async () => {
        const learnCard = makeLearnCard(makeParsed());
        const noExp = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);
        expect(noExp.vc.validUntil).toBeUndefined();

        const withExp = await synthesizeSdJwtVc(
            FAKE_COMPACT,
            SD_JWT_VC_FORMAT,
            makeLearnCard(makeParsed({ expiresAt: new Date('2030-01-01T00:00:00.000Z') }))
        );
        expect(withExp.vc.validUntil).toBe('2030-01-01T00:00:00.000Z');
    });

    it('throws unsupported_format when @learncard/sd-jwt-vc-plugin is not installed', async () => {
        const learnCard = { invoke: {} } as unknown as Parameters<typeof synthesizeSdJwtVc>[2];
        await expect(
            synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
        ).rejects.toBeInstanceOf(VciError);
        await expect(
            synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
        ).rejects.toMatchObject({ code: 'unsupported_format' });
    });

    it('wraps plugin parse failures in a VciError with cause', async () => {
        const learnCard = makeLearnCard(undefined, new Error('signature_invalid: bad sig'));
        await expect(
            synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard)
        ).rejects.toMatchObject({
            code: 'unsupported_format',
            message: expect.stringContaining('signature_invalid: bad sig'),
        });
    });

    it('rejects non-string credential payloads', async () => {
        const learnCard = makeLearnCard(makeParsed());
        await expect(
            synthesizeSdJwtVc({ not: 'a string' }, SD_JWT_VC_FORMAT, learnCard)
        ).rejects.toMatchObject({ code: 'unsupported_format' });
    });
});

describe('extractSdJwtVct', () => {
    it('returns the vct only when proof.type === "SdJwtCompactProof"', () => {
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                sdJwtVct: 'https://example.com/credentials/x',
                proof: { type: 'SdJwtCompactProof', jwt: '...' },
            } as Parameters<typeof extractSdJwtVct>[0])
        ).toBe('https://example.com/credentials/x');
    });

    it('returns undefined when proof.type is missing or non-matching', () => {
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                sdJwtVct: 'https://example.com/credentials/x',
            } as Parameters<typeof extractSdJwtVct>[0])
        ).toBeUndefined();

        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                sdJwtVct: 'https://example.com/credentials/x',
                proof: { type: 'JwtProof2020', jwt: '...' },
            } as Parameters<typeof extractSdJwtVct>[0])
        ).toBeUndefined();
    });

    it('returns undefined when the sdJwtVct extension is missing or non-string', () => {
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                proof: { type: 'SdJwtCompactProof', jwt: '...' },
            } as Parameters<typeof extractSdJwtVct>[0])
        ).toBeUndefined();
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                sdJwtVct: 42,
                proof: { type: 'SdJwtCompactProof', jwt: '...' },
            } as unknown as Parameters<typeof extractSdJwtVct>[0])
        ).toBeUndefined();
    });
});

describe('deriveTypeFromVct', () => {
    it('extracts PascalCase from the last URL path segment', () => {
        expect(deriveTypeFromVct('http://localhost:5173/embedded/vct/playground-credential')).toBe(
            'PlaygroundCredential'
        );
    });

    it('uppercases short single-word lowercase segments as acronyms', () => {
        expect(deriveTypeFromVct('https://www.eudi.example/pid')).toBe('PID');
    });

    it('skips numeric URN version tails and uses the prior segment', () => {
        expect(deriveTypeFromVct('urn:eudi:pid:1')).toBe('PID');
    });

    it('preserves PascalCase plain-string vcts', () => {
        expect(deriveTypeFromVct('OpenBadgeCredential')).toBe('OpenBadgeCredential');
    });

    it('handles already-multi-word URL segments', () => {
        expect(
            deriveTypeFromVct('https://issuer.example.com/credentials/UniversityDegreeCredential')
        ).toBe('UniversityDegreeCredential');
    });

    it('returns undefined for empty / non-string input', () => {
        expect(deriveTypeFromVct(undefined)).toBeUndefined();
        expect(deriveTypeFromVct('')).toBeUndefined();
        expect(deriveTypeFromVct('   ')).toBeUndefined();
    });
});

describe('deriveNameFromVct', () => {
    it('renders space-separated title-case from a URL vct', () => {
        expect(deriveNameFromVct('http://localhost:5173/embedded/vct/playground-credential')).toBe(
            'Playground Credential'
        );
    });

    it('keeps acronyms uppercase', () => {
        expect(deriveNameFromVct('https://www.eudi.example/pid')).toBe('PID');
    });

    it('returns undefined when no meaningful segment can be derived', () => {
        expect(deriveNameFromVct(undefined)).toBeUndefined();
        expect(deriveNameFromVct('')).toBeUndefined();
    });
});
