import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash';

import { IonContent, IonPage, IonRow } from '@ionic/react';

import LearnCardTextLogo from '../../../assets/images/learncard-text-logo.svg';

export const LogoutLoadingPage: React.FC = () => {
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const colors = useMemo(
        () => [
            '#8B5CF6', // violet 500
            '#06B6D4', // cyan 500
            '#059669', // emerald 600
            '#3B82F6', // blue 500
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
                    <img
                        src={LearnCardTextLogo}
                        alt="LearnCard text logo"
                        className="mb-8 absolute top-[48%] left-[50%] translate-x-[-50%]"
                    />
                    <div className="w-full flex items-center justify-center text-center px-6 absolute top-[52%] left-[50%] translate-x-[-50%]">
                        <Typewriter
                            options={{
                                strings: ['Logging out...'],
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

export default LogoutLoadingPage;
