import {
    CredentialRefreshReceiptValidator,
    VCValidator,
    type CredentialRefreshReceipt,
    type VC,
    type VP,
    type VerificationCheck,
} from '@learncard/types';
import { assertManagedCredentialBinding } from '@learncard/helpers';

/** Minimal capability interface so ingestion can also run outside React. */
export interface ManagedCredentialIngestionWallet {
    read: { get: (uri: string) => Promise<unknown> };
    invoke: {
        getCredentialRefreshReceipt: (input: {
            uri: string;
        }) => Promise<CredentialRefreshReceipt | null>;
        verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    };
}

export interface IngestedManagedCredential {
    credential: VC;
    /** Save this binding alongside the LearnCloud record, never infer it from a later version. */
    baseline: CredentialRefreshReceipt;
}

/**
 * Resolve/decrypt a managed delivery and verify it before returning displayable content.
 * A JWE kid is routing metadata, not proof of who encrypted or issued the contents.
 * No acceptance or storage occurs here: callers retain control of the user's claim action.
 */
export const ingestManagedCredential = async (
    wallet: ManagedCredentialIngestionWallet,
    uri: string
): Promise<IngestedManagedCredential> => {
    try {
        const baseline = CredentialRefreshReceiptValidator.parse(
            await wallet.invoke.getCredentialRefreshReceipt({ uri })
        );
        const credential = VCValidator.parse(await wallet.read.get(uri));
        const check = await wallet.invoke.verifyCredential(credential);
        if (!check.checks.includes('proof') || check.errors.length || check.warnings.length) {
            throw new Error('INVALID_PROOF_OR_STATUS');
        }
        assertManagedCredentialBinding(credential, baseline);
        return { credential, baseline };
    } catch {
        // Do not propagate decrypted content or verifier internals into UI/error telemetry.
        throw new Error('MANAGED_CREDENTIAL_VERIFICATION_FAILED');
    }
};

/** Classify from authenticated delivery metadata, never from attacker-controlled VC fields. */
const isNetworkCredentialUri = (uri: string): boolean =>
    uri.startsWith('lc:network:') && uri.includes(':credential:');

const getErrorCode = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const { data, code } = error as { data?: { code?: unknown }; code?: unknown };
    if (typeof data?.code === 'string') return data.code;
    return typeof code === 'string' ? code : undefined;
};

/**
 * The receipt for a delivery addressed to this account, or null when the network says
 * the URI is not a managed delivery for it (an ordinary credential, a claim link, or a
 * URI it does not index). Other failures, such as a managed delivery missing its status
 * binding, fail closed.
 */
const getManagedReceipt = async (
    wallet: ManagedCredentialIngestionWallet,
    uri: string
): Promise<CredentialRefreshReceipt | null> => {
    if (!isNetworkCredentialUri(uri)) return null;
    let code: string | undefined;
    try {
        return await wallet.invoke.getCredentialRefreshReceipt({ uri });
    } catch (error) {
        code = getErrorCode(error);
    }
    if (code === 'NOT_FOUND' || code === 'BAD_REQUEST') return null;
    // Server error details are not passed on to the UI or error reporting.
    throw new Error('MANAGED_CREDENTIAL_VERIFICATION_FAILED');
};

/** A payload presenting a managed refresh service must never take the ordinary path. */
const presentsManagedRefresh = (credential: unknown): boolean => {
    const service = (credential as { refreshService?: unknown } | null)?.refreshService;
    const services = Array.isArray(service) ? service : service ? [service] : [];
    return services.some(
        entry =>
            !!entry &&
            typeof entry === 'object' &&
            (entry as { type?: unknown }).type === 'LearnCardCredentialRefresh2026'
    );
};

const ingestWithReceipt = (
    wallet: ManagedCredentialIngestionWallet,
    uri: string,
    receipt: CredentialRefreshReceipt
): Promise<IngestedManagedCredential> =>
    ingestManagedCredential(
        {
            read: wallet.read,
            invoke: {
                verifyCredential: credential => wallet.invoke.verifyCredential(credential),
                getCredentialRefreshReceipt: async () => receipt,
            },
        },
        uri
    );

/**
 * Verifies a managed delivery before it is accepted. Ordinary credentials are not read;
 * the network receipt (not the payload) decides whether a delivery is managed.
 */
export const verifyManagedDeliveryBeforeAccept = async (
    wallet: ManagedCredentialIngestionWallet,
    uri: string
): Promise<void> => {
    const receipt = await getManagedReceipt(wallet, uri);
    if (receipt) await ingestWithReceipt(wallet, uri, receipt);
};

export const resolveCredentialForClaim = async (
    wallet: ManagedCredentialIngestionWallet,
    uri: string
): Promise<{ credential: VC | VP; baseline?: CredentialRefreshReceipt }> => {
    const receipt = await getManagedReceipt(wallet, uri);
    if (receipt) return ingestWithReceipt(wallet, uri, receipt);
    const credential = await wallet.read.get(uri);
    if (!credential) throw new Error('CREDENTIAL_NOT_FOUND');
    if (isNetworkCredentialUri(uri) && presentsManagedRefresh(credential)) {
        throw new Error('MANAGED_CREDENTIAL_VERIFICATION_FAILED');
    }
    return { credential: credential as VC | VP };
};
