import React from 'react';
import { useHistory } from 'react-router-dom';

import { useIsLoggedIn } from 'learn-card-base';

import { openToS, openPP } from '../../helpers/externalLinkHelpers';

const SharedBoostPageFooter: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();

    if (isLoggedIn) return <></>;

    return (
        <>
            <SharedBoostPageFooterMobile />
            <footer className="w-full ion-no-border share-page-footer ion-padding">
                <div className="w-full flex items-center justify-between ion-padding">
                    <div className="flex">
                        <button
                            onClick={openToS}
                            className="flex items-center justify-center text-white font-bold text-xs mr-2"
                        >
                            Terms of Service •
                        </button>
                        <button
                            onClick={openPP}
                            className="flex items-center text-white font-bold text-xs"
                        >
                            Privacy Policy
                        </button>
                    </div>
                    <div>
                        <p className="flex text-white text-xs">
                            POWERED BY CONSENT FLOW • You own your own data • All connections
                            are&nbsp;
                            <u>encrypted</u>
                        </p>
                    </div>
                    <div className="w-[214px]" />
                </div>
            </footer>
        </>
    );
};

export const SharedBoostPageFooterMobile: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();

    const history = useHistory();

    const redirectHome = () => {
        history.push('/');
    };

    if (isLoggedIn) return <></>;

    return (
        <footer className="bg-white w-full ion-no-border share-page-footer-mobile ion-padding">
            <div className="w-full flex flex-col items-center justify-between ion-padding">
                <button
                    type="button"
                    className="bg-emerald-600 text-white rounded-full shadow-bottom normal font-poppins text-xl tracking-wide px-4 py-2 mb-2"
                    onClick={redirectHome}
                >
                    Get LearnCard
                </button>
                <div className="flex mb-2 mt-2">
                    <button
                        onClick={openToS}
                        className="flex items-center justify-center text-emerald-600 font-bold text-xs mr-2"
                    >
                        Terms of Service <span className="text-grayscale-900">&nbsp;•</span>
                    </button>
                    <button
                        onClick={openPP}
                        className="flex items-center text-emerald-600 font-bold text-xs"
                    >
                        Privacy Policy
                    </button>
                </div>
                <div>
                    <p className="text-grayscale-900 text-xs text-center">
                        POWERED BY CONSENT FLOW • You own your own <br /> data • All connections
                        are&nbsp;
                        <u>encrypted</u>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default SharedBoostPageFooter;
