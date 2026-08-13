import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useStore } from '@nanostores/react';

import { lastAiError } from 'learn-card-base/stores/nanoStores/chatStore';
import type { AiErrorCode } from 'learn-card-base/helpers/aiErrors';

import { getAiErrorCopy } from '../../helpers/aiError.helpers';

export const AiSessionErrorHandler: React.FC = () => {
    const aiError = useStore(lastAiError);
    const mountedAtRef = useRef(Date.now());
    const [visibleError, setVisibleError] = useState<{ at: number; code: AiErrorCode } | null>(
        null
    );

    useEffect(() => {
        if (!aiError) {
            setVisibleError(null);
            return;
        }

        if (aiError.event !== 'ai_error' && aiError.presented) {
            setVisibleError(null);
            return;
        }

        if (aiError.at < mountedAtRef.current || aiError.at === visibleError?.at) return;

        setVisibleError({
            at: aiError.at,
            code: aiError.event === 'ai_error' ? aiError.code : 'ai_unknown_error',
        });
    }, [aiError, visibleError?.at]);

    if (!visibleError) return null;

    const { title, body } = getAiErrorCopy(visibleError.code);

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

export default AiSessionErrorHandler;
