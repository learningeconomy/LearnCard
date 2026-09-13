import React, { useEffect } from 'react';

import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import { useGetBoost, useCredentialStatus } from 'learn-card-base';
import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';

import { VC, VerificationStatusEnum } from '@learncard/types';

import { isCredentialExpired } from '../../components/boost/boostHelpers';
import {
    deriveTroopIdStatus,
    shouldShowTroopIdStatus,
    type TroopIdIssuanceState,
} from './troopIdStatus.helpers';
import type { TroopIdStatusResult } from './troopIdStatus.types';

enum TroopIdStatusEnum {
    Valid,
    Invalid,
    Expired,
    Revoked,
    Pending,
    Suspended,
    Unavailable,
}

export interface TroopIdStatusButtonProps {
    credential: VC;
    credentialUri?: string;
    issuanceState?: TroopIdIssuanceState;
    lifecycleEnabled?: boolean;
    checkProof?: boolean;
    onClick?: () => void;
    skeletonStyles?: React.CSSProperties;
    isHidden?: boolean;
}

export interface UseTroopIdStatusOptions {
    credential?: VC;
    credentialUri?: string;
    issuanceState?: TroopIdIssuanceState;
    enabled?: boolean;
}

export const useTroopIDStatus = ({
    credential,
    credentialUri,
    issuanceState = 'accepted',
    enabled = true,
}: UseTroopIdStatusOptions): TroopIdStatusResult => {
    const lifecycle = useCredentialStatus({
        credential,
        uri: credentialUri,
        enabled: enabled && Boolean(credentialUri),
    });

    return {
        ...lifecycle,
        status: deriveTroopIdStatus({
            lifecycleStatus: lifecycle.status,
            issuanceState,
            isLoading: lifecycle.isLoading,
            isError: lifecycle.isError,
            lifecycleEnabled: enabled && Boolean(credentialUri),
        }),
    };
};

const TroopIdStatusButton: React.FC<TroopIdStatusButtonProps> = ({
    credential,
    credentialUri,
    issuanceState,
    lifecycleEnabled = true,
    checkProof = true,
    onClick,
    skeletonStyles,
    isHidden,
}) => {
    const { verifyCredential, worstVerificationStatus } = useVerifyCredential(checkProof);
    const { isLoading: isProofLoading } = useGetBoost(credential?.boostId);
    const {
        status: credentialStatus,
        isLoading: isLifecycleLoading,
        isError: isLifecycleError,
    } = useTroopIDStatus({
        credential,
        credentialUri,
        issuanceState,
        enabled: lifecycleEnabled,
    });

    useEffect(() => {
        verifyCredential(credential);
    }, [checkProof, credential]);

    let status: TroopIdStatusEnum = TroopIdStatusEnum.Valid;
    if (isCredentialExpired(credential)) {
        status = TroopIdStatusEnum.Expired;
    } else if (
        worstVerificationStatus &&
        worstVerificationStatus !== VerificationStatusEnum.Success
    ) {
        status = TroopIdStatusEnum.Invalid;
    } else if (isLifecycleError) {
        status = TroopIdStatusEnum.Unavailable;
    } else if (credentialStatus === 'revoked') {
        status = TroopIdStatusEnum.Revoked;
    } else if (credentialStatus === 'suspended') {
        status = TroopIdStatusEnum.Suspended;
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
        case TroopIdStatusEnum.Suspended:
            text = 'ID Suspended';
            buttonColor = 'bg-amber-500';
            break;
        case TroopIdStatusEnum.Unavailable:
            text = 'Status Unavailable';
            buttonColor = 'bg-amber-500';
            break;
    }

    if (isHidden || !shouldShowTroopIdStatus({ lifecycleEnabled, credentialUri })) return <></>;

    return (
        <>
            {isProofLoading || isLifecycleLoading ? (
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
