import {
    PERSONALIZED_QUESTION_SET,
    PersonalizedAnswersState,
    PersonalizedQuestionEnum,
} from './personalizedQuestions.helpers';
import _ from 'lodash';

export const DEFAULT_QA_CREDENTIAL_ID: string = '__qacredential__';

export const transformPersonalizedAnswersForVC = (
    personalizedAnswers: PersonalizedAnswersState
): {
    question: string;
    answer: string[];
}[] => {
    return Object.entries(personalizedAnswers).map(([questionEnum, answerArray]) => {
        const question = PERSONALIZED_QUESTION_SET.find(q => q.type === questionEnum);

        return {
            question: question?.title ?? '',
            answer: _.uniq(answerArray ?? []),
        };
    });
};

export const transformQACredIntoState = (data: any): PersonalizedAnswersState => {
    const qaMap: PersonalizedAnswersState = {
        [PersonalizedQuestionEnum.iLearnBest]: [],
        [PersonalizedQuestionEnum.favFictionalCharacter]: [],
        [PersonalizedQuestionEnum.favMovieGenre]: [],
    };

    data.forEach((item: { question: string; answer: string[] }) => {
        const matchingQuestion = PERSONALIZED_QUESTION_SET.find(q => q.title === item.question);

        if (matchingQuestion) qaMap[matchingQuestion.type] = item.answer;
    });

    return qaMap;
};

export const newPersonalizedQACredential = (
    QApairs: { question: string; answer: string | string[] }[],
    did: string
) => {
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                lcn: 'https://docs.learncard.com/definitions#',
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                QACredential: {
                    '@id': 'lcn:qaCredential',
                    '@context': {
                        qaPairs: {
                            '@id': 'lcn:qaPairs',
                            '@container': '@set',
                            '@context': {
                                question: {
                                    '@id': 'lcn:question',
                                    '@type': 'xsd:string',
                                },
                                answer: {
                                    '@id': 'lcn:answer',
                                    '@type': 'xsd:string',
                                    '@container': '@set',
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: 'http://example.com/credentials/3527',
        type: ['VerifiableCredential', 'QACredential'],
        issuer: { id: did },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: did,
        },
        qaPairs: QApairs.map(pair => ({
            question: pair.question,
            answer: Array.isArray(pair.answer) ? pair.answer : [pair.answer],
        })),
    };
};
