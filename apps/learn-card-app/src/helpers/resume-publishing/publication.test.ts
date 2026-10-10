import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { readResumeCheckpoint } from './checkpoint';
import { ProtectedPdfError } from './protectedPdf';
import type { ShareLink, ShareEnvelope, VC } from '@learncard/types';
import type { ResumeBuilderSnapshot } from '../../stores/resumeBuilderStore';
import {
    publishManagedResume,
    recoverResumeLink,
    discardPendingResumeAttempt,
    type ResumePublicationWallet,
} from './publication';
const prepare = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), recovery: vi.fn() }));
vi.mock('../../components/share-links/shareLinkFlow', async importOriginal => ({
    ...(await importOriginal<typeof import('../../components/share-links/shareLinkFlow')>()),
    prepareShare: (...args: unknown[]) => prepare.create(...args),
    prepareShareUpdate: (...args: unknown[]) => prepare.update(...args),
    readShareRecovery: (...args: unknown[]) => prepare.recovery(...args),
}));
const id = 'A'.repeat(22),
    key = 'A'.repeat(43),
    owner = 'did:key:owner';
const envelope: ShareEnvelope = { v: 1, alg: 'A256GCM', iv: 'A'.repeat(16), ct: 'A'.repeat(80) };
const share = {
    id,
    contentVersion: 1,
    version: 1,
    status: 'active',
    contentState: 'finalized',
    expiresAt: null,
} as ShareLink;
const vc = {
    id: 'vc:resume',
    type: ['VerifiableCredential'],
    credentialSubject: { private: 'canary' },
} as unknown as VC;
const snapshot = { personalDetails: { name: 'canary' } } as unknown as ResumeBuilderSnapshot;
const prepared = {
    input: {
        id,
        clientRequestId: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',
        title: 'Resume',
        notifyOnView: false,
        selectedCount: 1,
        contentVersion: 1,
        envelope,
        ownerEncryptedRecovery: { protected: 'e30', iv: 'a', ciphertext: 'b', tag: 'c' },
    },
    key,
    ownerDid: owner,
    payload: {},
};
const checkpointPayloads = new Map<string, unknown>();
const wallet = () => {
    const records: Record<string, unknown>[] = [];
    const mocks = {
        id: { did: () => owner },
        invoke: {
            createDagJwe: vi.fn(async (value: unknown) => {
                const token = crypto.randomUUID();
                checkpointPayloads.set(token, structuredClone(value));
                return { token };
            }),
            decryptDagJwe: vi.fn(async (encrypted: { token: string }) =>
                structuredClone(checkpointPayloads.get(encrypted.token))
            ),
            createShareLink: vi.fn(async () => ({ status: 'completed', share })),
            updateShareLink: vi.fn(async () => ({
                status: 'completed',
                share: { ...share, contentVersion: 2 },
            })),
            retryShareLinkOperation: vi.fn(async () => ({ status: 'completed', share })),
            listShareLinks: vi.fn(async () => ({ records: [share], hasMore: false })),
            getShareLink: vi.fn(async () => ({ status: 'found', share })),
            getShareLinkOperationStatus: vi.fn(async () => ({ status: 'not_found', id })),
            putShareLinkAttachmentChunk: vi.fn(async () => ({ ok: true })),
            deleteShareLinkAttachmentChunks: vi.fn(async () => ({ ok: true })),
        },
        store: {
            LearnCloud: {
                uploadEncrypted: vi.fn(async () => 'lc:encrypted'),
                delete: vi.fn(async () => true),
            },
        },
        index: {
            LearnCloud: {
                get: vi.fn(async () => records),
                add: vi.fn(async (record: Record<string, unknown>) => {
                    records.push(record);
                }),
                update: vi.fn(async () => undefined),
            },
        },
    };
    return { mocks, value: mocks as unknown as ResumePublicationWallet, records };
};
const options = (w: ResumePublicationWallet) => ({
    wallet: w,
    isCurrent: () => true,
    origin: 'https://learncard.app',
    development: false,
    activeResume: null,
    snapshot,
    fileName: 'resume.pdf',
    pdfHash: 'c'.repeat(64),
    generatedAt: '2026-10-03T00:00:00.000Z',
    build: vi.fn(async () => ({ lerVc: vc, pdfUrl: 'data:application/pdf;base64,canary' })),
});
beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    localStorage.clear();
    vi.clearAllMocks();
    checkpointPayloads.clear();
    prepare.create.mockResolvedValue(prepared);
    prepare.update.mockResolvedValue({
        ...prepared,
        input: { ...prepared.input, contentVersion: 2, expectedVersion: 1 },
    });
    prepare.recovery.mockResolvedValue({ latest: { key }, shareId: id });
});
describe('managed resume publication', () => {
    it('creates one link without putting key or PDF in index metadata', async () => {
        const w = wallet();
        const result = await publishManagedResume(options(w.value));
        expect(result.shareId).toBe(id);
        expect(result.shareLink).toContain(`/s/${id}#${key}`);
        expect(prepare.create.mock.calls[0][4]).toMatch(/T/);
        expect(w.records[0]).toMatchObject({ shareId: id, category: 'Resume' });
        expect(JSON.stringify(w.records)).not.toContain(key);
        expect(JSON.stringify(w.records)).not.toContain('data:application');
        expect(localStorage.length).toBe(0);
    });
    it('retains exact prepared request on transport ambiguity', async () => {
        const w = wallet();
        const opts = options(w.value);
        w.mocks.invoke.createShareLink.mockRejectedValueOnce(new Error('lost acknowledgement'));
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'pending' });
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(owner));
        const storageKey = `learncard.resume-publication.v1.${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
        const checkpoint = await readResumeCheckpoint(storageKey);
        expect(checkpoint).not.toContain('canary');
        expect(checkpoint).not.toContain(key);
        const result = await publishManagedResume({
            ...opts,
            build: vi.fn().mockRejectedValue(new Error('must not rebuild')),
        });
        expect(result.shareId).toBe(id);
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledTimes(2);
        expect(w.mocks.invoke.createShareLink.mock.calls[0]).toEqual(
            w.mocks.invoke.createShareLink.mock.calls[1]
        );
        expect(w.mocks.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(1);
    });
    it('retries pending operation by id without a new commit', async () => {
        const w = wallet();
        w.mocks.invoke.createShareLink.mockResolvedValueOnce({
            status: 'pending',
            id,
            operationId: 'op',
        } as never);
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'pending',
        });
        await publishManagedResume(options(w.value));
        expect(w.mocks.invoke.retryShareLinkOperation).toHaveBeenCalledWith({
            id,
            operationId: 'op',
        });
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledTimes(1);
    });
    it('recovers index failure after commit without a second share', async () => {
        const w = wallet();
        w.mocks.index.LearnCloud.add.mockRejectedValueOnce(new Error('index unavailable'));
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'pending',
        });
        await publishManagedResume(options(w.value));
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledTimes(1);
        expect(w.mocks.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(1);
    });
    it('updates associated share preserving id/key', async () => {
        const w = wallet();
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({ status: 'found', share });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({
            status: 'found',
            share: { ...share, contentVersion: 2 },
        });
        const result = await publishManagedResume({
            ...options(w.value),
            activeResume: { recordId: 'old', shareId: id },
        });
        expect(result.shareLink).toContain(`#${key}`);
        expect(w.mocks.invoke.updateShareLink).toHaveBeenCalledTimes(1);
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('never recreates inactive associated links', async () => {
        const w = wallet();
        const opts = options(w.value);
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({
            status: 'found',
            share: { ...share, status: 'stopped' },
        } as never);
        await expect(
            publishManagedResume({ ...opts, activeResume: { recordId: 'old', shareId: id } })
        ).rejects.toMatchObject({ code: 'inactive' });
        expect(opts.build).not.toHaveBeenCalled();
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('cleans definite oversize staging without a partial commit', async () => {
        const w = wallet();
        prepare.create.mockRejectedValueOnce(new Error('size'));
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'size',
        });
        expect(w.mocks.store.LearnCloud.delete).toHaveBeenCalledWith('lc:encrypted');
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('rejects account changes before commit and index mutation', async () => {
        const w = wallet();
        let current = true;
        w.mocks.store.LearnCloud.uploadEncrypted.mockImplementationOnce(async () => {
            current = false;
            return 'lc:encrypted';
        });
        await expect(
            publishManagedResume({ ...options(w.value), isCurrent: () => current })
        ).rejects.toMatchObject({ code: 'account' });
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
        expect(w.mocks.index.LearnCloud.add).not.toHaveBeenCalled();
        expect(w.mocks.store.LearnCloud.delete).not.toHaveBeenCalled();
    });
    it('does not create a link for legacy indexed resumes', async () => {
        const w = wallet();
        w.records.push({ id: 'legacy', uri: 'lc:legacy' });
        await expect(
            recoverResumeLink(w.value, 'lc:legacy', 'https://learncard.app', false, () => true)
        ).rejects.toMatchObject({ code: 'legacy' });
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('stages exact protected chunks before commit and preserves them on retry', async () => {
        const w = wallet();
        const attachment = { id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', chunkCount: 2 };
        const opts = {
            ...options(w.value),
            build: vi.fn(async () => ({
                lerVc: vc,
                pdfUrl: 'urn:learncard:resume-pdf:' + attachment.id,
                attachment,
                chunks: [envelope, envelope],
            })),
        };
        prepare.create.mockResolvedValue({ ...prepared, input: { ...prepared.input, attachment } });
        w.mocks.invoke.createShareLink.mockRejectedValueOnce(new Error('ambiguous'));
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'pending' });
        await publishManagedResume(opts);
        expect(opts.build).toHaveBeenCalledTimes(1);
        expect(w.mocks.invoke.putShareLinkAttachmentChunk).toHaveBeenCalledTimes(2);
        expect(w.mocks.invoke.putShareLinkAttachmentChunk.mock.invocationCallOrder[1]).toBeLessThan(
            w.mocks.invoke.createShareLink.mock.invocationCallOrder[0]
        );
    });
    it('allows exact cleanup of failed precommit chunk staging', async () => {
        const w = wallet();
        const attachment = { id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', chunkCount: 1 };
        prepare.create.mockResolvedValue({ ...prepared, input: { ...prepared.input, attachment } });
        const opts = {
            ...options(w.value),
            build: vi.fn(async () => ({
                lerVc: vc,
                pdfUrl: 'urn:learncard:resume-pdf:' + attachment.id,
                attachment,
                chunks: [envelope],
            })),
        };
        w.mocks.invoke.putShareLinkAttachmentChunk.mockRejectedValueOnce(new Error('offline'));
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'pending' });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({ status: 'not_found', id } as never);
        await discardPendingResumeAttempt(w.value, () => true);
        expect(w.mocks.invoke.deleteShareLinkAttachmentChunks).toHaveBeenCalledWith({
            id,
            contentVersion: 1,
            attachmentId: attachment.id,
            chunkCount: 1,
        });
        expect(w.mocks.store.LearnCloud.delete).toHaveBeenCalledWith('lc:encrypted');
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
        const nextDraft = {
            ...snapshot,
            personalDetails: { name: 'new draft' },
        } as unknown as ResumeBuilderSnapshot;
        const nextBuild = vi.fn(async () => ({ lerVc: vc, pdfUrl: 'new-draft-pdf' }));
        await publishManagedResume({ ...options(w.value), snapshot: nextDraft, build: nextBuild });
        expect(nextBuild).toHaveBeenCalledOnce();
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledOnce();
    });
    it('never discards uncertain commit attempts without authoritative abandonment', async () => {
        const w = wallet();
        w.mocks.invoke.createShareLink.mockRejectedValueOnce(new Error('offline'));
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'pending',
        });
        await expect(discardPendingResumeAttempt(w.value, () => true)).rejects.toMatchObject({
            code: 'pending',
        });
        expect(w.mocks.store.LearnCloud.delete).not.toHaveBeenCalled();
    });
    it('cleans a definitely rejected first create after owner confirms not_found', async () => {
        const w = wallet();
        w.mocks.invoke.createShareLink.mockRejectedValueOnce({ data: { code: 'BAD_REQUEST' } });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({ status: 'not_found', id } as never);
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'failed',
        });
        expect(w.mocks.store.LearnCloud.delete).toHaveBeenCalledWith('lc:encrypted');
        await publishManagedResume(options(w.value));
        expect(w.mocks.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(2);
    });
    it('reports cleanup failure without exposing provider errors', async () => {
        const w = wallet();
        prepare.create.mockRejectedValueOnce(new Error('size'));
        w.mocks.store.LearnCloud.delete.mockResolvedValueOnce(false);
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'size',
            cleanupWarning: true,
            message: 'Unable to publish resume',
        });
    });
    it('replays exact uncommitted chunks after a lost staging acknowledgement', async () => {
        const w = wallet();
        const attachment = { id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', chunkCount: 1 };
        prepare.create.mockResolvedValue({ ...prepared, input: { ...prepared.input, attachment } });
        const opts = {
            ...options(w.value),
            build: vi.fn(async () => ({
                lerVc: vc,
                pdfUrl: 'urn:learncard:resume-pdf:' + attachment.id,
                attachment,
                chunks: [envelope],
            })),
        };
        w.mocks.invoke.putShareLinkAttachmentChunk.mockRejectedValueOnce(new Error('lost ack'));
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'pending' });
        await publishManagedResume(opts);
        expect(opts.build).toHaveBeenCalledTimes(1);
        expect(w.mocks.invoke.putShareLinkAttachmentChunk.mock.calls[0]).toEqual(
            w.mocks.invoke.putShareLinkAttachmentChunk.mock.calls[1]
        );
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledTimes(1);
    });
    it('retains exact owner references to replaced encrypted publications', async () => {
        const w = wallet();
        w.records.push({ id: 'old', uri: 'lc:previous', previousPublicationUris: ['lc:older'] });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({ status: 'found', share });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({
            status: 'found',
            share: { ...share, contentVersion: 2 },
        });
        await publishManagedResume({
            ...options(w.value),
            activeResume: { recordId: 'old', shareId: id },
        });
        expect(w.mocks.index.LearnCloud.update).toHaveBeenCalledWith(
            'old',
            expect.objectContaining({ previousPublicationUris: ['lc:older', 'lc:previous'] })
        );
        expect(w.mocks.store.LearnCloud.delete).not.toHaveBeenCalled();
    });
    it('checks actual prepared ciphertext size before committing', async () => {
        const w = wallet();
        prepare.create.mockResolvedValueOnce({
            ...prepared,
            input: { ...prepared.input, envelope: { ...envelope, ct: 'A'.repeat(720000) } },
        });
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'size',
        });
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
        expect(w.mocks.store.LearnCloud.delete).toHaveBeenCalledWith('lc:encrypted');
    });
    it('withdraws tombstoned attachment attempts after authoritative operation abandonment', async () => {
        const w = wallet();
        const attachment = { id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', chunkCount: 1 };
        prepare.create.mockResolvedValue({ ...prepared, input: { ...prepared.input, attachment } });
        const opts = {
            ...options(w.value),
            build: vi.fn(async () => ({
                lerVc: vc,
                pdfUrl: 'urn:learncard:resume-pdf:' + attachment.id,
                attachment,
                chunks: [envelope],
            })),
        };
        w.mocks.invoke.createShareLink.mockResolvedValueOnce({
            status: 'pending',
            id,
            operationId: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
        } as never);
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'pending' });
        w.mocks.invoke.retryShareLinkOperation.mockResolvedValueOnce({
            status: 'not_found',
            id,
        } as never);
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({
            status: 'found',
            share: { ...share, status: 'pending', contentState: 'staging' },
        } as never);
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'failed' });
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledTimes(1);
        expect(w.mocks.invoke.deleteShareLinkAttachmentChunks).toHaveBeenCalled();
        expect(w.mocks.store.LearnCloud.delete).toHaveBeenCalledWith('lc:encrypted');
        expect(prepare.recovery).not.toHaveBeenCalled();
        const freshId = 'B'.repeat(21) + 'A';
        const freshAttachment = { id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee', chunkCount: 1 };
        prepare.create.mockResolvedValueOnce({
            ...prepared,
            input: {
                ...prepared.input,
                id: freshId,
                clientRequestId: 'ffffffff-ffff-4fff-afff-ffffffffffff',
                attachment: freshAttachment,
            },
        });
        opts.build.mockResolvedValueOnce({
            lerVc: vc,
            pdfUrl: 'urn:learncard:resume-pdf:' + freshAttachment.id,
            attachment: freshAttachment,
            chunks: [envelope],
        });
        w.mocks.invoke.createShareLink.mockResolvedValueOnce({
            status: 'completed',
            share: { ...share, id: freshId },
        });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({
            status: 'found',
            share: { ...share, id: freshId },
        });
        const freshResult = await publishManagedResume(opts);
        expect(freshResult.shareId).toBe(freshId);
        expect(opts.build).toHaveBeenCalledTimes(2);
        expect(w.mocks.invoke.createShareLink).toHaveBeenCalledTimes(2);
    });
    it('never resumes cancelled attempts when encrypted staging cleanup fails', async () => {
        const w = wallet();
        const attachment = { id: 'cccccccc-cccc-4ccc-accc-cccccccccccc', chunkCount: 1 };
        prepare.create.mockResolvedValue({ ...prepared, input: { ...prepared.input, attachment } });
        const opts = {
            ...options(w.value),
            build: vi.fn(async () => ({
                lerVc: vc,
                pdfUrl: 'urn:learncard:resume-pdf:' + attachment.id,
                attachment,
                chunks: [envelope],
            })),
        };
        w.mocks.invoke.putShareLinkAttachmentChunk.mockRejectedValueOnce(new Error('offline'));
        await expect(publishManagedResume(opts)).rejects.toMatchObject({
            code: 'pending',
            canDiscard: true,
        });
        w.mocks.invoke.getShareLink.mockResolvedValue({ status: 'not_found', id } as never);
        w.mocks.store.LearnCloud.delete.mockResolvedValueOnce(false);
        await expect(discardPendingResumeAttempt(w.value, () => true)).rejects.toMatchObject({
            code: 'failed',
            cleanupWarning: true,
        });
        await expect(publishManagedResume(opts)).rejects.toMatchObject({ code: 'failed' });
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
        expect(opts.build).toHaveBeenCalledTimes(1);
    });
    it.each(['active', 'stopped', 'pending'] as const)(
        'keeps committed %s projections when recovery references the staged credential',
        async status => {
            const w = wallet();
            w.mocks.invoke.createShareLink.mockResolvedValueOnce({
                status: 'pending',
                id,
                operationId: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            } as never);
            await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
                code: 'pending',
            });
            w.mocks.invoke.getShareLink.mockResolvedValueOnce({
                status: 'found',
                share: { ...share, status, contentState: 'finalized' },
            } as never);
            prepare.recovery.mockResolvedValueOnce({
                selection: [{ ref: 'lc:encrypted', order: 0 }],
                latest: { key },
                shareId: id,
            });
            await expect(discardPendingResumeAttempt(w.value, () => true)).rejects.toMatchObject({
                code: 'pending',
            });
            expect(prepare.recovery).toHaveBeenCalled();
            expect(w.mocks.store.LearnCloud.delete).not.toHaveBeenCalled();
            expect(w.mocks.invoke.deleteShareLinkAttachmentChunks).not.toHaveBeenCalled();
        }
    );
    it('keeps a current reservation even after an older operation was abandoned', async () => {
        const w = wallet();
        w.mocks.invoke.createShareLink.mockResolvedValueOnce({
            status: 'pending',
            id,
            operationId: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
        } as never);
        await expect(publishManagedResume(options(w.value))).rejects.toMatchObject({
            code: 'pending',
        });
        w.mocks.invoke.getShareLink.mockResolvedValueOnce({
            status: 'pending',
            id,
            operationId: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee',
        } as never);
        await expect(discardPendingResumeAttempt(w.value, () => true)).rejects.toMatchObject({
            code: 'pending',
        });
        expect(w.mocks.store.LearnCloud.delete).not.toHaveBeenCalled();
    });
    it('maps trusted PDF oversize errors before any Cloud or chunk staging', async () => {
        const w = wallet();
        const opts = {
            ...options(w.value),
            build: vi.fn().mockRejectedValue(new ProtectedPdfError('too-large')),
        };
        await expect(publishManagedResume(opts)).rejects.toMatchObject({
            code: 'size',
            message: 'Unable to publish resume',
        });
        expect(w.mocks.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
        expect(w.mocks.invoke.putShareLinkAttachmentChunk).not.toHaveBeenCalled();
        expect(w.mocks.invoke.createShareLink).not.toHaveBeenCalled();
        expect(w.mocks.index.LearnCloud.add).not.toHaveBeenCalled();
    });
});
