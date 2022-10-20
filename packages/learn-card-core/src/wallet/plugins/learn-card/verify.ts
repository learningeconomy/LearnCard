import { VC, VerificationCheck, VerificationItem, VerificationStatusEnum } from '@learncard/types';
import { format } from 'date-fns';

import { Wallet } from 'types/wallet';
import { ProofOptions } from '../didkit';

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
    wallet: Wallet<
        any,
        {
            verifyCredential: (
                credential: VC,
                options?: Partial<ProofOptions>
            ) => Promise<VerificationCheck>;
        }
    >
): ((
    _wallet: any,
    credential: VC,
    options?: Partial<ProofOptions>
) => Promise<VerificationItem[]>) => {
    return async (_wallet, credential, options) => {
        const rawVerificationCheck = await wallet.invoke.verifyCredential(credential, options);

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
                check: 'hmm',
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
