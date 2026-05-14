import { describe, it, expect } from 'vitest';

import {
    dedupeDidRelationshipArray,
    ensureVerificationMethodsHaveJwk,
    normalizeDidDocumentForInterop,
} from '../src/helpers/did-doc-normalize.helpers';

const DEMO_DID = 'did:web:staging.network.learncard.com:users:demo-account';
const DEMO_MULTIBASE = 'z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw';

describe('ensureVerificationMethodsHaveJwk', () => {
    it('converts an Ed25519 verification method with publicKeyMultibase to publicKeyJwk', () => {
        const out = ensureVerificationMethodsHaveJwk([
            {
                id: `${DEMO_DID}#owner`,
                type: 'Ed25519VerificationKey2020',
                controller: DEMO_DID,
                publicKeyMultibase: DEMO_MULTIBASE,
            },
        ])!;

        expect(out).toHaveLength(1);
        const vm = out[0];
        expect(vm.id).toBe(`${DEMO_DID}#owner`);
        expect(vm.controller).toBe(DEMO_DID);
        expect(vm.type).toBe('JsonWebKey2020');
        expect(vm.publicKeyMultibase).toBeUndefined();
        expect(vm.publicKeyJwk).toEqual({
            kty: 'OKP',
            crv: 'Ed25519',
            x: expect.any(String),
        });
        expect(vm.publicKeyJwk.x).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('preserves verification methods that already expose publicKeyJwk', () => {
        const existing = {
            id: `${DEMO_DID}#owner`,
            type: 'Ed25519VerificationKey2018',
            controller: DEMO_DID,
            publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
        };
        const out = ensureVerificationMethodsHaveJwk([existing])!;
        expect(out[0]).toBe(existing);
    });

    it('leaves non-Ed25519 verification methods untouched', () => {
        const x25519 = {
            id: `${DEMO_DID}#z6LSn`,
            type: 'X25519KeyAgreementKey2020',
            controller: DEMO_DID,
            publicKeyMultibase: DEMO_MULTIBASE,
        };
        const out = ensureVerificationMethodsHaveJwk([x25519])!;
        expect(out[0]).toBe(x25519);
    });

    it('passes through entries we cannot decode without throwing', () => {
        const malformed = {
            id: `${DEMO_DID}#broken`,
            type: 'Ed25519VerificationKey2020',
            controller: DEMO_DID,
        };
        const out = ensureVerificationMethodsHaveJwk([malformed])!;
        expect(out[0]).toBe(malformed);
    });

    it('handles non-array input by returning it unchanged', () => {
        expect(ensureVerificationMethodsHaveJwk(undefined)).toBeUndefined();
    });
});

describe('dedupeDidRelationshipArray', () => {
    it('dedupes object entries by id (first occurrence wins)', () => {
        const a1 = { id: 'did:web:x#owner', type: 'A' };
        const a2 = { id: 'did:web:x#owner', type: 'B' };
        const b = { id: 'did:web:x#sa', type: 'C' };
        const out = dedupeDidRelationshipArray([a1, a2, b])!;
        expect(out).toHaveLength(2);
        expect(out[0]).toBe(a1);
        expect(out[1]).toBe(b);
    });

    it('dedupes string entries by value', () => {
        const out = dedupeDidRelationshipArray([
            'did:web:x#owner',
            'did:web:x#owner',
            'did:web:x#sa',
        ])!;
        expect(out).toEqual(['did:web:x#owner', 'did:web:x#sa']);
    });

    it('keeps entries without an id (spec-legal edge case)', () => {
        const withoutId = { type: 'X25519KeyAgreementKey2020' };
        const out = dedupeDidRelationshipArray([withoutId, withoutId])!;
        expect(out).toHaveLength(2);
    });

    it('returns non-array input unchanged', () => {
        expect(dedupeDidRelationshipArray(undefined)).toBeUndefined();
    });
});

describe('normalizeDidDocumentForInterop', () => {
    it('produces a walt.id-resolvable DID document from the live staging shape', () => {
        const liveShape = {
            id: DEMO_DID,
            verificationMethod: [
                {
                    id: `${DEMO_DID}#owner`,
                    type: 'Ed25519VerificationKey2020',
                    controller: DEMO_DID,
                    publicKeyMultibase: DEMO_MULTIBASE,
                },
                {
                    id: 'did:key:z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3#z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                    type: 'Ed25519VerificationKey2020',
                    controller:
                        'did:key:z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                    publicKeyMultibase:
                        'z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                },
                {
                    id: 'did:key:z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3#z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                    type: 'Ed25519VerificationKey2020',
                    controller:
                        'did:key:z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                    publicKeyMultibase:
                        'z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                },
                {
                    id: 'did:key:z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3#z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                    type: 'Ed25519VerificationKey2020',
                    controller:
                        'did:key:z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                    publicKeyMultibase:
                        'z6MkwZDpiRabYjm25kweB68izTza3Rvz3UbHb5bmBnT8VKc3',
                },
            ],
            authentication: [`${DEMO_DID}#owner`, `${DEMO_DID}#owner`],
            assertionMethod: [`${DEMO_DID}#owner`],
            keyAgreement: [
                {
                    id: `${DEMO_DID}#x25519`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: DEMO_DID,
                    publicKeyBase58: 'AWcRcUTdFVa7RfFtZQ93yZFoDoyC9yZGhmVw5tzwYSwZ',
                },
                {
                    id: `${DEMO_DID}#x25519`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: DEMO_DID,
                    publicKeyBase58: 'AWcRcUTdFVa7RfFtZQ93yZFoDoyC9yZGhmVw5tzwYSwZ',
                },
            ],
        };

        normalizeDidDocumentForInterop(liveShape);

        const ownerVm = liveShape.verificationMethod.find(
            (vm: any) => vm.id === `${DEMO_DID}#owner`
        )!;
        expect(ownerVm.type).toBe('JsonWebKey2020');
        expect((ownerVm as any).publicKeyJwk).toEqual({
            kty: 'OKP',
            crv: 'Ed25519',
            x: expect.any(String),
        });
        expect((ownerVm as any).publicKeyMultibase).toBeUndefined();

        expect(liveShape.verificationMethod).toHaveLength(2);

        expect(liveShape.authentication).toEqual([`${DEMO_DID}#owner`]);
        expect(liveShape.keyAgreement).toHaveLength(1);
    });

    it('is a no-op for missing/empty docs', () => {
        expect(() => normalizeDidDocumentForInterop(undefined)).not.toThrow();
        const empty: any = {};
        normalizeDidDocumentForInterop(empty);
        expect(empty).toEqual({});
    });
});
