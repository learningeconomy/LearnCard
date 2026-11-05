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
export const resolveCredentialForClaim = async (
    wallet: ManagedCredentialIngestionWallet,
    uri: string
): Promise<{ credential: VC | VP; baseline?: CredentialRefreshReceipt }> => {
    if (uri.startsWith('lc:network:') && uri.includes(':credential:')) {
        const receipt = await wallet.invoke.getCredentialRefreshReceipt({ uri });
        if (receipt) {
            return ingestManagedCredential(
                {
                    read: wallet.read,
                    invoke: {
                        verifyCredential: credential => wallet.invoke.verifyCredential(credential),
                        getCredentialRefreshReceipt: async () => receipt,
                    },
                },
                uri
            );
        }
    }
    const credential = await wallet.read.get(uri);
    if (!credential) throw new Error('CREDENTIAL_NOT_FOUND');
    return { credential: credential as VC | VP };
};
