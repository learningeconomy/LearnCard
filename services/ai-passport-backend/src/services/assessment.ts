import type { VC } from '@learncard/types';
import {
    AssessmentQuestionsSchema,
    type AiAssessmentQuestionType,
    type AiAssesmentQuestionType,
} from '../ai/generation-schemas';
import { searchCredentialsByTopic } from './credentialSearch';
import { aiCall, streamingAiCall } from '../ai';
import { getLearnCard } from '../learncard';
import { createAndPublishBoostCredential } from '../learncard/boost-helpers';
import {
    projectCredential,
    serializeModelSafeCredentialProjection,
} from '../credentials/projection';

import { assertCurrentAiConsent, getCurrentAiSubject } from '../ai/privacy';
import { verifyCredentialForIngestion, fingerprintCredential } from '../credentials/verification';
import { PLANNING_MODEL } from '../constants/env';

export const DUMMY_SESSION_ASSESSMENT: AiAssessmentQuestionType[] = [
    {
        id: 1,
        title: '**Concept Mastery** 💡',
        question:
            'What was the most important concept you learned in this session? Feel free to use bullet points:\n\n- Idea 1\n- Idea 2',
        type: 'text',
        choices: null,
    },
    {
        id: 2,
        title: '_Challenge Reflection_ 🚧',
        question:
            'Which part of the material did you find most challenging, and **why**?\n\nTry to explain using examples like `functionName(args)` or reference concepts like $E = mc^2$.',
        type: 'text',
        choices: null,
    },
    {
        id: 3,
        title: '🚀 Most Effective Learning Method',
        question: 'Which of the following methods helped you the most during this session?',
        type: 'multipleChoice',
        choices: [
            '**Videos**',
            'Articles with `code examples`',
            '💡 Interactive exercises',
            'Group discussions with peers',
        ],
    },
    {
        id: 4,
        title: '🌍 Real-World Application',
        question:
            'Can you describe a **real-world** scenario where you would apply something from this session?\n\nYou may use:\n- bullet points\n- numbered steps\n- or even a small formula like $\\frac{a}{b}$.',
        type: 'text',
        choices: null,
    },
    {
        id: 5,
        title: '❓ Lingering Questions',
        question:
            "What's **one** question you still have after completing this session?\n\n_(It could be about the topic, the tools, or even how to go deeper.)_",
        type: 'text',
        choices: null,
    },
];

export const generateAiAssessment = async (did: string, summaryVc: VC) => {
    if (getCurrentAiSubject() !== did) throw new Error('Authenticated assessment owner required');
    const learnCard = await getLearnCard();
    const consent = await assertCurrentAiConsent('model-inference');
    const verification = await verifyCredentialForIngestion({
        credential: summaryVc,
        credentialUri:
            typeof summaryVc.id === 'string'
                ? summaryVc.id
                : `sha256:${fingerprintCredential(summaryVc)}`,
        subjectDid: did,
        consent,
        verify: original => learnCard.invoke.verifyCredential(original),
    });
    const summaryProjection = projectCredential(summaryVc, 'Session Summary', verification);
    // Safely extract title from summaryVc
    let title = '';

    if (summaryVc.summaryInfo?.title) {
        title = summaryVc.summaryInfo.title;
    } else if (summaryVc.credentialSubject) {
        const subject = Array.isArray(summaryVc.credentialSubject)
            ? summaryVc.credentialSubject[0]
            : summaryVc.credentialSubject;

        if (subject && typeof subject === 'object' && 'achievement' in subject) {
            const achievement = subject.achievement;
            if (achievement && typeof achievement === 'object' && 'name' in achievement) {
                title = String(achievement.name);
            }
        }
    }

    const credentials = await searchCredentialsByTopic(title, did);
    const credentialsForModel = credentials.map(({ context, title, type }) => ({
        context,
        title,
        type,
    }));

    const assessment = await aiCall({
        model: PLANNING_MODEL,
        systemPrompt: `Create a structured assessment for a single 5-30 minute session.
    Here is an example: ${JSON.stringify(DUMMY_SESSION_ASSESSMENT)}

    DO NOT use the example directly.`,
        message: `Generate an assessment based on the following session summary and the user’s existing credentials.

Session summary: ${serializeModelSafeCredentialProjection(summaryProjection)}

User’s existing credentials: ${JSON.stringify(credentialsForModel)}`,
        output: AssessmentQuestionsSchema,
    });

    return assessment;
};

