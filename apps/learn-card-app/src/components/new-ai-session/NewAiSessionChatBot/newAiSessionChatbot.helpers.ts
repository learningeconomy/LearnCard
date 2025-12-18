export enum ChatBotQuestionsEnum {
    TopicSelection = 'TopicSelection',
    AppSelection = 'AppSelection',
    ResumeTopic = 'ResumeTopic',
    LearningPathway = 'LearningPathway',
}

export type ChatBotQA = {
    id: number;
    question?: null | string;
    answer?: null | string | number | undefined;
    type?: ChatBotQuestionsEnum;
    phraseToEmphasize?: string;
};

export const newSessionQAInitState: ChatBotQA[] = [
    {
        id: 0,
        question: null,
        answer: 'New Topic',
        phraseToEmphasize: undefined,
    },
    {
        id: 1,
        question: 'What would you like to learn about?',
        answer: null,
        type: ChatBotQuestionsEnum.TopicSelection,
        phraseToEmphasize: 'learn',
    },
    {
        id: 2,
        question: 'What app do you want to use?',
        answer: null,
        type: ChatBotQuestionsEnum.AppSelection,
        phraseToEmphasize: 'What app',
    },
];

export const existingSessionQAInitState: ChatBotQA[] = [
    {
        id: 0,
        question: null,
        answer: 'Revisit Topic',
        phraseToEmphasize: undefined,
    },
    {
        id: 1,
        question: "Select a topic you'd like to continue.",
        answer: null,
        type: ChatBotQuestionsEnum.ResumeTopic,
        phraseToEmphasize: 'Select a topic',
    },
    {
        id: 2,
        question: 'Choose a Learning Pathway!',
        answer: null,
        type: ChatBotQuestionsEnum.LearningPathway,
        phraseToEmphasize: 'Learning Pathway!',
    },
];

export const aiAppQAInitState: ChatBotQA[] = [
    {
        id: 0,
        question: 'Which AI Learning App do you want to use?',
        answer: null,
        phraseToEmphasize: 'AI Learning App',
    },
    {
        id: 1,
        question: 'What would you like to learn about?',
        answer: null,
        type: ChatBotQuestionsEnum.TopicSelection,
        phraseToEmphasize: 'learn',
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
