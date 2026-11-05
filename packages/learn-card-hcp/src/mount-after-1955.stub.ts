/**
 * AFTER #1955 ONLY — dual-resource mount harness plan.
 *
 * Do not import `@learncard/mcp` on this branch. When LC-2313 / #1955 is on
 * `main`, replace this stub with a real harness roughly like:
 *
 *   import { createMcpApp, createOAuthProxyProvider, defineMcpTool } from '@learncard/mcp';
 *   import { hcpTools } from '@learncard/hcp';
 *
 *   // One createMcpApp per protected resource (one auth block each).
 *   const recognitionApp = createMcpApp({
 *     serverInfo: { name: 'learncard-recognition', version: '0.0.0' },
 *     tools: recognitionTools,
 *     auth: {
 *       provider: recognitionProvider,
 *       issuerUrl,
 *       baseUrl: recognitionBaseUrl, // distinct resource
 *       scopesSupported: ['author', 'issue', ...],
 *       requiredScopes: [...],
 *       protectedResourceMetadataPath: '/.well-known/oauth-protected-resource-recognition',
 *     },
 *   });
 *
 *   const hcpApp = createMcpApp({
 *     serverInfo: { name: 'learncard-hcp', version: '0.0.0' },
 *     tools: hcpTools, // swap local defineHcpTool → defineMcpTool at that time
 *     auth: {
 *       provider: hcpProvider,
 *       issuerUrl,
 *       baseUrl: hcpBaseUrl, // distinct HCP Provider audience
 *       scopesSupported: hcpPurposeScopes, // never Recognition author/issue
 *       requiredScopes: [...],
 *       protectedResourceMetadataPath: '/.well-known/oauth-protected-resource-hcp',
 *     },
 *   });
 *
 * Acceptance: docs/prototypes/lc-2320-hcp-placement/TEST-PLAN.md §B (H1–H8).
 */

export type DualResourceMountPlan = {
    recognitionResource: string;
    hcpResource: string;
    notes: string[];
};

/** Document-only plan object for tests / Loom narration before #1955. */
export const dualResourceMountPlan = (): DualResourceMountPlan => ({
    recognitionResource: 'https://recognition.example/mcp',
    hcpResource: 'https://hcp.example/mcp',
    notes: [
        'Two createMcpApp mounts; never share Recognition author/issue audience with HCP.',
        'RFC 8707 resource parameter must name the mount being called.',
        'RFC 9728 PRM required per mount; wrong-audience tokens must 401/403.',
        'Governance stays on HTTP Binding — not on the HCP MCP tool list.',
        'Implementation gated on #1955 merge + green light to wire @learncard/mcp.',
    ],
});

/** Throws until the real harness lands after #1955. */
export const createDualResourceMountHarness = (): never => {
    throw new Error(
        'Dual-resource createMcpApp harness waits on #1955 (@learncard/mcp on main). See mount-after-1955.stub.ts.'
    );
};
