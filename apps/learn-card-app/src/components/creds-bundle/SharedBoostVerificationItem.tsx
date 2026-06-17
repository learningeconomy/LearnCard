import React from 'react';

import X from '../svgs/X';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import ExclamationPoint from '../svgs/ExclamationPoint';
import { VerificationItem, VerificationStatusEnum } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

export const SharedBoostVerificationItem: React.FC<{
    verification: VerificationItem;
    hideBorder?: boolean;
}> = ({ verification, hideBorder = false }) => {
    let check = verification.check;
    let message: string | undefined = '';

    message = verification?.check ? verification?.message : verification.message;

    if (verification.status === VerificationStatusEnum.Failed) {
        message = '';
    }

    // --- i18n: resolve display strings at render time (never at module load).
    // `boostHelpers.getBoostVerificationPreview` (editor preview) emits
    // lowercase `check` values ('proof'/'expiration') and English `message`
    // strings; the SDK `prettifyVerificationItems` path (runtime verification)
    // emits humanized checks ('Proof'/'Expiration'/'Status') and messages.
    // We normalize by lowercasing `check` and matching known message strings /
    // date-prefixed patterns, falling back to the raw value when unrecognized.
    const statusLabel =
        verification.status === VerificationStatusEnum.Success
            ? m['verification.status.success']()
            : verification.status === VerificationStatusEnum.Failed
            ? m['verification.status.failed']()
            : verification.status === VerificationStatusEnum.Error
            ? m['verification.status.error']()
            : verification.status;

    const checkLower = (check ?? '').toLowerCase();
    const checkLabel =
        checkLower === 'proof'
            ? m['verification.checks.proof']()
            : checkLower === 'revocation' ||
              checkLower === 'status' ||
              checkLower === 'credentialstatus'
            ? m['verification.checks.revocation']()
            : checkLower === 'expiration'
            ? m['verification.checks.expiration']()
            : check;

    const resolveMessage = (raw: string | undefined): string | undefined => {
        if (!raw) return raw;
        if (raw === 'Valid') return m['verification.messages.valid']();
        if (raw === 'Not Revoked') return m['verification.messages.notRevoked']();
        if (raw === 'Does Not Expire') return m['verification.messages.doesNotExpire']();
        // Editor-preview date messages: 'Invalid • Expired <date>' / 'Valid • Expires <date>'
        if (raw.startsWith('Invalid • Expired '))
            return m['verification.messages.expired']({
                date: raw.slice('Invalid • Expired '.length),
            });
        if (raw.startsWith('Valid • Expires '))
            return m['verification.messages.expires']({
                date: raw.slice('Valid • Expires '.length),
            });
        // SDK runtime date messages: 'Expired <date>' / 'Expires <date>'
        if (raw.startsWith('Expired '))
            return m['verification.messages.expired']({ date: raw.slice('Expired '.length) });
        if (raw.startsWith('Expires '))
            return m['verification.messages.expires']({ date: raw.slice('Expires '.length) });
        return raw;
    };
    const messageLabel = resolveMessage(message);

    const getIcon = () => {
        switch (verification.status) {
            case VerificationStatusEnum.Success:
                return <Checkmark className="text-emerald-600 w-[20px] h-[20px] mr-1" />;
            case VerificationStatusEnum.Error:
                return <ExclamationPoint className="text-red-600 w-[20px] h-[20px] mr-1" />;
            case VerificationStatusEnum.Failed:
                return <X className="text-red-600 w-[20px] h-[20px] mr-1" />;
        }
    };

    const getTextColor =
        verification?.status === VerificationStatusEnum.Success
            ? 'text-emerald-600'
            : 'text-red-600';

    // overrides the default message  for authentic boosts
    if (
        verification.check === 'Boost is Authentic. Verified by LearnCard Network.' &&
        verification.status === VerificationStatusEnum.Success
    ) {
        message = verification.check ? `${verification.message}` : verification.message;

        return (
            <div
                className={`w-full flex flex-col items-start justify-center border-grayscale-200 mb-2 pb-2 ${
                    hideBorder ? 'border-none' : 'border-b-[1px]'
                }`}
            >
                <p
                    className={`flex items-center justify-between text-sm font-bold mb-1 normal ${getTextColor}`}
                >
                    {getIcon()} {statusLabel}
                </p>
                <p className="flex items-center justify-between text-sm mb-1 capitalize font-semibold text-grayscale-900">
                    Authentic Boost:
                </p>
                <p className="flex items-center justify-between text-sm mb-1 capitalize text-grayscale-900">
                    Verified by the LearnCard Network
                </p>
            </div>
        );
    }

    return (
        <div
            className={`w-full flex flex-col items-start justify-center border-grayscale-200 mb-2 pb-2 ${
                hideBorder ? 'border-none' : 'border-b-[1px]'
            }`}
        >
            <p
                className={`flex items-center justify-between text-sm font-bold mb-1 normal ${getTextColor}`}
            >
                {getIcon()} {statusLabel}
            </p>
            <p
                className={`flex ${
                    check === 'Boost Authenticity' ? 'flex-col' : 'flex-row'
                }  items-start justify-between text-sm mb-1 capitalize text-grayscale-900`}
            >
                {checkLabel}:&nbsp;
                {messageLabel && <span className="font-semibold text-wrap">{messageLabel}</span>}
            </p>
        </div>
    );
};

export default SharedBoostVerificationItem;
