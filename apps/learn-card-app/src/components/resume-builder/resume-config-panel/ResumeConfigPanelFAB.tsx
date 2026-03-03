import React from 'react';

import { IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { pencilOutline } from 'ionicons/icons';

export const ResumeConfigPanelFAB: React.FC<{ openResumeConfigPanel: () => void }> = ({
    openResumeConfigPanel,
}) => {
    return (
        <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={openResumeConfigPanel} color="indigo-500">
                <IonIcon icon={pencilOutline} />
            </IonFabButton>
        </IonFab>
    );
};

export default ResumeConfigPanelFAB;
