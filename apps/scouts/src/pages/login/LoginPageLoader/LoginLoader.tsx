import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash';

import { IonContent, IonPage, IonRow } from '@ionic/react';

import ScoutPassTextLogo from '../../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../../assets/images/scoutpass-logo.svg';
import * as m from '../../../paraglide/messages.js';
import { useLocale } from '../../../i18n';

export const LoginLoadingPage: React.FC = () => {
    const locale = useLocale();
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const messages = useMemo(
        () =>
            _.shuffle([
                m['login.loadingMessages.badgesComing'](),
                m['login.loadingMessages.magicBoostWand'](),
                m['login.loadingMessages.badgeBrilliance'](),
                m['login.loadingMessages.secretStardust'](),
                m['login.loadingMessages.digitalDelights'](),
                m['login.loadingMessages.boostSuperpowers'](),
                m['login.loadingMessages.digitalTreasure'](),
                m['login.loadingMessages.badgeBonanza'](),
                m['login.loadingMessages.badgesPizzazz'](),
                m['login.loadingMessages.boostSpark'](),
            ]),
        [locale]
    );
    const colors = useMemo(
        () => [
            '#622599', // scouts purple
            '#0094B4', // scouts ocean blue
            '#248737', // scouts forest green
            '#FFAE80', // scouts ember orange
        ],
        []
    );
    const interval = 5200;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentColorIndex(prevIndex => (prevIndex + 1) % colors.length);
        }, interval);

        return () => clearInterval(timer);
    }, [colors, interval]);

    return (
        <IonPage>
            <IonContent fullscreen color="emerald-700" className="flex items-center justify-center">
                <IonRow
                    className="h-full w-full transition-colors duration-1000 ease-in-out flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: colors[currentColorIndex] }}
                >
                    <div className="w-full flex items-center justify-center flex-col absolute top-[40%] left-[50%] translate-x-[-50%]">
                        <img src={ScoutPassLogo} alt="" className="w-[55px]" />
                        <img src={ScoutPassTextLogo} alt="" className="mt-4" />
                        <div className="w-full flex items-center justify-center text-center text-[18px] px-6 mt-[20px]">
                            <Typewriter
                                key={locale}
                                options={{
                                    strings: messages,
                                    autoStart: true,
                                    loop: true,
                                    delay: 70,
                                    deleteSpeed: 50,
                                }}
                            />
                        </div>
                    </div>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default LoginLoadingPage;