export type AssessmentQA = {
    id?: string;
    title?: string;
    question: string;
    type?: AiAssesmentQuestionType;
    answer: string;
    choices?: string[];
};

export const completeAssessment = async ({
    did,
    // TODO: Why is this unused?
    session: _session,
    sessionUri,
    assessmentQA,
}: {
    did: string;
    session: any;
    sessionUri: string;
    assessmentQA: AssessmentQA[];
}) => {
    // Generate AI summary of the assessment
    const result = await streamingAiCall({
        model: PLANNING_MODEL,
        systemPrompt: `You are an expert learning assistant. Analyze the following assessment questions and answers to generate a concise summary of the user's learning progress and understanding.`,
        message: [
            {
                role: 'user',
                content: `Assessment Questions and Answers:\n\n${assessmentQA
                    .map(
                        q =>
                            `Q: ${q.question}\nA: ${q.answer}${q.choices ? `\nChoices: ${q.choices.join(', ')}` : ''}`
                    )
                    .join(
                        '\n\n'
                    )}\n\nPlease provide a concise summary of the user's understanding and progress.`,
            },
        ],
        options: { accumulateContent: true },
    });

    const learnCard = await getLearnCard();

    // Create the assessment credential
    // Define the credential type with boostId
    type AssessmentCredential = {
        '@context': any[];
        id: string;
        type: [string, ...string[]];
        issuer: string;
        issuanceDate: string;
        credentialSubject: { id: string };
        assessment: {
            sessionUri: string;
            questions: AssessmentQA[];
            result: string;
        };
        boostId?: string;
    } & Record<string, any>;

    const unsignedVc: AssessmentCredential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                lcn: 'https://docs.learncard.com/definitions#',
                AssessmentCredential: {
                    '@id': 'lcn:assessmentCredential',
                    '@context': {
                        boostId: {
                            '@id': 'lcn:boostId',
                            '@type': 'xsd:string',
                        },
                        assessment: {
                            '@id': 'lcn:assessment',
                            '@context': {
                                sessionUri: {
                                    '@id': 'lcn:sessionUri',
                                    '@type': 'xsd:anyURI',
                                },
                                summary: {
                                    '@id': 'lcn:assessment-summary',
                                    '@type': 'xsd:string',
                                },
                                result: {
                                    '@id': 'lcn:assessment-result',
                                    '@type': 'xsd:string',
                                },
                                questions: {
                                    '@id': 'lcn:questions',
                                    '@container': '@set',
                                    '@context': {
                                        id: {
                                            '@id': 'lcn:assessment-question-id',
                                            '@type': 'xsd:string',
                                        },
                                        title: {
                                            '@id': 'lcn:assessment-question-title',
                                            '@type': 'xsd:string',
                                        },
                                        question: {
                                            '@id': 'lcn:assessment-question',
                                            '@type': 'xsd:string',
                                        },
                                        type: {
                                            '@id': 'lcn:assessment-question-type',
                                            '@type': 'xsd:string',
                                        },
                                        answer: {
                                            '@id': 'lcn:answer',
                                            '@type': 'xsd:string',
                                        },
                                        choices: {
                                            '@id': 'lcn:choices',
                                            '@container': '@set',
                                            '@type': 'xsd:string',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: `http://example.org/credentials/assessment-${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'AssessmentCredential'] as [string, ...string[]],
        issuer: learnCard.id.did(),
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: did },
        assessment: {
            sessionUri,
            questions: assessmentQA,
            result: result || 'No summary available',
        },
    };

    const { boostUri, contractCredentialUri } = await createAndPublishBoostCredential({
        unsignedVc,
        did,
        boostOptions: {
            status: 'LIVE',
            category: 'ai-assessment',
        },
        parentBoostUri: sessionUri,
    });

    return {
        success: true,
        credentialUri: contractCredentialUri,
        boostUri,
        assessment: {
            ...unsignedVc.assessment,
            result,
        },
    };
};
