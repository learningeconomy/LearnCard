import React, { useState, useRef, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useQueryClient } from '@tanstack/react-query';
import { getLogger } from 'learn-card-base';
const log = getLogger('ai-assessment-container');

import AiAssessmentFooter from './AiAssessmentFooter';
import AiAssessmentHeader from './AiAssessmentHeader';
import AiAssessmentIntro from './AiAssessmentIntro';
import AiAssessmentQAItems from './AiAssessmentQAItems';
import AiAssessmentLayout from './helpers/AiAssessmentLayout';
import AiSessionLoader from '../../new-ai-session/AiSessionLoader';
import AssessmentAnswerInput from './helpers/AssessmentAnswerInput';
import StartAssessmentButton from './helpers/StartAssessmentButton';
import ViewAssessmentBadgeButton from './helpers/ViewAssessmentBadgeButton';
import FinishedAiSessionAssessmentPreview from '../FinishedAiSessionAssessmentPreview';
import AssessmentMultipleChoiceAnswers from './helpers/AssessmentMultipleChoiceAnswers';
import UnfinishedAiSessionAssessmentPreviewSimple from '../UnFinishedAiSessionAssessmentPreviewSimple';

import {
    AiAssessmentQuestion,
    AiAssesmentQuestionTypeEnum,
    finishedAssessmentText,
    preLoadingAssessmentText,
} from './ai-assessment.helpers';

import {
    LaunchPadAppListItem,
    ModalTypes,
    useModal,
    useDeviceTypeByWidth,
    usePreloadAssessment,
    useSyncConsentFlow,
    useFinishAssessmentMutation,
    usePathQuery,
    useGetEnrichedSession,
    useGetSummaryInfo,
} from 'learn-card-base';

import { VC } from '@learncard/types';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession } from 'learn-card-base';
import { useWallet } from 'learn-card-base/hooks/useWallet';
import { aiLoadingStore } from 'learn-card-base/stores/aiLoadingStore';
import GenericNetworkError from '../../generic/GenericNetworkError';
import { AiServiceError } from 'learn-card-base/helpers/aiErrors';
import { getAiErrorCopy } from '../../../helpers/aiError.helpers';
import * as m from '../../../paraglide/messages.js';

const hasAssessmentQuestions = (value: unknown): value is AiAssessmentQuestion[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
        question =>
            question &&
            typeof question.question === 'string' &&
            question.question.trim() &&
            (question.type === undefined ||
                question.type === AiAssesmentQuestionTypeEnum.text ||
                (question.type === AiAssesmentQuestionTypeEnum.multipleChoice &&
                    Array.isArray(question.choices) &&
                    question.choices.length >= 2 &&
                    question.choices.every(
                        (choice: unknown) => typeof choice === 'string' && choice.trim()
                    )))
    );

const normalizeQuestionTypes = (questions: AiAssessmentQuestion[]): AiAssessmentQuestion[] =>
    questions.map(question => ({
        ...question,
        type: question.type ?? AiAssesmentQuestionTypeEnum.text,
    }));

export enum AiAssessmentStepEnum {
    assessmentIntro = 'assessmentIntro',
    assessmentQA = 'assessmentQA',
}

