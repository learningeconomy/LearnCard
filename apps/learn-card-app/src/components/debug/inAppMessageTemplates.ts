/**
 * Known-good in-app message templates for the debug panel.
 *
 * These mirror the three anticipated use cases documented in
 * `packages/learn-card-base/src/in-app-messages/README.md` plus a minimal
 * smoke-test message. They serve double duty:
 *
 *   1. One-click **Preview** presets in the Messages debug tab
 *   2. Starting points for the **Builder**, so flag authors begin from a
 *      validated shape instead of a blank JSON object
 *
 * Templates are stored as plain JSON (`Record<string, unknown>`) and run
 * through `inAppMessageValidator` at the point of use, so schema defaults
 * (priority, frequency, presentation, …) are applied exactly like a real
 * LaunchDarkly flag value would be.
 */

export interface InAppMessageTemplate {
    key: string;
    label: string;
    description: string;
    json: Record<string, unknown>;
}

export const IN_APP_MESSAGE_TEMPLATES: InAppMessageTemplate[] = [
    {
        key: 'smoke-test',
        label: 'Simple test message',
        description: 'Minimal dismissible modal — quickest way to eyeball styling.',
        json: {
            id: 'debug-smoke-test',
            title: 'Test message',
            body: 'If you can read this, the in-app message pipeline works.',
            presentation: 'modal',
            frequency: 'always',
            actions: [{ label: 'OK', style: 'primary', action: { type: 'dismiss' } }],
        },
    },
    {
        key: 'announce-feature',
        label: 'Announce a feature',
        description: 'Once-per-user modal with media that deep-links into a feature.',
        json: {
            id: 'announce-feature-example',
            priority: 80,
            dismissible: true,
            frequency: 'once',
            presentation: 'modal',
            media: {
                type: 'youtube',
                url: 'https://www.youtube.com/watch?v=iG9CE55wbtY',
                aspect: '16:9',
            },
            title: 'Introducing Pathways',
            body: 'Map your journey to any goal.',
            actions: [
                {
                    label: 'Explore Pathways',
                    style: 'primary',
                    action: { type: 'internalLink', path: '/pathways' },
                },
                { label: 'Not now', style: 'dismiss', action: { type: 'dismiss' } },
            ],
        },
    },
    {
        key: 'force-update',
        label: 'Force app-store update',
        description: 'Blocking modal targeting native binaries below a version.',
        json: {
            id: 'force-update-example',
            priority: 1000,
            dismissible: false,
            frequency: 'always',
            presentation: 'modal',
            title: 'Update required',
            body: 'A critical security update is available. Please update to continue.',
            actions: [
                {
                    label: 'Update in the App Store',
                    style: 'primary',
                    action: { type: 'appStore' },
                },
            ],
            targeting: {
                all: [
                    { platform: ['ios', 'android'] },
                    { version: { source: 'native', op: 'lt', value: '1.0.9' } },
                ],
            },
        },
    },
    {
        key: 'capgo-nudge',
        label: 'Capgo (OTA) update nudge',
        description: 'Non-blocking banner, every 3 days, targeting old Capgo bundles.',
        json: {
            id: 'capgo-nudge-example',
            priority: 50,
            dismissible: true,
            frequency: { everyDays: 3 },
            presentation: 'banner',
            title: 'New improvements are ready',
            body: 'Get the latest version of the app.',
            actions: [
                { label: 'Update now', style: 'positive', action: { type: 'capgoUpdate' } },
                { label: 'Later', style: 'dismiss', action: { type: 'dismiss' } },
            ],
            targeting: {
                all: [
                    { platform: ['ios', 'android'] },
                    { version: { source: 'capgo', op: 'lt', value: '1.0.8' } },
                ],
            },
        },
    },
];
