import React from 'react';
import { InAppMessageHost } from 'learn-card-base';
import { useAnalytics } from './context';
import { AnalyticsEvents } from './events';

/** Mount below AnalyticsContextProvider so telemetry respects the app's consent settings. */
export const InAppMessagesAnalyticsHost: React.FC = () => {
    const { track } = useAnalytics();
    return (
        <InAppMessageHost
            onEvent={event => {
                if (event.source === 'override') return;
                const names = {
                    shown: AnalyticsEvents.IN_APP_MESSAGE_SHOWN,
                    action: AnalyticsEvents.IN_APP_MESSAGE_ACTION,
                    dismissed: AnalyticsEvents.IN_APP_MESSAGE_DISMISSED,
                };
                track(names[event.type], {
                    messageId: event.messageId,
                    presentation: event.presentation,
                    source: event.source,
                    ...(event.actionIndex !== undefined ? { actionIndex: event.actionIndex } : {}),
                    ...(event.actionSource !== undefined
                        ? { actionSource: event.actionSource }
                        : {}),
                    ...(event.actionType !== undefined ? { actionType: event.actionType } : {}),
                    ...(event.stepIndex !== undefined ? { stepIndex: event.stepIndex } : {}),
                });
            }}
        />
    );
};
