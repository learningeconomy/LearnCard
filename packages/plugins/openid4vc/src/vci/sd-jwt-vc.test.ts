import {
    SD_JWT_VC_FORMAT,
    SD_JWT_VC_FORMAT_LEGACY,
    extractSdJwtVct,
    isSdJwtFormat,
    synthesizeSdJwtVc,
} from './sd-jwt-vc';
import { VciError } from './errors';

const FAKE_COMPACT =
    'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.payload-segment.sig~';

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

const makeLearnCard = (parsed: unknown, throws?: Error) =>
    ({
        invoke: {
            parseSdJwtVc: jest.fn(async () => {
                if (throws) throw throws;
                return parsed;
            }),
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
        expect(result.vc.type).toEqual(['VerifiableCredential', 'SdJwtVcCredential']);
        expect(result.vc.issuer).toBe('did:web:issuer.example.com');
        expect(result.vc.validFrom).toBe('2024-01-01T00:00:00.000Z');
        expect((result.vc.proof as { jwt: string }).jwt).toBe(FAKE_COMPACT);
        expect((result.vc.proof as { type: string }).type).toBe('SdJwtCompactProof');
        expect((result.vc.proof as { verificationMethod: string }).verificationMethod).toBe(
            'did:web:issuer.example.com#key-1'
        );
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

    it('emits validUntil only when the credential has an exp', async () => {
        const learnCard = makeLearnCard(makeParsed());
        const noExp = await synthesizeSdJwtVc(FAKE_COMPACT, SD_JWT_VC_FORMAT, learnCard);
        expect(noExp.vc.validUntil).toBeUndefined();

        const withExp = await synthesizeSdJwtVc(
            FAKE_COMPACT,
            SD_JWT_VC_FORMAT,
            makeLearnCard(
                makeParsed({ expiresAt: new Date('2030-01-01T00:00:00.000Z') })
            )
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
    it('returns the vct when the synthesized extension is present', () => {
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                sdJwtVct: 'https://example.com/credentials/x',
            } as Parameters<typeof extractSdJwtVct>[0])
        ).toBe('https://example.com/credentials/x');
    });

    it('returns undefined when the extension is missing or non-string', () => {
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
            } as Parameters<typeof extractSdJwtVct>[0])
        ).toBeUndefined();
        expect(
            extractSdJwtVct({
                '@context': [],
                type: 'VerifiableCredential',
                sdJwtVct: 42,
            } as unknown as Parameters<typeof extractSdJwtVct>[0])
        ).toBeUndefined();
    });
});
