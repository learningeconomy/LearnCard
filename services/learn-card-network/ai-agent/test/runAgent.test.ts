import { describe, expect, it } from 'vitest';

import { runAgent } from '../src/agent/runAgent';
import type { AgentProvider, AgentToolDefinition } from '../src/agent/types';

describe('runAgent', () => {
    it('runs a requested tool and returns the final assistant response', async () => {
        let calls = 0;
        const provider: AgentProvider = {
            complete: async () => {
                calls += 1;

                if (calls === 1) {
                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'call-1',
                                    name: 'getProfile',
                                    arguments: {},
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'Taylor has a LearnCard profile.',
                    },
                };
            },
        };
        const tools: AgentToolDefinition[] = [
            {
                name: 'getProfile',
                description: 'Gets a profile.',
                parameters: { type: 'object', properties: {} },
                execute: async () => ({ profile: { profileId: 'taylor' } }),
            },
        ];

        const result = await runAgent({
            model: 'test-model',
            messages: [{ role: 'user', content: 'Who am I?' }],
            provider,
            tools,
        });

        expect(result.message).toBe('Taylor has a LearnCard profile.');
        expect(result.toolRuns).toEqual([
            {
                id: 'call-1',
                name: 'getProfile',
                arguments: {},
                result: { profile: { profileId: 'taylor' } },
            },
        ]);
        expect(result.messages.some(message => message.role === 'tool')).toBe(true);
    });

    it('adds skill loading tools for skill-backed tools', async () => {
        let calls = 0;
        const provider: AgentProvider = {
            complete: async ({ tools, messages }) => {
                calls += 1;

                if (calls === 1) {
                    expect(tools.map(tool => tool.name)).toContain('readSkill');
                    expect(messages[0]?.content).toContain('Available skills:');

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'call-1',
                                    name: 'readSkill',
                                    arguments: { name: 'test-skill' },
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'I loaded the skill.',
                    },
                };
            },
        };
        const tools: AgentToolDefinition[] = [
            {
                name: 'freeformTool',
                description: 'A tool that needs instructions.',
                parameters: { type: 'object', properties: {} },
                skill: {
                    name: 'test-skill',
                    description: 'Explains how to use the freeform tool.',
                    load: async () => '# Test Skill',
                },
                execute: async () => ({ ok: true }),
            },
        ];

        const result = await runAgent({
            model: 'test-model',
            messages: [{ role: 'user', content: 'Load the skill' }],
            provider,
            tools,
        });

        expect(result.message).toBe('I loaded the skill.');
        expect(result.toolRuns).toEqual([
            {
                id: 'call-1',
                name: 'readSkill',
                arguments: { name: 'test-skill' },
                result: {
                    name: 'test-skill',
                    description: 'Explains how to use the freeform tool.',
                    source: undefined,
                    content: '# Test Skill',
                },
            },
        ]);
    });
});
