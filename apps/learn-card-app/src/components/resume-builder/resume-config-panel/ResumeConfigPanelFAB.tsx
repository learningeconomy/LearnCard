import React from 'react';

import { AppFab, AppFabButton } from 'learn-card-base/ui/widgets';
import { AppIcon } from 'learn-card-base/ui/icon';
import { pencilOutline } from 'learn-card-base/icons/ionicons';

export const ResumeConfigPanelFAB: React.FC<{ openResumeConfigPanel: () => void }> = ({
    openResumeConfigPanel,
}) => {
    return (
        <AppFab slot="fixed" vertical="bottom" horizontal="end">
            <AppFabButton onClick={openResumeConfigPanel} color="indigo-500">
                <AppIcon icon={pencilOutline} />
            </AppFabButton>
        </AppFab>
    );
};

export default ResumeConfigPanelFAB;
