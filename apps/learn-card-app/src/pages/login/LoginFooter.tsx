import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonCol } from '@ionic/react';
import SeedPhraseModal from './SeedPhraseModal';

import {
    openToS,
    openPP,
    openLCwebsite,
    TOS_LINK,
    PP_LINK,
    LEARNCARD_WEBSITE,
} from '../../helpers/externalLinkHelpers';
import { Capacitor } from '@capacitor/core';
import { ModalTypes, useModal } from 'learn-card-base';

const LoginFooter: React.FC<{ hideSelfCustodialLogin?: boolean }> = ({
    hideSelfCustodialLogin = false,
}) => {
    const history = useHistory();
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
        <div className="w-full flex items-center justify-center bg-emerald-700 pb-[20px]">
            <div className="w-full flex items-center justify-center flex-col max-w-[400px]">
                <IonCol
                    size="12"
                    className="w-full flex items-center justify-center p-0 mt-2 gap-[15px]"
                >
                    <a
                        href={TOS_LINK}
                        onClick={e => {
                            if (Capacitor?.isNativePlatform()) {
                                e.preventDefault();
                                openToS();
                            }
                        }}
                        className="flex items-center justify-center text-emerald-100 font-bold text-xs hover:underline"
                    >
                        Terms
                    </a>
                    <a
                        href={PP_LINK}
                        onClick={e => {
                            if (Capacitor?.isNativePlatform()) {
                                e.preventDefault();
                                openPP();
                            }
                        }}
                        className="flex items-center text-emerald-100 font-bold text-xs hover:underline"
                    >
                        Privacy
                    </a>
                    <a
                        href={LEARNCARD_WEBSITE}
                        onClick={e => {
                            if (Capacitor?.isNativePlatform()) {
                                e.preventDefault();
                                openLCwebsite();
                            }
                        }}
                        className="flex items-center text-emerald-100 font-bold text-xs hover:underline"
                    >
                        Learn More
                    </a>
                    <button
                        onClick={e => {
                            e.preventDefault();
                            history.push('/ai-pathways');
                        }}
                        className="flex items-center text-emerald-100 font-bold text-xs hover:underline"
                    >
                        Explore Pathways
                    </button>
                </IonCol>
                {!hideSelfCustodialLogin && (
                    <IonCol
                        size="12"
                        className="w-full flex flex-col items-center justify-center text-center mt-[20px] space-y-[4px] "
                    >
                        <p className="text-emerald-100 font-medium text-base">
                            Self-custodial login.
                        </p>
                        <p className="text-emerald-100 text-sm">
                            Have your own{' '}
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openSeedPhraseModal();
                                }}
                                className="font-bold underline text-sm text-emerald-100"
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
