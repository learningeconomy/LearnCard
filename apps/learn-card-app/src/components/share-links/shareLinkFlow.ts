import {
    CreateShareLinkInputValidator,
    ShareRecoveryPlaintextValidator,
    ShareContentKeyValidator,
    ShareLinkIdValidator,
    UpdateShareLinkInputValidator,
    type CreateShareLinkInput,
    type UpdateShareLinkInput,
    type ShareLink,
    type ShareRecoveryPlaintext,
    type SharePayload,
    type VC,
    type VP,
    type UnsignedVP,
    type VerificationCheck,
    type ShareOwnerRecovery,
    type ShareLinkOwnerCommitOutput,
    type ShareLinkOperationKeyInput,
    type ShareLinkPublicState,
    type ShareLinkPublicContentView,
    type ListShareLinksInput,
    type PaginatedShareLinks,
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
        updateShareLink(input: UpdateShareLinkInput): Promise<ShareLinkOwnerCommitOutput>;
        revokeShareLink(input: {
            id: string;
            expectedVersion?: number;
            clientRequestId?: string;
        }): Promise<ShareLinkOwnerCommitOutput>;
        getShareLinkRecovery(id: string): Promise<{ recovery: ShareOwnerRecovery }>;
        listShareLinks(input: ListShareLinksInput): Promise<PaginatedShareLinks>;
        retryShareLinkOperation(
            input: ShareLinkOperationKeyInput
        ): Promise<ShareLinkOwnerCommitOutput>;
        resolveShareLink(id: string): Promise<ShareLinkPublicState>;
        getShareLinkContent(id: string): Promise<ShareLinkPublicContentView>;
        acknowledgeShareLinkView(receipt: string): Promise<{ ok: true }>;
        verifyPresentation(vp: VP, options: { proofPurpose: string }): Promise<VerificationCheck>;
        verifyCredential(vc: VC): Promise<VerificationCheck>;
    };
}
export const shareWallet = (wallet: unknown): ShareWallet => wallet as ShareWallet;
export type CredentialChoice = { uri: string; credential?: VC };
export type PreparedShare = { input: CreateShareLinkInput; key: string; ownerDid: string };
export type PreparedShareUpdate = {
    input: UpdateShareLinkInput;
    key: string;
    ownerDid: string;
};
export type ProofState = 'checking' | 'verified' | 'failed' | 'unavailable';

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

    return { envelope, ownerEncryptedRecovery, ownerDid };
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
    note: string
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
        selectedCount: refs.length,
        contentVersion: 1,
        envelope: revision.envelope,
        ownerEncryptedRecovery: revision.ownerEncryptedRecovery,
    });
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 1024 * 1024)
        throw new Error('size');
    return { input, key, ownerDid: revision.ownerDid };
};

/** Re-sign and replace a share's contents while preserving its permanent URL key. */
export const prepareShareUpdate = async (
    wallet: ShareWallet,
    share: ShareLink,
    recovery: ShareRecoveryPlaintext,
    refs: string[],
    title: string,
    note: string
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
        contentVersion,
        selectedCount: refs.length,
        envelope: revision.envelope,
        ownerEncryptedRecovery: revision.ownerEncryptedRecovery,
    });
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 1024 * 1024)
        throw new Error('size');
    return { input, key: recovery.latest.key, ownerDid: revision.ownerDid };
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
