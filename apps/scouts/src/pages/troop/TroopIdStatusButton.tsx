import React, { useEffect } from 'react';

import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import { useGetBoost, useGetBoostPermissions, useGetCurrentLCNUser } from 'learn-card-base';

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

// ! TEMPORARY WAY OF CHECKING IF AN ID IS VALID !!
// TODO: implement Revocation !!
export const isTroopIDRevokedFake = (isError: boolean, error: any): boolean => {
    if (isError && error instanceof Error && error?.message.includes(`Could not find boost`)) {
        return true;
    }

    return false;
};

export const useIsTroopIDRevokedFake = (
    credential: VC,
    isError: boolean,
    error: any,
    otherUserProfileID?: string,
    boostUri?: string
) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const myProfileId = currentLCNUser?.profileId;
    const _boostUri = credential?.boostId || boostUri;

    const { data: permissions, isError: isPermissionsError } = useGetBoostPermissions(
        _boostUri,
        otherUserProfileID ?? myProfileId
    );
    const isRevoked = isTroopIDRevokedFake(isError, error);

    // # if the boost is not found, the ID has been revoked!
    if (isRevoked) return true;

    // # if the user has no permissions for this boost, their ID is revoked!
    if (isPermissionsError || !permissions?.role) return true;

    // # if the user has permissions for this boost, their ID is valid!
    if (
        permissions?.role === 'creator' ||
        permissions?.role === 'Director' ||
        permissions?.role === 'Global Admin' ||
        permissions?.role === 'Leader' ||
        permissions?.role === 'Scout'
    ) {
        return false;
    }

    return true;
};
// TODO: implement Revocation !!
// ! TEMPORARY WAY OF CHECKING IF AN ID IS VALID !!

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
