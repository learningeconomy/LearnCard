import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
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
    const { t } = useTranslation();
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
                        {t('login.footer.terms', 'Terms')}
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
                        {t('login.footer.privacy', 'Privacy')}
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
                        {t('login.footer.learnMore', 'Learn More')}
                    </a>
                    <button
                        onClick={e => {
                            e.preventDefault();
                            history.push('/ai/pathways/discovery');
                        }}
                        className="flex items-center text-white/80 font-bold text-xs hover:underline"
                    >
                        {t('login.footer.explorePathways', 'Explore Pathways')}
                    </button>
                </IonCol>
                {!hideSelfCustodialLogin && (
                    <IonCol
                        size="12"
                        className="w-full flex flex-col items-center justify-center text-center mt-[20px] space-y-[4px] "
                    >
                        <p className="text-white/80 font-medium text-base">
                            {t('login.footer.selfCustodialLogin', 'Self-custodial login.')}
                        </p>
                        <p className="text-white/80 text-sm">
                            <Trans
                                i18nKey="login.footer.haveSeedPhrase"
                                defaults="Have your own <0>seed phrase</0>?"
                                components={[
                                    <button
                                        key="s"
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openSeedPhraseModal();
                                        }}
                                        className="font-bold underline text-sm text-white/80"
                                    />,
                                ]}
                            />
                        </p>
                    </IonCol>
                )}
            </div>
        </div>
    );
};

export default LoginFooter;
