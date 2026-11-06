import { streamingAiCall } from './client';
import { FORMATTING_MODEL } from '../constants/env';

/**
 * Generate a concise title (5-7 words) summarizing a credential context
 */
export async function generateCredentialTitle(context: string): Promise<string> {
    return streamingAiCall({
        model: FORMATTING_MODEL,
        systemPrompt:
            'Generate a concise title (5-7 words) summarizing the following credential context:',
        message: context,
        options: { accumulateContent: true },
    });
}
