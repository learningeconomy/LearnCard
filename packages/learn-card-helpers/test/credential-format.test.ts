import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { StoredCredentialEnvelopeValidator, isStoredCredentialEnvelope } from '@learncard/types';

import {
    projectEnvelopeToDisplayVc,
    resolveStorageReadResult,
    synthesizeDidJwk,
    toStoredCredential,
} from '../src';
import { parseSdJwtVc } from '../../plugins/sd-jwt-vc/src/parse';
import { sha256Hasher } from '../../plugins/sd-jwt-vc/src/hasher';
import { randomSalt } from '../../plugins/sd-jwt-vc/src/salt';

const { webcrypto } = require('node:crypto');
const { TextEncoder, TextDecoder } = require('node:util');

if (!globalThis.crypto) {
    Object.assign(globalThis, { crypto: webcrypto });
}
if (!globalThis.TextEncoder) {
    Object.assign(globalThis, { TextEncoder });
}
if (!globalThis.TextDecoder) {
    Object.assign(globalThis, { TextDecoder });
}

const base64UrlEncode = (input: string): string => {
    const b64 = Buffer.from(input, 'utf-8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const makeSdJwtCompact = (payload: Record<string, unknown>): string => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'dc+sd-jwt' }));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const sig = 'AAAA';
    return `${header}.${payloadB64}.${sig}~`;
};

const makeJwtVcCompact = (vcClaim: Record<string, unknown>): string => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payloadB64 = base64UrlEncode(JSON.stringify({ vc: vcClaim }));
    const sig = 'AAAA';
    return `${header}.${payloadB64}.${sig}`;
};

const decodeBase64UrlJson = (segment: string): [string, string, unknown] => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as [string, string, unknown];
};

const decodeBase64UrlObject = (segment: string): Record<string, unknown> => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as Record<string, unknown>;
};

const makeIssuerSigner = async () => {
    const cryptoModule = require('node:crypto');
    const { privateKey, publicKey } = cryptoModule.generateKeyPairSync('ed25519');
    const publicJwk = publicKey.export({ format: 'jwk' }) as Record<string, unknown>;

    const signer = async (data: string): Promise<string> => {
        return cryptoModule
            .sign(null, Buffer.from(data, 'utf-8'), privateKey)
            .toString('base64url');
    };

    return { signer, publicJwk };
};

const issueRealSdJwtCompact = async (): Promise<{
    compact: string;
    holderPublicJwk: Record<string, unknown>;
}> => {
    const cryptoModule = require('node:crypto');
    const { signer } = await makeIssuerSigner();
    const holderKeypair = cryptoModule.generateKeyPairSync('ed25519');
    const holderPublicJwk = holderKeypair.publicKey.export({
        format: 'jwk',
    }) as Record<string, unknown>;
    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });

    const compact = await instance.issue(
        {
            iss: 'did:web:issuer.example.com',
            iat: 1_700_000_000,
            nbf: 1_700_000_000,
            exp: 1_800_000_000,
            vct: 'https://example.com/credentials/employment',
            given_name: 'Ada',
            email: 'ada@example.com',
            dob: '1815-12-10',
            cnf: { jwk: holderPublicJwk },
        },
        { _sd: ['given_name', 'email', 'dob'] },
        { header: { kid: '#issuer-key-1', alg: 'EdDSA', typ: 'dc+sd-jwt' } }
    );

    return { compact, holderPublicJwk };
};

const makeSdJwtSynthesisLearnCard = () =>
    ({
        invoke: {
            parseSdJwtVc,
            verifySdJwtVc: jest.fn().mockResolvedValue({ checks: [], warnings: [], errors: [] }),
        },
    } as never);

type TestCredentialRecord = {
    id: string;
    uri: string;
    format?: string;
    rawWireForm?: string;
    vc?: unknown;
    [key: string]: unknown;
};

type TestVc = {
    '@context'?: unknown;
    type?: unknown;
    issuer?: unknown;
    credentialSubject?: unknown;
    validFrom?: string;
    proof?: unknown;
    [key: string]: unknown;
};

