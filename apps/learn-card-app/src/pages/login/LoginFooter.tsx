import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonCol } from '@ionic/react';
import SeedPhraseModal from './SeedPhraseModal';

import {
    openToS,
    openPP,
    openLCwebsite,
} from '../../helpers/externalLinkHelpers';
import { useTenantLinks } from 'learn-card-base/config/TenantConfigProvider';
import { Capacitor } from '@capacitor/core';
import { ModalTypes, useModal } from 'learn-card-base';

const LoginFooter: React.FC<{ hideSelfCustodialLogin?: boolean }> = ({
    hideSelfCustodialLogin = false,
}) => {
    const history = useHistory();
    const links = useTenantLinks();

    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.FullScreen,
    });
    const openSeedPhraseModal = () => {
        newModal(<SeedPhraseModal />, {
            sectionClassName: '!max-w-[500px]',
            hideButton: true,
        });
    };

    return (
        <div className="w-full flex items-center justify-center pb-[20px]">
            <div className="w-full flex items-center justify-center flex-col max-w-[400px]">
                <IonCol
                    size="12"
                    className="w-full flex items-center justify-center p-0 mt-2 gap-[15px]"
                >
                    <a
                        href={links.termsOfServiceUrl}
                        onClick={e => {
                            if (Capacitor?.isNativePlatform()) {
                                e.preventDefault();
                                openToS();
                            }
                        }}
                        className="flex items-center justify-center text-white/80 font-bold text-xs hover:underline"
                    >
                        Terms
                    </a>
                    <a
                        href={links.privacyPolicyUrl}
                        onClick={e => {
                            if (Capacitor?.isNativePlatform()) {
                                e.preventDefault();
                                openPP();
                            }
                        }}
                        className="flex items-center text-white/80 font-bold text-xs hover:underline"
                    >
                        Privacy
                    </a>
                    <a
                        href={links.websiteUrl}
                        onClick={e => {
                            if (Capacitor?.isNativePlatform()) {
                                e.preventDefault();
                                openLCwebsite();
                            }
                        }}
                        className="flex items-center text-white/80 font-bold text-xs hover:underline min-w-[69px]"
                    >
                        Learn More
                    </a>
                    <button
                        onClick={e => {
                            e.preventDefault();
                            history.push('/ai/pathways/discovery');
                        }}
                        className="flex items-center text-white/80 font-bold text-xs hover:underline"
                    >
                        Explore Pathways
                    </button>
                </IonCol>
                {!hideSelfCustodialLogin && (
                    <IonCol
                        size="12"
                        className="w-full flex flex-col items-center justify-center text-center mt-[20px] space-y-[4px] "
                    >
                        <p className="text-white/80 font-medium text-base">
                            Self-custodial login.
                        </p>
                        <p className="text-white/80 text-sm">
                            Have your own{' '}
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openSeedPhraseModal();
                                }}
                                className="font-bold underline text-sm text-white/80"
                            >
                                seed phrase
                            </button>
                            ?
                        </p>
                    </IonCol>
                )}
            </div>
        </div>
    );
};

export default LoginFooter;
