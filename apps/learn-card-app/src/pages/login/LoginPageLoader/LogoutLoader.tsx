import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from 'typewriter-effect';
import _ from 'lodash-es';

import { IonContent, IonPage, IonRow } from '@ionic/react';

import { useTenantBrandingAssets } from '../../../config/brandingAssets';
import { useTheme } from '../../../theme/hooks/useTheme';

export const LogoutLoadingPage: React.FC = () => {
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
            <IonContent fullscreen className="flex items-center justify-center" style={{ '--background': colors[currentColorIndex] } as React.CSSProperties}>
                <IonRow
                    className="h-full w-full transition-colors duration-1000 ease-in-out flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: colors[currentColorIndex] }}
                >
                    <img
                        src={textLogo}
                        alt="Logo"
                        className="mb-8 absolute top-[48%] left-[50%] translate-x-[-50%] max-w-[300px] max-h-[80px] object-contain"
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