export const AiAssessmentContainer: React.FC<{
    app: LaunchPadAppListItem | undefined;
    topicRecord?: LCR;
    topicVc?: VC;
    session: AiSession;
    assessment?: AiAssessmentQuestion[];
}> = ({ app, topicRecord, topicVc, session, assessment }) => {
    const query = usePathQuery();
    const queryClient = useQueryClient();
    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();
    const { isMobile, isDesktop } = useDeviceTypeByWidth();

    const [activeStep, setActiveStep] = useState<AiAssessmentStepEnum>(
        AiAssessmentStepEnum.assessmentIntro
    );
    const [assessmentQA, setAssessmentQA] = useState<AiAssessmentQuestion[]>(
        normalizeQuestionTypes(assessment || []).map(q => ({ ...q, answer: '' }))
    );
    const [isPreLoadingAssessment, setIsPreLoadingAssessment] = useState(false);
    const [preloadError, setPreloadError] = useState<Error | null>(null);
    const preloadInFlight = useRef(false);
    const [allPrefilled, setAllPrefilled] = useState(false);

    const { refetch: refetchEnrichedSession } = useGetEnrichedSession(
        query.get('topicBoostUri') as string
    );
    const { refetch: refetchSummaryInfo } = useGetSummaryInfo(session?.record?.uri);
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { mutateAsync: finishAssessment, error: finishAssessmentError } =
        useFinishAssessmentMutation();
    const { mutateAsync: preloadAssessment } = usePreloadAssessment();

    const isFinishingAssessment = aiLoadingStore.use.isFinishingAssessment();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const lastQuestionIndex = assessmentQA.length - 1;

    const qaItemsRef = useRef<HTMLDivElement>(null);

    // === Handle Errors ===
    useEffect(() => {
        if (finishAssessmentError) {
            newModal(
                <GenericNetworkError
                    text="Something went wrong while completing your assessment. Please try again."
                    closeModal={() => {
                        closeModal();
                        setActiveStep(AiAssessmentStepEnum.assessmentIntro);
                        aiLoadingStore.set.isFinishingAssessment(false);
                    }}
                    handleRetry={async () => {
                        closeModal();
                        await handleFinishAssessment();
                    }}
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    }, [finishAssessmentError]);

    // === Helpers ===
    const isAlreadyCompleted = async () => {
        const enriched = await refetchSummaryInfo();
        const alreadyCompleted =
            enriched?.data?.summaryVc?.completed || Boolean(enriched?.data?.assessmentVc);

        if (alreadyCompleted) {
            await fetchNewContractCredentials();
            await refetchEnrichedSession();
            closeModal();
            aiLoadingStore.set.isFinishingAssessment(false);
            return true;
        }

        return false;
    };

    const handleFinishAssessment = async (answers = assessmentQA) => {
        const learnCard = await initWallet();
        aiLoadingStore.set.isFinishingAssessment(true);

        try {
            const _isAlreadyCompleted = await isAlreadyCompleted();
            if (_isAlreadyCompleted) return;

            await finishAssessment(
                {
                    did: learnCard.id.did(),
                    assessmentQA: answers,
                    session: session.vc?.boostCredential ?? session.vc,
                    sessionUri: session.boost.uri,
                    summaryCredentialUri: session.record?.uri,
                },
                {
                    onSettled: () => {
                        aiLoadingStore.set.isFinishingAssessment(false);
                    },
                }
            );
        } catch (error) {
            log.error('[Assessment] Finish failed:', error);
            aiLoadingStore.set.isFinishingAssessment(false);
        } finally {
            aiLoadingStore.set.isFinishingAssessment(false);
        }
    };

    const handleAnswerChange = async (index: number, answer: string) => {
        const updatedQA = [...assessmentQA];
        updatedQA[index].answer = answer;
        setAssessmentQA(updatedQA);

        if (index === currentQuestionIndex && answer.trim()) {
            setCurrentQuestionIndex(prev => Math.min(prev + 1, updatedQA.length - 1));
        }

        if (index === lastQuestionIndex && answer.trim()) {
            await handleFinishAssessment(updatedQA);
        }
    };

    const preLoadAssessment = async () => {
        if (preloadInFlight.current) return;
        preloadInFlight.current = true;
        try {
            setIsPreLoadingAssessment(true);
            setPreloadError(null);
            aiLoadingStore.set.isFinishingAssessment(false);

            const learnCard = await initWallet();
            const summaryCredential = session?.vc?.boostCredential ?? session?.vc;
            if (!summaryCredential) throw new Error('Session summary is unavailable');
            const boostId = summaryCredential?.boostId;

            const cached = queryClient.getQueryData<AiAssessmentQuestion[]>([
                'assessment',
                boostId,
            ]);

            if (hasAssessmentQuestions(cached)) {
                setAssessmentQA(normalizeQuestionTypes(cached));

                const allAnswered = cached.every(q => q.answer?.trim());
                if (allAnswered) {
                    setCurrentQuestionIndex(cached.length - 1);
                    setAllPrefilled(true);
                } else {
                    const firstUnansweredIndex = cached.findIndex(
                        (q: AiAssessmentQuestion) => !q.answer?.trim()
                    );
                    setCurrentQuestionIndex(firstUnansweredIndex);
                    setAllPrefilled(false);
                }
            } else {
                const { assessment } = await preloadAssessment({
                    did: learnCard.id.did(),
                    summaryCredential,
                    summaryCredentialUri: session.record?.uri,
                });

                if (!hasAssessmentQuestions(assessment)) {
                    throw new Error('Assessment response contains no usable questions');
                }
                setAssessmentQA(normalizeQuestionTypes(assessment));
                const firstUnansweredIndex = assessment.findIndex(q => !q.answer?.trim());
                setCurrentQuestionIndex(
                    firstUnansweredIndex === -1 ? assessment.length - 1 : firstUnansweredIndex
                );
                setAllPrefilled(firstUnansweredIndex === -1);
            }
        } catch (error) {
            log.error('Error preloading assessment:', error);
            setPreloadError(
                error instanceof Error ? error : new Error('Assessment could not be loaded')
            );
            setAssessmentQA([]);
            setAllPrefilled(false);
        } finally {
            preloadInFlight.current = false;
            setIsPreLoadingAssessment(false);
        }
    };

    const handleStartAssessment = async () => {
        setActiveStep(AiAssessmentStepEnum.assessmentQA);
        scrollTo('smooth', 'end', 500);

        const _isAlreadyCompleted = await isAlreadyCompleted();
        if (_isAlreadyCompleted) return;

        if (allPrefilled && !isFinishingAssessment) {
            await handleFinishAssessment();
        }
    };

    const scrollTo = (
        behavior: ScrollBehavior = 'smooth',
        block: ScrollLogicalPosition = 'end',
        timeout?: number
    ) => {
        setTimeout(() => {
            qaItemsRef.current?.scrollIntoView({ behavior, block });
        }, timeout || 0);
    };

    const handleViewBadge = () => {
        newModal(
            <FinishedAiSessionAssessmentPreview
                topicRecord={topicRecord}
                topicVc={topicVc}
                session={session}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    let assessmentEl = null;
    const preloadErrorCopy =
        preloadError instanceof AiServiceError
            ? getAiErrorCopy(preloadError.payload.code).body
            : m['error.generic']();

    if (activeStep === AiAssessmentStepEnum.assessmentIntro) {
        assessmentEl = (
            <AiAssessmentLayout>
                <UnfinishedAiSessionAssessmentPreviewSimple
                    topicRecord={topicRecord}
                    topicVc={topicVc}
                    session={session}
                    preLoadAssessment={preLoadAssessment}
                />
            </AiAssessmentLayout>
        );
    } else if (activeStep === AiAssessmentStepEnum.assessmentQA) {
        assessmentEl = (
            <AiAssessmentLayout>
                {session.vc && <AiAssessmentIntro session={session.vc} />}
                {isPreLoadingAssessment ? (
                    <div ref={qaItemsRef}>
                        <AiSessionLoader
                            topicRecord={session?.record || topicRecord}
                            overrideText={preLoadingAssessmentText}
                            isInline
                        />
                    </div>
                ) : preloadError ? (
                    <div className="w-full mt-6 font-poppins">
                        <div
                            role="alert"
                            className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                        >
                            <IonIcon
                                icon={alertCircleOutline}
                                className="text-red-400 text-lg mt-0.5 shrink-0"
                                aria-hidden="true"
                            />
                            <span className="text-sm text-red-700 leading-relaxed">
                                {preloadErrorCopy}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                {m['common.close']()}
                            </button>
                            <button
                                onClick={preLoadAssessment}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                {m['common.tryAgain']()}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div ref={qaItemsRef}>
                        <AiAssessmentQAItems
                            activeStep={activeStep}
                            assessmentQA={assessmentQA}
                            currentQuestionIndex={currentQuestionIndex}
                            onAnswerChange={handleAnswerChange}
                        />
                    </div>
                )}
            </AiAssessmentLayout>
        );
    }

    return (
        <>
            {isFinishingAssessment && isMobile && (
                <AiSessionLoader
                    topicRecord={session?.record || topicRecord}
                    overrideText={finishedAssessmentText}
                />
            )}
            <div
                className={`h-screen bg-transparent relative flex items-center flex-col justify-end ${
                    isDesktop ? 'pb-[30px]' : ''
                }`}
            >
                {isMobile && (
                    <AiAssessmentHeader
                        topicRecord={topicRecord}
                        topicVc={topicVc}
                        session={session}
                        showBackButton={activeStep === AiAssessmentStepEnum.assessmentQA}
                    />
                )}
                {assessmentEl}
                {activeStep === AiAssessmentStepEnum.assessmentIntro && (
                    <StartAssessmentButton handleStartAssessment={handleStartAssessment} />
                )}
                {activeStep === AiAssessmentStepEnum.assessmentQA &&
                    assessmentQA[currentQuestionIndex]?.type === AiAssesmentQuestionTypeEnum.text &&
                    !assessmentQA[lastQuestionIndex]?.answer && (
                        <AssessmentAnswerInput
                            handleAnswer={handleAnswerChange}
                            index={currentQuestionIndex}
                            scrollTo={scrollTo}
                        />
                    )}
                {activeStep === AiAssessmentStepEnum.assessmentQA &&
                    assessmentQA[currentQuestionIndex]?.type ===
                        AiAssesmentQuestionTypeEnum.multipleChoice &&
                    !assessmentQA[lastQuestionIndex]?.answer && (
                        <AssessmentMultipleChoiceAnswers
                            assessmentQA={assessmentQA}
                            handleAnswer={handleAnswerChange}
                            index={currentQuestionIndex}
                        />
                    )}
            </div>
        </>
    );
};

export default AiAssessmentContainer;
