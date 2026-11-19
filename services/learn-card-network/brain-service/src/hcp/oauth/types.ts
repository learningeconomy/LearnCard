/**
 * Domain types for the HCP OAuth Authorization Server (Draft 3 §13).
 *
 * An access token is a credential that *represents* a grant (§13.1, §3.1). The
 * live StoredGrant in Neo4j remains the single source of truth for authorization
 * decisions (§13.6); the token only binds the request to that grant.
 */
import type { StoredGrant } from '../v1/store/port';

/** JWT claims minted by the HCP AS. `grant_id` is the binding; never a tool arg. */
export type HcpAccessTokenClaims = {
    iss: string;
    aud: string;
    /** HCP Context Client DID (= grant.client.id). */
    sub: string;
    grant_id: string;
    /** OAuth client_id of the MCP host software (may differ from sub). */
    client_id: string;
    scope: string;
    iat: number;
    exp: number;
    jti: string;
};

export type HcpOAuthClient = {
    client_id: string;
    client_secret?: string;
    client_name?: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    token_endpoint_auth_method: string;
    created_at: number;
};

export type PendingAuthorization = {
    requestId: string;
    clientId: string;
    redirectUri: string;
    state: string | null;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
    scope: string | null;
    resource: string | null;
    createdAt: number;
};

export type AuthorizationCodeRecord = {
    code: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
    grantId: string;
    subjectDid: string;
    clientDid: string;
    scope: string;
    resource: string;
    expiresAt: number;
};

/** What the RS attaches after a valid bearer: live grant, no grantId in the body. */
export type ResolvedHcpGrantAuth = {
    grant: StoredGrant;
    clientDid: string;
    oauthClientId: string;
    scopes: string[];
    tokenJti: string;
};

export type HcpOAuthUrls = {
    /** Public base URL of this AS+RS (issuer and resource share it in Unit 1). */
    issuerUrl: string;
    /** Audience / resource identifier (RFC 8707). Defaults to issuerUrl. */
    resourceUrl?: string;
};
