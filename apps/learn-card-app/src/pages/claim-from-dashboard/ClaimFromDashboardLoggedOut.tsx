import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonPage, IonCol, IonRow } from '@ionic/react';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';

import { redirectStore } from 'learn-card-base';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';
import { FromDashboardMetadata } from './ClaimFromDashboard';

import useTheme from '../../theme/hooks/useTheme';

export type ClaimFromDashboardLoggedOutProps = {
    metadata: FromDashboardMetadata | undefined;
};

const ClaimFromDashboardLoggedOut: React.FC<ClaimFromDashboardLoggedOutProps> = ({ metadata }) => {
    const currentUser = useCurrentUser();

    const history = useHistory();
    const location = useLocation();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const redirectToLogin = () => {
        redirectStore.set.authRedirect(location.pathname + location.search);
        history.push('/login');
    };

    const claimText = metadata?.credentialName
        ? `Login or signup to claim your ${metadata?.credentialName}.`
        : `Login or signup to claim.`;

    return (
        <IonPage className="bg-emerald-700 p-[30px]">
            <div className="flex flex-col gap-[10px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] m-auto max-w-[350px]">
                <h3 className="text-5xl">🎉</h3>

                <div className="flex flex-col items-center font-poppins w-full text-center">
                    <h1 className="text-grayscale-900 text-[20px] font-[600] leading-[160%]">
                        You've received a credential!
                    </h1>
                    <div className="text-grayscale-800 text-[17px]">{claimText}</div>
                </div>

                {!currentUser && (
                    <div className="flex flex-col gap-[15px] items-center w-full">
                        <button
                            type="button"
                            onClick={redirectToLogin}
                            className="bg-emerald-700 text-grayscale-50 text-[18px] leading-[28px] tracking-[0.75px] font-poppins normal w-full py-[12px] rounded-[40px] shadow-bottom"
                        >
                            Sign up for LearnCard
                        </button>
                        <div className="text-grayscale-900 text-[14px]">
                            Have an account?{' '}
                            <button
                                type="button"
                                onClick={redirectToLogin}
                                className={`text-${primaryColor} font-[600]`}
                            >
                                Login
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-[20px] border-solid border-t-[1px] border-grayscale-200 w-full flex flex-col items-center gap-[10px]">
                    <span className="text-grayscale-900 text-[14px] font-montserrat normal font-[700] tracking-[7px] uppercase">
                        LearnCard
                    </span>
                    <span className="text-grayscale-700 text-[14px]">
                        Universal Learning & Work Portfolio
                    </span>
                    <IonRow className="flex items-center justify-center">
                        <IonCol className="flex items-center justify-center">
                            <button
                                onClick={openPP}
                                className={`text-${primaryColor} font-[600] text-[12px]`}
                            >
                                Privacy Policy
                            </button>
                            <span className="text-grayscale-600 font-bold text-[12px]">
                                &nbsp;•&nbsp;
                            </span>
                            <button
                                onClick={openToS}
                                className={`text-${primaryColor} font-[600] text-[12px]`}
                            >
                                Terms of Service
                            </button>
                        </IonCol>
                    </IonRow>
                </div>
            </div>
        </IonPage>
    );
};

export default ClaimFromDashboardLoggedOut;
