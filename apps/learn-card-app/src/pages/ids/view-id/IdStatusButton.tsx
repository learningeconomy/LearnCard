import React, { useEffect } from 'react';
import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import { isCredentialExpired } from '../../../components/boost/boostHelpers';
import { VC, VerificationStatusEnum } from '@learncard/types';

enum IdStatusEnum {
    Valid,
    Invalid,
    Expired,
    Revoked,
}

type IdStatusButtonProps = {
    credential: VC;
    checkProof?: boolean;
    onClick?: () => void;
};

const IdStatusButton: React.FC<IdStatusButtonProps> = ({
    credential,
    checkProof = true,
    onClick,
}) => {
    const { verifyCredential, worstVerificationStatus } = useVerifyCredential(checkProof);

    useEffect(() => {
        verifyCredential(credential); // this will set worstVerificationStatus
    }, [checkProof, credential]);

    let status: IdStatusEnum = IdStatusEnum.Valid;
    if (isCredentialExpired(credential)) {
        status = IdStatusEnum.Expired;
    } else if (
        worstVerificationStatus &&
        worstVerificationStatus !== VerificationStatusEnum.Success
    ) {
        status = IdStatusEnum.Invalid;
    }

    let text: string;
    let buttonColor: string;
    switch (status) {
        case IdStatusEnum.Valid:
            text = 'Valid ID';
            buttonColor = 'bg-emerald-700';
            break;
        case IdStatusEnum.Invalid:
            text = 'Invalid ID';
            buttonColor = 'bg-rose-500';
            break;
        case IdStatusEnum.Expired:
            text = 'Expired ID';
            buttonColor = 'bg-amber-500';
            break;
        case IdStatusEnum.Revoked:
            text = 'ID Revoked';
            buttonColor = 'bg-rose-500';
            break;
    }

    return (
        <div
            role={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`rounded-[20px] py-[5px] px-[14px] absolute top-[-26px] right-[10px] text-[12px] font-notoSans font-[600] ${buttonColor}`}
        >
            {text}
        </div>
    );
};

export default IdStatusButton;
