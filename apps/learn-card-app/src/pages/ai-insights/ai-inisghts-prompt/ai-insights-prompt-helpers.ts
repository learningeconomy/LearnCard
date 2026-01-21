export interface AiInsightsPrompt {
    prompt: string;
}

export const DEFAULT_PROMPTS: AiInsightsPrompt[] = [
    {
        prompt: 'What are my strengths and weaknesses?',
    },
    {
        prompt: 'What skills do I need to learn for my career?',
    },
    {
        prompt: 'How do I earn more money at work?',
    },
];
