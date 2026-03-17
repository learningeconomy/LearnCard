import { VC, VerificationItem, VerificationStatusEnum } from '@learncard/types';

const BOOST_AUTH_CHECK = 'Boost is Authentic. Verified by LearnCard Network.';

export const filterOutBoostVerificationItems = (items: VerificationItem[]): VerificationItem[] =>
    items.filter(item => {
        const checkText = item.check || '';
        const messageText = item.message || '';
        return !checkText.includes(BOOST_AUTH_CHECK) && !messageText.includes(BOOST_AUTH_CHECK);
    });

export type LerVerificationResultLike = {
    presentationResult?: {
        verified?: boolean;
        errors?: string[];
    };
    credentialResults?: Array<{
        verified?: boolean;
        isSelfIssued?: boolean;
        errors?: string[];
    }>;
};

export const mapLerVerificationResultToItems = (
    lerVerification: LerVerificationResultLike | null | undefined
): VerificationItem[] => {
    if (!lerVerification) return [];

    const presentationErrors = Array.isArray(lerVerification.presentationResult?.errors)
        ? lerVerification.presentationResult?.errors
        : [];
    const credentialResults = Array.isArray(lerVerification.credentialResults)
        ? lerVerification.credentialResults
        : [];

    return [
        {
            check: 'Presentation',
            status: lerVerification.presentationResult?.verified
                ? VerificationStatusEnum.Success
                : VerificationStatusEnum.Failed,
            message: lerVerification.presentationResult?.verified
                ? 'valid.'
                : presentationErrors.join('; ') || 'verification failed.',
            details: presentationErrors.length ? presentationErrors.join('\n') : undefined,
        },
        ...credentialResults.map(result => {
            const errors = Array.isArray(result.errors) ? result.errors : [];
            const passed = Boolean(result.verified || result.isSelfIssued);
            return {
                check: 'Credential',
                status: passed ? VerificationStatusEnum.Success : VerificationStatusEnum.Failed,
                message: passed
                    ? result.isSelfIssued && !result.verified
                        ? 'Credential accepted as self-issued for LER validation.'
                        : 'valid.'
                    : errors.join('; ') || 'verification failed.',
                details: errors.length ? errors.join('\n') : undefined,
            } as VerificationItem;
        }),
    ];
};

export const buildResumeMetadataVerificationItems = (credential: VC): VerificationItem[] => {
    const expiresAt = credential?.expirationDate || credential?.validUntil;
    const proofValue = credential?.proof;
    const proofRecord = Array.isArray(proofValue) ? proofValue[0] : proofValue;
    const proofMethod =
        typeof proofRecord === 'object' && proofRecord
            ? (proofRecord as Record<string, unknown>).verificationMethod
            : undefined;

    return [
        {
            check: 'Proof',
            status: proofValue ? VerificationStatusEnum.Success : VerificationStatusEnum.Error,
            message: proofValue ? 'valid.' : 'missing.',
            details: proofMethod ? String(proofMethod) : undefined,
        },
        {
            check: 'Expires',
            status: expiresAt ? VerificationStatusEnum.Success : VerificationStatusEnum.Error,
            message: expiresAt
                ? `has an expiration date: ${String(expiresAt)}.`
                : 'does not include an expiration date.',
        },
    ];
};

export const getResumeSubjectDid = (credential: VC | null): string | undefined => {
    if (!credential) return undefined;

    const credentialSubject = credential.credentialSubject as
        | Record<string, unknown>
        | undefined
        | null;
    const directSubjectDid =
        credentialSubject && typeof credentialSubject.id === 'string'
            ? credentialSubject.id
            : undefined;
    if (directSubjectDid) return directSubjectDid;

    const person = credentialSubject?.person as Record<string, unknown> | undefined;
    const personDid = person && typeof person.id === 'string' ? person.id : undefined;
    if (personDid) return personDid;

    return undefined;
};
