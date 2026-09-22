import { describe, expect, it, vi } from 'vitest';
import {
    buildSharePresentationExport,
    downloadSharePresentation,
    shareExportFilename,
} from './shareDownload';

const presentation = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    holder: 'did:example:owner',
    verifiableCredential: [
        {
            id: 'urn:credential:selected',
            name: 'Selected credential',
            proof: { type: 'Ed25519Signature2020', proofValue: 'selected-signature' },
        },
        {
            id: 'urn:credential:endorsement',
            name: 'Public endorsement',
            proof: { type: 'Ed25519Signature2020', proofValue: 'endorsement-signature' },
        },
    ],
    proof: { type: 'Ed25519Signature2020', proofValue: 'holder-signature' },
};

describe('share presentation export', () => {
    it('exports the exact holder-signed presentation', () => {
        const contents = buildSharePresentationExport({ presentation } as never);
        expect(contents).toBe(JSON.stringify(presentation, null, 2));
        expect(JSON.parse(contents)).toEqual(presentation);
    });
    it('never exports the key, source refs, owner recovery or manifest metadata', () => {
        const key = 'A'.repeat(43);
        const payload = {
            presentation,
            shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
            selection: [{ credentialIndex: 0 }],
            endorsements: [{ credentialIndex: 1, targetCredentialIndex: 0 }],
            ownerEncryptedRecovery: { protected: 'owner-recovery-secret' },
            sourceRef: 'private:credential:one',
            key,
        };
        const contents = buildSharePresentationExport(payload as never);
        expect(contents).not.toContain('ownerEncryptedRecovery');
        expect(contents).not.toContain('sourceRef');
        expect(contents).not.toContain('private:credential:one');
        expect(contents).not.toContain('owner-recovery-secret');
        expect(contents).not.toContain(key);
        // The signed selected credential and public endorsement stay intact.
        expect(contents).toContain('holder-signature');
        expect(contents).toContain('selected-signature');
        expect(contents).toContain('endorsement-signature');
    });
    it('builds a safe, bounded file name from the title', () => {
        expect(shareExportFilename('Learning highlights')).toBe('learning-highlights.json');
        expect(shareExportFilename('  ***  ')).toBe('shared-credentials.json');
        expect(shareExportFilename('بيانات الاعتماد')).toBe('shared-credentials.json');
        expect(shareExportFilename('a'.repeat(200))).toBe(`${'a'.repeat(60)}.json`);
    });
    it('downloads a JSON blob and revokes its object URL', async () => {
        const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
        const revokeObjectURL = vi.fn();
        const patched = URL as unknown as {
            createObjectURL?: unknown;
            revokeObjectURL?: unknown;
        };
        const originalCreate = patched.createObjectURL;
        const originalRevoke = patched.revokeObjectURL;
        patched.createObjectURL = createObjectURL;
        patched.revokeObjectURL = revokeObjectURL;
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        try {
            downloadSharePresentation({ presentation } as never, 'Learning highlights');
            expect(createObjectURL).toHaveBeenCalledTimes(1);
            expect(createObjectURL.mock.calls[0][0].type).toBe('application/json');
            expect(click).toHaveBeenCalledTimes(1);
            expect(document.querySelector('a')).toBeNull();
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
        } finally {
            click.mockRestore();
            patched.createObjectURL = originalCreate;
            patched.revokeObjectURL = originalRevoke;
        }
    });
});
