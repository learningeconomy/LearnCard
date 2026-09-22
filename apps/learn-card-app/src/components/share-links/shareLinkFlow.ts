import {
    CreateShareLinkInputValidator,
    ShareContentKeyValidator,
    ShareLinkIdValidator,
    type CreateShareLinkInput,
    type SharePayload,
    type VC,
    type VP,
    type UnsignedVP,
    type VerificationCheck,
    type ShareOwnerRecovery,
    type ShareLink,
    type ShareLinkOwnerCommitOutput,
    type ShareLinkOwnerStatusOutput,
    type ShareLinkOperationKeyInput,
    type ShareLinkPublicState,
    type ShareLinkPublicContentView,
    ShareManifestPresentationValidator,
} from '@learncard/types';
import {
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
                records: { id?: string; uri: string }[];
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
        retryShareLinkOperation(
            input: ShareLinkOperationKeyInput
        ): Promise<ShareLinkOwnerStatusOutput>;
        resolveShareLink(id: string): Promise<ShareLinkPublicState>;
        getShareLinkContent(id: string): Promise<ShareLinkPublicContentView>;
        acknowledgeShareLinkView(receipt: string): Promise<{ ok: true }>;
        verifyPresentation(vp: VP, options: { proofPurpose: string }): Promise<VerificationCheck>;
        verifyCredential(vc: VC): Promise<VerificationCheck>;
    };
}
export const shareWallet = (wallet: unknown): ShareWallet => wallet as ShareWallet;
export type CredentialChoice = { uri: string; credential?: VC };
export type PreparedShare = {
    input: CreateShareLinkInput;
    key: string;
    ownerDid: string;
    /** Exact manifest that was encrypted: the preview must render this, not a rebuild. */
    payload: SharePayload;
};
export type ProofState = 'checking' | 'verified' | 'failed' | 'unavailable';

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
 * Derive the canonical share host from a tenant base URL. Non-HTTPS bases
 * (e.g. a local `http://localhost:3000`) are rejected before any server state
 * can be created, since `buildShareLinkUrl` would otherwise mint an
 * unreachable `https://localhost:3000/...` link.
 */
export const shareLinkHost = (baseUrl: string): string | undefined => {
    try {
        const url = new URL(baseUrl);
        if (url.protocol !== 'https:') return undefined;
        return url.host || undefined;
    } catch {
        return undefined;
    }
};

export type ExpiryChoice = '7' | '30' | '365' | 'never';
export const EXPIRY_CHOICES: ExpiryChoice[] = ['7', '30', '365', 'never'];
/** Conservative default for a production policy that has no verified age. */
export const DEFAULT_EXPIRY_CHOICE: ExpiryChoice = '30';
const DAY_MS = 24 * 60 * 60 * 1000;

export const expiryToDays = (choice: ExpiryChoice): number | null =>
    choice === 'never' ? null : Number(choice);

/** Absolute timestamp pinned once per prepared attempt; `null` means never. */
export const resolveExpiryIso = (
    choice: ExpiryChoice,
    now: number = Date.now()
): string | null => {
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

/** Resolve originals again at publication; never sign display edits or omit failed selections. */
export const prepareShare = async (
    wallet: ShareWallet,
    refs: string[],
    title: string,
    note: string,
    expiresAt?: string | null
): Promise<PreparedShare> => {
    if (!refs.length || refs.length > 50 || new Set(refs).size !== refs.length)
        throw new Error('selection');
    const profile = await wallet.invoke.getProfile();
    if (!profile) throw new Error('profile');
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
    const id = generateShareLinkId();
    const key = generateShareContentKey();
    const createdAt = new Date().toISOString();
    const ownerDid = wallet.id.did();
    const presentation = await wallet.invoke.issuePresentation(
        {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: ownerDid,
            verifiableCredential: credentials,
        },
        { proofPurpose: 'authentication' }
    );
    const payload = buildShareManifest({
        shareId: id,
        contentVersion: 1,
        createdAt,
        sharer: {
            profileId: profile.profileId,
            displayName: profile.displayName || profile.profileId,
        },
        presentation: ShareManifestPresentationValidator.parse(presentation),
        selection: refs.map((_, credentialIndex) => ({ credentialIndex })),
        endorsements,
    });
    if (!validateShareManifest(payload, { shareId: id, contentVersion: 1 }).ok)
        throw new Error('manifest');
    const envelope = await encryptSharePayload({ shareId: id, contentVersion: 1, key, payload });
    const recovery = buildShareRecovery({
        shareId: id,
        ownerProfileId: profile.profileId,
        createdAt,
        latest: { contentVersion: 1, key },
        selection: refs.map((ref, order) => ({ ref, order })),
        endorsements: recoveryEndorsements,
    });
    const ownerEncryptedRecovery = await encryptShareRecovery(recovery, ownerDid, {
        encrypt: (value, recipients) => wallet.invoke.createDagJwe(value, [...recipients]),
        decrypt: value => wallet.invoke.decryptDagJwe(value),
    });
    const input = CreateShareLinkInputValidator.parse({
        id,
        clientRequestId: crypto.randomUUID(),
        title: title.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(expiresAt !== undefined ? { expiresAt } : {}),
        selectedCount: refs.length,
        contentVersion: 1,
        envelope,
        ownerEncryptedRecovery,
    });
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 1024 * 1024)
        throw new Error('size');
    return { input, key, ownerDid, payload };
};

/** Offline or unresponsive issuers must not leave a permanent checking badge. */
const boundedVerification = async (
    verification: Promise<VerificationCheck>
): Promise<VerificationCheck> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            verification,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error('verification unavailable')), 30_000);
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

/** Verify nested CLR members independently, without fetching unsigned display references. */
export const verifyCredentialTree = async (
    wallet: ShareWallet,
    credential: VC
): Promise<ProofState> => {
    try {
        const states = [
            proofState(await boundedVerification(wallet.invoke.verifyCredential(credential))),
        ];
        const visit = async (value: unknown): Promise<void> => {
            if (!value || typeof value !== 'object') return;
            for (const [key, child] of Object.entries(value)) {
                if (key === 'verifiableCredential' && Array.isArray(child)) {
                    for (const nested of child)
                        states.push(await verifyCredentialTree(wallet, nested as VC));
                } else if (child && typeof child === 'object') await visit(child);
            }
        };
        await visit(credential);
        return states.includes('failed')
            ? 'failed'
            : states.includes('unavailable')
              ? 'unavailable'
              : 'verified';
    } catch {
        return 'unavailable';
    }
};

export const verifySharedPresentation = async (
    wallet: ShareWallet,
    payload: SharePayload
): Promise<ProofState> => {
    try {
        return proofState(
            await boundedVerification(
                wallet.invoke.verifyPresentation(payload.presentation, {
                    proofPurpose: 'authentication',
                })
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
