import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';

import { lastAiError } from 'learn-card-base/stores/nanoStores/chatStore';
import { showErrorModal } from 'learn-card-base/stores/nanoStores/ErrorModalStore';

import { AiSessionMode } from './newAiSession.helpers';

export const AiInsightsErrorHandler: React.FC<{
    active: boolean;
    mode: AiSessionMode;
}> = ({ active, mode }) => {
    const aiError = useStore(lastAiError);
    const activeSinceRef = useRef<number | null>(null);
    const handledErrorAtRef = useRef<number | null>(null);

    useEffect(() => {
        if (active && mode === AiSessionMode.insights) {
            activeSinceRef.current ??= Date.now();
            return;
        }

        activeSinceRef.current = null;
        handledErrorAtRef.current = null;
    }, [active, mode]);

    useEffect(() => {
        const activeSince = activeSinceRef.current;

        if (
            !active ||
            mode !== AiSessionMode.insights ||
            !aiError ||
            activeSince === null ||
            aiError.at < activeSince ||
            aiError.at === handledErrorAtRef.current
        ) {
            return;
        }

        handledErrorAtRef.current = aiError.at;
        showErrorModal('Something went wrong', 'Please try your request again.');
    }, [active, aiError, mode]);

    return null;
};

export default AiInsightsErrorHandler;
