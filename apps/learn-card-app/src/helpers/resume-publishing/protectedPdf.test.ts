import { Blob as NodeBlob } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import {
    MAX_RESUME_PDF_BYTES,
    RESUME_PDF_CHUNK_BYTES,
    prepareProtectedPdf,
    loadProtectedResumePdf,
    getProtectedResumePdf,
    hasProtectedResumePdf,
    downloadProtectedResumePdf,
    type PreparedProtectedPdf,
    type ProtectedResumeChunkReader,
    type ProtectedResumeChunkRequest,
} from './protectedPdf';
const shareId = 'AAAAAAAAAAAAAAAAAAAAAA';
const bytes = new TextEncoder().encode('%PDF-1.7\nPDF_CONTENT_CANARY\n%%EOF');
const hash = async (input: Uint8Array): Promise<string> =>
    Buffer.from(await webcrypto.subtle.digest('SHA-256', new Uint8Array(input).buffer)).toString(
        'hex'
    );
const fixture = async (input = bytes) => {
    const prepared = await prepareProtectedPdf(
        new Blob([new Uint8Array(input).buffer], { type: 'application/pdf' }),
        await hash(input),
        { shareId, contentVersion: 2 }
    );
    return {
        prepared,
        vc: { credentialSubject: { attachments: [prepared.descriptor] } } as unknown as VC,
    };
};
const reader = (prepared: PreparedProtectedPdf): ProtectedResumeChunkReader =>
    vi.fn(async request => ({ ...request, envelope: prepared.chunks[request.chunkIndex] }));