const make = (extra: Partial<TestCredentialRecord> = {}): TestCredentialRecord => ({
    id: 'test-id',
    uri: 'lc:test',
    ...extra,
});

const makeVc = (overrides: Record<string, unknown> = {}): TestVc => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:web:issuer',
    credentialSubject: {},
    ...overrides,
});

describe('toStoredCredential — explicit format', () => {
    it('honors `format: dc+sd-jwt` with explicit rawWireForm', () => {
        const compact = 'header.payload.signature~Wyx~';
        const stored = toStoredCredential(
            make({ format: 'dc+sd-jwt', rawWireForm: compact, vc: undefined })
        );
        expect(stored.format).toBe('dc+sd-jwt');
        if (stored.format === 'dc+sd-jwt') {
            expect(stored.data).toBe(compact);
        }
    });

    it('honors `format: vc+sd-jwt` with explicit rawWireForm', () => {
        const compact = 'header.payload.signature~Wyx~';
        const stored = toStoredCredential(
            make({ format: 'vc+sd-jwt', rawWireForm: compact, vc: undefined })
        );
        expect(stored.format).toBe('vc+sd-jwt');
    });

    it('honors `format: jwt-vc-json` with explicit rawWireForm', () => {
        const jws = 'header.payload.signature';
        const stored = toStoredCredential(
            make({ format: 'jwt-vc-json', rawWireForm: jws, vc: undefined })
        );
        expect(stored.format).toBe('jwt-vc-json');
        if (stored.format === 'jwt-vc-json') {
            expect(stored.data).toBe(jws);
        }
    });

    it('honors `format: mso_mdoc` with base64 rawWireForm', () => {
        const base64Cbor = 'pmZ2ZXJzaW9uYzEuMA==';
        const stored = toStoredCredential(
            make({ format: 'mso_mdoc', rawWireForm: base64Cbor, vc: undefined })
        );
        expect(stored.format).toBe('mso_mdoc');
    });

    it('uses record.vc for w3c-vc-2.0 format', () => {
        const vc = makeVc({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential', 'TestCredential'],
            credentialSubject: { name: 'Alice' },
        });
        const stored = toStoredCredential(make({ format: 'w3c-vc-2.0', vc }));
        expect(stored.format).toBe('w3c-vc-2.0');
        if (stored.format === 'w3c-vc-2.0') {
            expect(stored.data).toBe(vc);
        }
    });

    it('extracts wire form from proof.jwt when rawWireForm is absent for SD-JWT format', () => {
        const compact = 'header.payload.sig~';
        const wrapper: Record<string, unknown> = {
            type: ['VerifiableCredential', 'SdJwtVcCredential'],
            proof: { type: 'SdJwtCompactProof', jwt: compact },
        };
        const stored = toStoredCredential(make({ format: 'dc+sd-jwt', vc: wrapper }));
        expect(stored.format).toBe('dc+sd-jwt');
        if (stored.format === 'dc+sd-jwt') {
            expect(stored.data).toBe(compact);
        }
    });
});

