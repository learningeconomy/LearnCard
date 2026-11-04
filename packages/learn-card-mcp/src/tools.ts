import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

import { McpToolError, toolErrorResponse, type McpToolResponse } from './errors';

/**
 * Behavior hints every LearnCard MCP tool must declare. Clients use them to decide
 * whether a call needs user confirmation, so leaving them implicit is not allowed.
 */
export type McpToolAnnotations = {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
};

/**
 * A raw Zod shape (`{ field: z.string() }`). Typed loosely because the SDK may resolve
 * its own Zod copy whose generic identity differs from the caller's at compile time.
 */
export type McpSchemaShape = Record<string, unknown>;

export type McpToolContext = {
    authInfo?: AuthInfo;
    signal?: AbortSignal;
};

export type McpToolDefinition = {
    name: string;
    title: string;
    description: string;
    annotations: McpToolAnnotations;
    inputSchema?: McpSchemaShape;
    outputSchema?: McpSchemaShape;
    handler: (args: Record<string, unknown>, context: McpToolContext) => Promise<McpToolResponse>;
};

const ANNOTATION_KEYS: (keyof McpToolAnnotations)[] = [
    'readOnlyHint',
    'destructiveHint',
    'idempotentHint',
    'openWorldHint',
];

/** Identity helper that type-checks a definition and validates it at load time. */
export const defineMcpTool = (tool: McpToolDefinition): McpToolDefinition => {
    assertValidTool(tool);
    return tool;
};

export const assertValidTool = (tool: McpToolDefinition): void => {
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(tool.name)) {
        throw new Error(`Invalid MCP tool name: ${JSON.stringify(tool.name)}`);
    }
    if (!tool.title?.trim() || !tool.description?.trim()) {
        throw new Error(`MCP tool ${tool.name} needs a title and description`);
    }
    for (const key of ANNOTATION_KEYS) {
        if (typeof tool.annotations?.[key] !== 'boolean') {
            throw new Error(`MCP tool ${tool.name} must declare annotations.${key}`);
        }
    }
    if (tool.annotations.readOnlyHint && tool.annotations.destructiveHint) {
        throw new Error(`MCP tool ${tool.name} cannot be both read-only and destructive`);
    }
};

/** The DID the OAuth verifier placed on the token, if any. */
export const getAuthenticatedDid = (context: McpToolContext): string | undefined => {
    const did = context.authInfo?.extra?.did;
    return typeof did === 'string' ? did : undefined;
};

type LooseRegisterTool = (
    name: string,
    config: {
        title: string;
        description: string;
        inputSchema?: McpSchemaShape;
        outputSchema?: McpSchemaShape;
        annotations: McpToolAnnotations & { title: string };
    },
    callback: (args: Record<string, unknown>, extra: McpToolContext) => Promise<McpToolResponse>
) => unknown;

/** Registers validated tools on a server. `McpToolError`s become typed tool errors. */
export const registerMcpTools = (server: McpServer, tools: readonly McpToolDefinition[]): void => {
    const seen = new Set<string>();
    const registerTool = server.registerTool.bind(server) as unknown as LooseRegisterTool;

    for (const tool of tools) {
        assertValidTool(tool);
        if (seen.has(tool.name)) throw new Error(`Duplicate MCP tool name: ${tool.name}`);
        seen.add(tool.name);

        registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                ...(tool.inputSchema ? { inputSchema: tool.inputSchema } : {}),
                ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
                annotations: { title: tool.title, ...tool.annotations },
            },
            async (args, extra) => {
                try {
                    return await tool.handler(args ?? {}, {
                        authInfo: extra?.authInfo,
                        signal: extra?.signal,
                    });
                } catch (error) {
                    if (error instanceof McpToolError) {
                        return toolErrorResponse(error.code, error.message);
                    }
                    throw error;
                }
            }
        );
    }
};
