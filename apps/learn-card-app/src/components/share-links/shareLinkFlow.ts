import {
    CreateShareLinkInputValidator,
    ShareRecoveryPlaintextValidator,
    ShareContentKeyValidator,
    ShareLinkIdValidator,
    UpdateShareLinkInputValidator,
    type CreateShareLinkInput,
    type UpdateShareLinkInput,
    type ShareRecoveryPlaintext,
    type SharePayload,
    type VC,
    type VP,
    type UnsignedVP,
    type VerificationCheck,
    type ShareOwnerRecovery,
    type ShareLink,
    type ShareLinkOwnerCommitOutput,
    type ShareLinkOwnerContentOutput,
    type ShareLinkOwnerStatusOutput,
    type ShareLinkOperationKeyInput,
    type ShareLinkPublicState,
    type ShareLinkPublicContentView,
    type ListShareLinksInput,
    type PaginatedShareLinks,
    type SentCredentialInfo,
    ShareManifestPresentationValidator,
} from '@learncard/types';
import {
    buildShareLinkUrl,
    buildShareManifest,
    buildShareRecovery,
    encryptSharePayload,
    encryptShareRecovery,
    generateShareContentKey,
    generateShareLinkId,
    validateShareManifest,
} from 'learn-card-base/helpers/share-links';

/** Narrow boundary shared by browser adapters and tests; no app-wide wallet store coupling. */
export interface ShareWallet {
    id: { did(): string };
    read: { get(uri: string): Promise<unknown> };
    index: {
        LearnCloud: {
            get(query: { credentialId: string }): Promise<{ uri: string; visibility?: string }[]>;
            getPage(
                query: undefined,
                options: { cursor?: string; limit: number }
            ): Promise<{
                records: { id?: string; uri: string; category?: string; title?: string }[];
                cursor?: string;
                hasMore: boolean;
            }>;
        };
    };
    invoke: {
        getProfile(): Promise<{ profileId: string; displayName?: string } | undefined>;
        issuePresentation(vp: UnsignedVP, options: { proofPurpose: string }): Promise<VP>;
        createDagJwe(value: unknown, recipients: string[]): Promise<ShareOwnerRecovery>;
        decryptDagJwe(value: ShareOwnerRecovery): Promise<unknown>;
        createShareLink(input: CreateShareLinkInput): Promise<ShareLinkOwnerCommitOutput>;
        updateShareLink(input: UpdateShareLinkInput): Promise<ShareLinkOwnerCommitOutput>;
        revokeShareLink(input: {
            id: string;
            expectedVersion?: number;
            clientRequestId?: string;
        }): Promise<ShareLinkOwnerCommitOutput>;
        getShareLinkRecovery(id: string): Promise<{ recovery: ShareOwnerRecovery }>;
        getShareLinkOwnerContent(id: string): Promise<ShareLinkOwnerContentOutput>;
        listShareLinks(input: ListShareLinksInput): Promise<PaginatedShareLinks>;
        retryShareLinkOperation(
            input: ShareLinkOperationKeyInput
        ): Promise<ShareLinkOwnerStatusOutput>;
        resolveShareLink(id: string, passcode?: string): Promise<ShareLinkPublicState>;
        getShareLinkContent(id: string, passcode?: string): Promise<ShareLinkPublicContentView>;
        acknowledgeShareLinkView(receipt: string): Promise<{ ok: true }>;
        sendPresentation(
            profileId: string,
            vp: VP,
            metadataOrEncrypt?: Record<string, unknown> | boolean,
            encrypt?: boolean
        ): Promise<string>;
        acceptPresentation(uri: string): Promise<boolean>;
        getReceivedPresentations(): Promise<SentCredentialInfo[]>;
        getIncomingPresentations(): Promise<SentCredentialInfo[]>;
        verifyPresentation(vp: VP, options: { proofPurpose: string }): Promise<VerificationCheck>;
        verifyCredential(vc: VC): Promise<VerificationCheck>;
    };
}
export const shareWallet = (wallet: unknown): ShareWallet => wallet as ShareWallet;
export type CredentialChoice = { uri: string; credential?: VC; category?: string; title?: string };
export type PreparedShare = {
    input: CreateShareLinkInput;
    key: string;
    ownerDid: string;
    /** Exact manifest that was encrypted: the preview must render this, not a rebuild. */
    payload: SharePayload;
};
export type PreparedShareUpdate = {
    input: UpdateShareLinkInput;
    key: string;
    ownerDid: string;
    /** Exact manifest that was encrypted: the preview must render this, not a rebuild. */
    payload: SharePayload;
};
export type ProofState = 'checking' | 'verified' | 'failed' | 'unavailable';

