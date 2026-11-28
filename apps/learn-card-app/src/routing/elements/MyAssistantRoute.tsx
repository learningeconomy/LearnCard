import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { environment } from '../../config/environment';
import MyAssistantPage from '../../pages/my-assistant/MyAssistantPage';

/** `/ai/assistant`: only routed in dev or with the enableLearnCardAssistant flag. */
export const MyAssistantRoute: React.FC = () => {
    const flags = useFlags();
    const enabled = environment.DEV || Boolean(flags.enableLearnCardAssistant);
    return enabled ? <MyAssistantPage /> : null;
};
