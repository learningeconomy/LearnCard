import React from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useTheme } from '../../theme/hooks/useTheme';

const RouteTransitionLoader: React.FC = () => {
    const { theme } = useTheme();
    const color = theme.colors.defaults.loaders?.[0] ?? '#8B5CF6';

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="h-full w-full flex items-center justify-center">
                    <IonSpinner
                        name="crescent"
                        style={{ color, width: 36, height: 36 }}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default RouteTransitionLoader;
