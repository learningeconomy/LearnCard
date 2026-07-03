import { describe, it, expect } from 'vitest';
import { createPublicKey, verify as nodeVerify, createHash } from 'crypto';

import { LocalKeyManagementService } from '@kms';
import {
    deriveDidWebPath,
    didWebFromDomain,
    buildManagedDidDocument,
    DidDocumentService,
    InMemoryKeyDirectory,
} from '@did';

describe('did:web path derivation', () => {
    it('derives the served path from path-segmented DIDs', () => {
        expect(deriveDidWebPath('did:web:console.lef.org:p:01HXYZ')).toBe('/p/01HXYZ/did.json');
    });

    it('derives the well-known path for a bare-domain DID', () => {
        expect(deriveDidWebPath('did:web:console.lef.org')).toBe('/.well-known/did.json');
    });

    it('rejects non-did:web strings', () => {
        expect(() => deriveDidWebPath('did:key:z6Mk')).toThrow();
    });

    it('encodes ports when constructing a DID from a domain', () => {
        expect(didWebFromDomain('localhost:3000', '01')).toBe('did:web:localhost%3A3000:p:01');
        expect(deriveDidWebPath(didWebFromDomain('localhost:3000', '01'))).toBe('/p/01/did.json');
    });
});

describe('managed DID document', () => {
    it('builds a JsonWebKey2020 document that excludes any private key material', () => {
        const jwk: JsonWebKey = { kty: 'EC', crv: 'P-256', x: 'X', y: 'Y', d: 'SECRET' };
        const doc = buildManagedDidDocument('did:web:console.lef.org:p:01', jwk);

        expect(doc.id).toBe('did:web:console.lef.org:p:01');
        expect(doc.verificationMethod[0]!.type).toBe('JsonWebKey2020');
        expect(doc.authentication).toEqual(['did:web:console.lef.org:p:01#key-1']);
        expect(
            (doc.verificationMethod[0]!.publicKeyJwk as Record<string, unknown>).d
        ).toBeUndefined();
    });
});

describe('DidDocumentService', () => {
    it('projects the live KMS public key into a resolvable, verifiable document', async () => {
        const kms = new LocalKeyManagementService();
        const directory = new InMemoryKeyDirectory();
        const service = new DidDocumentService({ kms, directory });

        const did = 'did:web:console.lef.org:p:01';
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'p:01' });
        await directory.put(did, ref);

        const doc = await service.resolve(did);
        expect(doc?.id).toBe(did);

        const data = createHash('sha256').update('proof').digest();
        const signature = await kms.sign(ref, data);
        const publicKey = createPublicKey({
            key: doc!.verificationMethod[0]!.publicKeyJwk as any,
            format: 'jwk',
        });

        expect(
            nodeVerify('SHA256', data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)
        ).toBe(true);
    });

    it('returns null for an unknown DID', async () => {
        const service = new DidDocumentService({
            kms: new LocalKeyManagementService(),
            directory: new InMemoryKeyDirectory(),
        });

        expect(await service.resolve('did:web:console.lef.org:p:ghost')).toBeNull();
    });
});
