import React from 'react';

import { IonCol, IonRouterLink } from '@ionic/react';
import Web3AuthLogo from '../../assets/images/web3auth-logo.svg';
import ExternalLinkIcon from 'learn-card-base/svgs/ExternalLink';
import { openToS, openPP, openContactLink, openLCwebsite } from '../../helpers/externalLinkHelpers';

interface LoginFooterProps {
    className?: string;
    wrapperClassName?: string;
}

const LoginFooter: React.FC<LoginFooterProps> = ({
    className = 'login-footer-container',
    wrapperClassName = 'login-footer-wrap',
}) => {
    return (
        <div className={`${className}`}>
            <div className={`ion-padding pl-6 w-full ${wrapperClassName}`}>
                <IonCol size="12" className="login-footer-title-wrap">
                    <p className="text-grayscale-600 font-medium text-base">
                        Self-custodial login.
                    </p>
                </IonCol>
                <div className="bg-grayscale-100 w-full h-[2px]" />
                <button
                    onClick={openLCwebsite}
                    className="flex items-end justify-center text-indigo-500 font-bold text-sm mr-2 mt-2"
                >
                    Learn More about ScoutPass{' '}
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
                        Terms of Service
                    </button>
                    <button
                        onClick={openPP}
                        className="flex items-center text-indigo-500 font-bold text-xs mr-2 mt-2"
                    >
                        Privacy Policy
                    </button>
                    <button
                        onClick={openContactLink}
                        className="flex items-center text-indigo-500 font-bold text-xs mr-1 mt-2"
                    >
                        Contact
                    </button>
                </IonCol>
            </div>
        </div>
    );
};

export default LoginFooter;
