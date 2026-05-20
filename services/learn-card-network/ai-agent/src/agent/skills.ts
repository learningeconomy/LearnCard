import { readFile } from 'node:fs/promises';

import type { AgentSkillDefinition, AgentToolDefinition } from './types';

const getUniqueSkills = (tools: AgentToolDefinition[]): AgentSkillDefinition[] => {
    const skillsByName = new Map<string, AgentSkillDefinition>();

    for (const tool of tools) {
        if (tool.skill && !skillsByName.has(tool.skill.name)) {
            skillsByName.set(tool.skill.name, tool.skill);
        }
    }

    return [...skillsByName.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const listSkillsParameters = {
    type: 'object',
    properties: {},
    additionalProperties: false,
};

const readSkillParameters = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            description: 'Name of the skill to load.',
        },
    },
    required: ['name'],
    additionalProperties: false,
};

export interface FileBackedSkillConfig {
    name: string;
    description: string;
    filePath: string;
    fallbackContent?: string;
}

export const createFileBackedSkill = ({
    name,
    description,
    filePath,
    fallbackContent,
}: FileBackedSkillConfig): AgentSkillDefinition => ({
    name,
    description,
    source: filePath,
    load: async () => {
        try {
            return await readFile(filePath, 'utf8');
        } catch (error) {
            if (fallbackContent) return fallbackContent;

            const message = error instanceof Error ? error.message : 'Could not read skill file.';
            throw new Error(`Could not load ${name} skill from ${filePath}: ${message}`);
        }
    },
});

export const createSkillTools = (skills: AgentSkillDefinition[]): AgentToolDefinition[] => {
    if (skills.length === 0) return [];

    const skillsByName = new Map(skills.map(skill => [skill.name, skill]));

    return [
        {
            name: 'listSkills',
            description:
                'Lists the SKILL.md documents available to load for specialized tool usage.',
            parameters: listSkillsParameters,
            execute: async () => ({
                skills: skills.map(({ name, description, source }) => ({
                    name,
                    description,
                    source,
                })),
            }),
        },
        {
            name: 'readSkill',
            description:
                'Loads a SKILL.md document. Use this before using a specialized or freeform tool for the first time.',
            parameters: readSkillParameters,
            execute: async args => {
                const skillName = typeof args.name === 'string' ? args.name.trim() : '';
                const skill = skillsByName.get(skillName);

                if (!skill) {
                    throw new Error(`Unknown skill: ${skillName}`);
                }

                return {
                    name: skill.name,
                    description: skill.description,
                    source: skill.source,
                    content: await skill.load(),
                };
            },
        },
    ];
};

export const withSkillTools = (tools: AgentToolDefinition[]): AgentToolDefinition[] => {
    const skills = getUniqueSkills(tools);
    if (skills.length === 0) return tools;

    const existingToolNames = new Set(tools.map(tool => tool.name));
    const skillTools = createSkillTools(skills).filter(tool => !existingToolNames.has(tool.name));

    return [...tools, ...skillTools];
};

export const getSkillSystemPrompt = (tools: AgentToolDefinition[]): string => {
    const skills = getUniqueSkills(tools);

    if (skills.length === 0) return '';

    const lines = skills.map(
        skill => `- ${skill.name}: ${skill.description}${skill.source ? ` (${skill.source})` : ''}`
    );

    return [
        'Some tools have SKILL.md instructions that can be loaded on demand.',
        'Use readSkill before using a specialized or freeform tool unless you already know exactly how it works.',
        'Available skills:',
        ...lines,
    ].join('\n');
};
