/**
 * Known-good in-app message templates for the debug panel.
 *
 * A categorized library covering the feature's permutation space —
 * presentations (modal/banner/toast), media (image/gif/youtube), frequencies
 * (once/session/always/everyDays), blocking vs dismissible, every action type
 * (internalLink/externalLink/appStore/capgoUpdate/dismiss), and the targeting
 * shapes (platform/role/version leaves, all/any/not combinators).
 *
 * They serve double duty:
 *
 *   1. One-click **Preview** presets in the Messages debug tab
 *   2. Starting points for the **Builder**, so flag authors begin from a
 *      validated shape instead of a blank JSON object
 *
 * Templates are stored as plain JSON (`Record<string, unknown>`) and run
 * through `inAppMessageValidator` at the point of use, so schema defaults are
 * applied exactly like a real LaunchDarkly flag value would be.
 */

export type InAppMessageTemplateCategory =
    | 'Basics'
    | 'Announcements'
    | 'Updates'
    | 'Targeting'
    | 'Operational';

export interface InAppMessageTemplate {
    key: string;
    label: string;
    description: string;
    category: InAppMessageTemplateCategory;
    json: Record<string, unknown>;
}

export const IN_APP_MESSAGE_TEMPLATES: InAppMessageTemplate[] = [
    {
        key: 'smoke-test',
        label: 'Simple test message',
        description: 'Minimal dismissible modal — quickest way to eyeball styling.',
        category: 'Basics',
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
        key: 'banner-test',
        label: 'Simple banner',
        description: 'Non-blocking top banner with one action — banner layout check.',
        category: 'Basics',
        json: {
            id: 'debug-banner-test',
            title: 'Heads up',
            body: 'This is what a banner looks like.',
            presentation: 'banner',
            frequency: 'always',
            actions: [{ label: 'Got it', style: 'primary', action: { type: 'dismiss' } }],
        },
    },
    {
        key: 'toast-test',
        label: 'Simple toast',
        description: 'Fire-and-forget toast — no actions, auto-dismisses.',
        category: 'Basics',
        json: {
            id: 'debug-toast-test',
            title: 'Saved',
            body: 'Toast presentation check.',
            presentation: 'toast',
            frequency: 'always',
        },
    },
    {
        key: 'blocking-modal',
        label: 'Blocking modal (no dismiss)',
        description:
            'dismissible: false with a single required action — verifies no close affordance renders.',
        category: 'Basics',
        json: {
            id: 'debug-blocking-modal',
            title: 'Action required',
            body: 'This message cannot be dismissed — the only way out is the button.',
            presentation: 'modal',
            frequency: 'always',
            dismissible: false,
            actions: [{ label: 'Continue', style: 'primary', action: { type: 'dismiss' } }],
        },
    },
    {
        key: 'announce-feature',
        label: 'Feature announcement (image)',
        description: 'Once-per-user modal with image media that deep-links into a feature.',
        category: 'Announcements',
        json: {
            id: 'announce-feature-example',
            priority: 80,
            dismissible: true,
            frequency: 'once',
            presentation: 'modal',
            media: {
                type: 'image',
                url: 'https://cdn.filestackcontent.com/SEv63ovQZeltl54nSsLA',
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
        key: 'announce-video',
        label: 'Feature announcement (video)',
        description: 'Modal with an embedded YouTube walkthrough plus internal + external links.',
        category: 'Announcements',
        json: {
            id: 'announce-video-example',
            priority: 80,
            frequency: 'once',
            presentation: 'modal',
            media: {
                type: 'youtube',
                url: 'https://youtu.be/dQw4w9WgXcQ',
                aspect: '16:9',
            },
            title: 'See what’s new',
            body: 'A 60-second tour of the latest release.',
            actions: [
                {
                    label: 'Try it now',
                    style: 'primary',
                    action: { type: 'internalLink', path: '/wallet' },
                },
                {
                    label: 'Read the guide',
                    style: 'secondary',
                    action: { type: 'externalLink', url: 'https://docs.learncard.com' },
                },
                { label: 'Maybe later', style: 'dismiss', action: { type: 'dismiss' } },
            ],
        },
    },
    {
        key: 'announce-banner',
        label: 'Announcement banner',
        description: 'Low-priority banner with a thumbnail that links out — lighter than a modal.',
        category: 'Announcements',
        json: {
            id: 'announce-banner-example',
            priority: 20,
            frequency: 'once',
            presentation: 'banner',
            media: {
                type: 'image',
                url: 'https://cdn.filestackcontent.com/Lb9NtTOfReOkat9pbRoE',
                aspect: '1:1',
            },
            title: 'New: resume builder',
            body: 'Turn your credentials into a polished resume.',
            actions: [
                {
                    label: 'Try it',
                    style: 'primary',
                    action: { type: 'internalLink', path: '/resume-builder' },
                },
            ],
        },
    },
    {
        key: 'survey-request',
        label: 'Feedback / survey request',
        description: 'everyDays: 30 modal for learners linking to an external survey.',
        category: 'Announcements',
        json: {
            id: 'survey-request-example',
            emoji: '💬',
            priority: 10,
            frequency: { everyDays: 30 },
            presentation: 'modal',
            title: 'How are we doing?',
            body: 'Two minutes of feedback helps us improve LearnCard.',
            actions: [
                {
                    label: 'Take the survey',
                    style: 'positive',
                    action: { type: 'externalLink', url: 'https://example.com/survey' },
                },
                { label: 'Skip for Now', style: 'dismiss', action: { type: 'dismiss' } },
            ],
            targeting: { role: ['learner'] },
        },
    },
    {
        key: 'force-update',
        label: 'Force app-store update',
        description:
            'Blocking modal targeting native binaries below a version — the critical-fix path.',
        category: 'Updates',
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
        key: 'soft-update',
        label: 'Soft app-store update nudge',
        description: 'Dismissible everyDays: 7 modal — same targeting as force-update, gentler UX.',
        category: 'Updates',
        json: {
            id: 'soft-update-example',
            priority: 60,
            frequency: { everyDays: 7 },
            presentation: 'modal',
            title: 'A new version is available',
            body: 'Update for the latest features and fixes.',
            actions: [
                { label: 'Update now', style: 'primary', action: { type: 'appStore' } },
                { label: 'Later', style: 'dismiss', action: { type: 'dismiss' } },
            ],
            targeting: {
                all: [
                    { platform: ['ios', 'android'] },
                    { version: { source: 'native', op: 'lt', value: '1.1.0' } },
                ],
            },
        },
    },
    {
        key: 'capgo-nudge',
        label: 'Capgo (OTA) update nudge',
        description: 'Non-blocking banner, every 3 days, targeting old Capgo bundles.',
        category: 'Updates',
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
    {
        key: 'capgo-forced',
        label: 'Forced Capgo (OTA) update',
        description:
            'Blocking modal that runs the OTA update with live progress — for broken bundles.',
        category: 'Updates',
        json: {
            id: 'capgo-forced-example',
            priority: 900,
            dismissible: false,
            frequency: 'always',
            presentation: 'modal',
            title: 'Update required',
            body: 'We need to apply an important fix before you continue. This only takes a moment.',
            actions: [{ label: 'Update now', style: 'primary', action: { type: 'capgoUpdate' } }],
            targeting: {
                all: [
                    { platform: ['ios', 'android'] },
                    { version: { source: 'capgo', op: 'lt', value: '1.0.8' } },
                ],
            },
        },
    },
    {
        key: 'role-targeted',
        label: 'Role-targeted (teachers)',
        description: 'Single role leaf — only teachers see it.',
        category: 'Targeting',
        json: {
            id: 'role-targeted-example',
            frequency: 'once',
            presentation: 'modal',
            title: 'New tools for teachers',
            body: 'Issue credentials to your whole class at once.',
            actions: [
                {
                    label: 'See how',
                    style: 'primary',
                    action: { type: 'internalLink', path: '/wallet' },
                },
                { label: 'Not now', style: 'dismiss', action: { type: 'dismiss' } },
            ],
            targeting: { role: ['teacher'] },
        },
    },
    {
        key: 'web-only',
        label: 'Web-only (get the app)',
        description: 'platform: web leaf pointing web users at the native app stores.',
        category: 'Targeting',
        json: {
            id: 'web-only-example',
            emoji: '📲',
            frequency: { everyDays: 14 },
            presentation: 'banner',
            title: 'LearnCard is better in the app',
            body: 'Get notifications and offline access.',
            actions: [
                { label: 'Get the app', style: 'primary', action: { type: 'appStore' } },
                { label: 'Later', style: 'dismiss', action: { type: 'dismiss' } },
            ],
            targeting: { platform: ['web'] },
        },
    },
    {
        key: 'exclusion',
        label: 'Exclusion (not admins)',
        description: 'not combinator — everyone except admins. Verifies negation handling.',
        category: 'Targeting',
        json: {
            id: 'exclusion-example',
            frequency: 'once',
            presentation: 'modal',
            title: 'Welcome to the new experience',
            body: 'Everything has a fresh look. Admins already saw this in the pilot.',
            actions: [{ label: 'Got it', style: 'primary', action: { type: 'dismiss' } }],
            targeting: { not: { role: ['admin'] } },
        },
    },
    {
        key: 'complex-targeting',
        label: 'Complex combinator (nested)',
        description:
            'any-of-alls: (iOS below 1.2.0) OR (Android below 1.3.0). Stress-tests the trace tree.',
        category: 'Targeting',
        json: {
            id: 'complex-targeting-example',
            frequency: { everyDays: 7 },
            presentation: 'modal',
            title: 'Your version is falling behind',
            body: 'Update to keep everything working smoothly.',
            actions: [
                { label: 'Update', style: 'primary', action: { type: 'appStore' } },
                { label: 'Later', style: 'dismiss', action: { type: 'dismiss' } },
            ],
            targeting: {
                any: [
                    {
                        all: [
                            { platform: ['ios'] },
                            { version: { source: 'native', op: 'lt', value: '1.2.0' } },
                        ],
                    },
                    {
                        all: [
                            { platform: ['android'] },
                            { version: { source: 'native', op: 'lt', value: '1.3.0' } },
                        ],
                    },
                ],
            },
        },
    },
    {
        key: 'maintenance-notice',
        label: 'Maintenance notice',
        description:
            'always-frequency banner linking to a status page — for planned downtime windows.',
        category: 'Operational',
        json: {
            id: 'maintenance-notice-example',
            emoji: '🛠️',
            priority: 500,
            frequency: 'always',
            presentation: 'banner',
            title: 'Scheduled maintenance tonight',
            body: 'LearnCard may be briefly unavailable from 11pm–12am ET.',
            actions: [
                {
                    label: 'Status page',
                    style: 'secondary',
                    action: { type: 'externalLink', url: 'https://status.learncloud.ai/' },
                },
            ],
        },
    },
    {
        key: 'policy-update',
        label: 'Policy / terms update',
        description: 'once-frequency modal driving users to review updated legal terms in-app.',
        category: 'Operational',
        json: {
            id: 'policy-update-example',
            emoji: '📄',
            priority: 300,
            frequency: 'once',
            presentation: 'modal',
            title: 'We’ve updated our terms',
            body: 'Please take a moment to review what changed.',
            actions: [
                {
                    label: 'Review changes',
                    style: 'primary',
                    action: {
                        type: 'externalLink',
                        url: 'https://www.learncard.com/learncard-privacy-policy',
                    },
                },
                { label: 'Done', style: 'dismiss', action: { type: 'dismiss' } },
            ],
        },
    },
    {
        key: 'session-tip',
        label: 'Session tip (toast)',
        description: 'session-frequency toast — shows at most once per app session.',
        category: 'Operational',
        json: {
            id: 'session-tip-example',
            emoji: '💡',
            frequency: 'session',
            presentation: 'toast',
            title: 'Tip: share credentials with a QR code',
            body: 'Open any credential and tap Share.',
        },
    },
];

export const IN_APP_MESSAGE_TEMPLATE_CATEGORIES: InAppMessageTemplateCategory[] = [
    'Basics',
    'Announcements',
    'Updates',
    'Targeting',
    'Operational',
];
