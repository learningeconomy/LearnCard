import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useStore } from '@nanostores/react';

import { lastAiError } from 'learn-card-base/stores/nanoStores/chatStore';

import { AiSessionMode } from './newAiSession.helpers';

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

    return (
        <div className="absolute inset-x-4 top-[calc(80px+var(--ion-safe-area-top,0px))] z-[100]">
            <div
                role="alert"
                className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 shadow-soft-bottom"
            >
                <IonIcon
                    icon={alertCircleOutline}
                    className="text-red-400 text-lg mt-0.5 shrink-0"
                />
                <div>
                    <p className="text-sm font-semibold text-red-700">Something went wrong</p>
                    <p className="text-sm text-red-700 leading-relaxed">
                        AI chat is temporarily unavailable. Please try again later.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiInsightsErrorHandler;
