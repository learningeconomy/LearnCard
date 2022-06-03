import { VerificationItem, VerificationStatus } from 'learn-card-types';

import { VC } from '@wallet/plugins/vc/types';
import { LearnCardRawWallet } from 'types/LearnCard';

export const verifyCredential = (
    wallet: LearnCardRawWallet
): ((credential: VC) => Promise<VerificationItem[]>) => {
    return async (credential: VC): Promise<VerificationItem[]> => {
        const rawVerificationCheck = await wallet.pluginMethods.verifyCredential(credential);

        const verificationItems: VerificationItem[] = [];

        rawVerificationCheck.errors.forEach(error => {
            verificationItems.push({
                status: VerificationStatus.Failed,
                check: 'hmm',
                details: error,
            });
        });

        rawVerificationCheck.warnings.forEach(warning => {
            verificationItems.push({
                status: VerificationStatus.Error,
                check: 'hmm',
                message: warning,
            });
        });

        rawVerificationCheck.checks.forEach(check => {
            verificationItems.push({
                status: VerificationStatus.Success,
                check,
                message: check,
            });
        });

        return verificationItems;
    };
};
