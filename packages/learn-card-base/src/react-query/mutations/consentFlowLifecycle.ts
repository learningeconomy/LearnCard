import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export type LifecycleRejection = 'revoked' | 'suspended';

/**
 * Messages brain-service's acceptCredential throws (as BAD_REQUEST) for a credential whose
 * CREDENTIAL_SENT status is revoked or suspended. Keep in sync with
 * services/learn-card-network/brain-service/src/helpers/credential.helpers.ts.
 *
 * These are only a fallback for when the structured lifecycle lookup below is unavailable;
 * BAD_REQUEST alone doesn't say why acceptance was refused.
 */
export const ACCEPT_LIFECYCLE_REJECTION_MESSAGES: Record<LifecycleRejection, string> = {
    revoked: 'Credential has been revoked',
    suspended: 'Credential is suspended',
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

const getTrpcCode = (error: unknown): unknown => {
    const record = asRecord(error);
    return asRecord(record?.data)?.code ?? asRecord(asRecord(record?.shape)?.data)?.code;
};

export const getLifecycleRejectionFromAcceptError = (
    error: unknown
): LifecycleRejection | undefined => {
    if (getTrpcCode(error) !== 'BAD_REQUEST') return undefined;

    const message = asRecord(error)?.message;
    if (typeof message !== 'string') return undefined;

    return (Object.keys(ACCEPT_LIFECYCLE_REJECTION_MESSAGES) as LifecycleRejection[]).find(status =>
        message.includes(ACCEPT_LIFECYCLE_REJECTION_MESSAGES[status])
    );
};

/**
 * Decides whether a failed acceptCredential was a definitive lifecycle rejection (the issuer
 * revoked or suspended the credential) rather than a transient or ambiguous failure.
 *
 * The authoritative signal is the holder's lifecycle status from brain-service (the status on
 * the CREDENTIAL_SENT edge, as a structured enum). Only if that lookup is unavailable, fails, or
 * has no status for the URI do we fall back to the accept error's code + message. Anything else
 * is treated as retryable, so a flaky network never costs a holder their credential.
 */
export const getAcceptLifecycleRejection = async (
    learnCard: BespokeLearnCard,
    uri: string,
    acceptError: unknown
): Promise<LifecycleRejection | undefined> => {
    const invoke = learnCard.invoke as unknown as {
        getMyCredentialLifecycleStatuses?: (options: {
            uris: string[];
        }) => Promise<Record<string, string> | undefined>;
    };

    if (invoke.getMyCredentialLifecycleStatuses) {
        try {
            const statuses = await invoke.getMyCredentialLifecycleStatuses({ uris: [uri] });
            const status = statuses?.[uri];
            if (status === 'revoked' || status === 'suspended') return status;
            if (status) return undefined;
            // No status for this URI: fall through to the accept error itself.
        } catch {
            // Fall through to the accept error itself.
        }
    }

    return getLifecycleRejectionFromAcceptError(acceptError);
};
