import { VC, VerificationCheck, VerificationItem, VerificationStatusEnum } from '@learncard/types';
import { format } from 'date-fns';

import { LearnCard } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';

const transformErrorCheck = (error: string, _credential: VC): string => {
    const prefix = error.split(' error')[0];

    return prefix || error;
};

const transformErrorMessage = (error: string, credential: VC): string => {
    if (error.startsWith('expiration')) {
        return credential.expirationDate
            ? `Invalid • Expired ${format(
                new Date(credential.expirationDate),
                'dd MMM yyyy'
            ).toUpperCase()}`
            : 'Invalid • Expired';
    }

    return error;
};

const transformWarningCheck = (warning: string, _credential: VC): string => {
    if (warning.includes('Boost Authenticity')) return 'Boost Authenticity';

    const prefix = warning.split(' warning')[0];

    return prefix || warning;
};

const transformCheckMessage = (check: string, credential: VC): string => {
    return (
        {
            proof: 'Valid',
            expiration: credential.expirationDate
                ? `Valid • Expires ${format(
                    new Date(credential.expirationDate),
                    'dd MMM yyyy'
                ).toUpperCase()}`
                : 'Valid • Does Not Expire',
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
                check: transformErrorCheck(error, credential),
                details: transformErrorMessage(error, credential),
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
                check,
                message: transformCheckMessage(check, credential),
            });
        });

        return verificationItems;
    };
};
