import React from 'react';

import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import RedXCircle from 'learn-card-base/svgs/RedXCircle';
import WarningCircle from 'learn-card-base/svgs/WarningCircle';

import { useCredentialVerification } from 'learn-card-base/hooks/useCredentialVerification';

import type { VC, VerificationItem } from '@learncard/types';
import { VerificationStatusEnum } from '@learncard/types';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';

const getProofVerified = (items: VerificationItem[]): boolean => {
    const proofItem = items.find(i => i.check.toLowerCase().includes('proof'));
    if (proofItem) return proofItem.status === VerificationStatusEnum.Success;

    return items.every(i => i.status === VerificationStatusEnum.Success);
};

const ClrVerificationPills: React.FC<{ boost: VC }> = ({ boost }) => {
    const { verificationItems, isVerified } = useCredentialVerification(boost);
    const verified = isVerified ? getProofVerified(verificationItems) : null;

    const expirationDate =
        boost.validUntil ?? (boost as { expirationDate?: string }).expirationDate;
    const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;

    const proofIcon =
        verified === null ? null : verified ? (
            <CircleCheckmark className="w-4 h-4 shrink-0" />
        ) : (
            <RedXCircle className="w-4 h-4 shrink-0" />
        );
    const proofLabel = verified === null ? 'Verifying…' : verified ? 'Valid' : 'Invalid';

    const expirationIcon = isExpired ? (
        <WarningCircle className="w-4 h-4 shrink-0" />
    ) : (
        <CircleCheckmark className="w-4 h-4 shrink-0" />
    );

    let expirationLabel: string;
    if (isExpired) expirationLabel = `Expired ${formatClrDate(expirationDate!)}`;
    else if (expirationDate) expirationLabel = `Expires ${formatClrDate(expirationDate)}`;
    else expirationLabel = 'Does not expire';

    const pillBase =
        'flex items-center gap-1 rounded-full px-2 py-1 font-poppins font-[500] text-[12px] leading-tight whitespace-nowrap';

    return (
        <div className="flex flex-wrap gap-2">
            {verified !== null && (
                <div
                    className={`${pillBase} ${
                        verified
                            ? 'bg-emerald-100 text-grayscale-900'
                            : 'bg-red-100 text-grayscale-900'
                    }`}
                >
                    {proofIcon}
                    <p>
                        <span className="font-semibold">Proof:</span>{' '}
                        <span className="text-grayscale-900 text-xs font-normal">{proofLabel}</span>
                    </p>
                </div>
            )}
            <div
                className={`${pillBase} ${
                    isExpired
                        ? 'bg-amber-100 text-grayscale-900'
                        : 'bg-emerald-100 text-grayscale-900'
                }`}
            >
                {expirationIcon}
                <p>
                    <span className="font-semibold">Expiration:</span>{' '}
                    <span className="text-grayscale-900 text-xs font-normal">
                        {expirationLabel}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default ClrVerificationPills;
