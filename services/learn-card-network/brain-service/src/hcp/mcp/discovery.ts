/**
 * Draft 3 §10.2 / §19 discovery helpers for the local MCP host.
 *
 * Official `conformsTo` Part URIs are intentionally empty: §18.1 requires a Part
 * claimed whole, and Core + HTTP Binding are still incomplete in v1. Clients read
 * `learncard_status` for what this host actually proves in Unit 3 tests.
 */
import { HCP_SPEC_PIN } from '../v1/service/meta';
import { HCP_MCP_TOOL_NAMES } from './tools';

export const HCP_MCP_EXTENSION_ID = 'example.hcp/hcp' as const;

export type HcpDiscoveryUrls = {
    resourceUrl: string;
    /** Streamable HTTP path. Defaults to `/mcp`. */
    mcpPath?: string;
};

const trim = (url: string) => url.replace(/\/$/, '');

/** LC-adapted discovery document. Omits Draft 3 required `conformsTo`/`bindings` claims. */
export const buildHcpConfiguration = (urls: HcpDiscoveryUrls): Record<string, unknown> => {
    const resource = trim(urls.resourceUrl);
    const mcpPath = urls.mcpPath ?? '/mcp';
    return {
        hcp_version: '2.0-draft-3',
        api_version: 'v1',
        spec: { ...HCP_SPEC_PIN },
        // §19 requires these when claiming. Empty until Core+MCP can be claimed whole (§18.1).
        conformsTo: [],
        bindings: [],
        mcp_endpoint: `${resource}${mcpPath}`,
        protected_resource_metadata: `${resource}/.well-known/oauth-protected-resource`,
        learncard_status: {
            mcp_tools: [...HCP_MCP_TOOL_NAMES],
            oauth_as_prm: true,
            grant_bound_bearer: true,
            report_sharing: 'not-implemented',
            official_conformsTo_claimed: false,
        },
    };
};

/** Settings object under capabilities.extensions[`example.hcp/hcp`] (§10.2). */
export const buildHcpMcpExtension = (urls: HcpDiscoveryUrls): Record<string, unknown> => {
    const resource = trim(urls.resourceUrl);
    return {
        discovery: `${resource}/.well-known/hcp-configuration`,
        // Mirror discovery: no official Part URIs yet (§18.1).
        conformsTo: [],
    };
};
