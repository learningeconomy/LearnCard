import React from 'react';

import { AppFab, AppFabButton } from 'learn-card-base/ui/widgets';
import { AppIcon } from 'learn-card-base/ui/icon';
import { eyeOutline, eyeOffOutline } from 'learn-card-base/icons/ionicons';

export const ResumePreviewFAB: React.FC<{
    isPreviewing: boolean;
    setIsPreviewing: (val: boolean) => void;
}> = ({ isPreviewing, setIsPreviewing }) => {
    return (
        <AppFab slot="fixed" vertical="bottom" horizontal="end" style={{ marginRight: '72px' }}>
            <AppFabButton onClick={() => setIsPreviewing(!isPreviewing)} color="light">
                <AppIcon icon={isPreviewing ? eyeOffOutline : eyeOutline} />
            </AppFabButton>
        </AppFab>
    );
};

export default ResumePreviewFAB;
