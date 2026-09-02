import React from 'react';

import { IonCol, IonRouterLink } from '@ionic/react';
import Web3AuthLogo from '../../assets/images/web3auth-logo.svg';
import ExternalLinkIcon from 'learn-card-base/svgs/ExternalLink';
import * as m from '../../paraglide/messages.js';
import { openToS, openPP, openContactLink, openLCwebsite } from '../../helpers/externalLinkHelpers';

interface LoginFooterProps {
    className?: string;
    wrapperClassName?: string;
    hideSelfCustodialLogin?: boolean;
}

const LoginFooter: React.FC<LoginFooterProps> = ({
    className = 'login-footer-container',
    wrapperClassName = 'login-footer-wrap',
    hideSelfCustodialLogin = false,
}) => {
    return (
        <div className={`${className}`}>
            <div className={`ion-padding pl-6 !pt-1 w-full ${wrapperClassName}`}>
                {!hideSelfCustodialLogin && (
                    <IonCol size="12" className="login-footer-title-wrap">
                        <p className="text-grayscale-600 font-medium text-base">
                            {m['login.selfCustodial']()}
                        </p>
                    </IonCol>
                )}
                <div className="bg-grayscale-100 w-full h-[2px]" />
                <button
                    onClick={openLCwebsite}
                    className="flex items-end justify-center text-indigo-500 font-bold text-sm mr-2 mt-2"
                >
                    {m['login.learnMoreScoutPass']()}{' '}
                    <ExternalLinkIcon className="ml-[6px] w-[20px]" color="#6366f1" />
                </button>
                <IonCol
                    size="12"
                    className="w-full flex items-center justify-center p-0 mt-2 login-footer-links-wrap"
                >
                    <button
                        onClick={openToS}
                        className="flex items-center justify-center text-indigo-500 font-bold text-xs mr-2 mt-2"
                    >
                        {m['login.termsOfService']()}
                    </button>
                    <button
                        onClick={openPP}
                        className="flex items-center text-indigo-500 font-bold text-xs mr-2 mt-2"
                    >
                        {m['login.privacyPolicy']()}
                    </button>
                    <button
                        onClick={openContactLink}
                        className="flex items-center text-indigo-500 font-bold text-xs mr-1 mt-2"
                    >
                        {m['login.contact']()}
                    </button>
                </IonCol>
            </div>
        </div>
    );
};

export default LoginFooter;
