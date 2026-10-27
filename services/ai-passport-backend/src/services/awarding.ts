import { assertPrivacyLocale } from '../ai/privacy-language';
import { withPrivacyOperation } from '../ai/privacy-diagnostics';
import { withPrivacyInputOrigin } from '../ai/privacy-diagnostics';
import { compactInsightEvidence } from './insightCompactionRuntime';
import {
    prepareInsightEvidence,
    InsightCompactionError,
    InsightCompactionStatsValidator,
    type InsightEvidencePlan,
    type InsightCompactionStats,
} from './insightCompaction';
import { normalizeAiLocale, getCurrentLocale } from '../ai/locale';
import { withAiInsightStage } from '../diagnostics/ai-insight';
import type { ChatMessage, UnsignedVC, VC } from '@learncard/types';
import type { DBCredentialRecord } from '../db';
import { VCValidator } from '@learncard/types';
import { db } from '../db';
import { aiCall } from '../ai';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants';
import type { ServerWebSocket } from 'bun';
import { getLearnCard } from '../learncard';
import { createAndPublishBoostCredential } from '../learncard/boost-helpers';
import { CATEGORY_MAP } from '../credentials/helpers';
import { CHAT_MODEL } from '../constants/env';
import { searchCredentialsByTopic } from './credentialSearch';
import {
    NoEligibleInsightInputsError,
    type InsightInputCoverage,
} from '../credentials/insight-eligibility';
import { fetchCredentials, fetchInsightCredentials } from '../credentials/service';
import { createHash } from 'node:crypto';
import { OPEN_SYLLABUS_FIELDS } from '../helpers/openSyllabus.helpers';
import { withDistributedSingleFlight } from '../utils/distributedSingleFlight';
import {
    getCredentialProjection,
    getPromptCredentialProjection,
    serializeModelSafeCredentialProjection,
    projectCredential,
    serializeModelSafeCredentialRecords,
} from '../credentials/projection';
import { assertCurrentAiConsent } from '../ai/privacy';
import { AiConsentError } from '../learncard/consent';
import { assertOwnerOperationActive } from './dataErasure';
import { verifyCredentialForIngestion } from '../credentials/verification';
import { getPrivacySubjectRef } from '../ai/privacy-keys';
import {
    AIInsightDataValidator,
    SummaryCredentialDataValidator,
    CredentialIssuanceSchemas,
    type SummaryCredentialData,
} from '../ai/generation-schemas';

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    return value as Record<string, unknown>;
};

const normalizeText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

/**
 * Factory function to create Topic credential structure with JSON-LD context
 */
