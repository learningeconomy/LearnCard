import React, { useEffect, useState } from 'react';
import { IonCol, IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    SCOUTPASS_NETWORK_API_URL,
    useDeviceTypeByWidth,
    usePathQuery,
    BoostCategoryOptionsEnum,
    getDefaultCategoryForCredential,
} from 'learn-card-base';
import { BrandingEnum, LoginTypesEnum, SocialLoginTypes } from 'learn-card-base';
import ScoutPassLogo from '../../../assets/images/scoutpass-logo.svg';
import ScoutPassTextLogo from '../../../assets/images/scoutpass-text-logo.svg';
import WorldScoutsIcon from '../../../assets/images/world-scouts-icon.svg';
import PhoneIcon from '../../../assets/images/Phone.svg';
import EmailIcon from '../../../assets/images/Email-outline.svg';
import AppleIcon from '../../../assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';
import { openLCwebsite, openPP, openToS } from '../../../helpers/externalLinkHelpers';
import ScoutsSSOLogin from '../../../pages/login/ScoutsSSO/ScoutSSOLogin';
import EmailForm from '../../../pages/login/forms/EmailForm';
import PhoneForm from '../../../pages/login/forms/PhoneForm';
import LoginFooter from '../../../pages/login/LoginFooter';
import SocialLogins from '../../../components/social-logins/SocialLogins';
import useFirebase from '../../../hooks/useFirebase';
import { VC } from '@learncard/types';
import { getLogger } from 'learn-card-base';

const log = getLogger('claim-boost-logged-out-prompt');

const getBoostHeadline = (boost?: VC): string => {
    const boostCategory = getDefaultCategoryForCredential(boost as any);
    const boostName =
        (boost as any)?.name ??
        (boost as any)?.credentialSubject?.achievement?.name ??
        'this boost';

    switch (boostCategory) {
        case BoostCategoryOptionsEnum.globalAdminId:
        case BoostCategoryOptionsEnum.nationalNetworkAdminId:
            return `You've been invited to be an admin of ${boostName}`;
        case BoostCategoryOptionsEnum.troopLeaderId:
            return `You've been invited to be a leader of ${boostName}`;
        case BoostCategoryOptionsEnum.scoutId:
            return `You've been invited to join ${boostName}`;
        case BoostCategoryOptionsEnum.meritBadge:
            return `You've been sent a Merit Badge`;
        case BoostCategoryOptionsEnum.socialBadge:
            return `You've been sent a Social Boost`;
        default:
            return 'Someone sent you a credential';
    }
};

const getBoostActionLabel = (boost?: VC): string => {
    const boostCategory = getDefaultCategoryForCredential(boost as any);

    switch (boostCategory) {
        case BoostCategoryOptionsEnum.globalAdminId:
        case BoostCategoryOptionsEnum.nationalNetworkAdminId:
        case BoostCategoryOptionsEnum.troopLeaderId:
        case BoostCategoryOptionsEnum.scoutId:
            return 'Sign in to Accept';
        case BoostCategoryOptionsEnum.meritBadge:
        case BoostCategoryOptionsEnum.socialBadge:
            return 'Sign in to Claim';
        default:
            return 'Sign In to View and Claim';
    }
};

export const ClaimBoostLoggedOutPrompt: React.FC<{
    handleRedirectTo: () => void;
}> = ({ handleRedirectTo }) => {
    const { isDesktop } = useDeviceTypeByWidth();
    const query = usePathQuery();

    const [isLoading, setIsLoading] = useState(true);
    const [boost, setBoost] = useState<VC | undefined>(undefined);

    const boostHeadline = getBoostHeadline(boost);

    const boostUri = query.get('boostUri') || undefined;
    const challenge = query.get('challenge') || undefined;

    const getBoost = async () => {
        if (!boostUri) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);

            const result = await fetch(
                `${SCOUTPASS_NETWORK_API_URL}/storage/resolve?uri=${encodeURIComponent(boostUri)}${
                    challenge ? `&challenge=${encodeURIComponent(challenge)}` : ''
                }`
            );

            if (result.status !== 200) throw new Error('Error resolving boost');

            const boostVC: VC = await result.json();

            setBoost(boostVC);
        } catch (error: any) {
            log.error('Failed to resolve boost:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getBoost();
    }, []);

    const backgroundColor = 'var(--sp-purple-base, #622599)';
    const boostActionLabel = getBoostActionLabel(boost);

    if (isLoading) {
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
                            <IonCol className="w-full flex flex-col items-center justify-center h-full p-0 m-0 text-white">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <span className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <p className="text-sm font-medium text-white/90">
                                        Loading boost...
                                    </p>
                                </div>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonPage>
        );
    }

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
                                    logo={ScoutPassLogo}
                                    textLogo={ScoutPassTextLogo}
                                    headline={boostHeadline}
                                />
                            ) : (
                                <ClaimBoostLoggedOutPromptMobile
                                    handleRedirectTo={handleRedirectTo}
                                    logo={ScoutPassLogo}
                                    textLogo={ScoutPassTextLogo}
                                    headline={boostHeadline}
                                    actionLabel={boostActionLabel}
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
    logo: string;
    textLogo: string;
    headline: string;
}> = ({ logo, textLogo, headline }) => {
    return (
        <div className="relative grid h-full w-full grid-cols-2 overflow-hidden text-white">
            <ScoutsLoginColumn />

            <div className="flex min-h-0 min-w-0 flex-col items-center justify-center border-l border-white/15 px-[50px] py-[22px] text-center">
                <div className="mb-[16px] flex w-full items-center justify-center gap-2">
                    <img src={logo} alt="ScoutPass logo" className="w-[55px]" />
                    <img src={textLogo} alt="ScoutPass text logo" className="max-w-[200px]" />
                </div>

                <h1 className="max-w-[310px] text-[24px] font-semibold leading-snug text-white drop-shadow-sm">
                    {headline}
                </h1>
            </div>
        </div>
    );
};

