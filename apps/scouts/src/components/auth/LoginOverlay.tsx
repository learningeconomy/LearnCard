import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash';

import { IonRow } from '@ionic/react';

import ScoutPassTextLogo from '../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../assets/images/scoutpass-logo.svg';
import * as m from '../../paraglide/messages.js';
import { useLocale } from '../../i18n';

export const LoginOverlay: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const locale = useLocale();
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [typewriterKey, setTypewriterKey] = useState(0);
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
        [typewriterKey, locale]
    );

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsTransitioning(false);
            // Reset typewriter when opening
            setTypewriterKey(prev => prev + 1);
        } else if (shouldRender) {
            // Start exit transition
            setIsTransitioning(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsTransitioning(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
        >
            <IonRow
                className="h-full w-full flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: '#622599' }}
            >
                <div className="w-full flex items-center justify-center flex-col absolute top-[40%] left-[50%] translate-x-[-50%]">
                    <img src={ScoutPassLogo} alt="" className="w-[55px]" />
                    <img src={ScoutPassTextLogo} alt="" className="mt-4" />
                    <div className="w-full flex items-center justify-center text-center text-[18px] px-6 mt-[20px]">
                        {!isTransitioning && (
                            <Typewriter
                                key={`${locale}-${typewriterKey}`}
                                options={{
                                    strings: messages,
                                    autoStart: true,
                                    loop: true,
                                    delay: 70,
                                    deleteSpeed: 50,
                                }}
                            />
                        )}
                    </div>
                </div>
            </IonRow>
        </div>
    );
};

export default LoginOverlay;