export function createTopicVCStructure(
    issuerDid: string,
    subjectDid: string,
    topicTitle: string,
    threadId: string
): UnsignedVC {
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://ctx.learncard.com/boosts/1.0.1.json',
            {
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                lcn: 'https://docs.learncard.com/definitions#',
                TopicCredential: {
                    '@id': 'lcn:topicCredential',
                    '@context': {
                        boostId: {
                            '@id': 'lcn:boostId',
                            '@type': 'xsd:string',
                        },
                        topicInfo: {
                            '@id': 'lcn:topicInfo',
                            '@context': {
                                title: {
                                    '@id': 'lcn:title',
                                    '@type': 'xsd:string',
                                },
                                threadId: {
                                    '@id': 'lcn:threadId',
                                    '@type': 'xsd:string',
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'TopicCredential', 'BoostCredential'],
        issuer: issuerDid,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: subjectDid },
        topicInfo: {
            title: topicTitle,
            threadId: threadId,
        },
    };
}

/**
 * Factory function to create Summary credential structure with JSON-LD context
 */
export function createSummaryVCStructure(
    issuerDid: string,
    subjectDid: string,
    summaryData: SummaryCredentialData
): UnsignedVC {
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://ctx.learncard.com/boosts/1.0.1.json',
            {
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                lcn: 'https://docs.learncard.com/definitions#',
                SummaryCredential: {
                    '@id': 'lcn:summaryCredential',
                    '@context': {
                        boostId: {
                            '@id': 'lcn:boostId',
                            '@type': 'xsd:string',
                        },
                        summaryInfo: {
                            '@id': 'lcn:summaryInfo',
                            '@context': {
                                title: {
                                    '@id': 'lcn:title',
                                    '@type': 'xsd:string',
                                },
                                summary: {
                                    '@id': 'lcn:summary',
                                    '@type': 'xsd:string',
                                },
                                learned: {
                                    '@id': 'lcn:learned',
                                    '@container': '@set',
                                    '@type': 'xsd:string',
                                },
                                skills: {
                                    '@id': 'lcn:skillsSummary',
                                    '@container': '@set',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:skillsSummaryTitle',
                                            '@type': 'xsd:string',
                                        },
                                        description: {
                                            '@id': 'lcn:skillsSummaryDescription',
                                            '@type': 'xsd:string',
                                        },
                                    },
                                },
                                reflections: {
                                    '@id': 'lcn:reflections',
                                    '@container': '@set',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:reflectionTitle',
                                            '@type': 'xsd:string',
                                        },
                                        description: {
                                            '@id': 'lcn:reflectionDescription',
                                            '@type': 'xsd:string',
                                        },
                                    },
                                },
                                nextSteps: {
                                    '@id': 'lcn:nextSteps',
                                    '@container': '@set',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:nextStepsTitle',
                                            '@type': 'xsd:string',
                                        },
                                        description: {
                                            '@id': 'lcn:nextStepsDescription',
                                            '@type': 'xsd:string',
                                        },
                                        keywords: {
                                            '@id': 'lcn:nextStepsKeywords',
                                            '@context': {
                                                occupations: {
                                                    '@id': 'lcn:nextStepsOccupationKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                careers: {
                                                    '@id': 'lcn:nextStepsCareerKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                jobs: {
                                                    '@id': 'lcn:nextStepsJobKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                skills: {
                                                    '@id': 'lcn:nextStepsSkillKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                fieldOfStudy: {
                                                    '@id': 'lcn:nextStepsFieldOfStudy',
                                                    '@type': 'xsd:string',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'SummaryCredential', 'BoostCredential'],
        issuer: issuerDid,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: subjectDid },
        summaryInfo: summaryData,
    };
}

export const buildCompactSummaryWithStats = (vcs: DBCredentialRecord[], _userDid?: string) => {
    const summary = vcs
        .map(
            (credential, index) =>
                `credential-${index + 1}: ${serializeModelSafeCredentialProjection(
                    getPromptCredentialProjection(credential)
                )}`
        )
        .join('\n');
    const originalChars = vcs.reduce(
        (total, credential) => total + credential.rawCredentialJson.length,
        0
    );
    const compactChars = summary.length;
    const compactionPercent = originalChars
        ? Math.max(0, Math.round((1 - compactChars / originalChars) * 1000) / 10)
        : 0;

    return { summary, originalChars, compactChars, compactionPercent };
};

/**
 * Generate a structured summary of a conversation that can be included in a verifiable credential
 * @param did The user's DID
 * @param messages The full conversation history
 * @param threadId The ID of the thread containing these messages
 * @param issuedCredential Whether a credential was issued (if applicable)
 * @returns A structured summary object
 */
export const generateConversationSummary = async (
    did: string,
    messages: ChatMessage[],
    threadId: string | null = null
): Promise<SummaryCredentialData> => {
    // Get conversation title if we have a threadId
    let conversationTitle = null;
    if (threadId) {
        // Get threads for this user
        const threads = await db.getThreads(did);
        const thread = threads.find(t => t.id === threadId);
        conversationTitle = thread?.title || null;
    }

    // Get all processed credentials for this user
    const credentials = threadId
        ? await db.getThreadCredentials(did, threadId)
        : await searchCredentialsByTopic(conversationTitle || '', did);
    const credentialsForModel = credentials.map(credential => {
        const record = asRecord(credential);

        return {
            context: normalizeText(record?.context ?? record?.aiContext),
            title: normalizeText(record?.title),
            type: normalizeText(record?.type ?? record?.category),
        };
    });

    // Format the messages for AI processing
    const formattedMessages = messages.map(msg => {
        const messageObj: any = {
            role: msg.role,
            content: msg.content,
        };

        // Handle tool calls and responses
        if (msg.tool_calls) {
            messageObj.tool_calls = msg.tool_calls;
            delete messageObj.content;
        }

        if (msg.tool_call_id) {
            messageObj.tool_call_id = msg.tool_call_id;
        }

        return messageObj;
    });

    // Use the conversation title that was generated when the plan was created
    const summaryTitle = conversationTitle || 'Learning Achievement';

    const fieldsOfStudy = OPEN_SYLLABUS_FIELDS.join(', ');

    // Generate the structured summary
    try {
        const summary = await aiCall({
            model: CHAT_MODEL,
            systemPrompt: `
      You are an expert educational summarizer. Your task is to create a structured summary of a 
      learning conversation. This summary will be used in a verifiable credential that represents
      what the learner has achieved in this conversation.

      The summary should extract:
      1. A clear and concise title of what was learned
      2. A comprehensive summary of the key learning moments
      3. Specific points of knowledge the user gained
      4. Categorized skills they demonstrated or developed
      5. Logical next steps to continue their learning journey
      6. Reflections on the learning experience

      For EACH "nextSteps" item, you MUST include keyword metadata to support career, job, and course discovery.
      Keywords are REQUIRED and should be inferred from the conversation content and learning demonstrated.

      Required keyword metadata:
      - keywords.occupations: 1–3 standardized occupation titles that relate to the skills learned
        (e.g., "Software Developer", "Data Analyst", "UX Designer")
      - keywords.careers: 1–3 broader career pathway titles that align with the learning direction
        (e.g., "Technology", "Data Science", "Creative Design")
      - keywords.jobs: 1–3 concrete job role phrases that could benefit from these skills
        (e.g., "Frontend Developer", "Junior Data Scientist", "UI/UX Designer")
      - keywords.skills: 3–6 specific technical or professional skills demonstrated in the conversation
        (e.g., "JavaScript", "React", "Data Visualization", "Problem Solving")

      Rules for keywords:
      - Keywords MUST be grounded in the conversation topics and demonstrated learning
      - Infer relevant occupations, careers, and jobs based on the actual skills discussed
      - Even if the learner is a beginner, suggest realistic entry-level roles and pathways
      - Only use empty arrays if the conversation is completely unrelated to any career path
      - Keywords should be suitable for querying labor-market, salary, and training APIs
      - Be specific and actionable; avoid generic terms like "professional" or "expert"

      OpenSyllabus field selection (REQUIRED for each nextSteps item):
      - Include fieldOfStudy: exactly ONE field of study selected from the allowed list
      - fieldOfStudy MUST be logically derived from the keyword metadata you generate

      Field alignment rules:
      - The fieldOfStudy must directly align with the dominant themes in:
        - keywords.skills
        - keywords.jobs
        - keywords.occupations
      - Choose the academic discipline most likely to offer coursework that deepens the skills learned
      - Do NOT select a fieldOfStudy that contradicts the keyword metadata
      - Do NOT default to a field unless it is clearly supported by the skills and roles
      - If learning spans multiple disciplines, select the single field that best supports the PRIMARY skill set
      - If no single field is dominant, choose the closest reasonable match rather than returning nothing

      Allowed OpenSyllabus fields (select ONE only):
      ${fieldsOfStudy}

      The user has the following past credential projections:
      ${JSON.stringify(credentialsForModel)}

      Be factual, educational, and motivational.
      Use clear, concise language appropriate for a learning platform.
      `,
            message: formattedMessages,
            output: SummaryCredentialDataValidator,
        });

        console.log('Generated summary: ', JSON.stringify(summary, null, 2));

        // Use our generated summary title
        if (summaryTitle) {
            summary.title = summaryTitle;
        }

        return summary;
    } catch (error) {
        console.error('Error generating conversation summary:', error);

        // A failed generation is not evidence of learning, including when privacy
        // checks or cancellation stop the operation. Let callers handle the failure.
        throw error;
    }
};

export const awardVc = async (
    ws: ServerWebSocket<{ did: string }>,
    messages: ChatMessage[],
    parentTopicUri?: string
): Promise<false | VC> => {
    const { did } = ws.data;

    const credentials = await fetchCredentials(did);

    try {
        // Map the messages properly preserving tool calls and responses
        const formattedMessages = messages.map(msg => {
            const messageObj: any = {
                role: msg.role,
                content: msg.content,
            };

            // If this is a tool call message
            if (msg.tool_calls) {
                messageObj.tool_calls = msg.tool_calls;
                delete messageObj.content;
            }

            // If this is a tool response message
            if (msg.tool_call_id) {
                messageObj.tool_call_id = msg.tool_call_id;
            }

            return messageObj;
        });

        // Use the generic aiCall function with multiple possible output schemas
        const result = await aiCall({
            systemPrompt: `
You are looking at a conversation between a user and a socratic assistant designed to get the user to
learn. You will also be given a list of credentials that the user has shared as having already learned.
Your job is to decide if the user has just demonstrated some level of objective learning, and if so,
issue them a new VC. You can not decide that a user has learned from just one message, they _must_
show growth across multiple messages.

Right now, this is a testing build, so you should be handing out credentials often so that I can test out the rest of this system.

Here are the user's shared credential projections: ${serializeModelSafeCredentialRecords(credentials)}`,
            message: formattedMessages,
            output: CredentialIssuanceSchemas,
            model: CHAT_MODEL,
        });

        // If result has a "reason" property, it's the NoCredentialSchema result
        if ('reason' in result) {
            console.log('No credential issued:', result.reason);
            return false;
        }

        // Otherwise, it's a credential to issue
        const parameters = result;
        const learnCard = await getLearnCard();

        // Create the credential
        const unsignedVc = learnCard.invoke.newCredential({
            ...parameters,
            type: 'boost',
            did: learnCard.id.did(),
            subject: did,
            issuanceDate: new Date().toISOString(),
        });

        const category = CATEGORY_MAP[parameters.achievementType] || 'Achievement';

        // Use createChildBoost if parentTopicUri is provided
        const { signedVc: vc } = await createAndPublishBoostCredential({
            unsignedVc,
            did,
            boostOptions: {
                status: 'LIVE',
                category,
            },
            parentBoostUri: parentTopicUri,
        });

        // Send the issued VC to the client
        ws.send(
            JSON.stringify({
                event: 'vc_issued',
                vc,
            })
        );

        return vc;
    } catch (error) {
        console.error('Error in credential awarding:', error);
        return false;
    }
};

/**
 * Send a generated conversation summary to a client
 * @param ws WebSocket connection
 * @param did The user's DID
 * @param messages The conversation messages
 * @param threadId The thread ID (if available)
 * @param credential Whether a credential was issued for this conversation
 * @param parentTopicUri The parent topic URI (if available)
 */
const createLearningPathwayCredentials = async (
    did: string,
    parentSessionUri: string,
    summary: SummaryCredentialData
): Promise<string[]> => {
    const learnCard = await getLearnCard();
    const pathwayUris: string[] = [];

    await Promise.all(
        summary.nextSteps.map(async (step, i) => {
            const normalizedKeywords = {
                occupations: step.keywords.occupations ?? [],
                careers: step.keywords.careers ?? [],
                jobs: step.keywords.jobs ?? [],
                skills: step.keywords.skills ?? [],
                fieldOfStudy: step.keywords.fieldOfStudy ?? null,
            };

            // Create the unsigned VC with proper JSON-LD structure
            const unsignedVc: UnsignedVC = {
                '@context': [
                    'https://www.w3.org/2018/credentials/v1',
                    {
                        type: '@type',
                        xsd: 'https://www.w3.org/2001/XMLSchema#',
                        lcn: 'https://docs.learncard.com/definitions#',
                        LearningPathwayCredential: {
                            '@id': 'lcn:learningPathwayCredential',
                            '@context': {
                                boostId: {
                                    '@id': 'lcn:boostId',
                                    '@type': 'xsd:string',
                                },
                                learningPathway: {
                                    '@id': 'lcn:learningPathway',
                                    '@context': {
                                        stepIndex: {
                                            '@id': 'lcn:stepIndex',
                                            '@type': 'xsd:integer',
                                        },
                                        step: {
                                            '@id': 'lcn:step',
                                            '@context': {
                                                title: {
                                                    '@id': 'lcn:title',
                                                    '@type': 'xsd:string',
                                                },
                                                description: {
                                                    '@id': 'lcn:description',
                                                    '@type': 'xsd:string',
                                                },
                                                summary: {
                                                    '@id': 'lcn:summary',
                                                    '@type': 'xsd:string',
                                                },
                                                learned: {
                                                    '@id': 'lcn:learned',
                                                    '@container': '@set',
                                                    '@type': 'xsd:string',
                                                },
                                                skills: {
                                                    '@id': 'lcn:skills',
                                                    '@container': '@set',
                                                    '@context': {
                                                        title: {
                                                            '@id': 'lcn:skillTitle',
                                                            '@type': 'xsd:string',
                                                        },
                                                        description: {
                                                            '@id': 'lcn:skillDescription',
                                                            '@type': 'xsd:string',
                                                        },
                                                    },
                                                },
                                                keywords: {
                                                    '@id': 'lcn:Keywords',
                                                    '@context': {
                                                        occupations: {
                                                            '@id': 'lcn:OccupationKeywords',
                                                            '@type': 'xsd:string',
                                                            '@container': '@set',
                                                        },
                                                        careers: {
                                                            '@id': 'lcn:CareerKeywords',
                                                            '@type': 'xsd:string',
                                                            '@container': '@set',
                                                        },
                                                        jobs: {
                                                            '@id': 'lcn:JobKeywords',
                                                            '@type': 'xsd:string',
                                                            '@container': '@set',
                                                        },
                                                        skills: {
                                                            '@id': 'lcn:SkillKeywords',
                                                            '@type': 'xsd:string',
                                                            '@container': '@set',
                                                        },
                                                        fieldOfStudy: {
                                                            '@id': 'lcn:FieldOfStudy',
                                                            '@type': 'xsd:string',
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
                id: `http://example.org/credentials/learning-pathway-${crypto.randomUUID()}`,
                type: ['VerifiableCredential', 'LearningPathwayCredential'],
                issuer: learnCard.id.did(),
                issuanceDate: new Date().toISOString(),
                credentialSubject: { id: did },
                learningPathway: {
                    stepIndex: i,
                    step: {
                        ...step,
                        title: step.title,
                        description: step.description,
                        keywords: normalizedKeywords,
                        summary: summary.summary,
                        learned: summary.learned,
                        skills: summary.skills,
                    },
                },
            };

            const { contractCredentialUri } = await createAndPublishBoostCredential({
                unsignedVc,
                did,
                boostOptions: {
                    status: 'LIVE',
                    category: 'learning-pathway',
                },
                parentBoostUri: parentSessionUri,
            });

            // Store the credential URI
            pathwayUris.push(contractCredentialUri);
        })
    );

    return pathwayUris;
};

type SummarySocket = Pick<ServerWebSocket<{ did: string }>, 'send'>;

export const sendConversationSummary = async (
    ws: SummarySocket,
    did: string,
    messages: ChatMessage[],
    threadId: string | null,
    parentTopicUri?: string
): Promise<void> => {
    try {
        console.log(`🔔 sendConversationSummary called for thread ${threadId} by DID ${did}`);

        // Check if we already have a summary credential for this thread
        if (threadId) {
            const existingSummaries = await db.getThreadSummaryCredentials(did, threadId);
            if (existingSummaries.length > 0) {
                console.log(
                    `⚠️ Thread ${threadId} already has ${existingSummaries.length} summaries, using existing`
                );
                // Use the most recent summary
                const latestSummary = existingSummaries[0];
                ws.send(
                    JSON.stringify({
                        event: 'conversation_summary',
                        summary: JSON.parse(latestSummary.summary_data),
                        credentialUri: latestSummary.credential_uri,
                        threadId,
                        isDuplicate: true, // Let the client know this is an existing summary
                    })
                );
                return; // Skip creating a new summary
            }
        }

        // Guard: ensure at least one user-authored message exists
        const hasUserMessage = messages.some(
            msg =>
                msg.role === 'user' &&
                typeof msg.content === 'string' &&
                msg.content.trim().length > 0
        );

        if (!hasUserMessage) {
            console.log(`⏭️ Skipping summary for thread ${threadId}: no user messages`);

            ws.send(
                JSON.stringify({
                    event: 'no_conversation_summary',
                    reason: 'No user messages were found in the conversation.',
                    threadId,
                })
            );

            return;
        }

        console.log(`✅ Generating new summary for thread ${threadId}`);

        // Generate a new summary if none exists
        const summary = await generateConversationSummary(did, messages, threadId);
        const learnCard = await getLearnCard();

        const unsignedVc = createSummaryVCStructure(learnCard.id.did(), did, summary);

        // When creating the summary boost, use createChildBoost if parentTopicUri is provided
        const { boostUri, contractCredentialUri } = await createAndPublishBoostCredential({
            unsignedVc,
            did,
            boostOptions: {
                status: 'LIVE',
                category: 'ai-summary',
            },
            parentBoostUri: parentTopicUri,
        });

        console.log('Unsigned VC:');
        console.log(JSON.stringify(unsignedVc));

        const credentialUri = contractCredentialUri;

        // Send the summary to the client
        ws.send(
            JSON.stringify({
                event: 'conversation_summary',
                summary,
                credentialUri,
                threadId,
            })
        );

        // Store the summary credential against the thread if we have a threadId
        if (threadId) {
            try {
                // Store the summary credential
                await db.storeThreadSummaryCredential(
                    did,
                    threadId,
                    JSON.stringify(summary),
                    credentialUri
                );

                // Create learning pathway credentials for each next step
                const pathwayUris = await createLearningPathwayCredentials(did, boostUri, summary);

                // Send pathway URIs to the client
                ws.send(
                    JSON.stringify({
                        event: 'learning_pathways_created',
                        pathwayUris,
                        threadId,
                    })
                );
            } catch (error) {
                console.error('Error in summary credential processing:', error);
                // Continue even if storage fails, as we've already sent the summary to the client
            }
        }
    } catch (error) {
        console.error('Error generating or sending conversation summary:', error);
        throw error;
    }
};

/**
 * Generate AI insights credential from user's existing credentials
 * @param did The user's DID
 * @returns A verifiable credential containing AI-generated insights
 */
const generateAIInsightCredentialForSnapshot = async (
    did: string,
    allVcs: DBCredentialRecord[],
    sourceFingerprint: string,
    prompt: { message: string; stats: InsightCompactionStats }
): Promise<{
    vc: VC;
    compaction: {
        originalChars: number;
        compactChars: number;
        compactionPercent: number;
    };
} | null> => {
    const vcs = allVcs.filter(vc => vc.category !== AI_INSIGHT_CREDENTIAL_TYPE);

    if (!vcs || vcs.length === 0) {
        console.log(
            `[generateAIInsightCredential] No credentials found for analysis for DID ${did}`
        );
        return null;
    }

    const learnCard = await withAiInsightStage('issuance', () => getLearnCard());

    // Prepare compact credential data for AI analysis (with stats)
    const originalChars = vcs.reduce(
        (total, credential) => total + credential.rawCredentialJson.length,
        0
    );
    const compactChars = prompt.message.length;
    const compactionPercent = originalChars
        ? Math.max(0, Math.round((1 - compactChars / originalChars) * 1000) / 10)
        : 0;

    const fieldsOfStudy = OPEN_SYLLABUS_FIELDS.join(', ');
    const credentialUriByAlias = new Map(
        vcs.map((credential, index) => [`credential-${index + 1}`, credential.uri])
    );

    // Generate AI insights with structured output
    const insights = await withAiInsightStage('generation', () =>
        aiCall({
            systemPrompt: `You are an expert career and education analyst.
    Your task is to produce three sections — Strongest Area, Weakest Area, and Room for Growth — based strictly on the provided verified evidence and cohort summaries. Source-group numbers preserve contributing provenance, not proof that every aggregate claim applies to every member.
    Your stated goals, professional title, and self-assigned skills are within the supplied evidence where present.
    Treat those stated details as the baseline truth for advice and planning.
    Use the credentials as evidence of demonstrated experience, but do not let them override your stated identity, goals, or self-assessment unless there is a direct contradiction that matters for safety or clarity.
    If the credentials do not independently prove a stated title or goal, do not frame that as a correction; instead, base the advice on the stated role and use the credentials to suggest next steps, gaps, or validation paths.
    If there is a direct contradiction between the stated details and the credentials, mention it briefly and respectfully, then continue with advice centered on your stated direction.
    Write all narrative guidance in second person. Avoid phrases like "the user"; use "you" instead.
    You must also craft a concise general summary (2-4 sentences) that captures a high-level narrative of your profile.
    You must also include a list of ~3-5 credential aliases for Learning Pathways to continue.

    Learning Pathways selection rules:
    - If a distinct Strongest Area can be identified, Learning Pathways MUST be selected exclusively to deepen, specialize, or advance the skills, job roles, or occupations identified in the Strongest Area.
    - If no single Strongest Area is clearly dominant, select Learning Pathways that reinforce the most consistently evidenced skills or occupational themes appearing across multiple credentials.
    - In all cases, prioritize pathways that represent:
      - advanced skill development
      - specialization within the same occupational family
      - career progression or increased responsibility

    Learning Pathways MUST use aliases derived from the provided source-group catalog, such as credential-1. Use an alias only when its contributing evidence clearly supports the pathway; leave ambiguous cohort-level matches empty.
    If no learning pathways reasonably align with the evidenced skills or occupations, return an empty array.

    ────────────────────────────────────────
    Field of Study selection (REQUIRED)
    ────────────────────────────────────────
    - Include fieldOfStudy for EACH of the following sections:
      - strongestArea
      - weakestArea
      - roomForGrowth

    - fieldOfStudy MUST be exactly ONE value selected from the allowed OpenSyllabus fields list.
    - fieldOfStudy MUST be logically derived from the section’s keyword metadata.

    Field alignment rules:
    - fieldOfStudy must directly align with the dominant themes in:
      - keywords.skills
      - keywords.jobs
      - keywords.occupations
    - Choose the academic discipline most likely to offer coursework that:
      - deepens the skills in Strongest Area
      - addresses gaps in Weakest Area
      - enables progression in Room for Growth
    - Do NOT select a field that contradicts the keyword evidence.
    - Do NOT default to a field unless clearly supported.
    - If multiple disciplines apply, choose the single best primary match.

    Allowed OpenSyllabus fields (select ONE only):
    ${fieldsOfStudy}

    ────────────────────────────────────────
    Section requirements
    ────────────────────────────────────────
    For each section:
    - Title: 3–7 words, specific, noun- or skill-focused (no vague adjectives).
    - Summary: 1–2 crisp, evidence-based sentences focused on overarching capabilities.
    - Keywords (REQUIRED):
      - keywords.occupations: 1–3 standardized occupation titles
        (e.g., "Software Engineer", "Marketing Manager", "Financial Analyst")
      - keywords.careers: 1–3 broader career pathway titles
        (e.g., "Technology & Engineering", "Business & Marketing")
      - keywords.jobs: 1–3 concrete job role phrases
        (e.g., "Full Stack Developer", "Digital Marketing Specialist")
      - keywords.skills: 3–6 specific technical or professional skills
        (e.g., "Python Programming", "React State Management")

    Keyword rules:
    - Infer keywords strictly from credential evidence.
    - Do NOT leave arrays empty unless evidence is truly absent.
    - Use industry-standard terminology suitable for job, salary, and course discovery APIs.

    ────────────────────────────────────────
    General summary requirements
    ────────────────────────────────────────
    - Provide 2-4 sentences of plain text that synthesize your strengths, breadth of experience, and notable themes.
    - Center the summary on your stated role, goals, and skills first, then use credentials to add evidence, nuance, or constraints.

    Quality bar:
    - Use only facts present in the VCs; never hallucinate. If evidence is limited, say so explicitly and keep recommendations conservative.
    - Avoid generic phrasing like "strong skills", "passionate", "varied background", "grow their career".
    - Prefer domain-specific wording inferred from credentials (e.g., "Kubernetes cluster ops", "React state management", "data modeling in SQL").
    - Keep each summary under 120 words. Do not include markdown; plain text only.
    - Output MUST strictly conform to the schema provided by the tool: each section has a title and a summary string. Do not add fields or change keys.`,
            message: prompt.message,
            output: AIInsightDataValidator,
            model: CHAT_MODEL,
        })
    );
    if (JSON.stringify([insights]).length > 100_000)
        throw new InsightCompactionError('invalid_summary');
    insights.suggestedPathways = insights.suggestedPathways
        .map(alias => credentialUriByAlias.get(alias))
        .filter((uri): uri is string => Boolean(uri));

    const now = new Date().toISOString();

    const unsignedVc: UnsignedVC = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://ctx.learncard.com/boosts/1.0.1.json',
            'https://www.w3.org/2018/credentials/examples/v1',
            {
                type: '@type',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                lcn: 'https://docs.learncard.com/definitions#',
                AIInsightCredential: {
                    '@id': 'https://schema.learncard.com/AIInsightCredential',
                    '@context': {
                        insights: {
                            '@id': 'lcn:AIInsights',
                            '@context': {
                                strongestArea: {
                                    '@id': 'lcn:strongestArea',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:strongestAreaTitle',
                                            '@type': 'xsd:string',
                                        },
                                        summary: {
                                            '@id': 'lcn:strongestAreaSummary',
                                            '@type': 'xsd:string',
                                        },
                                        keywords: {
                                            '@id': 'lcn:strongestAreaKeywords',
                                            '@context': {
                                                occupations: {
                                                    '@id': 'lcn:strongestAreaOccupationKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                careers: {
                                                    '@id': 'lcn:strongestAreaCareerKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                jobs: {
                                                    '@id': 'lcn:strongestAreaJobKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                skills: {
                                                    '@id': 'lcn:strongestAreaSkillKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                fieldOfStudy: {
                                                    '@id': 'lcn:strongestAreaFieldOfStudyKeywords',
                                                    '@type': 'xsd:string',
                                                },
                                            },
                                        },
                                    },
                                },
                                weakestArea: {
                                    '@id': 'lcn:weakestArea',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:weakestAreaTitle',
                                            '@type': 'xsd:string',
                                        },
                                        summary: {
                                            '@id': 'lcn:weakestAreaSummary',
                                            '@type': 'xsd:string',
                                        },
                                        keywords: {
                                            '@id': 'lcn:weakestAreaKeywords',
                                            '@context': {
                                                occupations: {
                                                    '@id': 'lcn:weakestAreaOccupationKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                careers: {
                                                    '@id': 'lcn:weakestAreaCareerKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                jobs: {
                                                    '@id': 'lcn:weakestAreaJobKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                skills: {
                                                    '@id': 'lcn:weakestAreaSkillKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                fieldOfStudy: {
                                                    '@id': 'lcn:weakestAreaFieldOfStudyKeywords',
                                                    '@type': 'xsd:string',
                                                },
                                            },
                                        },
                                    },
                                },
                                roomForGrowth: {
                                    '@id': 'lcn:roomForGrowth',
                                    '@context': {
                                        title: {
                                            '@id': 'lcn:roomForGrowthTitle',
                                            '@type': 'xsd:string',
                                        },
                                        summary: {
                                            '@id': 'lcn:roomForGrowthSummary',
                                            '@type': 'xsd:string',
                                        },
                                        keywords: {
                                            '@id': 'lcn:roomForGrowthKeywords',
                                            '@context': {
                                                occupations: {
                                                    '@id': 'lcn:roomForGrowthOccupationKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                careers: {
                                                    '@id': 'lcn:roomForGrowthCareerKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                jobs: {
                                                    '@id': 'lcn:roomForGrowthJobKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                skills: {
                                                    '@id': 'lcn:roomForGrowthSkillKeywords',
                                                    '@type': 'xsd:string',
                                                    '@container': '@set',
                                                },
                                                fieldOfStudy: {
                                                    '@id': 'lcn:roomForGrowthFieldOfStudyKeywords',
                                                    '@type': 'xsd:string',
                                                },
                                            },
                                        },
                                    },
                                },
                                suggestedPathways: {
                                    '@id': 'lcn:suggestedPathways',
                                    '@type': 'xsd:string',
                                    '@container': '@set',
                                },
                                generalSummary: {
                                    '@id': 'lcn:generalSummary',
                                    '@type': 'xsd:string',
                                },
                                analysisDate: {
                                    '@id': 'lcn:analysisDate',
                                    '@type': 'xsd:string',
                                },
                                credentialsAnalyzed: {
                                    '@id': 'lcn:credentialsAnalyzed',
                                    '@type': 'xsd:integer',
                                },
                            },
                        },
                    },
                },
            },
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', AI_INSIGHT_CREDENTIAL_TYPE, 'BoostCredential'],
        issuer: learnCard.id.did(),
        issuanceDate: now,
        credentialSubject: { id: did },
        insights: {
            generalSummary: insights.generalSummary,
            strongestArea: insights.strongestArea,
            weakestArea: insights.weakestArea,
            roomForGrowth: insights.roomForGrowth,
            suggestedPathways: insights.suggestedPathways,
            analysisDate: now,
            credentialsAnalyzed: vcs.length,
        },
    };

    // console.log("AI Insight VC: ", JSON.stringify(insights, null, 2));

    // Issue the credential
    // console.log(JSON.stringify(unsignedVc));
    // LearnCard's plugin aggregate loses the concrete issuance input type.
    const issuanceInput = unsignedVc as unknown as Parameters<
        typeof learnCard.invoke.issueCredential
    >[0];
    const issuedCredential = await withAiInsightStage('issuance', () =>
        learnCard.invoke.issueCredential(issuanceInput)
    );
    await withAiInsightStage('issuance', () => VCValidator.parse(issuedCredential));
    const vc = issuedCredential as VC;
    /**
     * We only want to store the AI Insight cred ephemerally, in the cache.
     * So, we generate an internal URI here so we can upsert/read in Mongo by uri (our DB key).
     * If we later write this credential to the network and get a canonical boostUri, we can update/replace this value:
     * const generatedUri = await learnCard.store.LearnCloud.uploadEncrypted(vc, { recipients: [did] });
     **/
    const generatedUri = `aiinsight:${did}:${sourceFingerprint}`;
    const verification = await verifyCredentialForIngestion({
        verificationOrigin: 'generated',
        credential: vc,
        credentialUri: generatedUri,
        subjectDid: did,
        consent: await assertCurrentAiConsent('model-inference'),
        verify: original => learnCard.invoke.verifyCredential(original),
    });
    verification.provenance.source = 'generated';
    const storedVc: DBCredentialRecord = {
        id: generatedUri,
        uri: generatedUri,
        category: AI_INSIGHT_CREDENTIAL_TYPE,
        credential: vc,
        rawCredentialJson: JSON.stringify(vc),
        generalSummary: insights.generalSummary,
        aiContext: '',
        createdAt: now,
        source: 'generated',
        sourceFingerprint,
        insightCompaction: {
            stats: prompt.stats,
            originalChars,
            compactChars,
            compactionPercent,
        },
        verification,
        projection: projectCredential(vc, AI_INSIGHT_CREDENTIAL_TYPE, verification),
    };

    try {
        await withAiInsightStage('storage', () => db.storeVC(did, storedVc));
    } catch {
        // The stage wrapper records bounded metadata; caching stays best effort.
        // Continue execution - caching failure should not prevent VC generation success
    }

    return { vc, compaction: { originalChars, compactChars, compactionPercent } };
};

const AI_INSIGHT_GENERATION_VERSION = '7-small-cohorts';

const getAIInsightSourceFingerprint = (credentials: DBCredentialRecord[]): string =>
    createHash('sha256')
        .update(
            JSON.stringify({
                generationVersion: AI_INSIGHT_GENERATION_VERSION,
                model: CHAT_MODEL,
                locale: normalizeAiLocale(getCurrentLocale()),
            })
        )
        .update('\n')
        .update(
            credentials
                .map(credential => ({
                    uri: credential.uri,
                    consentRevision: credential.verification!.consent.revision,
                    projection: getCredentialProjection(credential),
                }))
                .sort((left, right) => left.uri.localeCompare(right.uri))
                .map(credential => JSON.stringify(credential))
                .join('\n')
        )
        .digest('hex');

const getStoredAIInsightResult = (
    credential: DBCredentialRecord,
    sourceCredentials: DBCredentialRecord[],
    plan: InsightEvidencePlan
) => {
    const stored = credential.insightCompaction;
    const stats = InsightCompactionStatsValidator.safeParse(stored?.stats);
    if (
        !stored ||
        !stats.success ||
        stats.data.representedCredentialCount !== sourceCredentials.length ||
        stats.data.representativeCount !== plan.groups.length ||
        stats.data.duplicateCount !== sourceCredentials.length - plan.groups.length ||
        ![stored.originalChars, stored.compactChars, stored.compactionPercent].every(
            value => Number.isFinite(value) && value >= 0
        )
    )
        throw new InsightCompactionError('cache_metadata_invalid');
    return {
        vc: VCValidator.parse(credential.credential),
        compaction: {
            originalChars: stored.originalChars,
            compactChars: stored.compactChars,
            compactionPercent: stored.compactionPercent,
        },
        compactionCoverage: {
            ...stats.data,
            summaryCacheHits: 0,
            summaryCacheMisses: 0,
            summaryModelCalls: 0,
            generationCacheHit: true,
        },
    };
};

export const generateAIInsightCredential = async (
    did: string
): Promise<{
    vc: VC;
    inputCoverage: InsightInputCoverage;
    compaction: {
        originalChars: number;
        compactChars: number;
        compactionPercent: number;
    };
} | null> => {
    const batch = await withAiInsightStage('credential_resolution', () =>
        fetchInsightCredentials(did)
    );
    const sourceCredentials = batch.credentials;
    const inputCoverage = batch.coverage;
    if (!sourceCredentials.length) {
        if (inputCoverage.excludedCount) throw new NoEligibleInsightInputsError(inputCoverage);
        return null;
    }

    const revision = sourceCredentials[0]!.verification!.consent.revision;
    const assertFresh = async () => {
        await assertOwnerOperationActive(did);
        const receipt = await assertCurrentAiConsent('model-inference');
        if (
            receipt.revision !== revision ||
            sourceCredentials.some(
                credential => credential.verification!.consent.revision !== revision
            )
        )
            throw new AiConsentError();
    };
    await assertFresh();
    // Request locale policy applies before cache reuse, independently of text.
    await withAiInsightStage('privacy_filter', () =>
        withPrivacyInputOrigin('request_instructions', () =>
            withPrivacyOperation('language', () => assertPrivacyLocale(getCurrentLocale()))
        )
    );
    const plan = await withAiInsightStage('snapshot', () =>
        prepareInsightEvidence(
            sourceCredentials.map(credential => ({
                key: credential.uri,
                projection: getCredentialProjection(credential),
            }))
        )
    );
    const byUri = new Map(sourceCredentials.map(credential => [credential.uri, credential]));
    const orderedCredentials = plan.orderedKeys.map(uri => byUri.get(uri)!);
    const promptCoverage = {
        includedCount: sourceCredentials.length,
        omittedCount: 0,
        reason: null,
    };
    const sourceFingerprint = await withAiInsightStage('snapshot', () =>
        getAIInsightSourceFingerprint(sourceCredentials)
    );
    const cached = await withAiInsightStage('cache_read', () =>
        db.getGeneratedCredentialByFingerprint(did, AI_INSIGHT_CREDENTIAL_TYPE, sourceFingerprint)
    );

    if (cached) {
        await assertFresh();
        const result = await withAiInsightStage('snapshot', () =>
            getStoredAIInsightResult(cached, sourceCredentials, plan)
        );
        const { compactionCoverage, ...storedResult } = result;
        return {
            ...storedResult,
            inputCoverage: { ...inputCoverage, promptCoverage, compactionCoverage },
        };
    }

    const result = await withAiInsightStage('coordination', () =>
        withDistributedSingleFlight(
            `ai-insight-generation:${getPrivacySubjectRef(did)}:${sourceFingerprint}`,
            async () => {
                const generated = await withAiInsightStage('cache_read', () =>
                    db.getGeneratedCredentialByFingerprint(
                        did,
                        AI_INSIGHT_CREDENTIAL_TYPE,
                        sourceFingerprint
                    )
                );

                await assertFresh();
                if (generated)
                    return withAiInsightStage('snapshot', () =>
                        getStoredAIInsightResult(generated, sourceCredentials, plan)
                    );

                const prompt = await withAiInsightStage('evidence_compaction', () =>
                    compactInsightEvidence(did, revision, plan)
                );
                const generatedResult = await withPrivacyInputOrigin(
                    prompt.stats.strategy === 'direct' ? 'source_cohort' : 'reused_summary',
                    () =>
                        generateAIInsightCredentialForSnapshot(
                            did,
                            orderedCredentials,
                            sourceFingerprint,
                            prompt
                        )
                );
                return generatedResult
                    ? { ...generatedResult, compactionCoverage: prompt.stats }
                    : null;
            }
        )
    );
    await assertFresh();
    if (!result) return null;
    const { compactionCoverage, ...generatedResult } = result;
    return {
        ...generatedResult,
        inputCoverage: { ...inputCoverage, promptCoverage, compactionCoverage },
    };
};
