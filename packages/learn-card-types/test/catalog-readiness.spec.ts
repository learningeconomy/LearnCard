import { describe, expect, it } from 'vitest';
import { BundleManifestValidator, CatalogReadinessGateValidator } from '../src/education-os';

const bundle = {
    apiVersion: 'lc.bundle/v1',
    id: 'org.example.bundle',
    version: '1.0.0',
    publisherDid: 'did:key:publisher',
    contains: [],
    signature: { alg: 'EdDSA', sig: 'fixture', verificationMethod: 'did:key:publisher#key' },
};

describe('Catalog readiness evidence', () => {
    it('preserves bundles without readiness without introducing a signed default', () => {
        expect(BundleManifestValidator.parse(bundle)).not.toHaveProperty('readiness');
    });

    it.each(['OPEN', 'Passable', 'Keep optional'] as const)('round-trips %s evidence', status => {
        const readiness = [{ name: 'Support boundary', status, note: 'Review still required.' }];
        const parsed = BundleManifestValidator.parse({ ...bundle, readiness });
        expect(parsed.readiness).toEqual(readiness);
        expect(BundleManifestValidator.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed);
    });

    it.each([
        { name: '', status: 'OPEN', note: 'Pending' },
        { name: 'Review', status: 'APPROVED', note: 'Pending' },
        { name: 'Review', status: 'OPEN', note: '' },
        { name: 'Review', status: 'OPEN' },
    ])('rejects malformed readiness: %j', gate => {
        expect(CatalogReadinessGateValidator.safeParse(gate).success).toBe(false);
        expect(BundleManifestValidator.safeParse({ ...bundle, readiness: [gate] }).success).toBe(
            false
        );
    });
});
