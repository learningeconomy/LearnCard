import React, { useEffect } from 'react';

import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import { useGetBoost, useGetBoostRecipients, useGetCurrentLCNUser } from 'learn-card-base';

import { isCredentialExpired } from '../../components/boost/boostHelpers';
import { VC, VerificationStatusEnum } from '@learncard/types';

enum TroopIdStatusEnum {
    Valid,
    Invalid,
    Expired,
    Revoked,
}

type TroopIdStatusButtonProps = {
    credential: VC;
    checkProof?: boolean;
    onClick?: () => void;
    skeletonStyles?: React.CSSProperties;
    isHidden?: boolean;
    otherUserProfileID?: string;
};

// Proper revocation check using the recipients list
// Revoked users are filtered out by the backend, so if the user isn't in the list, they're revoked

export const useIsTroopIDRevoked = (
    credential: VC,
    otherUserProfileID?: string,
    boostUri?: string
): boolean | undefined => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileId = otherUserProfileID ?? currentLCNUser?.profileId;
    const _boostUri = credential?.boostId || boostUri;

    const { data: recipients, isLoading, isError } = useGetBoostRecipients(_boostUri);

    // Still loading - return undefined to indicate unknown state
    if (isLoading) return undefined;

    // Error fetching recipients - could be boost doesn't exist (revoked/deleted boost)
    if (isError) return true;

    // No recipients data yet - return undefined
    if (!recipients) return undefined;

    // Check if the user is in the recipients list
    // If not in the list, they're revoked (since revoked users are filtered out by the backend)
    const isInRecipients = recipients.some(r => r.to.profileId === profileId);
    return !isInRecipients;
};

// Legacy compatibility - deprecated, use useIsTroopIDRevoked instead
/** @deprecated Use useIsTroopIDRevoked instead */
export const useIsTroopIDRevokedFake = (
    credential: VC,
    _isError: boolean,
    _error: any,
    otherUserProfileID?: string,
    boostUri?: string
): boolean => {
    const result = useIsTroopIDRevoked(credential, otherUserProfileID, boostUri);
    // Return false for undefined (loading) to maintain backwards compatibility
    return result ?? false;
};

const TroopIdStatusButton: React.FC<TroopIdStatusButtonProps> = ({
    credential,
    checkProof = true,
    onClick,
    skeletonStyles,
    isHidden,
    otherUserProfileID,
}) => {
    const { verifyCredential, worstVerificationStatus } = useVerifyCredential(checkProof);
    const { isLoading, error, isError } = useGetBoost(credential?.boostId);

    useEffect(() => {
        verifyCredential(credential); // this will set worstVerificationStatus
    }, [checkProof, credential]);

    const isRevoked = useIsTroopIDRevokedFake(credential, isError, error, otherUserProfileID);

    let status: TroopIdStatusEnum = TroopIdStatusEnum.Valid;
    if (isCredentialExpired(credential)) {
        status = TroopIdStatusEnum.Expired;
    } else if (
        worstVerificationStatus &&
        worstVerificationStatus !== VerificationStatusEnum.Success
    ) {
        status = TroopIdStatusEnum.Invalid;
    }

    // TODO: implement Revocation !!
    else if (isRevoked) {
        status = TroopIdStatusEnum.Revoked;
    }
    // TODO: implement Revocation !!
    // ! TEMPORARY WAY OF DISPLAYING AN ID IS NO LONGER VALID !!

    let text: string;
    let buttonColor: string;
    switch (status) {
        case TroopIdStatusEnum.Valid:
            text = 'Valid ID';
            buttonColor = 'bg-emerald-700';
            break;
        case TroopIdStatusEnum.Invalid:
            text = 'Invalid ID';
            buttonColor = 'bg-rose-500';
            break;
        case TroopIdStatusEnum.Expired:
            text = 'Expired ID';
            buttonColor = 'bg-amber-500';
            break;
        case TroopIdStatusEnum.Revoked:
            text = 'ID Revoked';
            buttonColor = 'bg-rose-500';
            break;
    }

    if (isHidden) return <></>;

    return (
        <>
            {isLoading ? (
                <BoostSkeleton
                    containerClassName="rounded-full w-full flex items-center justify-end relative"
                    skeletonStyles={skeletonStyles}
                />
            ) : (
                <div
                    role={onClick ? 'button' : undefined}
                    onClick={onClick}
                    className={`rounded-[20px] text-white py-[5px] px-[14px] absolute top-[-26px] right-[10px] text-[12px] font-notoSans font-[600] ${buttonColor}`}
                >
                    {text}
                </div>
            )}
        </>
    );
};

export default TroopIdStatusButton;
