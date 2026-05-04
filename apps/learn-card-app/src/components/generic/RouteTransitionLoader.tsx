import React from 'react';
import { IonSpinner } from '@ionic/react';

import { useTheme } from '../../theme/hooks/useTheme';

/**
 * Inline route-transition placeholder. Intentionally NOT wrapped in
 * IonPage/IonContent — those would trigger Ionic's page-transition animation
 * twice (once for this loader, once for the real destination page) and cause a
 * visible white flash between the two transitions. A plain absolutely-
 * positioned div paints instantly with the tenant background color and is
 * replaced cleanly when the destination chunk resolves.
 */
const RouteTransitionLoader: React.FC = () => {
    const { theme } = useTheme();
    const spinnerColor = theme.colors.defaults.loaders?.[0] ?? '#8B5CF6';
    const bgColor =
        theme.colors.defaults.passportBgColor ?? 'var(--ion-background-color, #ffffff)';

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[1000]"
            style={{ backgroundColor: bgColor }}
        >
            <IonSpinner
                name="crescent"
                style={{ color: spinnerColor, width: 36, height: 36 }}
            />
        </div>
    );
};

export default RouteTransitionLoader;
