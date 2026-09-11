import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
}));

vi.mock('openai', () => ({
    default: class OpenAI {
        chat = { completions: { create: mocks.create } };
    },
}));

import { createOpenAIProvider } from '../src/agent/openAIProvider';

describe('createOpenAIProvider', () => {
    beforeEach(() => {
        mocks.create.mockReset();
        mocks.create.mockResolvedValue({
            id: 'completion-id',
            choices: [{ message: { content: 'Done' } }],
        });
    });

    it('disables reasoning for GPT-5.6 Luna Chat Completions with function tools', async () => {
        const provider = createOpenAIProvider('test-key');

        await provider.complete({
            model: 'gpt-5.6-luna',
            messages: [{ role: 'user', content: 'Complete the task.' }],
            tools: [
                {
                    name: 'testTool',
                    description: 'A test tool.',
                    parameters: { type: 'object', properties: {} },
                    execute: async () => undefined,
                },
            ],
        });

        expect(mocks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'gpt-5.6-luna',
                reasoning_effort: 'none',
                tool_choice: 'auto',
            })
        );
    });
});
