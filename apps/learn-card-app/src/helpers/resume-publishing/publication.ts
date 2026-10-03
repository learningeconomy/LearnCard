import { z } from 'zod';
import {
    CreateShareLinkInputValidator,
    UpdateShareLinkInputValidator,
    ShareEnvelopeValidator,
    type ShareLink,
    type ShareOwnerRecovery,
    type ShareLinkOperationKeyInput,
    type ShareLinkOwnerStatusOutput,
    type ShareEnvelope,
    type ShareLinkAttachment,
    type PutShareLinkAttachmentChunkInput,
    type DeleteShareLinkAttachmentChunksInput,
    type VC,
} from '@learncard/types';
import {
    prepareShare,
    prepareShareUpdate,
    readShareRecovery,
    resolveExpiryIso,
    classifySharePublication,
    buildAppShareLinkUrl,
    type ShareWallet,
    type PreparedShare,
    type PreparedShareUpdate,
} from '../../components/share-links/shareLinkFlow';
import {
    readResumeCheckpoint,
    writeResumeCheckpoint,
    deleteResumeCheckpoint,
    createResumeCheckpoint,
    ResumeCheckpointExistsError,
} from './checkpoint';
import { generateShareContentKey, generateShareLinkId } from 'learn-card-base/helpers/share-links';
import { ProtectedPdfError } from './protectedPdf';
import type { ResumeBuilderSnapshot } from '../../stores/resumeBuilderStore';

