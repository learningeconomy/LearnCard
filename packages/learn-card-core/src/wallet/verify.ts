import { VC, VerificationItem, VerificationStatusEnum } from '@learncard/types';
import { format } from 'date-fns';

import { LearnCardRawWallet } from 'types/LearnCard';

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
    wallet: LearnCardRawWallet
): ((credential: VC) => Promise<VerificationItem[]>) => {
    return async (credential: VC): Promise<VerificationItem[]> => {
        const rawVerificationCheck = await wallet.pluginMethods.verifyCredential(credential);

        const verificationItems: VerificationItem[] = [];

        rawVerificationCheck.errors.forEach(error => {
            verificationItems.push({
                status: VerificationStatusEnum.Failed,
                check: 'hmm',
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
