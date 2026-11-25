import {
    TopicMatchingDecisionValidator,
    SummaryCredentialDataValidator,
    type SummaryCredentialData,
} from '../../ai/generation-schemas';
import { VCValidator, type AIPassportCredentialRecord } from '@learncard/types';
import {
    aiCall,
    generateAndStoreCredentialEmbeddings,
    generateCredentialEmbeddingTexts,
    streamingAiCall,
} from '../../ai';
import { CHAT_MODEL } from '../../constants/env';
import { fetchCredentials } from '../../credentials/service';
import {
    projectCredential,
    serializeModelSafeCredentialProjection,
} from '../../credentials/projection';
import { assertCurrentAiConsent } from '../../ai/privacy';
import { verifyCredentialForIngestion } from '../../credentials/verification';
import { db, type DBCredentialRecord } from '../../db';
import { getLearnCard } from '../../learncard';
import { createAndPublishBoostCredential } from '../../learncard/boost-helpers';
import { createSummaryVCStructure, createTopicVCStructure } from '../../services/awarding';

type TopicMatchingDecision = {
    useExisting: boolean;
    topicUri: string | null;
    topicTitle: string | null;
};

// HELPER FUNCTIONS
/**
 * Fetch user's existing topic credentials from Learn Card
 */
const getUserExistingTopics = async (did: string) => {
    try {
        const credentials = await fetchCredentials(did);

        // Filter for topic credentials
        const topicCredentials = credentials.filter(vc => vc.category === 'ai-topic');

        // Extract topic info
        return topicCredentials
            .map(vc => {
                try {
                    const parsed = vc.credential;
                    // Handle both wrapped and unwrapped credentials
                    const inner = parsed?.boostCredential || parsed;

                    // Extract boost URI from credential (not storage URI)
                    const boostUri = inner?.boostId || parsed?.boostId;

                    // Only include topics with valid lc:network boost URIs
                    if (!boostUri || !boostUri.startsWith('lc:network:')) {
                        console.warn(`Skipping topic with invalid boost URI: ${boostUri}`);
                        return null;
                    }

                    return {
                        uri: boostUri, // Use boost URI, not storage URI
                        title: inner?.topicInfo?.title || 'Untitled Topic',
                        threadId: inner?.topicInfo?.threadId,
                    };
                } catch (error) {
                    console.error(`Failed to parse topic VC:`, error);
                    return null;
                }
            })
            .filter((topic): topic is NonNullable<typeof topic> => topic !== null);
    } catch (error) {
        console.error(`Failed to fetch existing topics:`, error);
        return [];
    }
};

/**
 * Use LLM to determine if summary should go under existing topic or create new one
 */
const determineTopicPlacement = async (
    summaryText: string,
    existingTopics: Array<{ uri: string; title: string }>
): Promise<TopicMatchingDecision> => {
    if (existingTopics.length === 0) {
        // No existing topics, must create new one
        return {
            useExisting: false,
            topicUri: null,
            topicTitle: null, // Will be generated later
        };
    }

    const topicsList = existingTopics
        .map((topic, index) => `${index + 1}. "${topic.title}"`)
        .join('\n');

    const decision = await aiCall({
        model: CHAT_MODEL,
        systemPrompt: `You are helping organize learning sessions into topics. Given a learning session summary and a list of existing topics, determine if this session should be categorized under an existing topic or if a new topic should be created.

Guidelines:
- Use an existing topic if the session content is clearly related to that topic's focus
- Create a new topic if the session covers a distinct subject matter not well represented by existing topics
- Be thoughtful about topic granularity - related subjects should be grouped together
- If creating a new topic, suggest a concise, descriptive title (2-5 words)`,
        message: `Learning Session Summary:
${summaryText}

Existing Topics:
${topicsList}

Should this session go under an existing topic or create a new one?`,
        output: TopicMatchingDecisionValidator,
    });

    const topic =
        decision.useExisting && decision.topicIndex
            ? existingTopics[decision.topicIndex - 1]
            : undefined;

    return {
        useExisting: Boolean(topic),
        topicUri: topic?.uri ?? null,
        topicTitle: topic ? null : decision.topicTitle,
    };
};