export const SAVED_SHARE_METADATA_TYPE = 'learncard.share-link.v1' as const;

export type SavedShareLinkMetadata = {
    type: typeof SAVED_SHARE_METADATA_TYPE;
    shareId: string;
    title: string;
    note?: string;
    sharer: {
        profileId: string;
        displayName: string;
        avatar?: string;
    };
};

const boundedString = (value: unknown, max: number): value is string =>
    typeof value === 'string' && value.length > 0 && value.length <= max;

/** Parse presentation relationship metadata without trusting it as signed content. */
export const parseSavedShareLinkMetadata = (value: unknown): SavedShareLinkMetadata | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const metadata = value as Record<string, unknown>;
    const sharer = metadata.sharer;
    if (!sharer || typeof sharer !== 'object' || Array.isArray(sharer)) return undefined;
    const sharerRecord = sharer as Record<string, unknown>;
    if (
        metadata.type !== SAVED_SHARE_METADATA_TYPE ||
        !ShareLinkIdValidator.safeParse(metadata.shareId).success ||
        !boundedString(metadata.title, 120) ||
        (metadata.note !== undefined && !boundedString(metadata.note, 500)) ||
        !boundedString(sharerRecord.profileId, 128) ||
        !boundedString(sharerRecord.displayName, 120) ||
        (sharerRecord.avatar !== undefined && !boundedString(sharerRecord.avatar, 2048))
    )
        return undefined;

    return metadata as SavedShareLinkMetadata;
};