export class ResumePublicationError extends Error {
    cleanupWarning?: boolean;
    canDiscard?: boolean;
    constructor(
        public readonly code: 'legacy' | 'pending' | 'size' | 'inactive' | 'account' | 'failed'
    ) {
        super('Unable to publish resume');
    }
}
export type ResumePublicationWallet = ShareWallet & {
    invoke: {
        getShareLink(id: string): Promise<ShareLinkOwnerStatusOutput>;
        putShareLinkAttachmentChunk(input: PutShareLinkAttachmentChunkInput): Promise<{ ok: true }>;
        deleteShareLinkAttachmentChunks(
            input: DeleteShareLinkAttachmentChunksInput
        ): Promise<{ ok: boolean }>;
        getShareLinkOperationStatus(
            input: ShareLinkOperationKeyInput
        ): Promise<ShareLinkOwnerStatusOutput>;
    };
    store: {
        LearnCloud: {
            uploadEncrypted(vc: VC): Promise<string>;
            delete(uri: string): Promise<boolean>;
        };
    };
    index: {
        LearnCloud: {
            get(query: {
                category?: string;
                uri?: string;
                credentialId?: string;
            }): Promise<Record<string, unknown>[]>;
            add(record: Record<string, unknown>): Promise<unknown>;
            update(id: string, record: Record<string, unknown>): Promise<unknown>;
        };
    };
};
export type ResumePublicationArtifacts = {
    lerVc: VC;
    lerUri: string;
    pdfUrl: string;
    shareId: string;
    shareLink: string;
    cleanupWarning?: boolean;
    recoveredAttempt?: boolean;
    snapshot: ResumeBuilderSnapshot;
};
type Attempt = {
    version: 1;
    ownerDid: string;
    mode: 'create' | 'update';
    prepared: PreparedShare | PreparedShareUpdate;
    lerVc: VC;
    lerUri: string;
    pdfUrl: string;
    recordId: string;
    replacesRecord: boolean;
    generatedAt: string;
    fileName: string;
    pdfHash: string;
    snapshot: ResumeBuilderSnapshot;
    operation?: ShareLinkOperationKeyInput;
    committed?: boolean;
    rejected?: boolean;
    phase?: 'prepared' | 'commit' | 'discarding';
    attachment?: ShareLinkAttachment;
    chunks?: ShareEnvelope[];
};
const persistedSchema = z.object({
    version: z.literal(1),
    ownerDid: z.string(),
    mode: z.enum(['create', 'update']),
    prepared: z.object({
        input: z.unknown(),
        key: z.string(),
        ownerDid: z.string(),
        payload: z.unknown(),
    }),
    lerVc: z.record(z.string(), z.unknown()),
    lerUri: z.string(),
    pdfUrl: z.string(),
    recordId: z.string(),
    replacesRecord: z.boolean(),
    generatedAt: z.string(),
    fileName: z.string(),
    pdfHash: z.string(),
    snapshot: z.record(z.string(), z.unknown()),
    operation: z.object({ id: z.string(), operationId: z.string() }).optional(),
    committed: z.boolean().optional(),
    rejected: z.boolean().optional(),
    phase: z.enum(['prepared', 'commit', 'discarding']).optional(),
    attachment: z
        .object({ id: z.string().uuid(), chunkCount: z.number().int().min(1).max(16) })
        .optional(),
    chunks: z.array(z.unknown()).max(16).optional(),
});
const activeOwners = new Set<string>();
const checkpointKey = async (did: string): Promise<string> => {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(did));
    return `learncard.resume-publication.v1.${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')}`;
};
const assertCurrent = (isCurrent: () => boolean): void => {
    if (!isCurrent()) throw new ResumePublicationError('account');
};
/** No raw capabilities or PDF bytes persist outside the owner-encrypted checkpoint. */
const saveAttempt = async (
    wallet: ResumePublicationWallet,
    key: string,
    attempt: Attempt,
    isCurrent: () => boolean,
    initial = false
): Promise<void> => {
    assertCurrent(isCurrent);
    const encrypted = await wallet.invoke.createDagJwe(attempt, [wallet.id.did()]);
    assertCurrent(isCurrent);
    const encoded = JSON.stringify(encrypted);
    if (encoded.length > 12 * 1024 * 1024) throw new ResumePublicationError('size');
    if (initial) await createResumeCheckpoint(key, encoded);
    else await writeResumeCheckpoint(key, encoded);
    assertCurrent(isCurrent);
};
const loadAttempt = async (
    wallet: ResumePublicationWallet,
    key: string,
    isCurrent: () => boolean
): Promise<Attempt | undefined> => {
    assertCurrent(isCurrent);
    const stored = await readResumeCheckpoint(key);
    assertCurrent(isCurrent);
    if (!stored) return undefined;
    if (stored.length > 12 * 1024 * 1024) throw new ResumePublicationError('failed');
    const plaintext = await wallet.invoke.decryptDagJwe(JSON.parse(stored) as ShareOwnerRecovery);
    assertCurrent(isCurrent);
    const parsed = persistedSchema.parse(plaintext);
    const input =
        parsed.mode === 'create'
            ? CreateShareLinkInputValidator.parse(parsed.prepared.input)
            : UpdateShareLinkInputValidator.parse(parsed.prepared.input);
    if (
        parsed.ownerDid !== wallet.id.did() ||
        parsed.prepared.ownerDid !== wallet.id.did() ||
        (parsed.operation && parsed.operation.id !== input.id)
    )
        throw new ResumePublicationError('failed');
    if (
        parsed.attachment &&
        (input.attachment?.id !== parsed.attachment.id ||
            input.attachment.chunkCount !== parsed.attachment.chunkCount)
    )
        throw new ResumePublicationError('failed');
    if (
        parsed.chunks &&
        (!parsed.attachment ||
            parsed.chunks.length !== parsed.attachment.chunkCount ||
            parsed.chunks.some(chunk => !ShareEnvelopeValidator.safeParse(chunk).success))
    )
        throw new ResumePublicationError('failed');
    return { ...parsed, prepared: { ...parsed.prepared, input } } as Attempt;
};
export const findOwnedResumeShare = async (
    wallet: ResumePublicationWallet,
    id: string,
    isCurrent: () => boolean
): Promise<ShareLink> => {
    assertCurrent(isCurrent);
    const outcome = classifySharePublication(await wallet.invoke.getShareLink(id));
    assertCurrent(isCurrent);
    if (outcome.status === 'pending') throw new ResumePublicationError('pending');
    if (
        outcome.status !== 'active' ||
        (outcome.share.expiresAt && Date.parse(outcome.share.expiresAt) <= Date.now())
    )
        throw new ResumePublicationError('inactive');
    if (outcome.share.contentState === 'staging') throw new ResumePublicationError('pending');
    if (outcome.share.contentState !== 'finalized') throw new ResumePublicationError('inactive');
    return outcome.share;
};
export const recoverResumeLink = async (
    wallet: ResumePublicationWallet,
    uri: string,
    origin: string,
    development: boolean,
    isCurrent: () => boolean
): Promise<string> => {
    assertCurrent(isCurrent);
    const records = await wallet.index.LearnCloud.get({ uri });
    assertCurrent(isCurrent);
    const record = records.find(item => item.uri === uri && typeof item.shareId === 'string');
    if (!record) throw new ResumePublicationError('legacy');
    const share = await findOwnedResumeShare(wallet, record.shareId as string, isCurrent);
    const recovery = await readShareRecovery(wallet, share);
    assertCurrent(isCurrent);
    return buildAppShareLinkUrl(origin, share.id, recovery.latest.key, development);
};

