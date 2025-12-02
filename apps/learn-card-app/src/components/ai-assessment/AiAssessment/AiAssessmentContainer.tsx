import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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
        (assessment || []).map(q => ({ ...q, answer: '' }))
    );
    const [isPreLoadingAssessment, setIsPreLoadingAssessment] = useState(false);
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

    const handleFinishAssessment = async () => {
        const learnCard = await initWallet();
        aiLoadingStore.set.isFinishingAssessment(true);

        try {
            const _isAlreadyCompleted = await isAlreadyCompleted();
            if (_isAlreadyCompleted) return;

            await finishAssessment(
                {
                    did: learnCard.id.did(),
                    assessmentQA,
                    session: session.vc,
                    sessionUri: session.boost.uri,
                },
                {
                    onSettled: () => {
                        aiLoadingStore.set.isFinishingAssessment(false);
                    },
                }
            );
        } catch (error) {
            console.error('[Assessment] Finish failed:', error);
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
            await handleFinishAssessment();
        }
    };

    const preLoadAssessment = async () => {
        try {
            setIsPreLoadingAssessment(true);
            aiLoadingStore.set.isFinishingAssessment(false);

            const learnCard = await initWallet();
            const summaryCredential = session?.vc?.boostCredential;
            const boostId = summaryCredential?.boostId;

            const cached = queryClient.getQueryData<AiAssessmentQuestion[]>([
                'assessment',
                boostId,
            ]);

            if (cached) {
                setAssessmentQA(cached);

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
                });

                if (assessment) setAssessmentQA(assessment);
                setAllPrefilled(false);
            }

            setIsPreLoadingAssessment(false);
        } catch (error) {
            console.error('Error preloading assessment:', error);
            setIsPreLoadingAssessment(false);
            setAllPrefilled(false);
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
                <AiAssessmentIntro session={session.vc} />
                {isPreLoadingAssessment ? (
                    <div ref={qaItemsRef}>
                        <AiSessionLoader
                            topicRecord={session?.record || topicRecord}
                            overrideText={preLoadingAssessmentText}
                            isInline
                        />
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
                className={`h-[100vh] bg-transparent relative flex items-center flex-col justify-end ${
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