/** Bounded, order-preserving fan-out so a picker never opens unbounded reads. */
export const mapWithConcurrency = async <T, R>(
    items: readonly T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let next = 0;
    const run = async (): Promise<void> => {
        while (next < items.length) {
            const index = next++;
            results[index] = await worker(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, run));
    return results;
};

/**
 * HTTPS everywhere, with an explicit development-only exception for loopback.
 * Keep this app adapter separate from the canonical HTTPS protocol helpers.
 */
export const shareLinkOrigin = (baseUrl: string, development = false): string | undefined => {
    try {
        const url = new URL(baseUrl);
        if (url.username || url.password) return undefined;
        const localHttp =
            development &&
            url.protocol === 'http:' &&
            ['localhost', '127.0.0.1'].includes(url.hostname);
        if (url.protocol !== 'https:' && !localHttp) return undefined;
        return url.origin;
    } catch {
        return undefined;
    }
};

export const buildAppShareLinkUrl = (
    baseUrl: string,
    id: string,
    key: string,
    development = false
): string => {
    const origin = shareLinkOrigin(baseUrl, development);
    if (!origin) throw new Error('Unsupported share origin');
    const url = new URL(buildShareLinkUrl(new URL(origin).host, id, key));
    url.protocol = new URL(origin).protocol;
    return url.href;
};

export type ExpiryChoice = '7' | '30' | '365' | 'never';
export const EXPIRY_CHOICES: ExpiryChoice[] = ['7', '30', '365', 'never'];
/** Conservative default for a production policy that has no verified age. */
export const DEFAULT_EXPIRY_CHOICE: ExpiryChoice = '30';
const DAY_MS = 24 * 60 * 60 * 1000;

export const expiryToDays = (choice: ExpiryChoice): number | null =>
    choice === 'never' ? null : Number(choice);

/** Absolute timestamp pinned once per prepared attempt; `null` means never. */
export const resolveExpiryIso = (choice: ExpiryChoice, now: number = Date.now()): string | null => {
    const days = expiryToDays(choice);
    return days === null ? null : new Date(now + days * DAY_MS).toISOString();
};

export const readShareAddress = (id: string, hash: string) => {
    const key = hash.startsWith('#') ? hash.slice(1) : '';
    return ShareLinkIdValidator.safeParse(id).success &&
        ShareContentKeyValidator.safeParse(key).success
        ? { id, key }
        : undefined;
};

const readSelectedCredentials = async (wallet: ShareWallet, refs: string[]) => {
    if (!refs.length || refs.length > 50 || new Set(refs).size !== refs.length)
        throw new Error('selection');

    const credentials: VC[] = [];
    for (const ref of refs) {
        const credential = await wallet.read.get(ref);
        if (!credential) throw new Error('credential');
        credentials.push(credential as VC);
    }

    const endorsements: { credentialIndex: number; targetCredentialIndex: number }[] = [];
    const recoveryEndorsements: { targetRef: string }[] = [];
    for (
        let targetCredentialIndex = 0;
        targetCredentialIndex < refs.length;
        targetCredentialIndex++
    ) {
        const target = credentials[targetCredentialIndex];
        if (!target.id) continue;
        const records = await wallet.index.LearnCloud.get({ credentialId: target.id });
        for (const record of records.filter(item => item.visibility === 'public')) {
            if (endorsements.length >= 200) throw new Error('endorsements');
            const credential = await wallet.read.get(record.uri);
            if (!credential) throw new Error('endorsement');
            endorsements.push({ credentialIndex: credentials.length, targetCredentialIndex });
            recoveryEndorsements.push({ targetRef: refs[targetCredentialIndex] });
            credentials.push(credential as VC);
        }
    }

    return { credentials, endorsements, recoveryEndorsements };
};

const prepareEncryptedRevision = async (
    wallet: ShareWallet,
    options: {
        id: string;
        key: string;
        contentVersion: number;
        createdAt: string;
        ownerProfileId: string;
        refs: string[];
    }
) => {
    const profile = await wallet.invoke.getProfile();
    if (!profile || profile.profileId !== options.ownerProfileId) throw new Error('profile');

    const { credentials, endorsements, recoveryEndorsements } = await readSelectedCredentials(
        wallet,
        options.refs
    );
    const ownerDid = wallet.id.did();
    // A v1 presentation context conflicts with nested v2 protected terms.
    // A v2 presentation can contain both original v1 and v2 credentials.
    const presentationContext = credentials.some(credential =>
        (Array.isArray(credential['@context'])
            ? credential['@context']
            : [credential['@context']]
        ).some(context => context === 'https://www.w3.org/ns/credentials/v2')
    )
        ? 'https://www.w3.org/ns/credentials/v2'
        : 'https://www.w3.org/2018/credentials/v1';
    const presentation = await wallet.invoke.issuePresentation(
        {
            '@context': [presentationContext],
            type: ['VerifiablePresentation'],
            holder: ownerDid,
            verifiableCredential: credentials,
        },
        { proofPurpose: 'authentication' }
    );
    const payload = buildShareManifest({
        shareId: options.id,
        contentVersion: options.contentVersion,
        createdAt: options.createdAt,
        sharer: {
            profileId: profile.profileId,
            displayName: profile.displayName || profile.profileId,
        },
        presentation: ShareManifestPresentationValidator.parse(presentation),
        selection: options.refs.map((_, credentialIndex) => ({ credentialIndex })),
        endorsements,
    });
    if (
        !validateShareManifest(payload, {
            shareId: options.id,
            contentVersion: options.contentVersion,
        }).ok
    )
        throw new Error('manifest');

    const envelope = await encryptSharePayload({
        shareId: options.id,
        contentVersion: options.contentVersion,
        key: options.key,
        payload,
    });
    const recovery = buildShareRecovery({
        shareId: options.id,
        ownerProfileId: profile.profileId,
        createdAt: options.createdAt,
        latest: { contentVersion: options.contentVersion, key: options.key },
        selection: options.refs.map((ref, order) => ({ ref, order })),
        endorsements: recoveryEndorsements,
    });
    const ownerEncryptedRecovery = await encryptShareRecovery(recovery, ownerDid, {
        encrypt: (value, recipients) => wallet.invoke.createDagJwe(value, [...recipients]),
        decrypt: value => wallet.invoke.decryptDagJwe(value),
    });

    return { envelope, ownerEncryptedRecovery, ownerDid, payload };
};

export const readShareRecovery = async (
    wallet: ShareWallet,
    share: Pick<ShareLink, 'id' | 'contentVersion'>
): Promise<ShareRecoveryPlaintext> => {
    const { recovery } = await wallet.invoke.getShareLinkRecovery(share.id);
    const parsed = ShareRecoveryPlaintextValidator.parse(
        await wallet.invoke.decryptDagJwe(recovery)
    );
    if (parsed.shareId !== share.id || parsed.latest.contentVersion !== share.contentVersion)
        throw new Error('recovery');
    return parsed;
};

/** Resolve originals again at publication; never sign display edits or omit failed selections. */
export const prepareShare = async (
    wallet: ShareWallet,
    refs: string[],
    title: string,
    note: string,
    expiresAt?: string | null,
    options: { passcode?: string; notifyOnView?: boolean } = {}
): Promise<PreparedShare> => {
    const profile = await wallet.invoke.getProfile();
    if (!profile) throw new Error('profile');
    const id = generateShareLinkId();
    const key = generateShareContentKey();
    const createdAt = new Date().toISOString();
    const revision = await prepareEncryptedRevision(wallet, {
        id,
        key,
        contentVersion: 1,
        createdAt,
        ownerProfileId: profile.profileId,
        refs,
    });
    const input = CreateShareLinkInputValidator.parse({
        id,
        clientRequestId: crypto.randomUUID(),
        title: title.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(expiresAt !== undefined ? { expiresAt } : {}),
        ...(options.passcode ? { passcode: options.passcode } : {}),
        notifyOnView: options.notifyOnView ?? false,
        selectedCount: refs.length,
        contentVersion: 1,
        envelope: revision.envelope,
        ownerEncryptedRecovery: revision.ownerEncryptedRecovery,
    });
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 1024 * 1024)
        throw new Error('size');
    return { input, key, ownerDid: revision.ownerDid, payload: revision.payload };
};

