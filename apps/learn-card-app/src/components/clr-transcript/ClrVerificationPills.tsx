import React, { useEffect, useRef, useState } from 'react';
import * as m from '../../paraglide/messages.js';

import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import RedXCircle from 'learn-card-base/svgs/RedXCircle';
import WarningCircle from 'learn-card-base/svgs/WarningCircle';

import { useVerifyCredential } from 'learn-card-base/hooks/useVerifyCredential';

import type { VC, VerificationItem } from '@learncard/types';
import { VerificationStatusEnum } from '@learncard/types';
import { formatClrDate } from 'learn-card-base/helpers/credentials/clr/renderer';

const PILL_BASE =
    'flex items-center gap-1 rounded-full px-2 py-1 font-poppins font-[500] text-[12px] leading-tight whitespace-nowrap';

const ClrVerificationPills: React.FC<{ boost: VC; verificationItems?: VerificationItem[] }> = ({
    boost,
    verificationItems,
}) => {
    const { verifyCredential } = useVerifyCredential();
    const verifyRef = useRef(verifyCredential);
    verifyRef.current = verifyCredential;
    const [result, setResult] = useState<{ boost: VC; items: VerificationItem[] }>();
    const hasSuppliedResult = Boolean(verificationItems?.length);

    useEffect(() => {
        if (hasSuppliedResult || !boost.proof) return;
        let cancelled = false;
        verifyRef.current(boost).then(
            items => {
                if (!cancelled) setResult({ boost, items });
            },
            () => {
                if (!cancelled) setResult({ boost, items: [] });
            }
        );
        return () => {
            cancelled = true;
        };
    }, [boost, hasSuppliedResult]);

    const items = hasSuppliedResult
        ? verificationItems
        : result?.boost === boost
          ? result.items
          : undefined;
    const proofs = items?.filter(item => /proof/i.test(item.check)) ?? [];
    const verified =
        proofs.length > 0
            ? proofs.every(item => item.status === VerificationStatusEnum.Success)
            : items?.length
              ? items.every(item => item.status === VerificationStatusEnum.Success)
              : null;

    const proofIcon =
        verified === null ? null : verified ? (
            <CircleCheckmark className="w-4 h-4 shrink-0" />
        ) : (
            <RedXCircle className="w-4 h-4 shrink-0" />
        );
    const proofLabel =
        verified === null
            ? items === undefined
                ? m['clrRenderer.verifying']()
                : m['clrRenderer.signedUnverified']()
            : verified
              ? m['clrRenderer.valid']()
              : m['clrRenderer.invalid']();

    return (
        <div className="flex flex-wrap gap-2">
            {Boolean(boost.proof) && (
                <div
                    className={`${PILL_BASE} ${
                        verified === null
                            ? 'bg-grayscale-100 text-grayscale-900'
                            : verified
                              ? 'bg-emerald-100 text-grayscale-900'
                              : 'bg-red-100 text-grayscale-900'
                    }`}
                >
                    {proofIcon}
                    <p>
                        <span className="font-semibold">{m['clrRenderer.proof']()}:</span>{' '}
                        <span className="text-grayscale-900 text-xs font-normal">{proofLabel}</span>
                    </p>
                </div>
            )}
            <ClrCredentialValidity boost={boost} />
        </div>
    );
};

/** Date presentation only. Rendering it must never start another proof verification pass. */
export const ClrCredentialValidity = ({ boost }: { boost: VC }) => {
    const expirationDate =
        boost.validUntil ??
        (typeof boost.expirationDate === 'string' ? boost.expirationDate : undefined);
    const expired = expirationDate ? new Date(expirationDate) < new Date() : false;
    const label = expired
        ? m['clrRenderer.expired']({ date: formatClrDate(expirationDate!) })
        : expirationDate
          ? m['clrRenderer.expires']({ date: formatClrDate(expirationDate) })
          : m['clrRenderer.doesNotExpire']();
    return (
        <div
            className={`${PILL_BASE} ${expired ? 'bg-amber-100' : 'bg-emerald-100'} text-grayscale-900`}
        >
            {expired ? (
                <WarningCircle className="h-4 w-4 shrink-0" />
            ) : (
                <CircleCheckmark className="h-4 w-4 shrink-0" />
            )}
            <p>
                <span className="font-semibold">{m['clrRenderer.expiration']()}:</span>{' '}
                <span className="text-xs font-normal">{label}</span>
            </p>
        </div>
    );
};

export default ClrVerificationPills;
