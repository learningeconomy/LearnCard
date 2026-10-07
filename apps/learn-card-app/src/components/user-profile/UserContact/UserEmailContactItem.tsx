import React, { useState } from 'react';
import Countdown from 'react-countdown';
import { ContactMethodType } from '@learncard/types';
import { IonSpinner } from '@ionic/react';
import { getLogger } from 'learn-card-base';
const log = getLogger('user-email-contact-item');

import TrashBin from '../../svgs/TrashBin';
import UnverifiedIcon from 'learn-card-base/svgs/UnverifiedIcon';
import VerifiedCheckmark from 'learn-card-base/svgs/VerifiedCheckmark';

import {
    useAddContactMethod,
    useSetPrimaryContactMethod,
    useRemoveContactMethod,
    useConfirmation,
} from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import * as m from '../../../paraglide/messages.js';

export const UserEmailContactItem: React.FC<{
    email: ContactMethodType;
    refetchContactMethods: () => void;
}> = ({ email, refetchContactMethods }) => {
    const confirm = useConfirmation();
    const [isResendCodeLoading, setIsResendCodeLoading] = useState<boolean>(false);

    const { mutateAsync: addContactMethod } = useAddContactMethod();
    const { mutateAsync: setPrimaryContactMethod, isPending: isSetPrimaryLoading } =
        useSetPrimaryContactMethod();
    const { mutateAsync: removeContactMethod, isPending: isRemoveLoading } =
        useRemoveContactMethod();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleResendVerificationEmail = async (contactMethodId: string, resendEmail: string) => {
        if (contactMethodId && resendEmail) {
            setIsResendCodeLoading(true);
            try {
                // ! work around for now
                // TODOS:
                // ! don't allow duplicate emails
                // ! need a resend email endpoint
                await removeContactMethod({ id: contactMethodId });
                await addContactMethod({ type: 'email', value: resendEmail.toLowerCase() });
            } finally {
                setIsResendCodeLoading(false);
            }
        }
    };

    const handleSetPrimaryContactMethod = async (contactMethodId: string) => {
        try {
            const confirmResponse = await confirm({
                title: m['profile.email.setPrimaryConfirm.title'](),
                text: m['profile.email.setPrimaryConfirm.text'](),
                confirmText: m['common.yes'](),
                cancelText: m['common.no'](),
                cancelButtonClassName:
                    'bg-grayscale-100 text-grayscale-900 font-semibold rounded-full px-4 py-3',
                confirmButtonClassName:
                    'bg-emerald-201 text-emerald-601 font-semibold rounded-full px-6 py-3',
            });
            if (!confirmResponse) {
                return;
            }
            await setPrimaryContactMethod({ contactMethodId });
        } catch (error) {
            log.error('Failed to set primary contact method:', error);
        }
    };

    const handleRemoveContactMethod = async (contactMethodId: string) => {
        try {
            const confirmResponse = await confirm({
                title: m['profile.email.removeConfirm.title'](),
                text: m['profile.email.removeConfirm.text'](),
                confirmText: m['common.yes'](),
                cancelText: m['common.no'](),
                cancelButtonClassName:
                    'bg-grayscale-100 text-grayscale-900 font-semibold rounded-full px-4 py-3',
                confirmButtonClassName:
                    'bg-emerald-201 text-emerald-601 font-semibold rounded-full px-6 py-3',
            });
            if (!confirmResponse) {
                return;
            }
            await removeContactMethod({ id: contactMethodId });
        } catch (error) {
            log.error('Failed to remove contact method:', error);
        }
    };

    return (
        <div
            key={email.id}
            className="w-full flex flex-col items-center justify-start border-b-solid border-b-[1px] border-grayscale-200 pb-4"
        >
            <div className="w-full flex items-center justify-start gap-2">
                <span aria-hidden="true">
                    {email.isVerified ? <VerifiedCheckmark /> : <UnverifiedIcon />}
                </span>
                {email.isVerified && <span className="sr-only">{m['issueFlow.verified']()}</span>}

                <p className="text-grayscale-800 font-medium text-lg flex-1 w-full">
                    {email.value}
                </p>
            </div>

            {!email.isVerified && (
                <div className="w-full flex items-center justify-start mt-2 mb-2">
                    <p className="text-amber-700 rounded-[15px] text-sm font-semibold">
                        {m['profile.email.unverified']()}{' '}
                        <span className="text-grayscale-900">•&nbsp;</span>
                    </p>
                    <button
                        type="button"
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResendVerificationEmail(email.id, email.value);
                        }}
                        disabled={isResendCodeLoading}
                        aria-busy={isResendCodeLoading}
                        aria-label={`${m['profile.email.resendVerification']()} ${email.value}`}
                        className={`text-${primaryColor} font-semibold text-sm cursor-pointer`}
                    >
                        {isResendCodeLoading
                            ? m['profile.email.sending']()
                            : m['profile.email.resendVerification']()}
                    </button>
                </div>
            )}

            <div className="flex items-center justify-end w-full gap-2 mt-2">
                {email?.isPrimary ? (
                    <p className="bg-emerald-201 text-emerald-601 font-semibold rounded-full px-6 py-3">
                        {m['profile.email.primary']()}
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleSetPrimaryContactMethod(email.id)}
                        disabled={isSetPrimaryLoading}
                        aria-busy={isSetPrimaryLoading}
                        aria-label={`${m['profile.email.setAsPrimary']()} ${email.value}`}
                        className="bg-grayscale-700 text-white font-semibold rounded-full px-4 py-3"
                    >
                        {isSetPrimaryLoading
                            ? m['common.loading']()
                            : m['profile.email.setAsPrimary']()}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => handleRemoveContactMethod(email.id)}
                    disabled={isRemoveLoading}
                    aria-busy={isRemoveLoading}
                    aria-label={`${m['profile.email.remove']()} ${email.value}`}
                    className="bg-white border-solid border-[1px] border-grayscale-200 rounded-full h-[48px] w-[48px] flex items-center justify-center"
                >
                    {isRemoveLoading ? (
                        <IonSpinner name="crescent" aria-hidden="true" />
                    ) : (
                        <span aria-hidden="true">
                            <TrashBin
                                version="2"
                                strokeWidth="2"
                                className="text-grayscale-900 w-[28px] h-[28px] min-w-[28px] min-h-[28px]"
                            />
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UserEmailContactItem;
