import { useState } from 'react';
import { VC, VerificationItem, VerificationStatus, VerificationStatusEnum } from '@learncard/types';
import { useFetchCredentialVerification } from './useCredentialVerification';

export const useVerifyCredential = (checkProof: boolean = true) => {
    const fetchVerification = useFetchCredentialVerification();

    const [worstVerificationStatus, setWorstVerificationStatus] = useState<
        VerificationStatus | undefined
    >(undefined);

    const verifyCredential = async (
        credential: VC,
        onVerify?: (verificationItems: VerificationItem[]) => void
    ) => {
        let verificationItems;
        const verifications = await fetchVerification(credential);

        if (!checkProof) {
            const verificationsMinusProof = verifications.filter(
                verificationItem => !/proof/i.test(verificationItem.check)
            );
            verificationItems = verificationsMinusProof;
        } else {
            verificationItems = verifications;
        }

        let worstStatus = verificationItems.reduce(
            (
                currentWorst: (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum],
                verification
            ) => {
                switch (currentWorst) {
                    case VerificationStatusEnum.Success:
                        return verification.status;
                    case VerificationStatusEnum.Error:
                        return verification.status === VerificationStatusEnum.Failed
                            ? verification.status
                            : currentWorst;
                    case VerificationStatusEnum.Failed:
                        return currentWorst;
                }
            },
            VerificationStatusEnum.Success
        );

        setWorstVerificationStatus(worstStatus);

        onVerify?.(verificationItems);

        return verificationItems;
    };

    return { verifyCredential, worstVerificationStatus };
};

export default useVerifyCredential;
