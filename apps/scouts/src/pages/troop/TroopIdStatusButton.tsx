import React, { useEffect } from 'react';

import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import { useGetBoost, useGetBoostRecipients, useGetCurrentLCNUser, useGetIDs } from 'learn-card-base';

import { isCredentialExpired } from '../../components/boost/boostHelpers';
import { VC, VerificationStatusEnum } from '@learncard/types';

enum TroopIdStatusEnum {
    Valid,
    Invalid,
    Expired,
    Revoked,
    Pending,
}

type TroopIdStatusButtonProps = {
    credential: VC;
    checkProof?: boolean;
    onClick?: () => void;
    skeletonStyles?: React.CSSProperties;
    isHidden?: boolean;
    otherUserProfileID?: string;
};

// Status type for credential state
export type TroopIdCredentialStatus = 'valid' | 'pending' | 'revoked' | undefined;

/**
 * Check the status of a troop ID credential.
 * Returns: 'valid' (claimed), 'pending' (sent but not claimed), 'revoked', or undefined (loading)
 */
export const useTroopIDStatus = (
    credential: VC,
    otherUserProfileID?: string,
    boostUri?: string
): TroopIdCredentialStatus => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileId = otherUserProfileID ?? currentLCNUser?.profileId;
    const _boostUri = credential?.boostId || boostUri;

    // Unconditional (rules of hooks) — used for pre-Feb-13 backcompat check below
    const { data: walletIds } = useGetIDs();

    // Query 1: Get claimed recipients only (default: includeUnacceptedBoosts=false)
    const { 
        data: claimedRecipients, 
        isLoading: isLoadingClaimed, 
        isError: isClaimedError 
    } = useGetBoostRecipients(_boostUri, true, false);

    // Query 2: Get all recipients including pending (includeUnacceptedBoosts=true)
    const { 
        data: allRecipients, 
        isLoading: isLoadingAll, 
        isError: isAllError 
    } = useGetBoostRecipients(_boostUri, true, true);

    // Still loading
    if (isLoadingClaimed || isLoadingAll) return undefined;

    // Error fetching - could be boost doesn't exist
    if (isClaimedError || isAllError) return 'revoked';

    // No data yet
    if (!claimedRecipients || !allRecipients) return undefined;

    // Check if user is in claimed recipients
    const isInClaimedRecipients = claimedRecipients.some(r => r.to.profileId === profileId);
    if (isInClaimedRecipients) return 'valid';

    // Check if user is in all recipients (includes pending)
    const isInAllRecipients = allRecipients.some(r => r.to.profileId === profileId);
    if (isInAllRecipients) {
        // Backcompat for pre-Feb-13 credentials: the old acceptance flow added credentials
        // to the LearnCloud wallet index directly without calling acceptCredential on the
        // brain-service, so CREDENTIAL_SENT exists but CREDENTIAL_RECEIVED was never created.
        // If the credential is already in the user's local wallet, treat it as claimed.
        // This is safe because revoked credentials are excluded from BOTH recipient queries
        // (status='revoked' filter), so they show as 'revoked' — this check only fires for
        // 'pending' and cannot accidentally override a real revocation.
        // Only applies to the current user's own credentials (not admin viewing another user).
        if (!otherUserProfileID && walletIds) {
            const credBoostId = credential?.boostId;
            const isInWallet =
                credBoostId &&
                walletIds.some(
                    (id: any) => id?.boostId === credBoostId || id?.vc?.boostId === credBoostId
                );
            if (isInWallet) return 'valid';
        }
        return 'pending';
    }

    // Not in any list - revoked
    return 'revoked';
};

// Legacy compatibility wrapper
export const useIsTroopIDRevoked = (
    credential: VC,
    otherUserProfileID?: string,
    boostUri?: string
): boolean | undefined => {
    const status = useTroopIDStatus(credential, otherUserProfileID, boostUri);
    if (status === undefined) return undefined;
    return status === 'revoked';
};

/** @deprecated Use useTroopIDStatus instead */
export const useIsTroopIDRevokedFake = (
    credential: VC,
    _isError: boolean,
    _error: any,
    otherUserProfileID?: string,
    boostUri?: string
): boolean => {
    const result = useIsTroopIDRevoked(credential, otherUserProfileID, boostUri);
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
        verifyCredential(credential);
    }, [checkProof, credential]);

    const credentialStatus = useTroopIDStatus(credential, otherUserProfileID);

    let status: TroopIdStatusEnum = TroopIdStatusEnum.Valid;
    if (isCredentialExpired(credential)) {
        status = TroopIdStatusEnum.Expired;
    } else if (
        worstVerificationStatus &&
        worstVerificationStatus !== VerificationStatusEnum.Success
    ) {
        status = TroopIdStatusEnum.Invalid;
    } else if (credentialStatus === 'revoked') {
        status = TroopIdStatusEnum.Revoked;
    } else if (credentialStatus === 'pending') {
        status = TroopIdStatusEnum.Pending;
    }

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
        case TroopIdStatusEnum.Pending:
            text = 'Pending Acceptance';
            buttonColor = 'bg-amber-500';
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