/** Re-sign and replace a share's contents while preserving its permanent URL key. */
export const prepareShareUpdate = async (
    wallet: ShareWallet,
    share: ShareLink,
    recovery: ShareRecoveryPlaintext,
    refs: string[],
    title: string,
    note: string,
    protection: Pick<UpdateShareLinkInput, 'passcode' | 'notifyOnView'> = {}
): Promise<PreparedShareUpdate> => {
    if (share.status !== 'active' || recovery.shareId !== share.id) throw new Error('inactive');
    if (recovery.latest.contentVersion !== share.contentVersion) throw new Error('stale');

    const contentVersion = share.contentVersion + 1;
    const revision = await prepareEncryptedRevision(wallet, {
        id: share.id,
        key: recovery.latest.key,
        contentVersion,
        createdAt: recovery.createdAt,
        ownerProfileId: recovery.ownerProfileId,
        refs,
    });
    const input = UpdateShareLinkInputValidator.parse({
        id: share.id,
        expectedVersion: share.version,
        clientRequestId: crypto.randomUUID(),
        title: title.trim(),
        note: note.trim() || null,
        ...(protection.passcode !== undefined ? { passcode: protection.passcode } : {}),
        ...(protection.notifyOnView !== undefined ? { notifyOnView: protection.notifyOnView } : {}),
        contentVersion,
        selectedCount: refs.length,
        envelope: revision.envelope,
        ownerEncryptedRecovery: revision.ownerEncryptedRecovery,
    });
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 1024 * 1024)
        throw new Error('size');
    return {
        input,
        key: recovery.latest.key,
        ownerDid: revision.ownerDid,
        payload: revision.payload,
    };
};

/**
 * Shared wall-clock budget for the whole recipient verification pass: the holder
 * presentation plus every selected credential and endorsement. One budget (not a
 * per-check timeout) bounds total work, so a large-but-structurally-valid
 * collection cannot multiply a per-check 30s wait across hundreds of members.
 */
export const VERIFICATION_TOTAL_BUDGET_MS = 30_000;

export interface VerificationBudget {
    /** Milliseconds left before the shared deadline; 0 once exhausted. */
    remaining(): number;
    /** True once the deadline passed or the pass was cancelled. */
    expired(): boolean;
    /** True only after {@link VerificationBudget.cancel}. */
    cancelled(): boolean;
    /** Cancel the pass; rejects {@link VerificationBudget.whenCancelled}. */
    cancel(): void;
    /** Rejects as soon as the budget is cancelled. */
    whenCancelled(): Promise<never>;
}

/**
 * Create the single budget shared by a verification pass. `now` is injectable so
 * tests can advance the deadline deterministically without wall-clock waits.
 */
export const createVerificationBudget = (
    totalMs: number = VERIFICATION_TOTAL_BUDGET_MS,
    now: () => number = () => Date.now()
): VerificationBudget => {
    const deadline = now() + totalMs;
    let cancelled = false;
    let rejectCancelled: ((error: Error) => void) | undefined;
    const cancellation = new Promise<never>((_, reject) => {
        rejectCancelled = reject;
    });
    // Never surface an unhandled rejection if a caller stops racing the promise.
    void cancellation.catch(() => {});
    return {
        remaining: () => Math.max(0, deadline - now()),
        expired: () => cancelled || now() >= deadline,
        cancelled: () => cancelled,
        cancel: () => {
            if (cancelled) return;
            cancelled = true;
            rejectCancelled?.(new Error('verification cancelled'));
        },
        whenCancelled: () => cancellation,
    };
};

/**
 * Bound a single wallet check by the shared budget. The injected wallet verify
 * API has no abort signal, so the in-flight promise itself cannot be stopped;
 * callers must ignore its late result. What is guaranteed here is that no check
 * is scheduled once the budget is spent or cancelled, and a timed-out check
 * resolves to `unavailable`, never to `verified`.
 */
