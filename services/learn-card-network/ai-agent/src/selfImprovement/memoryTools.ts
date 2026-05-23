import { z } from 'zod';

import type { AgentToolDefinition } from '../agent/types';
import {
    USER_DOC_KINDS,
    USER_DOC_SENSITIVITIES,
    USER_DOC_SOURCE_TYPES,
    type UserDocKind,
    type UserDocSensitivity,
    type UserDocService,
    type UserDocSourceType,
} from './userDocs';

export interface UserMemoryToolConfig {
    ownerDid: string;
    userDocs: UserDocService;
}

const MAX_GENERATED_NAME_CHARS = 48;
const MemoryExpiresAtValidator = z.union([z.string().trim().min(1), z.null()]).optional();

const MemoryWriteValidator = z.object({
    name: z.string().trim().min(2).max(64).optional(),
    kind: z.enum(USER_DOC_KINDS).default('memory'),
    description: z.string().trim().min(1).max(300),
    content: z.string().trim().min(1).max(20_000),
    sourceType: z.enum(USER_DOC_SOURCE_TYPES).optional(),
    confidence: z.number().min(0).max(1).optional(),
    sensitivity: z.enum(USER_DOC_SENSITIVITIES).optional(),
    expiresAt: MemoryExpiresAtValidator,
    reason: z.string().trim().max(1_000).optional(),
});

const ForgetMemoryValidator = z.object({
    name: z.string().trim().min(2).max(64),
    reason: z.string().trim().max(500).optional(),
});

const getSlug = (value: string): string => {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^[^a-z0-9]+/, '')
        .replace(/[^a-z0-9]+$/, '')
        .slice(0, MAX_GENERATED_NAME_CHARS);

    return slug || `memory-${crypto.randomUUID().slice(0, 8)}`;
};

const getMemoryName = (name: string | undefined, description: string): string =>
    getSlug(name ?? description);

const memoryWriteParameters = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            description:
                'Stable memory name. Use lowercase letters, numbers, underscores, periods, or hyphens. If omitted, one is generated from the description.',
        },
        kind: {
            type: 'string',
            enum: USER_DOC_KINDS,
            description:
                'Memory kind. Use user-profile for profile facts, memory for preferences/goals, wiki for durable notes, and skill for procedural instructions.',
        },
        description: {
            type: 'string',
            description: 'Short index description shown before the memory content is loaded.',
        },
        content: {
            type: 'string',
            description: 'Markdown memory content. Keep it factual and scoped to the user.',
        },
        sourceType: {
            type: 'string',
            enum: USER_DOC_SOURCE_TYPES,
            description:
                'Where the memory came from. Use user-stated for explicit user instructions and agent-inferred for unapproved observations.',
        },
        confidence: {
            type: 'number',
            description: 'Confidence from 0 to 1.',
        },
        sensitivity: {
            type: 'string',
            enum: USER_DOC_SENSITIVITIES,
            description:
                'Use high for sensitive personal, health, finance, legal, identity, or safety-related memory.',
        },
        expiresAt: {
            type: 'string',
            description: 'Optional ISO date when this memory should stop being exposed.',
        },
        reason: {
            type: 'string',
            description: 'Why this memory is being saved or proposed.',
        },
    },
    required: ['description', 'content'],
    additionalProperties: false,
};

const forgetMemoryParameters = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            description: 'Exact memory name to archive.',
        },
        reason: {
            type: 'string',
            description: 'Optional reason for archiving the memory.',
        },
    },
    required: ['name'],
    additionalProperties: false,
};

const toToolDoc = (
    doc: Awaited<ReturnType<UserDocService['createDoc']>>
): Record<string, unknown> => ({
    name: doc.name,
    kind: doc.kind,
    description: doc.description,
    status: doc.status,
    sourceType: doc.sourceType,
    confidence: doc.confidence,
    sensitivity: doc.sensitivity,
    expiresAt: doc.expiresAt,
    requiresApproval: doc.requiresApproval,
    version: doc.version,
});

const rememberMemory = async (
    ownerDid: string,
    userDocs: UserDocService,
    args: Record<string, unknown>,
    status: 'active' | 'proposed'
): Promise<Record<string, unknown>> => {
    const parsed = MemoryWriteValidator.parse(args);
    const name = getMemoryName(parsed.name, parsed.description);
    const existing = (await userDocs.getDocsForDebug(ownerDid)).find(doc => doc.name === name);
    const sourceType: UserDocSourceType =
        parsed.sourceType ?? (status === 'active' ? 'user-stated' : 'agent-inferred');
    const sensitivity: UserDocSensitivity =
        parsed.sensitivity ?? (status === 'proposed' ? 'normal' : 'low');
    const kind: UserDocKind = parsed.kind;

    if (existing) {
        const updated = await userDocs.updateDoc({
            ownerDid,
            name,
            kind,
            description: parsed.description,
            content: parsed.content,
            status,
            sourceType,
            confidence: parsed.confidence,
            sensitivity,
            expiresAt: parsed.expiresAt,
            requiresApproval: status === 'proposed',
            provenance: { reason: parsed.reason },
        });

        return { action: 'updated', doc: toToolDoc(updated) };
    }

    const created = await userDocs.createDoc({
        ownerDid,
        name,
        kind,
        description: parsed.description,
        content: parsed.content,
        status,
        sourceType,
        confidence: parsed.confidence,
        sensitivity,
        expiresAt: parsed.expiresAt ?? undefined,
        requiresApproval: status === 'proposed',
        createdBy: status === 'active' ? 'user' : 'retro',
        provenance: { reason: parsed.reason },
    });

    return { action: 'created', doc: toToolDoc(created) };
};

export const createUserMemoryTools = ({
    ownerDid,
    userDocs,
}: UserMemoryToolConfig): AgentToolDefinition[] => [
    {
        name: 'getUserMemoryManifest',
        description:
            'Returns the current user memory manifest, including active memories visible to the agent and proposed/archived memories not visible to the agent.',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
        execute: async () => userDocs.getMemoryManifest(ownerDid),
    },
    {
        name: 'rememberUserMemory',
        description:
            'Saves or updates an active memory for the current user DID. Use only when the user explicitly asks to remember/save/update something or clearly approves a proposed memory. For inferred or sensitive information, use proposeUserMemory instead.',
        parameters: memoryWriteParameters,
        execute: async args => rememberMemory(ownerDid, userDocs, args, 'active'),
    },
    {
        name: 'proposeUserMemory',
        description:
            'Creates or updates a proposed memory for the current user DID. Use for potentially useful inferred, sensitive, ambiguous, or unverified memory that should not become active until the user approves it.',
        parameters: memoryWriteParameters,
        execute: async args => rememberMemory(ownerDid, userDocs, args, 'proposed'),
    },
    {
        name: 'forgetUserMemory',
        description:
            'Archives a memory for the current user DID. Use when the user asks to forget, delete, remove, or stop using a named memory.',
        parameters: forgetMemoryParameters,
        execute: async args => {
            const parsed = ForgetMemoryValidator.parse(args);
            const archived = await userDocs.archiveDoc({
                ownerDid,
                name: parsed.name,
                reason: parsed.reason,
                provenance: { reason: parsed.reason },
            });

            return { action: 'archived', doc: toToolDoc(archived) };
        },
    },
];
