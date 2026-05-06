import { useState, useEffect, useCallback } from 'react';

import { useWallet } from 'learn-card-base';

import {
    PersonalizedAnswersState,
    PersonalizedQuestionEnum,
    PERSONALIZED_QUESTION_SET,
} from './personalizedQuestions.helpers';
import {
    DEFAULT_QA_CREDENTIAL_ID,
    transformQACredIntoState,
} from './personalizedQuestionCredential.helpers';

const EMPTY_ANSWERS: PersonalizedAnswersState = {
    [PersonalizedQuestionEnum.iLearnBest]: [],
    [PersonalizedQuestionEnum.favFictionalCharacter]: [],
    [PersonalizedQuestionEnum.favMovieGenre]: [],
};

const TOTAL_QUESTIONS = PERSONALIZED_QUESTION_SET.length;

const computeCompletionPercentage = (answers: PersonalizedAnswersState): number => {
    const filled = PERSONALIZED_QUESTION_SET.filter(q => answers[q.type]?.length > 0).length;
    return Math.round((filled / TOTAL_QUESTIONS) * 100);
};

export type UsePersonalizationQAReturn = {
    personalizedAnswers: PersonalizedAnswersState;
    setPersonalizedAnswers: React.Dispatch<React.SetStateAction<PersonalizedAnswersState>>;
    setAnswer: (questionType: PersonalizedQuestionEnum, answer: string) => void;
    removeAnswer: (questionType: PersonalizedQuestionEnum, answer: string) => void;
    completionPercentage: number;
    uri: string;
    isLoading: boolean;
    error: string | null;
    reload: () => void;
};

export const usePersonalizationQA = (): UsePersonalizationQAReturn => {
    const { initWallet } = useWallet();

    const [personalizedAnswers, setPersonalizedAnswers] =
        useState<PersonalizedAnswersState>(EMPTY_ANSWERS);
    const [uri, setUri] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const wallet = await initWallet();
            const record = await wallet.index.LearnCloud.get({ id: DEFAULT_QA_CREDENTIAL_ID });
            const recordUri = record?.[0]?.uri as string | undefined;

            if (recordUri) {
                setUri(recordUri);
                const qaCredential = await wallet.read.get(recordUri);

                if (qaCredential?.qaPairs) {
                    setPersonalizedAnswers(transformQACredIntoState(qaCredential.qaPairs));
                }
            }
        } catch (err) {
            console.error('usePersonalizationQA::load error', err);
            setError('Failed to load personalization data.');
        } finally {
            setIsLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        load();
    }, []);

    const setAnswer = useCallback((questionType: PersonalizedQuestionEnum, answer: string) => {
        setPersonalizedAnswers(prev => ({
            ...prev,
            [questionType]: [...prev[questionType], answer],
        }));
    }, []);

    const removeAnswer = useCallback(
        (questionType: PersonalizedQuestionEnum, answer: string) => {
            setPersonalizedAnswers(prev => ({
                ...prev,
                [questionType]: prev[questionType].filter(a => a !== answer),
            }));
        },
        []
    );

    const completionPercentage = computeCompletionPercentage(personalizedAnswers);

    return {
        personalizedAnswers,
        setPersonalizedAnswers,
        setAnswer,
        removeAnswer,
        completionPercentage,
        uri,
        isLoading,
        error,
        reload: load,
    };
};
