import { promises as fs } from 'fs';
import { describe, expect, it } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { clearDidWebDocumentFetchCache } from '@learncard/didkit-plugin';
import type { VC, VerificationCheck } from '@learncard/types';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { verifyClrCredentialTree } from 'learn-card-base/helpers/credentials/clr/verification';
import {
    createClrVerificationFixture,
    createClrVerificationScaleFixture,
} from '../../../tests/fixtures/clr-verification.fixture';

const didkit = fs.readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

describe('real signed CLR verification fixture', () => {
    it('uses DIDKit proofs and a real revoked bitstring while keeping the outer CLR valid', async () => {
        const fixture = await createClrVerificationFixture();
        try {
            clearDidWebDocumentFetchCache();
            const verifier = await initLearnCard({
                seed: 'd'.repeat(64),
                didkit,
                allowRemoteContexts: true,
            });
            const model = normalizeClrTranscriptDisplayModel(
                fixture.credential as unknown as Record<string, unknown>
            );
            const rawResults = new Map<string, VerificationCheck>();
            const snapshot = await verifyClrCredentialTree(model.canonical, async credential => {
                const result = await verifier.invoke.verifyCredential(credential as unknown as VC);
                rawResults.set(String(credential.id), result);
                return result;
            });

            expect(snapshot.outer.proof).toBe('verified');
            expect(snapshot.outer.binding).toBe('not-applicable');
            const valid = snapshot.records['urn:uuid:clr-valid-record'];
            const revoked = snapshot.records['urn:uuid:clr-revoked-record'];
            const tampered = snapshot.records['urn:uuid:clr-tampered-record'];
            expect(snapshot.outer.descendants).toHaveLength(4);
            expect(new Set(snapshot.outer.descendants.map(node => node.occurrencePath)).size).toBe(
                4
            );
            expect(valid?.proof).toBe('verified');
            expect(valid?.binding).toBe('matched');
            expect(revoked?.proof).toBe('verified');
            expect(
                revoked?.lifecycle,
                JSON.stringify(rawResults.get('urn:uuid:clr-revoked-record'))
            ).toBe('revoked');
            expect(revoked?.binding).toBe('matched');
            expect(
                tampered?.proof,
                JSON.stringify(rawResults.get('urn:uuid:clr-tampered-record'))
            ).toBe('invalid');
            expect(tampered?.binding).toBe('matched');
            expect(rawResults.get('urn:uuid:clr-multi-issuer-verification')?.checks).toContain(
                'proof'
            );
            expect(rawResults.get('urn:uuid:clr-valid-record')?.checks).toContain('proof');
            expect(
                rawResults.get('urn:uuid:clr-tampered-record')?.errors,
                JSON.stringify(rawResults.get('urn:uuid:clr-tampered-record'))
            ).not.toHaveLength(0);
            expect(
                rawResults.get('urn:uuid:clr-revoked-record')?.status?.some(item => item.isSet)
            ).toBe(true);
            expect(fixture.counters.didGets).toBeLessThanOrEqual(3);
            expect(fixture.counters.statusGets).toBeGreaterThan(0);
            expect(fixture.counters.statusGets).toBeLessThanOrEqual(1);
            expect(snapshot.complete).toBe(true);
        } finally {
            await fixture.close();
            clearDidWebDocumentFetchCache();
        }
    });
    it('verifies all 50 real records inside the shared 30-second budget without redundant DID lookups', async () => {
        const fixture = await createClrVerificationScaleFixture();
        try {
            clearDidWebDocumentFetchCache();
            const startedAt = performance.now();
            const verifier = await initLearnCard({
                seed: 'd'.repeat(64),
                didkit,
                allowRemoteContexts: true,
            });
            const model = normalizeClrTranscriptDisplayModel(fixture.credential);
            const snapshot = await verifyClrCredentialTree(model.canonical, credential =>
                verifier.invoke.verifyCredential(credential as unknown as VC)
            );
            expect(snapshot.complete).toBe(true);
            expect(snapshot.outer.proof).toBe('verified');
            expect(Object.values(snapshot.records)).toHaveLength(50);
            expect(
                Object.values(snapshot.records).every(
                    node => node.proof === 'verified' && node.binding === 'matched'
                )
            ).toBe(true);
            // Materialization has already resolved these DIDs. Fresh-browser tests prove
            // exactly five cold lookups; this pass must not regress into per-record GETs.
            expect(fixture.counters.didGets).toBeLessThanOrEqual(5);
            expect(performance.now() - startedAt).toBeLessThan(30_000);
        } finally {
            await fixture.close();
            clearDidWebDocumentFetchCache();
        }
    }, 35_000);
});
