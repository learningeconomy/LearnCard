import { m } from '../../paraglide/messages.js';

import { VC } from '@learncard/types';

export enum AiSessionMode {
    tutor = 'ai-tutor',
    insights = 'ai-insights',
}

export enum NewAiSessionStepEnum {
    newTopic = 'newTopic',
    revisitTopic = 'revisitTopic',
    topicSelector = 'topicSelector',
    aiAppSelector = 'aiAppSelector',
}

export const getAiTopicTitle = (topic: VC | undefined) => {
    if (!topic) return '';
    return topic?.boostCredential?.topicInfo?.title ?? '';
};

/**
 * Rotating session-startup loader copy.
 *
 * A function, not a module-scope array: Paraglide resolves the active locale at
 * call time, so a hoisted `const` would freeze these to whatever language was
 * active when the chunk first loaded (see the `no-module-scope-i18n` rule).
 */
export const getSessionLoadingText = (): string[] => [
    m['aiSession.loading.session1'](),
    m['aiSession.loading.session2'](),
    m['aiSession.loading.session3'](),
    m['aiSession.loading.session4'](),
    m['aiSession.loading.session5'](),
    m['aiSession.loading.session6'](),
    m['aiSession.loading.session7'](),
    m['aiSession.loading.session8'](),
    m['aiSession.loading.session9'](),
    m['aiSession.loading.session10'](),
];

/**
 * Rotating AI "thinking" loader copy.
 *
 * A function, not a module-scope array: Paraglide resolves the active locale at
 * call time, so a hoisted `const` would freeze these to whatever language was
 * active when the chunk first loaded (see the `no-module-scope-i18n` rule).
 */
export const getAiThinkingText = (): string[] => [
    m['aiSession.loading.thinking1'](),
    m['aiSession.loading.thinking2'](),
    m['aiSession.loading.thinking3'](),
    m['aiSession.loading.thinking4'](),
    m['aiSession.loading.thinking5'](),
    m['aiSession.loading.thinking6'](),
    m['aiSession.loading.thinking7'](),
    m['aiSession.loading.thinking8'](),
    m['aiSession.loading.thinking9'](),
    m['aiSession.loading.thinking10'](),
    m['aiSession.loading.thinking11'](),
    m['aiSession.loading.thinking12'](),
    m['aiSession.loading.thinking13'](),
    m['aiSession.loading.thinking14'](),
    m['aiSession.loading.thinking15'](),
];

/**
 * Rotating session wrap-up loader copy.
 *
 * A function, not a module-scope array: Paraglide resolves the active locale at
 * call time, so a hoisted `const` would freeze these to whatever language was
 * active when the chunk first loaded (see the `no-module-scope-i18n` rule).
 */
export const getSessionWrapUpText = (): string[] => [
    m['aiSession.loading.wrapUp1'](),
    m['aiSession.loading.wrapUp2'](),
    m['aiSession.loading.wrapUp3'](),
    m['aiSession.loading.wrapUp4'](),
    m['aiSession.loading.wrapUp5'](),
    m['aiSession.loading.wrapUp6'](),
    m['aiSession.loading.wrapUp7'](),
    m['aiSession.loading.wrapUp8'](),
    m['aiSession.loading.wrapUp9'](),
    m['aiSession.loading.wrapUp10'](),
    m['aiSession.loading.wrapUp11'](),
    m['aiSession.loading.wrapUp12'](),
    m['aiSession.loading.wrapUp13'](),
    m['aiSession.loading.wrapUp14'](),
    m['aiSession.loading.wrapUp15'](),
];
