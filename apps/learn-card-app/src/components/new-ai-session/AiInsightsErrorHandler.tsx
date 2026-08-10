import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useStore } from '@nanostores/react';

import { lastAiError } from 'learn-card-base/stores/nanoStores/chatStore';

import { AiSessionMode } from './newAiSession.helpers';
import { getAiErrorCopy } from '../../helpers/aiError.helpers';

export const AiInsightsErrorHandler: React.FC<{
    active: boolean;
    mode: AiSessionMode;
}> = ({ active, mode }) => {
    const aiError = useStore(lastAiError);
    const activeSinceRef = useRef<number | null>(null);
    const [visibleErrorAt, setVisibleErrorAt] = useState<number | null>(null);

    useEffect(() => {
        if (active && mode === AiSessionMode.insights) {
            activeSinceRef.current ??= Date.now();
            return;
        }

        activeSinceRef.current = null;
        setVisibleErrorAt(null);
    }, [active, mode]);

    useEffect(() => {
        const activeSince = activeSinceRef.current;

        if (
            !active ||
            mode !== AiSessionMode.insights ||
            !aiError ||
            activeSince === null ||
            aiError.at < activeSince ||
            aiError.at === visibleErrorAt
        ) {
            return;
        }

        setVisibleErrorAt(aiError.at);
    }, [active, aiError, mode, visibleErrorAt]);

    if (visibleErrorAt === null) return null;

    const { title, body } = getAiErrorCopy(
        aiError?.event === 'ai_error' ? aiError.code : 'ai_unknown_error'
    );

    return (
        <div className="absolute inset-x-4 top-[calc(80px+env(safe-area-inset-top))] z-[100]">
            <div
                role="alert"
                className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 shadow-soft-bottom"
            >
                <IonIcon
                    icon={alertCircleOutline}
                    className="text-red-400 text-lg mt-0.5 shrink-0"
                />
                <div>
                    <p className="text-sm font-semibold text-red-700">{title}</p>
                    <p className="text-sm text-red-700 leading-relaxed">{body}</p>
                </div>
            </div>
        </div>
    );
};

export default AiInsightsErrorHandler;
