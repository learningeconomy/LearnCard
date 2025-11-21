import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import LearnCardAppIcon from '../../../assets/images/lca-icon-v2.png';

import { usePathQuery, useVerifyContactMethod } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

const UserVerifyEmail: React.FC = () => {
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
                    <img src={LearnCardAppIcon} className="w-full h-full object-cover" />
                </div>

                {(isVerified === null || verifyEmailLoading) && (
                    <>
                        <h1 className="text-grayscale-900 text-[22px] font-semibold font-notoSans text-center mb-2">
                            Verifying your email...
                        </h1>
                        <p className="text-center text-grayscale-600 text-[15px] mb-6 font-notoSans">
                            Just a moment while we complete your verification.
                        </p>
                    </>
                )}

                {isVerified && (
                    <>
                        <h1 className="text-grayscale-900 text-[22px] font-semibold font-notoSans text-center mb-2 flex items-center justify-center">
                            Your email has successfully been verified.{' '}
                        </h1>
                        <button
                            onClick={() => history.push('/')}
                            className={`mt-2 bg-${primaryColor} py-[10px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white shadow-button-bottom flex gap-[5px] items-center justify-center w-[80%] max-w-[280px]`}
                        >
                            Return Home
                        </button>
                    </>
                )}

                {isVerified === false && (
                    <>
                        <h1 className="text-red-600 text-[22px] font-bold font-notoSans text-center mb-2">
                            Verification Failed
                        </h1>
                        <p className="text-center text-grayscale-700 text-[16px] mb-6 font-notoSans leading-[1.4]">
                            We couldn’t verify your email. The token may be invalid or expired.
                            Please try again or request a new verification email.
                        </p>
                        <button
                            onClick={() => history.push('/')}
                            className={`bg-${primaryColor} py-[10px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white shadow-button-bottom flex gap-[5px] items-center justify-center w-[80%] max-w-[280px]`}
                        >
                            Return Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserVerifyEmail;
