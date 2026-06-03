import React, { useState } from 'react';
import Countdown from 'react-countdown';
import { ContactMethodType } from '@learncard/types';

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
import { useTranslation } from 'react-i18next';

export const UserEmailContactItem: React.FC<{
    email: ContactMethodType;
    refetchContactMethods: () => void;
}> = ({ email, refetchContactMethods }) => {
    const { t } = useTranslation();
    const confirm = useConfirmation();
    const [isResendCodeLoading, setIsResendCodeLoading] = useState<boolean>(false);

    const { mutateAsync: addContactMethod } = useAddContactMethod();
    const { mutateAsync: setPrimaryContactMethod } = useSetPrimaryContactMethod();
    const { mutateAsync: removeContactMethod } = useRemoveContactMethod();

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
                title: t('profile.email.setPrimaryConfirm.title', 'Set Primary Contact Method'),
                text: t('profile.email.setPrimaryConfirm.text', 'Are you sure you want to set this email as primary?'),
                confirmText: t('profile.email.setPrimaryConfirm.yes', 'Yes'),
                cancelText: t('profile.email.setPrimaryConfirm.no', 'No'),
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
            console.error('Failed to set primary contact method:', error);
        }
    };

    const handleRemoveContactMethod = async (contactMethodId: string) => {
        try {
            const confirmResponse = await confirm({
                title: t('profile.email.removeConfirm.title', 'Remove Contact Method'),
                text: t('profile.email.removeConfirm.text', 'Are you sure you want to remove this email?'),
                confirmText: t('profile.email.removeConfirm.yes', 'Yes'),
                cancelText: t('profile.email.removeConfirm.no', 'No'),
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
            console.error('Failed to remove contact method:', error);
        }
    };

    return (
        <div
            key={email.id}
            className="w-full flex flex-col items-center justify-start border-b-solid border-b-[1px] border-grayscale-200 pb-4"
        >
            <div className="w-full flex items-center justify-start gap-2">
                {email.isVerified ? <VerifiedCheckmark /> : <UnverifiedIcon />}

                <p className="text-grayscale-800 font-medium text-lg flex-1 w-full">
                    {email.value}
                </p>
            </div>

            {!email.isVerified && (
                <div className="w-full flex items-center justify-start mt-2 mb-2">
                    <p className="text-amber-500 rounded-[15px] text-sm font-semibold">
                        {t('profile.email.unverified', 'Unverified')} <span className="text-grayscale-900">•&nbsp;</span>
                    </p>
                    <button
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResendVerificationEmail(email.id, email.value);
                        }}
                        className={`text-${primaryColor} font-semibold text-sm cursor-pointer`}
                    >
                        {isResendCodeLoading ? t('profile.email.sending', 'Sending...') : t('profile.email.resendVerification', 'Resend verification email')}
                    </button>
                </div>
            )}

            <div className="flex items-center justify-end w-full gap-2 mt-2">
                {email?.isPrimary ? (
                    <p
                        onClick={() => handleSetPrimaryContactMethod(email.id)}
                        className="bg-emerald-201 text-emerald-601 font-semibold rounded-full px-6 py-3"
                    >
                        {t('profile.email.primary', 'Primary')}
                    </p>
                ) : (
                    <button
                        onClick={() => handleSetPrimaryContactMethod(email.id)}
                        className="bg-grayscale-700 text-white font-semibold rounded-full px-4 py-3"
                    >
                        {t('profile.email.setAsPrimary', 'Set as Primary')}
                    </button>
                )}
                <button
                    onClick={() => handleRemoveContactMethod(email.id)}
                    className="bg-white border-solid border-[1px] border-grayscale-200 rounded-full h-[48px] w-[48px] flex items-center justify-center"
                >
                    <TrashBin
                        version="2"
                        strokeWidth="2"
                        className="text-grayscale-900 w-[28px] h-[28px] min-w-[28px] min-h-[28px]"
                    />
                </button>
            </div>
        </div>
    );
};

export default UserEmailContactItem;
