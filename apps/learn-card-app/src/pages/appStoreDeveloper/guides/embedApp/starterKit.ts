export type AppFeatureId =
    'identity' | 'credentials' | 'consent' | 'progress' | 'notifications' | 'ai-tutor';

export interface AppFeature {
    id: AppFeatureId;
    title: string;
    description: string;
    promptLine: string;
    code: string;
}

export const APP_FEATURES: AppFeature[] = [
    {
        id: 'identity',
        title: 'Sign people in',
        description: 'Know who is using your app. No passwords.',
        promptLine:
            'When the app opens, call `learnCard.requestIdentity()` and use `identity.user.did` as the stable ID for the signed-in person (save their progress under it).',
        code: `const identity = await learnCard.requestIdentity();
const userId = identity.user.did;`,
    },
    {
        id: 'credentials',
        title: 'Give out credentials',
        description: 'Award badges or certificates people keep forever.',
        promptLine:
            "When someone finishes something meaningful, call `learnCard.sendCredential({ alias, template, templateData })` with an inline template (name, description, achievementType, criteria.narrative). Use `{{placeholders}}` in the template and fill them with templateData. Don't hard-code any IDs.",
        code: `await learnCard.sendCredential({
    alias: 'lesson-complete',
    template: {
        name: 'Completed {{lessonName}}',
        description: 'Awarded for finishing {{lessonName}}.',
        achievementType: 'Course',
        criteria: { narrative: 'Finished every part of the lesson' },
    },
    templateData: { lessonName: 'Fractions 101' },
});`,
    },
    {
        id: 'consent',
        title: 'Ask to use learner info',
        description: 'With permission, read achievements or add new ones.',
        promptLine:
            "Before using the person's existing achievements, call `learnCard.requestConsent({ read: { credentialCategories: ['Achievement'], personalFields: ['name'] }, reason: '...' })` with a short, friendly reason, and only continue if `granted` is true.",
        code: `const { granted } = await learnCard.requestConsent({
    read: { credentialCategories: ['Achievement'], personalFields: ['name'] },
    reason: 'Suggest lessons based on what you already know',
});`,
    },
    {
        id: 'progress',
        title: 'Track progress',
        description: 'Keep points or streaks that follow the person.',
        promptLine:
            "Track progress with `learnCard.incrementCounter('points', 10)` and show the returned `newValue` as the total.",
        code: `const { newValue } = await learnCard.incrementCounter('points', 10);`,
    },
    {
        id: 'notifications',
        title: 'Send notifications',
        description: 'Reach people in their LearnCard inbox.',
        promptLine:
            "Celebrate milestones with `learnCard.sendNotification({ title, body, actionPath: '/' })`.",
        code: `await learnCard.sendNotification({
    title: 'Streak unlocked!',
    body: 'Five days in a row. Keep it up.',
    actionPath: '/',
});`,
    },
    {
        id: 'ai-tutor',
        title: 'Open the AI tutor',
        description: "Hand off to LearnCard's tutor on a topic.",
        promptLine:
            'Add a "Get help" button that calls `learnCard.launchFeature(\'/ai/topics?shortCircuitStep=newTopic&selectedAppId=null\', topic)` with the current topic.',
        code: `await learnCard.launchFeature(
    '/ai/topics?shortCircuitStep=newTopic&selectedAppId=null',
    'Help me understand fractions'
);`,
    },
];

export const DEFAULT_FEATURES: AppFeatureId[] = ['identity', 'credentials'];

export const INSTALL_COMMAND = 'npm install @learncard/partner-connect';

const selected = (ids: AppFeatureId[]): AppFeature[] =>
    APP_FEATURES.filter(feature => ids.includes(feature.id));

export const buildStarterPrompt = (idea: string, ids: AppFeatureId[]): string => {
    const about = idea.trim() || 'a small learning app';
    const lines = selected(ids).map(feature => `- ${feature.promptLine}`);

    return [
        `Build ${about.replace(/\.$/, '')}.`,
        '',
        'It runs inside LearnCard. Install `@learncard/partner-connect` and create one shared client:',
        "`import { createPartnerConnect } from '@learncard/partner-connect';`",
        '`const learnCard = createPartnerConnect();`',
        '',
        ...(lines.length > 0 ? ['Use LearnCard like this:', ...lines, ''] : []),
        'No setup or API keys are needed: while previewing, the SDK simulates LearnCard and shows what would happen.',
    ].join('\n');
};

export const buildStarterCode = (ids: AppFeatureId[]): string =>
    [
        "import { createPartnerConnect } from '@learncard/partner-connect';",
        '',
        'const learnCard = createPartnerConnect();',
        ...selected(ids).flatMap(feature => ['', feature.code]),
    ].join('\n');
