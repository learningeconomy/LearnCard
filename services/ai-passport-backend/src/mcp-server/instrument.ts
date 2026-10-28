import * as Sentry from '@sentry/node';

export const initializeInstrumentation = (): void => {
    if (!process.env.SENTRY_DSN) return;

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        sendDefaultPii: false,
        defaultIntegrations: false,
        maxBreadcrumbs: 0,
        tracesSampleRate: 0,
        beforeBreadcrumb: () => null,
        beforeSendTransaction: () => null,
        beforeSend: (event, hint) => {
            // Rebuild, never redact in place: unknown future SDK fields, exception
            // messages/stacks, request data, users, extras and attachments stay local.
            hint.attachments = [];
            const tool = event.tags?.tool;
            return {
                type: undefined,
                ...(typeof event.event_id === 'string' && /^[a-f0-9]{32}$/.test(event.event_id)
                    ? { event_id: event.event_id }
                    : {}),
                level: 'error',
                platform: 'node',
                message: 'backend_operation_failed',
                ...(tool === 'get_user_context' ||
                tool === 'get_answer_about_user' ||
                tool === 'save_session_summary'
                    ? { tags: { tool } }
                    : {}),
            };
        },
    });
};
