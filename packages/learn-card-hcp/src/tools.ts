import { defineHcpTool, stubJsonResponse, type McpToolDefinition } from './annotations';

/**
 * Draft2 §10.3 MCP Binding tools (context operations only).
 * Handlers are stubs — they return placeholder structured content until the HCP
 * domain/store (LC-2240) and shared-core mount (#1955) land.
 */

export const hcpQueryContext = defineHcpTool({
    name: 'hcp_queryContext',
    title: 'Query HCP context',
    description:
        "Retrieve minimal, relevant entries from the person's HCP instance for a stated purpose.",
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
    inputSchema: {
        query: { description: 'Natural language query describing the context or task.' },
        categories: { description: 'Optional. Categories to search.' },
        purpose: { description: 'Purpose code approved in the grant.' },
        purposeDescription: { description: 'Optional. Plain language task statement for audit.' },
        maxEntries: { description: 'Maximum entries to return. Default 5. Maximum 20.' },
    },
    async handler(args) {
        return stubJsonResponse({
            stub: true,
            tool: 'hcp_queryContext',
            entries: [],
            categoriesSearched: [],
            args,
        });
    },
});

export const hcpGetEntry = defineHcpTool({
    name: 'hcp_getEntry',
    title: 'Get HCP entry',
    description:
        "Retrieve one entry from the person's HCP instance by identifier, for a stated purpose.",
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
    inputSchema: {
        ref: { description: 'Disclosure ref for the entry.' },
        purpose: { description: 'Purpose code approved in the grant.' },
    },
    async handler(args) {
        return stubJsonResponse({ stub: true, tool: 'hcp_getEntry', entry: null, args });
    },
});

export const hcpCreateEntry = defineHcpTool({
    name: 'hcp_createEntry',
    title: 'Create HCP entry',
    description: "Create a new entry in the person's HCP instance under the presented grant.",
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
    },
    inputSchema: {
        category: { description: 'Entry category.' },
        content: { description: 'Entry content payload.' },
        purpose: { description: 'Purpose code approved in the grant.' },
    },
    async handler(args) {
        return stubJsonResponse({ stub: true, tool: 'hcp_createEntry', created: false, args });
    },
});

export const hcpReviseEntry = defineHcpTool({
    name: 'hcp_reviseEntry',
    title: 'Revise HCP entry',
    description: "Revise an existing entry in the person's HCP instance under the presented grant.",
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
    },
    inputSchema: {
        ref: { description: 'Disclosure ref for the entry to revise.' },
        content: { description: 'Revised content payload.' },
        purpose: { description: 'Purpose code approved in the grant.' },
    },
    async handler(args) {
        return stubJsonResponse({ stub: true, tool: 'hcp_reviseEntry', revised: false, args });
    },
});

export const hcpWithdrawEntry = defineHcpTool({
    name: 'hcp_withdrawEntry',
    title: 'Withdraw HCP entry',
    description: "Withdraw an entry from the person's HCP instance under the presented grant.",
    annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
    },
    inputSchema: {
        ref: { description: 'Disclosure ref for the entry to withdraw.' },
        purpose: { description: 'Purpose code approved in the grant.' },
    },
    async handler(args) {
        return stubJsonResponse({ stub: true, tool: 'hcp_withdrawEntry', withdrawn: false, args });
    },
});

/** All Draft2 §10 MCP Binding tools. Governance tools intentionally omitted. */
export const hcpTools: readonly McpToolDefinition[] = [
    hcpQueryContext,
    hcpGetEntry,
    hcpCreateEntry,
    hcpReviseEntry,
    hcpWithdrawEntry,
];

export const HCP_TOOL_NAMES = [
    'hcp_queryContext',
    'hcp_getEntry',
    'hcp_createEntry',
    'hcp_reviseEntry',
    'hcp_withdrawEntry',
] as const;