beforeEach(() => {
    vi.stubGlobal('Blob', NodeBlob);
    vi.stubGlobal('crypto', webcrypto);
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});
describe('managed encrypted PDF chunks', () => {
    it('roundtrips a realistic multipage PDF with bounded requests and no plaintext in chunks', async () => {
        const large = new Uint8Array(856067);
        large.set(bytes);
        const { prepared, vc } = await fixture(large);
        expect(prepared.chunks).toHaveLength(4);
        for (const envelope of prepared.chunks) {
            expect(JSON.stringify(envelope).length).toBeLessThan(512 * 1024);
            expect(JSON.stringify(envelope)).not.toContain('PDF_CONTENT_CANARY');
            expect(JSON.stringify(envelope)).not.toContain(String(prepared.descriptor.key));
        }
        const blob = await loadProtectedResumePdf(vc, reader(prepared));
        expect(new Uint8Array(await blob.arrayBuffer())).toEqual(large);
        expect(blob.type).toBe('application/pdf');
        expect(prepared.descriptor.url).toMatch(/^urn:learncard:resume-pdf:/);
    });
    it('accepts4MiB and rejects oversized input before reading', async () => {
        const boundary = new Uint8Array(MAX_RESUME_PDF_BYTES);
        boundary.set(bytes);
        const { prepared, vc } = await fixture(boundary);
        expect(prepared.chunks).toHaveLength(16);
        expect((await loadProtectedResumePdf(vc, reader(prepared))).size).toBe(
            MAX_RESUME_PDF_BYTES
        );
        const oversized = new Blob([boundary, new Uint8Array(1)], { type: 'application/pdf' });
        const read = vi.spyOn(oversized, 'arrayBuffer');
        await expect(
            prepareProtectedPdf(oversized, '0'.repeat(64), { shareId, contentVersion: 1 })
        ).rejects.toMatchObject({ code: 'too-large' });
        expect(read).not.toHaveBeenCalled();
    });
    it('checks MIME, magic, hash and binding before stage', async () => {
        const digest = await hash(bytes);
        await expect(
            prepareProtectedPdf(new Blob([bytes], { type: 'text/plain' }), digest, {
                shareId,
                contentVersion: 1,
            })
        ).rejects.toThrow();
        await expect(
            prepareProtectedPdf(new Blob(['not a pdf'], { type: 'application/pdf' }), digest, {
                shareId,
                contentVersion: 1,
            })
        ).rejects.toThrow();
        await expect(
            prepareProtectedPdf(new Blob([bytes], { type: 'application/pdf' }), '0'.repeat(64), {
                shareId,
                contentVersion: 1,
            })
        ).rejects.toMatchObject({ code: 'integrity' });
        await expect(
            prepareProtectedPdf(new Blob([bytes], { type: 'application/pdf' }), digest, {
                shareId: 'bad',
                contentVersion: 1,
            })
        ).rejects.toThrow();
    });
    it.each(['key', 'shareId', 'contentVersion', 'byteLength'])(
        'rejects tampered %s',
        async field => {
            const { prepared, vc } = await fixture();
            if (field === 'key')
                prepared.descriptor.key = String(prepared.descriptor.key).startsWith('A')
                    ? 'B'.repeat(43)
                    : 'A'.repeat(43);
            if (field === 'shareId') prepared.descriptor.shareId = 'BBBBBBBBBBBBBBBBBBBBBA';
            if (field === 'contentVersion') prepared.descriptor.contentVersion = 3;
            if (field === 'byteLength') prepared.descriptor.byteLength = bytes.length + 1;
            await expect(loadProtectedResumePdf(vc, reader(prepared))).rejects.toThrow();
        }
    );
    it('rejects swapped chunks, stale responses and denied access', async () => {
        const large = new Uint8Array(RESUME_PDF_CHUNK_BYTES + bytes.length);
        large.set(bytes);
        const { prepared, vc } = await fixture(large);
        await expect(
            loadProtectedResumePdf(vc, async req => ({
                ...req,
                envelope: prepared.chunks[1 - req.chunkIndex],
            }))
        ).rejects.toThrow();
        await expect(
            loadProtectedResumePdf(vc, async req => ({
                ...req,
                contentVersion: 1,
                envelope: prepared.chunks[req.chunkIndex],
            }))
        ).rejects.toThrow();
        await expect(
            loadProtectedResumePdf(vc, async () => {
                throw Error('stopped');
            })
        ).rejects.toThrow();
    });
    it('fails closed on external and ambiguous descriptors without URL fetch', async () => {
        const { prepared, vc } = await fixture();
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        const malformed = {
            ...vc,
            credentialSubject: {
                attachments: [{ ...prepared.descriptor, url: 'https://provider.test/resume.pdf' }],
            },
        } as VC;
        expect(hasProtectedResumePdf(malformed)).toBe(true);
        expect(getProtectedResumePdf(malformed)).toBeUndefined();
        await expect(loadProtectedResumePdf(malformed, reader(prepared))).rejects.toThrow();
        expect(
            getProtectedResumePdf({
                ...vc,
                credentialSubject: { attachments: [prepared.descriptor, prepared.descriptor] },
            } as VC)
        ).toBeUndefined();
        const ambiguous = {
            ...vc,
            credentialSubject: [vc.credentialSubject, vc.credentialSubject],
        } as VC;
        expect(hasProtectedResumePdf(ambiguous)).toBe(true);
        expect(getProtectedResumePdf(ambiguous)).toBeUndefined();
        await expect(loadProtectedResumePdf(ambiguous, reader(prepared))).rejects.toThrow();
        expect(fetch).not.toHaveBeenCalled();
    });
    it('roundtrips a descriptor on a later subject and forwards each renewed grant', async () => {
        const large = new Uint8Array(2 * RESUME_PDF_CHUNK_BYTES + bytes.length);
        large.set(bytes);
        const { prepared, vc } = await fixture(large);
        const array = {
            ...vc,
            credentialSubject: [{ id: 'unrelated' }, vc.credentialSubject],
        } as VC;
        expect(hasProtectedResumePdf(array)).toBe(true);
        expect(getProtectedResumePdf(array)).toBeDefined();
        const fetchChunk = vi.fn(async (request: ProtectedResumeChunkRequest) => ({
            ...request,
            envelope: prepared.chunks[request.chunkIndex],
            accessToken: `renewed-${request.chunkIndex}`,
        }));
        const blob = await loadProtectedResumePdf(array, fetchChunk);
        expect(new Uint8Array(await blob.arrayBuffer())).toEqual(large);
        expect(fetchChunk.mock.calls[0][0].accessToken).toBeUndefined();
        expect(fetchChunk.mock.calls[1][0].accessToken).toBe('renewed-0');
        expect(fetchChunk.mock.calls[2][0].accessToken).toBe('renewed-1');
    });
    it('checks hash after authenticated decryption', async () => {
        const { prepared, vc } = await fixture();
        prepared.descriptor.descriptions = [
            'LearnCard protected resume PDF v1',
            `SHA-256: ${'0'.repeat(64)}`,
        ];
        await expect(loadProtectedResumePdf(vc, reader(prepared))).rejects.toMatchObject({
            code: 'integrity',
        });
    });
    it('reauthorizes and releases download URL on success or browser failure', async () => {
        const { prepared, vc } = await fixture();
        const create = vi.fn(() => 'blob:local');
        const revoke = vi.fn();
        vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => undefined);
        await expect(
            downloadProtectedResumePdf(vc, 'Resume', async () => false, reader(prepared))
        ).rejects.toThrow();
        expect(create).not.toHaveBeenCalled();
        vi.useFakeTimers();
        await downloadProtectedResumePdf(vc, 'Resume', async () => true, reader(prepared));
        expect(click).toHaveBeenCalledOnce();
        expect(revoke).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(29_999);
        expect(revoke).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(revoke).toHaveBeenCalledWith('blob:local');
        expect(document.querySelector('a')).toBeNull();
        click.mockImplementation(() => {
            throw Error('browser');
        });
        await expect(
            downloadProtectedResumePdf(vc, 'Resume', async () => true, reader(prepared))
        ).rejects.toThrow();
        expect(revoke).toHaveBeenCalledTimes(2);
    });
});
