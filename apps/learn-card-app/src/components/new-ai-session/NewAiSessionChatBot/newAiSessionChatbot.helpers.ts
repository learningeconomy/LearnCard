import { mDynamic } from '../../../i18n/mDynamic';

export enum ChatBotQuestionsEnum {
    TopicSelection = 'TopicSelection',
    AppSelection = 'AppSelection',
    ResumeTopic = 'ResumeTopic',
    LearningPathway = 'LearningPathway',
}

export type ChatBotQA = {
    id: number;
    /**
     * English source text. Kept as the persisted, locale-independent value and
     * used as the render fallback when `questionKey` is absent.
     *
     * Do NOT store a translated string here: `chatBotStore` persists this array
     * to localStorage, so a translated value would be frozen into whichever
     * language was active when it was written and would survive a language
     * switch. Translation happens at render time — see `questionKey`.
     */
    question?: null | string;
    answer?: null | string | number | undefined;
    type?: ChatBotQuestionsEnum;
    /** English emphasis phrase; fallback for `emphasisKey`, same rules as `question`. */
    phraseToEmphasize?: string;
    hidden?: boolean;
    /**
     * Paraglide message key for `question`, resolved at render (LC-1901 follow-up).
     * Storing the key rather than the resolved string keeps the persisted store
     * locale-independent and makes language switching reactive.
     */
    questionKey?: string;
    /** Paraglide message key for `phraseToEmphasize`, resolved alongside `questionKey`. */
    emphasisKey?: string;
    /** Interpolation params for `questionKey` / `emphasisKey` (e.g. `{ topic }`). */
    questionParams?: Record<string, string>;
};

export const newSessionQAInitState: ChatBotQA[] = [
    {
        id: 0,
        question: null,
        answer: 'New Topic',
        phraseToEmphasize: undefined,
        hidden: true,
    },
    {
        id: 1,
        question: 'What would you like to learn about?',
        questionKey: 'aiSession.chat.topicSelectionQuestion',
        answer: null,
        type: ChatBotQuestionsEnum.TopicSelection,
        phraseToEmphasize: 'learn',
        emphasisKey: 'aiSession.chat.topicSelectionEmphasis',
    },
    {
        id: 2,
        question: 'What app do you want to use?',
        questionKey: 'aiSession.chat.appSelectionQuestion',
        answer: null,
        type: ChatBotQuestionsEnum.AppSelection,
        phraseToEmphasize: 'What app',
        emphasisKey: 'aiSession.chat.appSelectionEmphasis',
    },
];

export const existingSessionQAInitState: ChatBotQA[] = [
    {
        id: 0,
        question: null,
        answer: 'Revisit Topic',
        phraseToEmphasize: undefined,
        hidden: true,
    },
    {
        id: 1,
        question: "Select a topic you'd like to continue.",
        questionKey: 'aiSession.chat.resumeTopicQuestion',
        answer: null,
        type: ChatBotQuestionsEnum.ResumeTopic,
        phraseToEmphasize: 'Select a topic',
        emphasisKey: 'aiSession.chat.resumeTopicEmphasis',
    },
    {
        id: 2,
        question: 'Choose a Learning Pathway!',
        questionKey: 'aiSession.chat.learningPathwayQuestion',
        answer: null,
        type: ChatBotQuestionsEnum.LearningPathway,
        phraseToEmphasize: 'Learning Pathway!',
        emphasisKey: 'aiSession.chat.learningPathwayEmphasis',
    },
];

export const aiAppQAInitState: ChatBotQA[] = [
    {
        id: 0,
        question: 'Which AI Learning App do you want to use?',
        questionKey: 'aiSession.chat.aiLearningAppQuestion',
        answer: null,
        phraseToEmphasize: 'AI Learning App',
        emphasisKey: 'aiSession.chat.aiLearningAppEmphasis',
    },
    {
        id: 1,
        question: 'What would you like to learn about?',
        questionKey: 'aiSession.chat.topicSelectionQuestion',
        answer: null,
        type: ChatBotQuestionsEnum.TopicSelection,
        phraseToEmphasize: 'learn',
        emphasisKey: 'aiSession.chat.topicSelectionEmphasis',
    },
    // TODO: Need to support creating a new topic VC from LCA
    // {
    //     id: 2,
    //     question: 'Choose a Learning Pathway!',
    //     answer: null,
    //     type: ChatBotQuestionsEnum.LearningPathway,
    //     phraseToEmphasize: 'Learning Pathway!',
    // },
];

/**
 * Resolve a QA entry's question text for display, in the CURRENT locale.
 *
 * Must be called at render time, never at module scope: `chatBotStore` persists
 * `ChatBotQA[]` to localStorage, so baking a translated string into the stored
 * object would freeze it to the language that was active when it was written.
 * Storing `questionKey` and resolving here keeps the persisted payload
 * locale-independent and makes language switches take effect immediately.
 *
 * Falls back to the English `question` for entries that predate the keys —
 * including QA arrays already persisted in a user's localStorage.
 */
export const resolveChatBotQuestion = (qa: ChatBotQA | undefined): string => {
    if (!qa) return '';
    if (qa.questionKey) return mDynamic(qa.questionKey, qa.questionParams);
    return qa.question ?? '';
};

/** Locale-aware counterpart to {@link resolveChatBotQuestion} for the bolded phrase. */
export const resolveChatBotEmphasis = (qa: ChatBotQA | undefined): string => {
    if (!qa) return '';
    if (qa.emphasisKey) return mDynamic(qa.emphasisKey, qa.questionParams);
    return qa.phraseToEmphasize ?? '';
};
