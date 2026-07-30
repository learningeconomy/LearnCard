import {
    StatusCheckEntry,
    VC,
    VerificationCheck,
    VerificationItem,
    VerificationStatusEnum,
} from '@learncard/types';
import { format } from 'date-fns';

import { LearnCard } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';

const STATUS_CHECKS = new Set(['status', 'credentialStatus']);

const isStatusCheck = (check: string): boolean => STATUS_CHECKS.has(check);

const getStatusPurposeLabel = (statusPurpose: string): string => {
    switch (statusPurpose) {
        case 'revocation':
            return 'Revocation';
        case 'suspension':
            return 'Suspension';
        default:
            return statusPurpose
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/[-_]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/\b\w/g, letter => letter.toUpperCase());
    }
};

const getClearStatusMessage = (statusPurpose: string): string => {
    switch (statusPurpose) {
        case 'revocation':
            return 'Not Revoked';
        case 'suspension':
            return 'Not Suspended';
        default:
            return `${getStatusPurposeLabel(statusPurpose)} Clear`;
    }
};

const getSetStatusMessage = (statusPurpose: string): string => {
    switch (statusPurpose) {
        case 'revocation':
            return 'Revoked';
        case 'suspension':
            return 'Suspended';
        default:
            return `${getStatusPurposeLabel(statusPurpose)} Set`;
    }
};

const getUniqueStatusPurposes = (statuses: StatusCheckEntry[]): string[] => [
    ...new Set(statuses.map(status => status.statusPurpose)),
];

const transformStatusCheckMessage = (statusEntries: StatusCheckEntry[] = []): string => {
    const setStatuses = statusEntries.filter(status => status.isSet);
    if (setStatuses.length > 0) {
        return getUniqueStatusPurposes(setStatuses).map(getSetStatusMessage).join(', ');
    }

    const clearPurposes = getUniqueStatusPurposes(statusEntries);
    if (clearPurposes.length === 1) return getClearStatusMessage(clearPurposes[0]!);

    return 'Active';
};

const getStatusErrorMessage = (
    error: string,
    verificationCheck?: VerificationCheck
): string | undefined => {
    if (/credential is revoked/i.test(error)) return 'Status: Revoked';
    if (/credential is suspended/i.test(error)) return 'Status: Suspended';

    const statusPurpose = error.match(/credential status is set for purpose:\s*([^.]+)/i)?.[1];
    if (statusPurpose) return `Status: ${getSetStatusMessage(statusPurpose.trim())}`;

    if (!/status/i.test(error)) return;

    const setStatuses = verificationCheck?.status?.filter(status => status.isSet) ?? [];
    if (setStatuses.length > 0) return `Status: ${transformStatusCheckMessage(setStatuses)}`;
};

const transformErrorCheck = (
    error: string,
    _credential: VC,
    verificationCheck?: VerificationCheck
): string => {
    if (getStatusErrorMessage(error, verificationCheck)) return 'status';

    const prefix = error.split(' error')[0];

    return prefix || error;
};

const transformErrorMessage = (
    error: string,
    credential: VC,
    verificationCheck?: VerificationCheck
): string => {
    const statusErrorMessage = getStatusErrorMessage(error, verificationCheck);
    if (statusErrorMessage) return statusErrorMessage;

    if (error.startsWith('expiration')) {
        return credential.expirationDate
            ? `Expired ${format(new Date(credential.expirationDate), 'dd MMM yyyy').toUpperCase()}`
            : 'Expired';
    }

    return error;
};

const transformWarningCheck = (warning: string, _credential: VC): string => {
    if (warning.includes('Boost Authenticity')) return 'Boost Authenticity';

    const prefix = warning.split(' warning')[0];

    return prefix || warning;
};

const transformCheckMessage = (
    check: string,
    credential: VC,
    verificationCheck: VerificationCheck
): string => {
    if (isStatusCheck(check)) return transformStatusCheckMessage(verificationCheck.status);

    return (
        {
            proof: 'Valid',
            expiration: credential.expirationDate
                ? `Expires ${format(
                      new Date(credential.expirationDate),
                      'dd MMM yyyy'
                  ).toUpperCase()}`
                : 'Does Not Expire',
        }[check] || check
    );
};

export const verifyCredential = (
    learnCard: LearnCard<
        any,
        any,
        {
            verifyCredential: (
                credential: VC,
                options?: Partial<ProofOptions>
            ) => Promise<VerificationCheck>;
        }
    >
): ((
    _learnCard: LearnCard<any, any, any>,
    credential: VC,
    options?: Partial<ProofOptions>,
    prettify?: boolean
) => Promise<VerificationItem[] | VerificationCheck>) => {
    return async (_learnCard, credential, options, prettify = false) => {
        const rawVerificationCheck = await learnCard.invoke.verifyCredential(credential, options);

        if (!prettify) return rawVerificationCheck;

        const verificationItems: VerificationItem[] = [];

        rawVerificationCheck.errors.forEach(error => {
            verificationItems.push({
                status: VerificationStatusEnum.Failed,
                check: transformErrorCheck(error, credential, rawVerificationCheck),
                details: transformErrorMessage(error, credential, rawVerificationCheck),
            });
        });

        rawVerificationCheck.warnings.forEach(warning => {
            verificationItems.push({
                status: VerificationStatusEnum.Error,
                check: transformWarningCheck(warning, credential),
                message: warning,
            });
        });

        rawVerificationCheck.checks.forEach(check => {
            verificationItems.push({
                status: VerificationStatusEnum.Success,
                check: isStatusCheck(check) ? 'status' : check,
                message: transformCheckMessage(check, credential, rawVerificationCheck),
            });
        });

        return verificationItems;
    };
};
