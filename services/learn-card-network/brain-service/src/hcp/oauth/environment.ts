/**
 * Focused environment for the HCP OAuth AS and its local dev servers. Like the
 * lca-api OIDC/cache modules, it exists so the in-memory dev servers boot without the
 * full brain schema's required SEED/NEO4J_*. Read at call time, validated here; the
 * brain itself reads HCP_OAUTH_* through `@environment`.
 */
import { z } from 'zod';

const schema = z.object({
    NODE_ENV: z.string().optional(),
    /** `neo4j`: the MCP dev server uses the brain's Neo4j HCP store. */
    HCP_MCP_DEV_STORE: z.enum(['memory', 'neo4j']).default('memory'),
    /** `1`: dev servers serve the typed subject/grant form instead of the app handoff. */
    HCP_OAUTH_DEV_TYPED_CONSENT: z.enum(['0', '1']).default('0'),
    HCP_OAUTH_CONSENT_APP_URL: z.url().default('http://localhost:3000'),
    HCP_OAUTH_TOKEN_SECRET: z.string().min(1).optional(),
    /**
     * The AS's public base URL (issuer, PRM resource, client DID host). Must equal the
     * brain's HCP_OAUTH_ISSUER_URL. Default: http://127.0.0.1:<port>.
     */
    HCP_OAUTH_ISSUER_URL: z
        .url({
            protocol: /^https?$/,
            error: 'HCP_OAUTH_ISSUER_URL must be an absolute http(s) URL',
        })
        .optional(),
});

export type HcpOAuthEnvironment = z.infer<typeof schema>;

export const hcpOAuthEnvironment = (): HcpOAuthEnvironment => {
    const raw = process.env;
    return schema.parse({
        NODE_ENV: raw.NODE_ENV,
        HCP_MCP_DEV_STORE: raw.HCP_MCP_DEV_STORE || undefined,
        HCP_OAUTH_DEV_TYPED_CONSENT: raw.HCP_OAUTH_DEV_TYPED_CONSENT || undefined,
        HCP_OAUTH_CONSENT_APP_URL: raw.HCP_OAUTH_CONSENT_APP_URL || undefined,
        HCP_OAUTH_TOKEN_SECRET: raw.HCP_OAUTH_TOKEN_SECRET || undefined,
        HCP_OAUTH_ISSUER_URL: raw.HCP_OAUTH_ISSUER_URL?.trim() || undefined,
    });
};

/**
 * The issuer a dev server advertises: HCP_OAUTH_ISSUER_URL when set, else the local
 * listen address. One trailing slash dropped, as the brain and createHcpOAuthApp do,
 * so the AS and the brain compare the same string.
 */
export const devIssuerUrl = (
    env: Pick<HcpOAuthEnvironment, 'HCP_OAUTH_ISSUER_URL'>,
    port: number
) => (env.HCP_OAUTH_ISSUER_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, '');
