import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash-es';

import { IonContent, IonPage, IonRow } from '@ionic/react';
import LearnCardTextLogo from '../../../assets/images/learncard-text-logo.svg';

import { useTheme } from '../../../theme/hooks/useTheme';

const messages = _.shuffle([
    'Credentials coming right up!',
    'Waving a magic credential wand!',
    'Fetching your badge brilliance!',
    'Unlocking your secret stardust!',
    'Brewing your digital delights!',
    'Summoning your credential superpowers!',
    'Your digital treasure is near!',
    'Preparing your badge bonanza!',
    'Credentials loading with pizzazz!',
    'Get ready for credential spark!',
]);

export const LoginLoadingPage: React.FC = () => {
    const { theme } = useTheme();
    const { loaders } = theme.colors.defaults;
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const colors = useMemo(() => [...loaders], [loaders]);
    const interval = 5200;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentColorIndex(prevIndex => (prevIndex + 1) % colors.length);
        }, interval);

        return () => clearInterval(timer);
    }, [colors, interval]);

    return (
        <IonPage>
            <IonContent fullscreen className="flex items-center justify-center">
                <IonRow
                    className="h-full w-full transition-colors duration-1000 ease-in-out flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: colors[currentColorIndex] }}
                >
                    <img
                        src={LearnCardTextLogo}
                        alt="LearnCard text logo"
                        className="mb-8 absolute top-[48%] left-[50%] translate-x-[-50%]"
                    />
                    <div className="w-full flex items-center justify-center text-center px-6 absolute top-[52%] left-[50%] translate-x-[-50%]">
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
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default LoginLoadingPage;
