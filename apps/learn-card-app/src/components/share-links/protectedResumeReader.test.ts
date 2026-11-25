import type { VC } from '@learncard/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    resolve: vi.fn(),
    content: vi.fn(),
    chunk: vi.fn(),
    descriptor: { shareId: 'share-id', contentVersion: 4 },
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => ({
        invoke: {
            resolveShareLink: mocks.resolve,
            getShareLinkContent: mocks.content,
            getShareLinkAttachmentChunk: mocks.chunk,
        },
    }),
}));
vi.mock('./shareLinkFlow', () => ({ shareWallet: (wallet: unknown) => wallet }));
vi.mock('../../helpers/resume-publishing/protectedPdf', () => ({
    getProtectedResumePdf: () => mocks.descriptor,
}));
import { isProtectedResumeCurrent, readProtectedResumeChunk } from './protectedResumeReader';
beforeEach(() => {
    vi.resetAllMocks();
    mocks.resolve.mockResolvedValue({ state: 'active', contentVersion: 4, expiresAt: null });
    mocks.content.mockResolvedValue({ id: 'share-id', contentVersion: 4 });
    mocks.chunk.mockResolvedValue({
        id: 'share-id',
        contentVersion: 4,
        attachmentId: 'attachment-id',
        chunkIndex: 0,
        envelope: {},
    });
});
describe('version-bound resume reader', () => {
    const grantedRequest = {
        id: 'share-id',
        contentVersion: 4,
        attachmentId: 'attachment-id',
        chunkIndex: 1,
        accessToken: 'expired-or-old-ip-grant',
    };
    it.each([{ data: { code: 'UNAUTHORIZED' } }, { code: 'UNAUTHORIZED' }])(
        'reauthenticates exactly the same chunk once after an authorization rejection',
        async rejection => {
            mocks.chunk.mockRejectedValueOnce(rejection);
            await readProtectedResumeChunk(grantedRequest, '1234');
            expect(mocks.chunk).toHaveBeenCalledTimes(2);
            expect(mocks.chunk).toHaveBeenNthCalledWith(1, grantedRequest);
            expect(mocks.chunk).toHaveBeenNthCalledWith(2, {
                id: 'share-id',
                contentVersion: 4,
                attachmentId: 'attachment-id',
                chunkIndex: 1,
                passcode: '1234',
            });
        }
    );
    it('does not loop if the passcode changed or reauthentication is rejected', async () => {
        mocks.chunk.mockRejectedValue({ data: { code: 'UNAUTHORIZED' } });
        await expect(readProtectedResumeChunk(grantedRequest, '1234')).rejects.toMatchObject({
            data: { code: 'UNAUTHORIZED' },
        });
        expect(mocks.chunk).toHaveBeenCalledTimes(2);
    });
    it.each(['NOT_FOUND', 'TOO_MANY_REQUESTS', 'SERVICE_UNAVAILABLE'])(
        'does not reauthenticate a %s response',
        async code => {
            mocks.chunk.mockRejectedValue({ data: { code } });
            await expect(readProtectedResumeChunk(grantedRequest, '1234')).rejects.toMatchObject({
                data: { code },
            });
            expect(mocks.chunk).toHaveBeenCalledOnce();
        }
    );
    it('cannot retry without an entered passcode', async () => {
        mocks.chunk.mockRejectedValue({ data: { code: 'UNAUTHORIZED' } });
        await expect(readProtectedResumeChunk(grantedRequest)).rejects.toMatchObject({
            data: { code: 'UNAUTHORIZED' },
        });
        expect(mocks.chunk).toHaveBeenCalledOnce();
    });
    it('checks active metadata for the exact signed attachment version', async () => {
        expect(await isProtectedResumeCurrent({} as VC)).toBe(true);
        expect(mocks.resolve).toHaveBeenCalledWith('share-id', undefined);
        expect(mocks.content).not.toHaveBeenCalled();
    });
    it.each(['stopped', 'expired', 'not_found'])(
        'denies %s before fetching content',
        async state => {
            mocks.resolve.mockResolvedValue({ state });
            expect(await isProtectedResumeCurrent({} as VC)).toBe(false);
            expect(mocks.content).not.toHaveBeenCalled();
        }
    );
    it('denies a replacement version without exporting cached bytes', async () => {
        mocks.resolve.mockResolvedValue({ state: 'active', contentVersion: 5, expiresAt: null });
        expect(await isProtectedResumeCurrent({} as VC)).toBe(false);
    });
    it('denies local expiry even if metadata reports active', async () => {
        mocks.resolve.mockResolvedValue({
            state: 'active',
            contentVersion: 4,
            expiresAt: new Date(Date.now() - 1).toISOString(),
        });
        expect(await isProtectedResumeCurrent({} as VC)).toBe(false);
        expect(mocks.content).not.toHaveBeenCalled();
    });
    it('passes only public version identity and the optional passcode to the managed route', async () => {
        const request = {
            id: 'share-id',
            contentVersion: 4,
            attachmentId: 'attachment-id',
            chunkIndex: 0,
        };
        await readProtectedResumeChunk(request, '1234');
        expect(mocks.chunk).toHaveBeenCalledWith({ ...request, passcode: '1234' });
    });
    it('forwards a retrieval grant without repeating the passcode challenge', async () => {
        const request = {
            id: 'share-id',
            contentVersion: 4,
            attachmentId: 'attachment-id',
            chunkIndex: 1,
            accessToken: 'ephemeral-grant',
        };
        await readProtectedResumeChunk(request, '1234');
        expect(mocks.chunk).toHaveBeenCalledWith(request);
        expect(JSON.stringify(mocks.chunk.mock.calls)).not.toContain('1234');
    });
});
