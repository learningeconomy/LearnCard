import React from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useTheme } from '../../theme/hooks/useTheme';

const RouteTransitionLoader: React.FC = () => {
    const { theme } = useTheme();
    const spinnerColor = theme.colors.defaults.loaders?.[0] ?? '#8B5CF6';
    const bgColor = theme.colors.defaults.passportBgColor;

    return (
        <IonPage style={bgColor ? { backgroundColor: bgColor } : undefined}>
            <IonContent
                fullscreen
                style={
                    bgColor
                        ? ({ '--background': bgColor } as React.CSSProperties)
                        : undefined
                }
            >
                <div className="h-full w-full flex items-center justify-center">
                    <IonSpinner
                        name="crescent"
                        style={{ color: spinnerColor, width: 36, height: 36 }}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default RouteTransitionLoader;
