export enum PersonalizedQuestionEnum {
    iLearnBest = 'iLearnBest',
    favFictionalCharacter = 'favFictionalCharacter',
    favMovieGenre = 'favMovieGenre',
}

export type PersonalizedQuestionType = {
    id: number;
    title: string;
    predefinedAnswers: string[];
    type: PersonalizedQuestionEnum;

    showInput?: boolean;
    inputPlaceholderText?: string;
};

export const PERSONALIZED_QUESTION_SET: PersonalizedQuestionType[] = [
    {
        id: 1,
        title: 'I learn best when I',
        predefinedAnswers: [
            'See examples or visuals',
            'Read and analyze concepts',
            'Discuss and ask questions',
            'Practice hands on',
            'Follow instructions',
        ],
        type: PersonalizedQuestionEnum.iLearnBest,

        showInput: false,
        inputPlaceholderText: '',
    },
    {
        id: 2,
        title: 'My favorite fictional characters are',
        predefinedAnswers: [],
        type: PersonalizedQuestionEnum.favFictionalCharacter,

        showInput: true,
        inputPlaceholderText: 'Add fictional character',
    },
    {
        id: 3,
        title: 'My favorite movie genres are',
        predefinedAnswers: [],
        type: PersonalizedQuestionEnum.favMovieGenre,

        showInput: true,
        inputPlaceholderText: 'Add movie genre',
    },
];

export const PERSONALIZED_QUESTION_EMPHASIS_MAP = {
    [PersonalizedQuestionEnum.iLearnBest]: 'learn best',
    [PersonalizedQuestionEnum.favFictionalCharacter]: 'fictional characters',
    [PersonalizedQuestionEnum.favMovieGenre]: 'movie genres',
};

export type PersonalizedAnswersState = Record<PersonalizedQuestionEnum, string[]>;
