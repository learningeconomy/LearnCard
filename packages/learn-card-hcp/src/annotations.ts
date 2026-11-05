/**
 * Local mirror of `@learncard/mcp` tool annotation + definition shape.
 * Do NOT import `@learncard/mcp` until #1955 is on main — then swap these
 * helpers for `defineMcpTool` / `McpToolDefinition` from the shared package.
 */

export type McpToolAnnotations = {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
};

/** Loose schema shape (Zod raw shape or JSON-schema-like). Kept untyped like shared core. */
export type McpSchemaShape = Record<string, unknown>;

export type McpToolContext = {
    authInfo?: unknown;
    signal?: AbortSignal;
};

export type McpToolResponse = {
    content: Array<{ type: 'text'; text: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
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

/** Identity helper that type-checks a definition and validates it at load time. */
export const defineHcpTool = (tool: McpToolDefinition): McpToolDefinition => {
    assertValidTool(tool);
    return tool;
};

export const stubJsonResponse = (structuredContent: Record<string, unknown>): McpToolResponse => ({
    content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
    structuredContent,
});
