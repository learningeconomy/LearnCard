import { describe, expect, it } from 'vitest';

import { runAgent } from '../src/agent/runAgent';
import type { AgentProvider, AgentToolDefinition } from '../src/agent/types';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../src/selfImprovement/userDocs';

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
                    expect(tools.map(tool => tool.name)).toContain('searchSkills');
                    expect(tools.map(tool => tool.name)).toContain('readSkill');
                    expect(messages[0]?.content).toContain(
                        'Specialized skills and user-specific Markdown docs are searchable'
                    );
                    expect(messages[0]?.content).not.toContain('test-skill');

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

    it('merges dynamic user docs with static skill-backed tools', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        await userDocs.createDoc({
            ownerDid: 'did:key:user',
            name: 'taylor-profile',
            kind: 'user-profile',
            description: 'Stable profile notes for Taylor.',
            content: '# Taylor Profile\n\nTaylor prefers concise answers.',
            createdBy: 'retro',
            sourceType: 'user-stated',
        });

        let calls = 0;
        const provider: AgentProvider = {
            complete: async ({ tools, messages }) => {
                calls += 1;

                if (calls === 1) {
                    expect(tools.map(tool => tool.name)).toContain('searchSkills');
                    expect(tools.map(tool => tool.name)).toContain('readSkill');
                    expect(messages[0]?.content).not.toContain('taylor-profile');
                    expect(messages[0]?.content).not.toContain('static-skill');

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'call-1',
                                    name: 'searchSkills',
                                    arguments: { query: 'profile preferences' },
                                },
                            ],
                        },
                    };
                }

                if (calls === 2) {
                    expect(messages.at(-1)?.content).toContain('taylor-profile');

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'call-2',
                                    name: 'readSkill',
                                    arguments: { name: 'taylor-profile' },
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'I used the profile.',
                    },
                };
            },
        };
        const tools: AgentToolDefinition[] = [
            {
                name: 'staticTool',
                description: 'Static tool.',
                parameters: { type: 'object', properties: {} },
                skill: {
                    name: 'static-skill',
                    description: 'Static instructions.',
                    load: async () => '# Static Skill',
                },
                execute: async () => ({ ok: true }),
            },
        ];

        const result = await runAgent({
            model: 'test-model',
            messages: [{ role: 'user', content: 'Remember my preferences?' }],
            provider,
            tools,
            skills: await userDocs.createSkillDefinitions('did:key:user'),
        });

        expect(result.message).toBe('I used the profile.');
        expect(result.toolRuns[0]).toMatchObject({
            id: 'call-1',
            name: 'searchSkills',
            result: {
                matches: [
                    expect.objectContaining({
                        name: 'taylor-profile',
                        kind: 'user-profile',
                        dynamic: true,
                    }),
                ],
            },
        });
        expect(result.toolRuns[1]).toMatchObject({
            id: 'call-2',
            name: 'readSkill',
            result: {
                name: 'taylor-profile',
                kind: 'user-profile',
                dynamic: true,
                content: expect.stringContaining('Taylor prefers concise answers.'),
            },
        });
        await expect(
            userDocs.getActiveDoc('did:key:user', 'taylor-profile')
        ).resolves.toMatchObject({
            readCount: 1,
        });
    });
});
