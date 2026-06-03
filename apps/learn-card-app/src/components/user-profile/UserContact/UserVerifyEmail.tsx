import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { useTenantBrandingAssets } from '../../../config/brandingAssets';

import { usePathQuery, useVerifyContactMethod } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import * as m from '../../../paraglide/messages.js';

const UserVerifyEmail: React.FC = () => {
    const { appIcon } = useTenantBrandingAssets();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const history = useHistory();
    const query = usePathQuery();
    const token = query.get('token');

    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    const { mutateAsync: verifyEmail, isPending: verifyEmailLoading } = useVerifyContactMethod();

    const handleVerifyEmail = useCallback(async () => {
        try {
            await verifyEmail({ token: token! });
            setIsVerified(true);
        } catch (error) {
            console.error('Verification failed:', error);
            setIsVerified(false);
        }
    }, [verifyEmail]);

    useEffect(() => {
        if (token) {
            handleVerifyEmail();
        } else {
            setIsVerified(false);
        }
    }, [token, handleVerifyEmail]);

    return (
        <div className="bg-white flex items-center justify-center h-full w-full">
            <div className="w-full flex flex-col items-center justify-center max-w-[600px] ion-padding rounded-[16px] p-6 mx-4">
                <div className="flex items-center justify-center rounded-[12px] overflow-hidden w-[60px] h-[60px] mb-4">
                    <img src={appIcon} className="w-full h-full object-cover" />
                </div>

                {(isVerified === null || verifyEmailLoading) && (
                    <>
                        <h1 className="text-grayscale-900 text-[22px] font-semibold font-notoSans text-center mb-2">
                            {m['profile.verify.verifying']()}
                        </h1>
                        <p className="text-center text-grayscale-600 text-[15px] mb-6 font-notoSans">
                            {m['profile.verify.pleaseWait']()}
                        </p>
                    </>
                )}

                {isVerified && (
                    <>
                        <h1 className="text-grayscale-900 text-[22px] font-semibold font-notoSans text-center mb-2 flex items-center justify-center">
                            {m['profile.verify.success']()}
                        </h1>
                        <button
                            onClick={() => history.push('/')}
                            className={`mt-2 bg-${primaryColor} py-[10px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white shadow-button-bottom flex gap-[5px] items-center justify-center w-[80%] max-w-[280px]`}
                        >
                            {m['profile.verify.returnHome']()}
                        </button>
                    </>
                )}

                {isVerified === false && (
                    <>
                        <h1 className="text-red-600 text-[22px] font-bold font-notoSans text-center mb-2">
                            {m['profile.verify.failed']()}
                        </h1>
                        <p className="text-center text-grayscale-700 text-[16px] mb-6 font-notoSans leading-[1.4]">
                            {m['profile.verify.failedDesc']()}
                        </p>
                        <button
                            onClick={() => history.push('/')}
                            className={`bg-${primaryColor} py-[10px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white shadow-button-bottom flex gap-[5px] items-center justify-center w-[80%] max-w-[280px]`}
                        >
                            {m['profile.verify.returnHome']()}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserVerifyEmail;
