import { useState } from 'react';
import useWallet from './useWallet';
import { VC, VerificationItem, VerificationStatus, VerificationStatusEnum } from '@learncard/types';

export const useVerifyCredential = (checkProof: boolean = true) => {
    const { initWallet } = useWallet();

    const [worstVerificationStatus, setWorstVerificationStatus] = useState<
        VerificationStatus | undefined
    >(undefined);

    const verifyCredential = async (
        credential: VC,
        onVerify?: (verificationItems: VerificationItem[]) => void
    ) => {
        let verificationItems;
        const wallet = await initWallet();
        const verifications: VerificationItem[] = await wallet?.invoke?.verifyCredential(
            credential,
            {},
            true
        );

        if (!checkProof) {
            const verificationsMinusProof = verifications.filter(
                verificationItem => !verificationItem.check.includes('proof')
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
