import React from 'react';

import { IonIcon, IonFab, IonFabButton } from '@ionic/react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

export const ResumePreviewFAB: React.FC<{
    isPreviewing: boolean;
    setIsPreviewing: (val: boolean) => void;
}> = ({ isPreviewing, setIsPreviewing }) => {
    return (
        <IonFab slot="fixed" vertical="bottom" horizontal="end" style={{ marginRight: '72px' }}>
            <IonFabButton onClick={() => setIsPreviewing(!isPreviewing)} color="light">
                <IonIcon icon={isPreviewing ? eyeOffOutline : eyeOutline} />
            </IonFabButton>
        </IonFab>
    );
};

export default ResumePreviewFAB;