describe('toStoredCredential — inferred from shape (legacy records)', () => {
    it('infers w3c-vc-2.0 from VCDM 2.0 @context', () => {
        const vc = makeVc({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            proof: { type: 'Ed25519Signature2020' },
        });
        const stored = toStoredCredential(make({ vc }));
        expect(stored.format).toBe('w3c-vc-2.0');
    });

    it('infers w3c-vc-1.1 from VCDM 1.1 @context', () => {
        const vc = makeVc({ proof: { type: 'Ed25519Signature2020' } });
        const stored = toStoredCredential(make({ vc }));
        expect(stored.format).toBe('w3c-vc-1.1');
    });

    it('infers dc+sd-jwt from a bare SD-JWT compact string', () => {
        const compact = 'eyJh.eyJp.sig~Wyx~';
        const stored = toStoredCredential(make({ vc: compact }));
        expect(stored.format).toBe('dc+sd-jwt');
        if (stored.format === 'dc+sd-jwt') {
            expect(stored.data).toBe(compact);
        }
    });

    it('infers jwt-vc-json from a bare JWT compact string', () => {
        const compact = 'eyJh.eyJp.sig';
        const stored = toStoredCredential(make({ vc: compact }));
        expect(stored.format).toBe('jwt-vc-json');
        if (stored.format === 'jwt-vc-json') {
            expect(stored.data).toBe(compact);
        }
    });

    it('infers dc+sd-jwt from a transitional wrapper with SdJwtCompactProof', () => {
        const compact = 'header.payload.sig~';
        const wrapper: Record<string, unknown> = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential', 'SdJwtVcCredential'],
            proof: { type: 'SdJwtCompactProof', jwt: compact },
        };
        const stored = toStoredCredential(make({ vc: wrapper }));
        expect(stored.format).toBe('dc+sd-jwt');
        if (stored.format === 'dc+sd-jwt') {
            expect(stored.data).toBe(compact);
        }
    });

    it('infers jwt-vc-json from a legacy LDP-around-JWT envelope', () => {
        const compact = 'header.payload.sig';
        const envelope: Record<string, unknown> = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            proof: { type: 'JwtProof2020', jwt: compact },
        };
        const stored = toStoredCredential(make({ vc: envelope }));
        expect(stored.format).toBe('jwt-vc-json');
        if (stored.format === 'jwt-vc-json') {
            expect(stored.data).toBe(compact);
        }
    });

    it('handles an array-valued proof on the wrapper', () => {
        const compact = 'header.payload.sig~';
        const wrapper: Record<string, unknown> = {
            type: ['VerifiableCredential', 'SdJwtVcCredential'],
            proof: [{ type: 'SdJwtCompactProof', jwt: compact }],
        };
        const stored = toStoredCredential(make({ vc: wrapper }));
        expect(stored.format).toBe('dc+sd-jwt');
    });

    it('scans array-valued proofs for the supported JWT proof', () => {
        const compact = 'header.payload.sig';
        const wrapper = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            proof: [{ type: 'Ed25519Signature2020' }, { type: 'JwtProof2020', jwt: compact }],
        } as any;
        const stored = toStoredCredential(make({ vc: wrapper }));
        expect(stored.format).toBe('jwt-vc-json');
        if (stored.format === 'jwt-vc-json') {
            expect(stored.data).toBe(compact);
        }
    });

    it('scans array-valued proofs for the supported SD-JWT proof', () => {
        const compact = 'header.payload.sig~';
        const wrapper = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential', 'SdJwtVcCredential'],
            proof: [{ type: 'Ed25519Signature2020' }, { type: 'SdJwtCompactProof', jwt: compact }],
        } as any;
        const stored = toStoredCredential(make({ vc: wrapper }));
        expect(stored.format).toBe('dc+sd-jwt');
        if (stored.format === 'dc+sd-jwt') {
            expect(stored.data).toBe(compact);
        }
    });

    it('falls back to w3c-vc-1.1 for an object with no recognizable shape', () => {
        const opaque: Record<string, unknown> = { foo: 'bar' };
        const stored = toStoredCredential(make({ vc: opaque }));
        expect(stored.format).toBe('w3c-vc-1.1');
        if (stored.format === 'w3c-vc-1.1') {
            expect(stored.data).toBe(opaque);
        }
    });
});

describe('toStoredCredential — explicit format takes precedence over shape', () => {
    it('honors `format: w3c-vc-2.0` even when @context says v1', () => {
        const vc = makeVc();
        const stored = toStoredCredential(make({ format: 'w3c-vc-2.0', vc }));
        expect(stored.format).toBe('w3c-vc-2.0');
    });

    it('falls through to shape inference when explicit format is present but rawWireForm missing for SD-JWT', () => {
        // A record carrying `format: 'dc+sd-jwt'` but neither rawWireForm
        // nor extractable proof.jwt would be malformed; we degrade
        // gracefully to shape inference rather than crashing.
        const stored = toStoredCredential(
            make({
                format: 'dc+sd-jwt',
                vc: { '@context': ['https://www.w3.org/ns/credentials/v2'] },
            })
        );
        expect(stored.format).toBe('w3c-vc-2.0');
    });
});

