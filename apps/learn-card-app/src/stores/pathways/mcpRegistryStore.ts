/**
 * mcpRegistryStore — discovered MCP servers and the scopes the learner
 * granted each. Drives the Matching capability and external tool use in
 * policies (Policy kind: 'external'). See docs § 2 (Decision #2).
 *
 * Phase 0: shape only. Discovery + OAuth wiring lands in Phase 3b/4.
 */

import { createStore } from '@udecode/zustood';

export interface McpServerEntry {
    id: string;
    label: string;
    url: string;
    /** Human-readable scope strings granted by the learner. */
    grantedScopes: string[];
    connectedAt?: string;
    lastUsedAt?: string;
}

interface McpRegistryState {
    servers: Record<string, McpServerEntry>;
}

const initialState: McpRegistryState = {
    servers: {},
};

export const mcpRegistryStore = createStore('mcpRegistryStore')<McpRegistryState>(
    initialState,
    { persist: { name: 'mcpRegistryStore', enabled: true } },
).extendActions(set => ({
    connect: (entry: McpServerEntry) => {
        set.state(draft => {
            draft.servers[entry.id] = {
                ...entry,
                connectedAt: entry.connectedAt ?? new Date().toISOString(),
            };
        });
    },

    disconnect: (serverId: string) => {
        set.state(draft => {
            delete draft.servers[serverId];
        });
    },

    markUsed: (serverId: string) => {
        set.state(draft => {
            const server = draft.servers[serverId];

            if (server) server.lastUsedAt = new Date().toISOString();
        });
    },
})).extendSelectors((state, get) => ({
    list: (): McpServerEntry[] => Object.values(get.servers()),
    hasAny: (): boolean => Object.keys(get.servers()).length > 0,
}));

export default mcpRegistryStore;