/** Exact prepared attempts survive remount/reload on this browser; server owner recovery covers finalized links. */
export const publishManagedResume = async (options: {
    wallet: ResumePublicationWallet;
    isCurrent: () => boolean;
    origin: string;
    development: boolean;
    activeResume: { recordId: string; shareId?: string } | null;
    reservedIdentity?: { id: string; key: string };
    snapshot: ResumeBuilderSnapshot;
    fileName: string;
    pdfHash: string;
    generatedAt: string;
    build: (context: { shareId: string; contentVersion: number }) => Promise<{
        lerVc: VC;
        pdfUrl: string;
        attachment?: ShareLinkAttachment;
        chunks?: ShareEnvelope[];
    }>;
}): Promise<
    ResumePublicationArtifacts & { recordId: string; generatedAt: string; fileName: string }
> => {
    const { wallet, isCurrent } = options;
    assertCurrent(isCurrent);
    const owner = wallet.id.did();
    if (activeOwners.has(owner)) throw new ResumePublicationError('pending');
    activeOwners.add(owner);
    let attempt: Attempt | undefined;
    let stagedUri: string | undefined;
    let committedStarted = false;
    let persisted = false;
    let recoveredAttempt = false;
    let cleanupWarning = false;
    let key: string | undefined;
    try {
        key = await checkpointKey(owner);
        assertCurrent(isCurrent);
        attempt = await loadAttempt(wallet, key, isCurrent);
        recoveredAttempt = !!attempt;
        persisted = !!attempt;
        if (attempt?.phase === 'discarding') {
            await discardPendingResumeAttempt(wallet, isCurrent);
            persisted = false;
            throw new ResumePublicationError('failed');
        }
        if (!attempt) {
            const share = options.activeResume?.shareId
                ? await findOwnedResumeShare(wallet, options.activeResume.shareId, isCurrent)
                : undefined;
            const identity = share
                ? { id: share.id, key: '' }
                : options.reservedIdentity || {
                      id: generateShareLinkId(),
                      key: generateShareContentKey(),
                  };
            const { lerVc, pdfUrl, attachment, chunks } = await options.build({
                shareId: identity.id,
                contentVersion: share ? share.contentVersion + 1 : 1,
            });
            if (
                attachment &&
                (!chunks ||
                    chunks.length !== attachment.chunkCount ||
                    chunks.some(chunk => !ShareEnvelopeValidator.safeParse(chunk).success))
            )
                throw new ResumePublicationError('failed');
            assertCurrent(isCurrent);
            stagedUri = await wallet.store.LearnCloud.uploadEncrypted(lerVc);
            assertCurrent(isCurrent);
            if (!stagedUri) throw new ResumePublicationError('failed');
            const prepared = share
                ? await prepareShareUpdate(
                      wallet,
                      share,
                      await readShareRecovery(wallet, share),
                      [stagedUri],
                      'Resume',
                      '',
                      { attachment }
                  )
                : await prepareShare(wallet, [stagedUri], 'Resume', '', resolveExpiryIso('30'), {
                      identity,
                      attachment,
                  });
            assertCurrent(isCurrent);
            if (
                attachment &&
                (prepared.input.attachment?.id !== attachment.id ||
                    prepared.input.attachment.chunkCount !== attachment.chunkCount)
            )
                throw new ResumePublicationError('failed');
            // Validate the actual issued/encrypted envelope, not an estimate from PDF size.
            if (
                !ShareEnvelopeValidator.safeParse(prepared.input.envelope).success ||
                new TextEncoder().encode(JSON.stringify(prepared.input)).byteLength > 1024 * 1024
            )
                throw new ResumePublicationError('size');
            attempt = {
                version: 1,
                ownerDid: owner,
                mode: share ? 'update' : 'create',
                prepared,
                lerVc,
                lerUri: stagedUri,
                pdfUrl,
                recordId: options.activeResume?.recordId || crypto.randomUUID(),
                replacesRecord: !!options.activeResume?.recordId,
                snapshot: options.snapshot,
                generatedAt: options.generatedAt,
                fileName: options.fileName,
                pdfHash: options.pdfHash,
                attachment,
                chunks,
                phase: 'prepared',
            };
            await saveAttempt(wallet, key, attempt, isCurrent, true);
        }
        persisted = true;
        assertCurrent(isCurrent);
        if (!attempt.committed) {
            if (attempt.phase !== 'commit') {
                // Repeating uncommitted opaque chunks is safe; never rebuild their nonces, keys or bytes.
                for (let chunkIndex = 0; chunkIndex < (attempt.chunks?.length || 0); chunkIndex++) {
                    assertCurrent(isCurrent);
                    await wallet.invoke.putShareLinkAttachmentChunk({
                        id: attempt.prepared.input.id,
                        contentVersion: attempt.prepared.input.contentVersion!,
                        attachmentId: attempt.attachment!.id,
                        chunkIndex,
                        chunkCount: attempt.attachment!.chunkCount,
                        envelope: attempt.chunks![chunkIndex],
                        ownerEncryptedRecovery: attempt.prepared.input.ownerEncryptedRecovery!,
                    });
                    assertCurrent(isCurrent);
                }
                await saveAttempt(wallet, key, { ...attempt, phase: 'commit' }, isCurrent);
                attempt.phase = 'commit';
            }
            committedStarted = true;
            const commit = () =>
                attempt!.mode === 'create'
                    ? wallet.invoke.createShareLink((attempt!.prepared as PreparedShare).input)
                    : wallet.invoke.updateShareLink(
                          (attempt!.prepared as PreparedShareUpdate).input
                      );
            let outcome = classifySharePublication(
                attempt.operation
                    ? await wallet.invoke.retryShareLinkOperation(attempt.operation)
                    : await commit()
            );
            assertCurrent(isCurrent);
            if (outcome.status === 'abandoned' && attempt.attachment) {
                // Abandoned PDF chunks are tombstoned server-side. Withdraw the exact old attempt before preparing anew.
                await discardPendingResumeAttempt(wallet, isCurrent);
                persisted = false;
                stagedUri = undefined;
                throw new ResumePublicationError('failed');
            }
            if (outcome.status === 'abandoned') outcome = classifySharePublication(await commit());
            assertCurrent(isCurrent);
            if (outcome.status === 'pending') {
                attempt.operation = outcome.operation;
                await saveAttempt(wallet, key, attempt, isCurrent);
                throw new ResumePublicationError('pending');
            }
            if (outcome.status === 'abandoned') throw new ResumePublicationError('pending');
            if (outcome.status === 'inactive') throw new ResumePublicationError('inactive');
            if (
                outcome.share.id !== attempt.prepared.input.id ||
                outcome.share.contentVersion !== attempt.prepared.input.contentVersion
            )
                throw new ResumePublicationError('pending');
            attempt.committed = true;
            await saveAttempt(wallet, key, attempt, isCurrent);
        }
        const currentShare = await findOwnedResumeShare(
            wallet,
            attempt.prepared.input.id,
            isCurrent
        );
        if (currentShare.contentVersion !== attempt.prepared.input.contentVersion)
            throw new ResumePublicationError('inactive');
        // Upsert by exact owner record id. A lost add acknowledgement is recovered by reading first.
        const records = await wallet.index.LearnCloud.get({ category: 'Resume' });
        assertCurrent(isCurrent);
        const previous = records.find(item => item.id === attempt!.recordId);
        const previousPublicationUris = [
            ...new Set([
                ...(Array.isArray(previous?.previousPublicationUris)
                    ? previous.previousPublicationUris.filter(
                          (uri): uri is string => typeof uri === 'string'
                      )
                    : []),
                ...(typeof previous?.uri === 'string' ? [previous.uri] : []),
            ]),
        ].filter(uri => uri !== attempt!.lerUri);
        const record = {
            previousPublicationUris,
            uri: attempt.lerUri,
            category: 'Resume',
            credentialId: attempt.lerVc.id,
            lerRecordId: attempt.lerVc.id || attempt.recordId,
            pdfHash: attempt.pdfHash,
            shareId: attempt.prepared.input.id,
            publicationStatus: 'active',
            isCurrent: true,
            generatedAt: attempt.generatedAt,
            fileName: attempt.fileName,
            resumeBuilderSnapshot: attempt.snapshot,
        };
        if (attempt.replacesRecord || records.some(item => item.id === attempt!.recordId))
            await wallet.index.LearnCloud.update(attempt.recordId, record);
        else await wallet.index.LearnCloud.add({ id: attempt.recordId, ...record });
        assertCurrent(isCurrent);
        for (const old of records.filter(item => item.id !== attempt!.recordId)) {
            assertCurrent(isCurrent);
            try {
                await wallet.index.LearnCloud.update(String(old.id), { isCurrent: false });
            } catch {
                cleanupWarning = true;
            }
        }
        assertCurrent(isCurrent);
        await deleteResumeCheckpoint(key);
        assertCurrent(isCurrent);
        return {
            lerVc: attempt.lerVc,
            lerUri: attempt.lerUri,
            pdfUrl: attempt.pdfUrl,
            shareId: attempt.prepared.input.id,
            shareLink: buildAppShareLinkUrl(
                options.origin,
                attempt.prepared.input.id,
                attempt.prepared.key,
                options.development
            ),
            recordId: attempt.recordId,
            generatedAt: attempt.generatedAt,
            fileName: attempt.fileName,
            snapshot: attempt.snapshot,
            ...(recoveredAttempt ? { recoveredAttempt: true } : {}),
            ...(cleanupWarning ? { cleanupWarning: true } : {}),
        };
    } catch (error) {
        // A definite first-request rejection can be discarded only after an owner-scoped read.
        const failureCode =
            error && typeof error === 'object' && 'data' in error
                ? (error as { data?: { code?: string } }).data?.code
                : undefined;
        if (
            persisted &&
            !recoveredAttempt &&
            !attempt?.committed &&
            !attempt?.operation &&
            [
                'BAD_REQUEST',
                'FORBIDDEN',
                'UNAUTHORIZED',
                'NOT_FOUND',
                'PRECONDITION_FAILED',
            ].includes(failureCode || '') &&
            attempt &&
            key &&
            isCurrent()
        ) {
            try {
                attempt.rejected = true;
                await saveAttempt(wallet, key, attempt, isCurrent);
                cleanupWarning = await discardPendingResumeAttempt(wallet, isCurrent);
                persisted = false;
                committedStarted = false;
                stagedUri = undefined;
            } catch {
                /* Keep the exact attempt if proof or cleanup is unavailable. */
            }
        }
        // Never destroy a credential after an uncertain mutation or while another account is active.
        if (!persisted && !committedStarted && stagedUri && isCurrent()) {
            try {
                if (!(await wallet.store.LearnCloud.delete(stagedUri))) cleanupWarning = true;
            } catch {
                cleanupWarning = true;
            }
        }
        if (error instanceof ResumeCheckpointExistsError)
            throw new ResumePublicationError('pending');
        if (error instanceof ResumePublicationError) {
            error.canDiscard =
                error.canDiscard ||
                (persisted &&
                    (attempt?.phase === 'prepared' || attempt?.phase === 'discarding') &&
                    !attempt.committed);
            if (cleanupWarning) error.cleanupWarning = true;
            throw error;
        }
        if (error instanceof ProtectedPdfError && error.code === 'too-large') {
            const mapped = new ResumePublicationError('size');
            mapped.cleanupWarning = cleanupWarning;
            throw mapped;
        }
        if (
            error instanceof Error &&
            (error.message === 'size' ||
                (error instanceof z.ZodError &&
                    error.issues.some(issue => issue.code === 'too_big')))
        ) {
            const mapped = new ResumePublicationError('size');
            mapped.cleanupWarning = cleanupWarning;
            throw mapped;
        }
        const mapped = new ResumePublicationError(persisted ? 'pending' : 'failed');
        mapped.canDiscard =
            persisted &&
            (attempt?.phase === 'prepared' || attempt?.phase === 'discarding') &&
            !attempt.committed;
        mapped.cleanupWarning = cleanupWarning;
        throw mapped;
    } finally {
        activeOwners.delete(owner);
    }
};

