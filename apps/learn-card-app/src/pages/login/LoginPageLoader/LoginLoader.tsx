import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import { useTranslation } from 'react-i18next';
import _ from 'lodash-es';

import { IonContent, IonPage, IonRow } from '@ionic/react';
import { useTenantBrandingAssets } from '../../../config/brandingAssets';

import { useTheme } from '../../../theme/hooks/useTheme';

export const LoginLoadingPage: React.FC = () => {
    const { t } = useTranslation();
    const messages = useMemo(() => _.shuffle([
        t('login.loader.messages.0', 'Credentials coming right up!'),
        t('login.loader.messages.1', 'Waving a magic credential wand!'),
        t('login.loader.messages.2', 'Fetching your badge brilliance!'),
        t('login.loader.messages.3', 'Unlocking your secret stardust!'),
        t('login.loader.messages.4', 'Brewing your digital delights!'),
        t('login.loader.messages.5', 'Summoning your credential superpowers!'),
        t('login.loader.messages.6', 'Your digital treasure is near!'),
        t('login.loader.messages.7', 'Preparing your badge bonanza!'),
        t('login.loader.messages.8', 'Credentials loading with pizzazz!'),
        t('login.loader.messages.9', 'Get ready for credential spark!'),
    ]), [t]);
    const { textLogo } = useTenantBrandingAssets();
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
                    <div className="flex flex-col items-center justify-center">
                    <img
                        src={textLogo}
                        alt="Logo"
                        className="mb-8 max-w-[300px] max-h-[80px] object-contain"
                    />
                    <div className="w-full flex items-center justify-center text-center px-6">
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
