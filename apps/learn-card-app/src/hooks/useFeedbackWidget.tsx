import type { RefObject } from 'react';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { getClient } from '@sentry/react';

interface Props {
    buttonRef?: RefObject<HTMLButtonElement> | RefObject<HTMLAnchorElement>;
    messagePlaceholder?: string;
}

export default function useFeedbackWidget({ buttonRef, messagePlaceholder }: Props) {
    const feedback = Sentry.getFeedback();
    const isSentryEnabled = SENTRY_ENV && SENTRY_ENV !== 'development';

    useEffect(() => {
        if (!feedback || !isSentryEnabled) {
            return undefined;
        }

        const options = {
            colorScheme: 'light' as const,
            buttonLabel: 'Give Feedback',
            submitButtonLabel: 'Send Feedback',
            messagePlaceholder: messagePlaceholder ?? 'Tell us something or report an issue',
            formTitle: 'Give Feedback',
        };

        if (buttonRef) {
            if (buttonRef.current) {
                const widget = feedback.attachTo(buttonRef.current, options);
                return () => {
                    feedback.remove();
                };
            }
        } else {
            const widget = feedback?.createWidget(options);
            return () => {
                feedback.remove();
            };
        }

        return undefined;
    }, [buttonRef, feedback, messagePlaceholder]);

    return feedback;
}
