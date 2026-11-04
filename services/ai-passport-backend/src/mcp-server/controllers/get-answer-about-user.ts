import { streamingAiCall } from '../../ai/client';
import { CHAT_MODEL } from '../../constants/env';
import { searchCredentialsByTopic } from '../../services/credentialSearch';
import { assertCurrentAiConsent, getCurrentAiSubject } from '../../ai/privacy';
import { AiConsentError } from '../../learncard/consent';

export const getAnswerAboutUser = async (did: string, question: string) => {
    if (getCurrentAiSubject() !== did) throw new AiConsentError();
    await assertCurrentAiConsent('model-inference');
    // Step 1-3: Get semantic search results (query expansion → embeddings → Qdrant)
    const results = await searchCredentialsByTopic(question, did, { limit: 5 });

    // Handle no results case
    if (results.length === 0) {
        return "I don't have enough information in your credentials to answer that question.";
    }

    // Format credentials for LLM context
    const credentialsContext = results
        .map(
            (r, i) => `
${i + 1}. ${r.title}
   Type: ${r.type}
   Relevance Score: ${r.score.toFixed(2)}
   Context: ${r.context || 'No additional context available'}
`
        )
        .join('\n');

    // Step 4: LLM synthesis call
    const answer = await streamingAiCall({
        model: CHAT_MODEL,
        systemPrompt: `You are an AI assistant helping answer questions about a user based on their verified credentials.
Use the provided credentials as context to answer the user's question accurately and comprehensively.
If the credentials don't contain relevant information to answer the question, say so honestly.
Keep your answer concise and focused on the question asked.`,
        message: `Question: ${question}

User's Relevant Credentials:
${credentialsContext}

Please answer the question based on the credentials provided above.`,
        options: { accumulateContent: true, audience: 'external-model' },
    });
    await assertCurrentAiConsent('model-inference');

    return answer;
};