const boundedVerification = async <T>(
    verification: Promise<T>,
    budget: VerificationBudget
): Promise<T> => {
    if (budget.expired()) throw new Error('verification budget exhausted');
    const remaining = budget.remaining();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            verification,
            budget.whenCancelled(),
            new Promise<never>((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error('verification budget exhausted')),
                    remaining
                );
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
};

export const proofState = (result: VerificationCheck): ProofState =>
    result.errors.length
        ? 'failed'
        : result.warnings.length || !result.checks.includes('proof')
          ? 'unavailable'
          : 'verified';

interface CredentialTreeContext {
    readonly states: ProofState[];
    /** A check was skipped, cancelled or timed out, so the tree is not fully verified. */
    incomplete: boolean;
}

/**
 * Verify nested CLR members independently, without fetching unsigned display
 * references. Any member that was not actually checked (budget spent/cancelled)
 * marks the tree `incomplete`, so a partially checked tree can never be
 * reported as fully verified.
 */
const verifyCredentialNode = async (
    wallet: ShareWallet,
    credential: VC,
    budget: VerificationBudget,
    context: CredentialTreeContext
): Promise<void> => {
    if (budget.expired()) {
        context.incomplete = true;
        return;
    }
    try {
        context.states.push(
            proofState(
                await boundedVerification(wallet.invoke.verifyCredential(credential), budget)
            )
        );
    } catch {
        context.states.push('unavailable');
    }
    const visit = async (value: unknown): Promise<void> => {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) {
            if (budget.expired()) {
                context.incomplete = true;
                return;
            }
            if (key === 'verifiableCredential' && Array.isArray(child)) {
                for (const nested of child) {
                    if (budget.expired()) {
                        context.incomplete = true;
                        return;
                    }
                    await verifyCredentialNode(wallet, nested as VC, budget, context);
                }
            } else if (child && typeof child === 'object') await visit(child);
        }
    };
    await visit(credential);
};

export const verifyCredentialTree = async (
    wallet: ShareWallet,
    credential: VC,
    budget: VerificationBudget
): Promise<ProofState> => {
    const context: CredentialTreeContext = { states: [], incomplete: false };
    try {
        await verifyCredentialNode(wallet, credential, budget, context);
    } catch {
        return 'unavailable';
    }
    if (context.states.includes('failed')) return 'failed';
    if (context.incomplete || context.states.includes('unavailable')) return 'unavailable';
    return 'verified';
};

export const verifySharedPresentation = async (
    wallet: ShareWallet,
    payload: SharePayload,
    budget: VerificationBudget
): Promise<ProofState> => {
    if (budget.expired()) return 'unavailable';
    try {
        return proofState(
            await boundedVerification(
                wallet.invoke.verifyPresentation(payload.presentation, {
                    proofPurpose: 'authentication',
                }),
                budget
            )
        );
    } catch {
        return 'unavailable';
    }
};

/**
 * Normalize both create (`completed`/`pending`) and status
 * (`found`/`pending`/`not_found`) responses so the UI never confuses a
 * retryable pending operation with a completed share or a fresh attempt.
 */
export type SharePublicationOutcome =
    | { status: 'active'; share: ShareLink }
    | { status: 'inactive'; share: ShareLink }
    | { status: 'pending'; operation: ShareLinkOperationKeyInput }
    | { status: 'abandoned'; id: string };

export const classifySharePublication = (
    result: ShareLinkOwnerCommitOutput | ShareLinkOwnerStatusOutput
): SharePublicationOutcome => {
    if (result.status === 'pending') {
        return {
            status: 'pending',
            operation: { id: result.id, operationId: result.operationId },
        };
    }
    if (result.status === 'not_found') return { status: 'abandoned', id: result.id };
    return result.share.status === 'active'
        ? { status: 'active', share: result.share }
        : { status: 'inactive', share: result.share };
};

export const credentialText = (
    credential: VC | undefined
): { name: string; description: string; issuer: string } => {
    const subject = credential?.credentialSubject;
    const first = Array.isArray(subject) ? subject[0] : subject;
    const achievement = first?.achievement;
    const text = (value: unknown) => (typeof value === 'string' ? value : '');
    const issuer = credential?.issuer;
    return {
        name: text(credential?.name) || text(achievement?.name),
        description: text(credential?.description) || text(achievement?.description),
        issuer: typeof issuer === 'object' ? text(issuer?.name) : '',
    };
};