describe('toStoredCredential — never throws', () => {
    it('handles undefined vc gracefully', () => {
        const stored = toStoredCredential(make({ vc: undefined }));
        expect(stored.format).toBe('w3c-vc-1.1');
    });

    it('handles null vc gracefully', () => {
        const stored = toStoredCredential(make({ vc: null }));
        expect(stored.format).toBe('w3c-vc-1.1');
    });

    it('handles empty-string vc gracefully', () => {
        const stored = toStoredCredential(make({ vc: '' }));
        expect(stored.format).toBe('w3c-vc-1.1');
    });
});

describe('StoredCredentialEnvelope', () => {
    describe('isStoredCredentialEnvelope', () => {
        it('returns true for a valid string envelope', () => {
            expect(isStoredCredentialEnvelope({ format: 'dc+sd-jwt', data: 'compact.jwt~' })).toBe(
                true
            );
        });

        it('returns true for a Uint8Array envelope (mDoc forward-compat)', () => {
            expect(
                isStoredCredentialEnvelope({
                    format: 'mso_mdoc',
                    data: new Uint8Array([1, 2, 3]),
                })
            ).toBe(true);
        });

        it('returns false for a W3C VC (the envelope must not collide with VC shape)', () => {
            const vc = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: 'did:key:abc',
                credentialSubject: { id: 'did:key:xyz' },
            };
            expect(isStoredCredentialEnvelope(vc)).toBe(false);
        });

        it('returns false for an unknown format string', () => {
            expect(isStoredCredentialEnvelope({ format: 'unknown', data: 'x' })).toBe(false);
        });

        it('returns false for primitives, null, and undefined', () => {
            expect(isStoredCredentialEnvelope(null)).toBe(false);
            expect(isStoredCredentialEnvelope(undefined)).toBe(false);
            expect(isStoredCredentialEnvelope('compact.jwt')).toBe(false);
            expect(isStoredCredentialEnvelope(42)).toBe(false);
        });

        it('returns false when data is missing', () => {
            expect(isStoredCredentialEnvelope({ format: 'dc+sd-jwt' })).toBe(false);
        });

        it('returns false when data is the wrong type', () => {
            expect(isStoredCredentialEnvelope({ format: 'dc+sd-jwt', data: 42 })).toBe(false);
            expect(isStoredCredentialEnvelope({ format: 'dc+sd-jwt', data: {} })).toBe(false);
        });
    });

    describe('StoredCredentialEnvelopeValidator', () => {
        it('parses a string envelope', () => {
            const result = StoredCredentialEnvelopeValidator.safeParse({
                format: 'vc+sd-jwt',
                data: 'compact.jwt~',
            });
            expect(result.success).toBe(true);
        });

        it('rejects a Uint8Array data field (wire validator is string-only)', () => {
            // The TypeScript type allows `data: string | Uint8Array` for
            // in-memory ergonomics, but the wire validator is intentionally
            // narrower so OpenAPI generation can describe the schema. Plugins
            // convert binary to base64url before transport.
            const result = StoredCredentialEnvelopeValidator.safeParse({
                format: 'mso_mdoc',
                data: new Uint8Array([1, 2]),
            });
            expect(result.success).toBe(false);
        });

        it('rejects unknown format', () => {
            const result = StoredCredentialEnvelopeValidator.safeParse({
                format: 'made-up',
                data: 'x',
            });
            expect(result.success).toBe(false);
        });

        it('rejects when data is missing', () => {
            const result = StoredCredentialEnvelopeValidator.safeParse({ format: 'dc+sd-jwt' });
            expect(result.success).toBe(false);
        });

        it('applies vct-derived type AND name (backwards-compat parity with synthesizer)', () => {
            const compact = makeSdJwtCompact({
                iss: 'did:web:ca.gov',
                iat: 1700000000,
                vct: 'https://ca.gov/credentials/career-passport-test',
            });
            const vc = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: compact });
            expect(vc).toBeDefined();
            expect(vc!.type).toEqual([
                'VerifiableCredential',
                'SdJwtVcCredential',
                'CareerPassportTest',
            ]);
            expect((vc as Record<string, unknown>).name).toBe('Career Passport Test');
        });

        it('does NOT append derived type when it equals SdJwtVcCredential', () => {
            const compact = makeSdJwtCompact({
                iss: 'did:web:x',
                iat: 1700000000,
                vct: 'SdJwtVcCredential',
            });
            const vc = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: compact });
            expect(vc!.type).toEqual(['VerifiableCredential', 'SdJwtVcCredential']);
        });

        it('handles vct with no meaningful segment gracefully', () => {
            const compact = makeSdJwtCompact({
                iss: 'did:web:x',
                iat: 1700000000,
                vct: 'urn:eudi:pid:1',
            });
            const vc = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: compact });
            expect(vc!.type).toContain('PID');
            expect((vc as Record<string, unknown>).name).toBe('PID');
        });

        it('SD-JWT compact → display VC', () => {
            const compact = makeSdJwtCompact({
                iss: 'did:web:issuer.example.com',
                iat: 1700000000,
                exp: 1800000000,
                vct: 'https://example.com/credentials/employment',
                name: 'Alice',
                role: 'Engineer',
            });
            const vc = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: compact });
            expect(vc).toBeDefined();
            expect(vc!.issuer).toBe('did:web:issuer.example.com');
            expect((vc!.credentialSubject as Record<string, unknown>).name).toBe('Alice');
            expect((vc!.credentialSubject as Record<string, unknown>).role).toBe('Engineer');
            expect((vc!.credentialSubject as Record<string, unknown>).iss).toBeUndefined();
            expect((vc!.credentialSubject as Record<string, unknown>).vct).toBeUndefined();
            const proof = vc!.proof as { type: string; jwt: string };
            expect(proof.type).toBe('SdJwtCompactProof');
            expect(proof.jwt).toBe(compact);
            expect((vc as Record<string, unknown>).sdJwtVct).toBe(
                'https://example.com/credentials/employment'
            );
            expect((vc as Record<string, unknown>).validUntil).toBe(
                new Date(1800000000 * 1000).toISOString()
            );
        });

        it('uses a deterministic nbf fallback when iat is missing', () => {
            const compact = makeSdJwtCompact({
                iss: 'did:web:issuer.example.com',
                nbf: 1700000000,
                vct: 'https://example.com/credentials/employment',
            });

            const vc = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: compact });

            expect(vc?.validFrom).toBe(new Date(1700000000 * 1000).toISOString());
        });

        it('matches the write-time SD-JWT wrapper projection for a real compact credential', async () => {
            const { compact, holderPublicJwk } = await issueRealSdJwtCompact();
            const learnCard = makeSdJwtSynthesisLearnCard();
            jest.resetModules();
            jest.doMock('@learncard/helpers', () => require('../src'));
            const { synthesizeSdJwtVc } = require('../../plugins/openid4vc/src/vci/sd-jwt-vc');

            const wrapperA = await synthesizeSdJwtVc(compact, 'dc+sd-jwt', learnCard);
            const wrapperB = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: compact });

            expect(wrapperB).toBeDefined();
            expect(wrapperA.vc.credentialSubject).toEqual(wrapperB?.credentialSubject);
            expect(wrapperA.vc.type).toEqual(wrapperB?.type);
            expect(wrapperA.vc.issuer).toBe(wrapperB?.issuer);
            expect(wrapperA.vc.validFrom).toBe(wrapperB?.validFrom);
            expect((wrapperA.vc as Record<string, unknown>).sdJwtVct).toBe(
                (wrapperB as Record<string, unknown>).sdJwtVct
            );
            expect((wrapperA.vc as Record<string, unknown>).name).toBe(
                (wrapperB as Record<string, unknown>).name
            );
            expect((wrapperA.vc as Record<string, unknown>).validUntil).toBe(
                (wrapperB as Record<string, unknown>).validUntil
            );
            expect((wrapperB?.credentialSubject as Record<string, unknown>).id).toBe(
                synthesizeDidJwk(holderPublicJwk)
            );
            expect(wrapperA.vc.proof).toEqual(wrapperB?.proof);
            jest.dontMock('@learncard/helpers');
        });

        it('does not project a tampered disclosure into the credential subject', async () => {
            const { compact } = await issueRealSdJwtCompact();
            const parts = compact.split('~');
            const disclosureIndex = parts.findIndex(segment => {
                if (!segment) return false;
                try {
                    const decoded = decodeBase64UrlJson(segment);
                    return decoded[1] === 'email';
                } catch {
                    return false;
                }
            });
            expect(disclosureIndex).toBeGreaterThan(0);

            const [salt, key] = decodeBase64UrlJson(parts[disclosureIndex]!);
            const tamperedDisclosure = base64UrlEncode(
                JSON.stringify([salt, key, 'mallory@example.com'])
            );
            const tamperedParts = [...parts];
            tamperedParts[disclosureIndex] = tamperedDisclosure;
            const tamperedCompact = tamperedParts.join('~');

            const vc = projectEnvelopeToDisplayVc({ format: 'dc+sd-jwt', data: tamperedCompact });

            expect((vc?.credentialSubject as Record<string, unknown>).email).toBeUndefined();
            expect((vc?.credentialSubject as Record<string, unknown>).given_name).toBeDefined();
        });

        it('vc+sd-jwt legacy alias works identically', () => {
            const compact = makeSdJwtCompact({ iss: 'did:web:x', iat: 1700000000 });
            const vc = projectEnvelopeToDisplayVc({ format: 'vc+sd-jwt', data: compact });
            expect(vc).toBeDefined();
            expect(vc!.issuer).toBe('did:web:x');
        });

        it('JWT-VC compact extracts inner vc claim', () => {
            const compact = makeJwtVcCompact({
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'UniversityDegreeCredential'],
                issuer: 'did:web:university.example',
                credentialSubject: { degree: 'BS' },
            });
            const vc = projectEnvelopeToDisplayVc({ format: 'jwt-vc-json', data: compact });
            expect(vc).toBeDefined();
            expect(vc!.issuer).toBe('did:web:university.example');
            expect(vc!.type).toContain('UniversityDegreeCredential');
            const proof = vc!.proof as { type: string; jwt: string };
            expect(proof.type).toBe('JwtProof2020');
            expect(proof.jwt).toBe(compact);
        });

        it('mDoc returns undefined (no fake VC for binary)', () => {
            const result = projectEnvelopeToDisplayVc({
                format: 'mso_mdoc',
                data: 'base64url-cbor-bytes',
            });
            expect(result).toBeUndefined();
        });

        it('malformed SD-JWT compact returns undefined', () => {
            const result = projectEnvelopeToDisplayVc({
                format: 'dc+sd-jwt',
                data: 'not-a-jws',
            });
            expect(result).toBeUndefined();
        });

        it('resolveStorageReadResult — passes through non-envelope', () => {
            const vc: Record<string, unknown> = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: 'did:web:x',
                credentialSubject: { id: 'did:key:y' },
            };
            expect(resolveStorageReadResult(vc as never)).toBe(vc);
        });

        it('resolveStorageReadResult — passes through undefined', () => {
            expect(resolveStorageReadResult(undefined)).toBeUndefined();
        });

        it('resolveStorageReadResult — projects SD-JWT envelope to display VC', () => {
            const compact = makeSdJwtCompact({ iss: 'did:web:x', iat: 1700000000 });
            const result = resolveStorageReadResult({ format: 'dc+sd-jwt', data: compact });
            expect(result).toBeDefined();
            expect((result as Record<string, unknown>).issuer).toBe('did:web:x');
        });

        it('resolveStorageReadResult — returns envelope as-is for mDoc (no fake VC)', () => {
            const envelope = { format: 'mso_mdoc' as const, data: 'base64url-bytes' };
            expect(resolveStorageReadResult(envelope)).toBe(envelope);
        });

        it('preserves unknown fields (passthrough) for forward-compat', () => {
            const result = StoredCredentialEnvelopeValidator.safeParse({
                format: 'dc+sd-jwt',
                data: 'compact.jwt~',
                metadata: { issuedBy: 'partner-x' },
                version: 2,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect((result.data as Record<string, unknown>).metadata).toEqual({
                    issuedBy: 'partner-x',
                });
                expect((result.data as Record<string, unknown>).version).toBe(2);
            }
        });
    });
});
