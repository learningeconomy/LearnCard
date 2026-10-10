import {
    PutShareLinkAttachmentChunkInputValidator,
    DeleteShareLinkAttachmentChunksInputValidator,
} from '@learncard/types';
import type {
    PutShareLinkAttachmentChunkInput,
    DeleteShareLinkAttachmentChunksInput,
} from '@learncard/types';
import type { ShareContentClient } from './share-content-client';
import {
    beginShareAttachmentChunk,
    completeShareAttachmentChunk,
    deleteUnreferencedShareAttachment,
    shareAttachmentTuple,
    type ShareAttachmentBinding,
} from '../accesslayer/share-link/attachment';
import { ShareLinkCoordinatorError } from './share-link-coordinator/types';
import type { ShareOwnerContext } from './share-link-coordinator/types';
import { isShareLinkRepositoryError } from '../accesslayer/share-link/errors';

export type ShareLinkAttachmentOwnerApi = {
    put: (
        input: PutShareLinkAttachmentChunkInput,
        owner: ShareOwnerContext
    ) => Promise<{ ok: true }>;
    delete: (
        input: DeleteShareLinkAttachmentChunksInput,
        owner: ShareOwnerContext
    ) => Promise<{ ok: boolean }>;
};

export const createShareLinkAttachmentOwnerApi = (
    client: Pick<ShareContentClient, 'put' | 'delete'>,
    repository = {
        begin: beginShareAttachmentChunk,
        complete: completeShareAttachmentChunk,
        deleteUnreferenced: deleteUnreferencedShareAttachment,
    }
): ShareLinkAttachmentOwnerApi => {
    const bindingFor = (
        input: DeleteShareLinkAttachmentChunksInput,
        owner: ShareOwnerContext
    ): ShareAttachmentBinding => ({
        namespace: owner.namespace,
        ownerProfileId: owner.ownerProfileId,
        shareId: input.id,
        contentVersion: input.contentVersion,
        attachmentId: input.attachmentId,
        chunkCount: input.chunkCount,
    });
    return {
        put: async (input, owner) => {
            const parsed = PutShareLinkAttachmentChunkInputValidator.safeParse(input);
            if (!parsed.success)
                throw new ShareLinkCoordinatorError('INVALID_INPUT', 'invalid attachment');
            const value = parsed.data;
            const binding = bindingFor(value, owner);
            try {
                await repository.begin(binding, value.chunkIndex);
                const result = await client.put({
                    ...shareAttachmentTuple(binding, value.chunkIndex),
                    envelope: value.envelope,
                    ownerEncryptedRecovery: value.ownerEncryptedRecovery,
                });
                if (!result.ok)
                    throw new ShareLinkCoordinatorError(
                        result.error === 'CONFLICT' ? 'CONFLICT' : 'UNAVAILABLE',
                        'attachment upload unavailable'
                    );
                await repository.complete(binding, value.chunkIndex);
                return { ok: true };
            } catch (error) {
                if (error instanceof ShareLinkCoordinatorError) throw error;
                const code = isShareLinkRepositoryError(error) ? error.code : undefined;
                throw new ShareLinkCoordinatorError(
                    code === 'CONFLICT'
                        ? 'CONFLICT'
                        : code === 'NOT_FOUND'
                          ? 'NOT_FOUND'
                          : code === 'PRECONDITION_FAILED' || code === 'INVALID_INPUT'
                            ? code
                            : 'UNAVAILABLE',
                    'attachment upload unavailable'
                );
            }
        },
        delete: async (input, owner) => {
            const parsed = DeleteShareLinkAttachmentChunksInputValidator.safeParse(input);
            if (!parsed.success)
                throw new ShareLinkCoordinatorError('INVALID_INPUT', 'invalid attachment');
            const binding = bindingFor(parsed.data, owner);
            let allowed: boolean;
            try {
                allowed = await repository.deleteUnreferenced(binding);
            } catch {
                throw new ShareLinkCoordinatorError(
                    'UNAVAILABLE',
                    'attachment cleanup unavailable'
                );
            }
            if (!allowed) return { ok: false };
            // Durable jobs were queued before I/O; interrupted/failed deletes are retried by maintenance.
            let ok = true;
            for (let index = 0; index < binding.chunkCount; index++) {
                try {
                    const result = await client.delete(shareAttachmentTuple(binding, index));
                    if (!result.ok) ok = false;
                } catch {
                    ok = false;
                }
            }
            return { ok };
        },
    };
};
