import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash';

import { IonContent, IonPage, IonRow } from '@ionic/react';

import ScoutPassTextLogo from '../../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../../assets/images/scoutpass-logo.svg';

const messages = _.shuffle([
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
]);

export const LoginLoadingPage: React.FC = () => {
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
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
                        <img src={ScoutPassLogo} alt="ScoutPass logo" className="w-[55px]" />
                        <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
                        <div className="w-full flex items-center justify-center text-center text-[18px] px-6 mt-[20px]">
                        <Typewriter
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