const ScoutsLoginColumn: React.FC = () => {
    const flags = useFlags();
    const { googleLogin, appleLogin } = useFirebase();
    const [activeLoginType, setActiveLoginType] = useState<LoginTypesEnum>(LoginTypesEnum.email);

    const enableWorldScoutsLogin = flags?.enableWorldScoutsLogin;
    const enableSmsLogin = flags?.enableSmsLogin;

    let LoginTypeForm: React.ReactNode | null = null;

    if (activeLoginType === LoginTypesEnum.email) {
        LoginTypeForm = <EmailForm />;
    } else if (activeLoginType === LoginTypesEnum.phone) {
        LoginTypeForm = <PhoneForm />;
    } else if (activeLoginType === LoginTypesEnum.scoutsSSO) {
        LoginTypeForm = <ScoutsSSOLogin />;
    }

    const extraSocialLogins = [
        {
            id: 1,
            src: GoogleIcon,
            alt: 'google',
            onClick: googleLogin,
            type: SocialLoginTypes.google,
        },
        {
            id: 2,
            src: AppleIcon,
            alt: 'apple',
            onClick: appleLogin,
            type: SocialLoginTypes.apple,
        },
    ];

    const activeLoginTypeStyles = 'border-[#FF8DFF]';

    return (
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white text-grayscale-900">
            <div className="relative flex items-center justify-center bg-sp-purple-base login-page-header !overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                    <img src={ScoutPassLogo} alt="ScoutPass logo" className="w-[55px]" />
                    <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
                </div>
                <div className="absolute bottom-[-155px] h-[80%] w-[110%] rounded-[100%] bg-white login-page-curve" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[24px] pt-[48px] pb-[32px]">
                <div className="w-full max-w-[500px] flex flex-col items-center justify-center text-center">
                    <div className="mb-6 flex w-full items-center justify-center gap-2">
                        {enableWorldScoutsLogin && (
                            <button
                                className={`flex items-center justify-center border-solid border-2 rounded-full mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] z-[9999] ${
                                    activeLoginType === LoginTypesEnum.scoutsSSO
                                        ? activeLoginTypeStyles
                                        : 'border-gray-100'
                                }`}
                                onClick={() => setActiveLoginType(LoginTypesEnum.scoutsSSO)}
                            >
                                <img
                                    src={WorldScoutsIcon}
                                    alt="world scouts icon"
                                    className="w-[50px] h-auto rounded-full"
                                />
                            </button>
                        )}

                        <button
                            className={`flex items-center justify-center border-solid border-2 p-2 bg-[#0094F6] rounded-full mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] z-[9999] ${
                                activeLoginType === LoginTypesEnum.email
                                    ? activeLoginTypeStyles
                                    : 'border-gray-100'
                            }`}
                            onClick={() => setActiveLoginType(LoginTypesEnum.email)}
                        >
                            <img src={EmailIcon} alt="email icon" className="w-[30px] h-[30px]" />
                        </button>

                        {enableSmsLogin && (
                            <button
                                className={`flex items-center justify-center border-solid border-2 p-2 bg-[#0094F6] rounded-full mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] z-[9999] ${
                                    activeLoginType === LoginTypesEnum.phone
                                        ? activeLoginTypeStyles
                                        : 'border-gray-100'
                                }`}
                                onClick={() => setActiveLoginType(LoginTypesEnum.phone)}
                            >
                                <img
                                    src={PhoneIcon}
                                    alt="phone icon"
                                    className="w-[30px] h-[30px]"
                                />
                            </button>
                        )}
                    </div>

                    <IonRow className="w-full max-w-[500px] ion-padding-horizontal flex items-center justify-center">
                        {LoginTypeForm}
                    </IonRow>

                    <div className="w-full flex items-center justify-center">
                        <SocialLogins
                            branding={BrandingEnum.scoutPass}
                            activeLoginType={activeLoginType}
                            setActiveLoginType={setActiveLoginType}
                            extraSocialLogins={extraSocialLogins}
                        />
                    </div>
                </div>

                <div className="w-full max-w-[500px] flex justify-center">
                    <LoginFooter
                        className="w-full text-center"
                        wrapperClassName="flex flex-col items-center"
                    />
                </div>
            </div>
        </div>
    );
};

const ClaimBoostLoggedOutPromptMobile: React.FC<{
    handleRedirectTo: () => void;
    logo: string;
    textLogo: string;
    headline: string;
    actionLabel: string;
}> = ({ handleRedirectTo, logo, textLogo, headline, actionLabel }) => {
    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden text-white">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[14px] py-[22px] text-center">
                <div className="mb-[16px] flex w-full items-center justify-center gap-2">
                    <img src={logo} alt="ScoutPass logo" className="w-[44px]" />
                    <img src={textLogo} alt="ScoutPass text logo" className="max-w-[160px]" />
                </div>

                <h1 className="mb-2 max-w-[310px] text-[20px] font-semibold leading-snug text-white drop-shadow-sm">
                    {headline}
                </h1>

                <button
                    onClick={handleRedirectTo}
                    className="mt-[18px] flex h-[50px] w-full max-w-[360px] px-[30px] items-center justify-center rounded-[20px] bg-white text-[15px] font-semibold text-grayscale-900 shadow-lg transition-opacity hover:opacity-90"
                >
                    {actionLabel}
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
