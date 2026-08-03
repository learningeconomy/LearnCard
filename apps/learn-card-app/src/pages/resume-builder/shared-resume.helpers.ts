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
        warnings?: string[];
    };
    credentialResults?: Array<{
        verified?: boolean;
        isSelfIssued?: boolean;
        errors?: string[];
        warnings?: string[];
    }>;
};

const toReasons = (...groups: Array<string[] | undefined>): string[] =>
    groups.flatMap(group => (Array.isArray(group) ? group : []));

export const mapLerVerificationResultToItems = (
    lerVerification: LerVerificationResultLike | null | undefined
): VerificationItem[] => {
    if (!lerVerification) return [];

    const presentationReasons = toReasons(
        lerVerification.presentationResult?.errors,
        lerVerification.presentationResult?.warnings
    );
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
                : presentationReasons.join('; ') || 'verification failed.',
            details: presentationReasons.length ? presentationReasons.join('\n') : undefined,
        },
        ...credentialResults.map(result => {
            const reasons = toReasons(result.errors, result.warnings);
            const passed = Boolean(result.verified || result.isSelfIssued);
            return {
                check: 'Credential',
                status: passed ? VerificationStatusEnum.Success : VerificationStatusEnum.Failed,
                message: passed
                    ? result.isSelfIssued && !result.verified
                        ? 'Credential accepted as self-issued for LER validation.'
                        : 'valid.'
                    : reasons.join('; ') || 'verification failed.',
                details: reasons.length ? reasons.join('\n') : undefined,
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