/** Return the exact pending address before generating a QR-bearing PDF. */
export const readPendingResumeAddress = async (
    wallet: ResumePublicationWallet,
    isCurrent: () => boolean
): Promise<{ id: string; key: string } | undefined> => {
    const key = await checkpointKey(wallet.id.did());
    const pending = await loadAttempt(wallet, key, isCurrent);
    return pending ? { id: pending.prepared.input.id, key: pending.prepared.key } : undefined;
};

/** Explicit discard requires an authoritative abandoned operation or a definite rejected first request. */
export const discardPendingResumeAttempt = async (
    wallet: ResumePublicationWallet,
    isCurrent: () => boolean
): Promise<boolean> => {
    assertCurrent(isCurrent);
    const owner = wallet.id.did();
    const key = await checkpointKey(owner);
    const pending = await loadAttempt(wallet, key, isCurrent);
    if (!pending) return false;
    if (pending.committed) throw new ResumePublicationError('pending');
    if (!pending.rejected && pending.phase !== 'prepared' && pending.phase !== 'discarding') {
        if (!pending.operation) throw new ResumePublicationError('pending');
        const status = await wallet.invoke.getShareLinkOperationStatus(pending.operation);
        assertCurrent(isCurrent);
        if (status.status !== 'not_found') throw new ResumePublicationError('pending');
    }
    const status = await wallet.invoke.getShareLink(pending.prepared.input.id);
    assertCurrent(isCurrent);
    if (status.status === 'pending') throw new ResumePublicationError('pending');
    // An abandoned create can retain a pending/non-finalized owner node after its reservation is gone.
    // No recipient-readable content exists on that projection; backend exact-chunk cleanup still fences ownership/pinning.
    const unpublishedOwnerNode =
        status.status !== 'not_found' &&
        status.share.status === 'pending' &&
        status.share.contentState !== 'finalized';
    if (status.status !== 'not_found' && !unpublishedOwnerNode) {
        const recovery = await readShareRecovery(wallet, status.share);
        assertCurrent(isCurrent);
        if (recovery.selection.some(item => item.ref === pending.lerUri))
            throw new ResumePublicationError('pending');
    }
    // Persist cancellation before deleting bytes; failed local finalization must never resume this attempt.
    await saveAttempt(wallet, key, { ...pending, phase: 'discarding' }, isCurrent);
    if (pending.attachment) {
        const cleaned = await wallet.invoke.deleteShareLinkAttachmentChunks({
            id: pending.prepared.input.id,
            contentVersion: pending.prepared.input.contentVersion!,
            attachmentId: pending.attachment.id,
            chunkCount: pending.attachment.chunkCount,
        });
        assertCurrent(isCurrent);
        if (!cleaned.ok) {
            const error = new ResumePublicationError('failed');
            error.cleanupWarning = true;
            error.canDiscard = true;
            throw error;
        }
    }
    const deleted = await wallet.store.LearnCloud.delete(pending.lerUri);
    assertCurrent(isCurrent);
    if (!deleted) {
        const error = new ResumePublicationError('failed');
        error.cleanupWarning = true;
        error.canDiscard = true;
        throw error;
    }
    await deleteResumeCheckpoint(key);
    assertCurrent(isCurrent);
    return false;
};
