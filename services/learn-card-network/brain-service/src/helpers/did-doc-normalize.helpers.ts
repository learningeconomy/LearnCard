import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';

import { JWK } from '@learncard/types';

export const extractEd25519FromVerificationMethod = (
    vm: any
): { bytes: Uint8Array; jwk: JWK } => {
    const jwk = vm?.publicKeyJwk as JWK | undefined;
    if (jwk?.x) {
        const bytes = base64url.decode(`u${jwk.x}`);
        return { bytes, jwk } as { bytes: Uint8Array; jwk: JWK };
    }

    const mb = vm?.publicKeyMultibase as string | undefined;
    if (mb) {
        const decoded = base58btc.decode(mb);
        const bytes = decoded[0] === 0xed && decoded[1] === 0x01 ? decoded.slice(2) : decoded;
        const x = base64url.encode(bytes).slice(1);
        return { bytes, jwk: { kty: 'OKP', crv: 'Ed25519', x } as JWK };
    }

    const b58 = vm?.publicKeyBase58 as string | undefined;
    if (b58) {
        const bytes = base58btc.baseDecode(b58);
        const x = base64url.encode(bytes).slice(1);
        return { bytes, jwk: { kty: 'OKP', crv: 'Ed25519', x } as JWK };
    }

    throw new Error('Unsupported verification method format: missing public key');
};

/**
 * Rewrite Ed25519 verification methods that only carry `publicKeyMultibase` so
 * they expose `publicKeyJwk` as well. Some third-party DID resolvers (notably
 * walt.id and a handful of EBSI / EUDI conformance tools) only look for the
 * JWK form when validating a holder's proof JWT and silently 500 if it is
 * absent — even though `publicKeyMultibase` is W3C-spec-compliant. Emitting
 * both forms is the maximally interoperable shape; the `type` switches to
 * `JsonWebKey2020` so the JWK is the authoritative source.
 *
 * Verification methods that already include `publicKeyJwk` are left alone.
 * X25519 / unknown key types are passed through unchanged.
 */
export const ensureVerificationMethodsHaveJwk = (
    vms: any[] | undefined
): any[] | undefined => {
    if (!Array.isArray(vms)) return vms;
    return vms.map(vm => {
        if (!vm || typeof vm !== 'object') return vm;
        if (vm.publicKeyJwk) return vm;
        // Only attempt conversion for Ed25519-typed methods. X25519 key
        // agreement entries belong in `keyAgreement` and use a different curve.
        const type = vm.type as string | undefined;
        const isEd25519 =
            type === 'Ed25519VerificationKey2020' ||
            type === 'Ed25519VerificationKey2018' ||
            type === 'Multikey' ||
            type === 'JsonWebKey2020';
        if (!isEd25519) return vm;
        try {
            const { jwk } = extractEd25519FromVerificationMethod(vm);
            return {
                id: vm.id,
                type: 'JsonWebKey2020',
                controller: vm.controller,
                publicKeyJwk: jwk,
            };
        } catch {
            // Couldn't decode — leave the original VM alone so we don't
            // silently drop a verification method we don't recognize.
            return vm;
        }
    });
};

/**
 * Deduplicate a DID-document relationship array (verificationMethod,
 * authentication, assertionMethod, keyAgreement) by `id`. Strings are
 * deduped by string equality; objects are deduped by `.id`. Entries
 * without an `id` are kept (they're spec-legal but rare).
 *
 * First occurrence wins so the primary `#owner` / `#lca-sa` form takes
 * precedence over any duplicates appended by signing-authority,
 * manager, or `did-metadata` merges further down the pipeline.
 */
export const dedupeDidRelationshipArray = <T>(arr: T[] | undefined): T[] | undefined => {
    if (!Array.isArray(arr)) return arr;
    const seen = new Set<string>();
    const out: T[] = [];
    for (const entry of arr) {
        const key =
            typeof entry === 'string'
                ? entry
                : entry && typeof entry === 'object' && typeof (entry as any).id === 'string'
                  ? ((entry as any).id as string)
                  : undefined;
        if (key === undefined) {
            out.push(entry);
            continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(entry);
    }
    return out;
};

export const normalizeDidDocumentForInterop = (doc: any): void => {
    if (!doc || typeof doc !== 'object') return;
    doc.verificationMethod = ensureVerificationMethodsHaveJwk(doc.verificationMethod);
    doc.verificationMethod = dedupeDidRelationshipArray(doc.verificationMethod);
    doc.authentication = dedupeDidRelationshipArray(doc.authentication);
    doc.assertionMethod = dedupeDidRelationshipArray(doc.assertionMethod);
    doc.keyAgreement = dedupeDidRelationshipArray(doc.keyAgreement);
};