export const saveSessionSummary = async (
    did: string,
    threadId: string,
    sessionData: { summary: string }
): Promise<{ learnCardLink: string }> => {
    const summaryText = sessionData.summary;

    // Guard: validate summary exists
    if (!summaryText || summaryText.trim().length === 0) {
        console.log(`⏭️ Skipping save: empty summary for thread ${threadId}`);
        throw new Error('Summary text cannot be empty');
    }

    try {
        const learnCard = await getLearnCard();

        // ========================================================================
        // STEP 1: DETERMINE TOPIC PLACEMENT (existing or new)
        // ========================================================================

        console.log(`🔍 Fetching existing topics for user...`);
        const existingTopics = await getUserExistingTopics(did);
        console.log(`📚 Found ${existingTopics.length} existing topics`);

        const topicDecision = await determineTopicPlacement(summaryText, existingTopics);
        console.log(`🎯 Topic decision:`, topicDecision);

        let topicCredentialUri: string;
        let topicName: string;

        if (topicDecision.useExisting && topicDecision.topicUri) {
            // Use existing topic
            topicCredentialUri = topicDecision.topicUri;
            const existingTopic = existingTopics.find(t => t.uri === topicDecision.topicUri);
            topicName = existingTopic?.title || 'Learning Session';
            console.log(`♻️  Using existing topic: "${topicName}" (${topicCredentialUri})`);
        } else {
            // Create new topic
            console.log(`🆕 Creating new topic...`);

            // Generate or use suggested topic title
            const topicTitle =
                topicDecision.topicTitle ||
                (await streamingAiCall({
                    model: CHAT_MODEL,
                    systemPrompt:
                        'Generate a concise topic title (2-4 words) that captures the main subject of this learning session.',
                    message: summaryText,
                    options: { accumulateContent: true },
                }));

            topicName = topicTitle?.trim() || 'Learning Session';

            // Create topic VC with exact structure from AI Passport
            const topicUnsignedVc = createTopicVCStructure(
                learnCard.id.did(),
                did,
                topicName,
                threadId
            );

            // Create the topic boost
            const result = await createAndPublishBoostCredential({
                unsignedVc: topicUnsignedVc,
                did,
                boostOptions: {
                    status: 'LIVE',
                    category: 'ai-topic',
                },
            });
            topicCredentialUri = result.boostUri;

            console.log(`✅ Created topic credential: ${topicCredentialUri}`);
        }

        // ========================================================================
        // STEP 2: CONVERT SUMMARY STRING TO STRUCTURED DATA
        // ========================================================================

        // Use AI to convert the simple summary text into structured format
        const summaryData: SummaryCredentialData = await aiCall({
            model: CHAT_MODEL,
            systemPrompt: `Convert the following learning session summary into a structured format with:
- A concise title
- An expanded summary
- Key points learned (as bullet points)
- Skills demonstrated or developed
- Next steps for continued learning
- Reflections on the experience

Be educational and motivational. Extract specific, actionable information.`,
            message: summaryText,
            output: SummaryCredentialDataValidator,
        });

        // ========================================================================
        // STEP 3: CREATE SUMMARY CREDENTIAL AS CHILD
        // ========================================================================

        const summaryUnsignedVc = createSummaryVCStructure(learnCard.id.did(), did, summaryData);

        // Create summary as CHILD of topic using createChildBoost
        const { boostUri: summaryBoostUri, signedVc: summaryVc } =
            await createAndPublishBoostCredential({
                unsignedVc: summaryUnsignedVc,
                did,
                boostOptions: {
                    status: 'LIVE',
                    category: 'ai-summary',
                },
                parentBoostUri: topicCredentialUri,
            });

        console.log(`✅ Created summary credential: ${summaryBoostUri}`);

        // ========================================================================
        // STEP 4: STORE IN MONGODB (Optional - for backend tracking)
        // ========================================================================

        VCValidator.parse(summaryVc);
        const parsedSummaryVc = summaryVc as AIPassportCredentialRecord['credential'];
        const verification = await verifyCredentialForIngestion({
            credential: parsedSummaryVc,
            credentialUri: summaryBoostUri,
            subjectDid: did,
            consent: await assertCurrentAiConsent('model-inference'),
            verify: original => learnCard.invoke.verifyCredential(original),
        });
        verification.provenance.source = 'generated';

        const credentialRecord: DBCredentialRecord = {
            id: summaryBoostUri,
            uri: summaryBoostUri,
            category: 'ThreadSummaryCredential',
            credential: parsedSummaryVc,
            rawCredentialJson: JSON.stringify(summaryVc),
            aiContext: summaryText,
            createdAt: new Date().toISOString(),
            title: summaryData.title,
            source: 'generated',
            verification,
            projection: projectCredential(parsedSummaryVc, 'ThreadSummaryCredential', verification),
        };

        await db.storeVC(did, credentialRecord);

        // Store embeddings
        try {
            const embeddingTexts = await generateCredentialEmbeddingTexts(
                serializeModelSafeCredentialProjection(credentialRecord.projection!)
            );
            await generateAndStoreCredentialEmbeddings(credentialRecord, embeddingTexts, did);
        } catch (embeddingError) {
            console.error(`⚠️  Failed to store embeddings:`, embeddingError);
        }

        const learnCardLink = `https://learncard.app/ai/sessions?topicBoostUri=${topicCredentialUri}&summaryUri=${summaryBoostUri}`;

        console.log(`✅ Saved session summary successfully!`);
        console.log(`   Topic URI: ${topicCredentialUri}`);
        console.log(`   Summary URI: ${summaryBoostUri}`);
        console.log(`   View in Learn Card: ${learnCardLink}`);

        return { learnCardLink };
    } catch (error) {
        console.error(`❌ Failed to save session summary:`, error);
        throw error;
    }
};
