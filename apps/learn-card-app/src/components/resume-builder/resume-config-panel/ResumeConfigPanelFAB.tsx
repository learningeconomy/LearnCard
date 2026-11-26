import React from 'react';

import { IonFab, IonFabButton } from '@ionic/react';
import { AppIcon } from '../../icon';
import { pencilOutline } from 'ionicons/icons';

export const ResumeConfigPanelFAB: React.FC<{ openResumeConfigPanel: () => void }> = ({
    openResumeConfigPanel,
}) => {
    return (
        <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={openResumeConfigPanel} color="indigo-500">
                <AppIcon icon={pencilOutline} />
            </IonFabButton>
        </IonFab>
    );
};

export default ResumeConfigPanelFAB;
