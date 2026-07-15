import React from 'react';
import { IonCol, IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import { useDeviceTypeByWidth } from 'learn-card-base';
import ScoutPassLogo from '../../../assets/images/scoutpass-logo.svg';
import ScoutPassTextLogo from '../../../assets/images/scoutpass-text-logo.svg';
import { openLCwebsite, openPP, openToS } from '../../../helpers/externalLinkHelpers';

export const ClaimBoostLoggedOutPrompt: React.FC<{
    handleRedirectTo: () => void;
}> = ({ handleRedirectTo }) => {
    const { isDesktop } = useDeviceTypeByWidth();

    const backgroundColor = 'var(--sp-purple-base, #622599)';

    return (
        <IonPage className="flex flex-col h-full" style={{ backgroundColor }}>
            <IonContent
                fullscreen
                className="flex flex-col flex-grow"
                style={{ '--background': backgroundColor } as React.CSSProperties}
            >
                <IonGrid
                    className="h-full w-full flex items-center justify-center p-0"
                    style={{ backgroundColor }}
                >
                    <IonRow className="flex flex-col items-center justify-center w-full h-full p-0 m-0">
                        <IonCol className="w-full flex flex-col items-center justify-center h-full p-0 m-0">
                            {isDesktop ? (
                                <ClaimBoostLoggedOutPromptDesktop
                                    handleRedirectTo={handleRedirectTo}
                                    logo={ScoutPassLogo}
                                    textLogo={ScoutPassTextLogo}
                                />
                            ) : (
                                <ClaimBoostLoggedOutPromptMobile
                                    handleRedirectTo={handleRedirectTo}
                                    logo={ScoutPassLogo}
                                    textLogo={ScoutPassTextLogo}
                                />
                            )}
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

const ClaimBoostLoggedOutPromptDesktop: React.FC<{
    handleRedirectTo: () => void;
    logo: string;
    textLogo: string;
}> = ({ handleRedirectTo, logo, textLogo }) => {
    return (
        <div className="relative flex h-full w-full flex-row overflow-hidden text-white">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-white px-[50px] py-[22px] text-center text-grayscale-900">
                <div className="flex w-full max-w-[240px] flex-col items-center justify-center">
                    <h2 className="text-lg font-semibold text-grayscale-900">SCOUTPASS</h2>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-semibold text-indigo-500">
                        <button
                            onClick={openLCwebsite}
                            className="transition-colors hover:opacity-80"
                        >
                            Learn More
                        </button>
                        <button onClick={openToS} className="transition-colors hover:opacity-80">
                            Terms of Service
                        </button>
                        <button onClick={openPP} className="transition-colors hover:opacity-80">
                            Privacy Policy
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center border-l border-white/15 px-[50px] py-[22px] text-center">
                <div className="mb-[16px] flex w-full items-center justify-center gap-2">
                    <img src={logo} alt="ScoutPass logo" className="w-[55px]" />
                    <img src={textLogo} alt="ScoutPass text logo" className="max-w-[200px]" />
                </div>

                <h1 className="mb-2 max-w-[320px] text-[24px] font-semibold leading-snug text-white drop-shadow-sm">
                    Someone sent you a credential
                </h1>

                <button
                    onClick={handleRedirectTo}
                    className="mt-[24px] flex h-[54px] w-full items-center justify-center rounded-[20px] bg-white px-[24px] text-[17px] font-semibold text-grayscale-900 shadow-lg transition-opacity hover:opacity-90"
                >
                    Sign In to View and Claim
                </button>
            </div>
        </div>
    );
};

const ClaimBoostLoggedOutPromptMobile: React.FC<{
    handleRedirectTo: () => void;
    logo: string;
    textLogo: string;
}> = ({ handleRedirectTo, logo, textLogo }) => {
    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden text-white">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[14px] py-[22px] text-center">
                <div className="mb-[16px] flex w-full items-center justify-center gap-2">
                    <img src={logo} alt="ScoutPass logo" className="w-[44px]" />
                    <img src={textLogo} alt="ScoutPass text logo" className="max-w-[160px]" />
                </div>

                <h1 className="mb-2 max-w-[220px] text-[20px] font-semibold leading-snug text-white drop-shadow-sm">
                    Someone sent you a credential
                </h1>

                <button
                    onClick={handleRedirectTo}
                    className="mt-[18px] flex h-[50px] w-full items-center justify-center rounded-[20px] bg-white px-[18px] text-[15px] font-semibold text-grayscale-900 shadow-lg transition-opacity hover:opacity-90"
                >
                    Sign In to View and Claim
                </button>

                <div className="mt-[24px] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-white/80">
                    <button onClick={openLCwebsite} className="transition-colors hover:text-white">
                        Learn More
                    </button>
                    <button onClick={openToS} className="transition-colors hover:text-white">
                        Terms of Service
                    </button>
                    <button onClick={openPP} className="transition-colors hover:text-white">
                        Privacy Policy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClaimBoostLoggedOutPrompt;
