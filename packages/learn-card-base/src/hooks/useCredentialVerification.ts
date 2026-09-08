import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import useWallet from './useWallet';
import { prettifyVerificationItems } from '../helpers/verificationPrettifier';

import type { Proof, UnsignedVC, VC, VerificationItem } from '@learncard/types';

const QUERY_KEY_ROOT = 'credential-verification';
const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 15;

type VerifiableCredentialInput = VC | UnsignedVC;

const getProofFingerprint = (credential: VerifiableCredentialInput): string | undefined => {
    const proof = (credential as Partial<VC>).proof;
    const proofs: Proof[] = Array.isArray(proof) ? proof : proof ? [proof] : [];
    const fingerprint = proofs
        .map(p => (p.proofValue as string | undefined) ?? p.jws ?? p.created)
        .filter(Boolean)
        .join('|');

    return fingerprint || undefined;
};

/**
 * Cache key for a credential's verification result.
 *
 * Signed credentials are keyed by `id` + proof fingerprint so two views of the same
 * signed document share one DIDKit verification. Unsigned credentials have nothing
 * stable to key on, so they fall back to the full serialized document.
 */
export const getCredentialVerificationKey = (credential: VerifiableCredentialInput) => {
    const proofFingerprint = getProofFingerprint(credential);

    if (proofFingerprint) {
        return [QUERY_KEY_ROOT, credential.id ?? null, proofFingerprint] as const;
    }

    return [QUERY_KEY_ROOT, JSON.stringify(credential)] as const;
};

const runVerification = async (
    initWallet: ReturnType<typeof useWallet>['initWallet'],
    credential: VerifiableCredentialInput
): Promise<VerificationItem[]> => {
    const wallet = await initWallet();
    const raw = await wallet?.invoke?.verifyCredential(credential as VC, {}, true);

    return prettifyVerificationItems((raw as VerificationItem[] | undefined) ?? []);
};

export const fetchCredentialVerification = (
    queryClient: QueryClient,
    initWallet: ReturnType<typeof useWallet>['initWallet'],
    credential: VerifiableCredentialInput
): Promise<VerificationItem[]> =>
    queryClient.fetchQuery({
        queryKey: getCredentialVerificationKey(credential),
        queryFn: () => runVerification(initWallet, credential),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        meta: { persist: false },
    });

/**
 * Verifies a credential once and shares the result with every mounted consumer.
 *
 * DIDKit verification of a large JSON-LD document (e.g. a CLR transcript) can take
 * seconds of main-thread time, so every surface that shows verification state for
 * the same credential must go through this hook rather than calling
 * `wallet.invoke.verifyCredential` directly.
 */
export const useCredentialVerification = (
    credential: VerifiableCredentialInput | undefined,
    { enabled = true }: { enabled?: boolean } = {}
) => {
    const { initWallet } = useWallet();

    const query = useQuery<VerificationItem[]>({
        queryKey: credential ? getCredentialVerificationKey(credential) : [QUERY_KEY_ROOT, 'none'],
        queryFn: () => runVerification(initWallet, credential!),
        enabled: enabled && !!credential,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        meta: { persist: false },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    return {
        verificationItems: query.data ?? [],
        isVerifying: query.isPending && enabled && !!credential,
        isVerified: query.isSuccess,
        error: query.error,
    };
};

export const useFetchCredentialVerification = () => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();

    return (credential: VerifiableCredentialInput) =>
        fetchCredentialVerification(queryClient, initWallet, credential);
};

export default useCredentialVerification;
