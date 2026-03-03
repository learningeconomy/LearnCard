import React, { useState, useEffect, useMemo, useRef } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash';

import { IonRow } from '@ionic/react';

import ScoutPassTextLogo from '../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../assets/images/scoutpass-logo.svg';

const messagesSource = [
    'Badges coming right up!',
    'Waving a magic boost wand!',
    'Fetching your badge brilliance!',
    'Unlocking your secret stardust!',
    'Brewing your digital delights!',
    'Summoning your boost superpowers!',
    'Your digital treasure is near!',
    'Preparing your badge bonanza!',
    'Badges loading with pizzazz!',
    'Get ready for boost spark!',
];

export const LoginOverlay: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [typewriterKey, setTypewriterKey] = useState(0);
    const messages = useMemo(() => _.shuffle(messagesSource), [typewriterKey]);

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
                    <img src={ScoutPassLogo} alt="ScoutPass logo" className="w-[55px]" />
                    <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
                    <div className="w-full flex items-center justify-center text-center text-[18px] px-6 mt-[20px]">
                        {!isTransitioning && (
                            <Typewriter
                                key={typewriterKey}
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
