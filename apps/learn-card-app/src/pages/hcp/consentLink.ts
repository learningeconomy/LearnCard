import type { HcpContractOffer, HcpGrantRequest } from 'learn-card-base/hcp/useHcp';
import { isCustomCategory, isRegisteredCategory } from './hcpModel';

export const DEFAULT_PURPOSE_CODE = 'https://learncard.com/hcp/purposes/app-access';
export const DURATIONS = ['1h', '4h', '24h', 'ongoing'] as const;
export type Duration = (typeof DURATIONS)[number];
const isDuration = (value: string): value is Duration => DURATIONS.some(item => item === value);

/**
 * What an app asks for: from a direct link, or from a contract's HCP offer (LC-2421).
 * The screen only consumes this shape.
 */
export type AccessRequest = {
    client: { id: string; name: string };
    categories: [string, ...string[]];
    purpose: { code: string; description: string };
    duration: Duration;
    /** The contract owner's LearnCard profile name, when a contract stands behind it. */
    offeredBy?: string;
    /**
     * LC-2423 hand-test: `suggest=1` on the link. Allow grants write with canWrite false
     * so the app can only land suggestions until the person accepts.
     */
    canSuggest?: boolean;
};

export type LinkProblem =
    'app' | 'name' | 'categories' | 'purpose' | 'duration' | 'contract' | 'suggest' | 'oauth';

/**
 * An HCP OAuth sign-in (an MCP host such as Claude Code): the AS's signed request
 * ticket, decoded for display only. The brain verifies the ticket on Allow.
 */
export type OAuthSignIn = {
    ticket: string;
    clientName: string;
    clientDid: string;
    scopes: string[];
    categories: [string, ...string[]];
    canWrite: boolean;
};

export type ParsedLink =
    | { kind: 'ok'; request: AccessRequest }
    | { kind: 'contract'; contractUri: string; client: string | null }
    | { kind: 'oauth'; signIn: OAuthSignIn }
    | { kind: 'bad'; problem: LinkProblem };

/** The OAuth grant's purpose and duration: what the brain issues (oauth-consent.ts). */
export const OAUTH_PURPOSE_CODE = 'https://learncard.com/hcp/purposes/app-access';
export const OAUTH_DURATION: Duration = '1h';

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
                .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                .join('')
        );
        const payload: unknown = JSON.parse(json);
        return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    } catch {
        return null;
    }
};

const SCOPE = /^hcp:([a-z0-9_]+):(read|write)$/;

/** `/hcp/connect?oauth_request=<ticket>`; null when the ticket is unreadable or expired. */
export const parseOAuthRequest = (ticket: string, now: Date): OAuthSignIn | null => {
    const claims = decodeJwtPayload(ticket);
    if (!claims || claims.typ !== 'hcp-oauth-request') return null;
    const { client_name: name, client_did: did, scope, exp } = claims;
    if (typeof name !== 'string' || !name.trim() || typeof did !== 'string' || !DID.test(did))
        return null;
    if (typeof scope !== 'string' || typeof exp !== 'number') return null;
    if (exp * 1000 <= now.getTime()) return null;

    const scopes = [...new Set(scope.split(/\s+/).filter(Boolean))];
    const matches = scopes.map(value => SCOPE.exec(value));
    if (matches.length === 0 || matches.some(match => !match || !isRegisteredCategory(match[1]!)))
        return null;
    const categories = [...new Set(matches.map(match => match![1]!))];
    const [first, ...rest] = categories;
    if (first === undefined) return null;
    return {
        ticket,
        clientName: name.trim().slice(0, 200),
        clientDid: did,
        scopes,
        categories: [first, ...rest],
        canWrite: matches.some(match => match![2] === 'write'),
    };
};

/** What the consent screen shows for an OAuth sign-in. */
export const requestFromOAuth = (signIn: OAuthSignIn, description: string): AccessRequest => ({
    client: { id: signIn.clientDid, name: signIn.clientName },
    categories: signIn.categories,
    purpose: { code: OAUTH_PURPOSE_CODE, description },
    duration: OAUTH_DURATION,
    ...(signIn.canWrite ? { canSuggest: true } : {}),
});

const DID = /^did:[a-z0-9]+:\S+$/;
const HOUR = 60 * 60 * 1000;

const isAbsoluteUrl = (value: string): boolean => {
    try {
        return Boolean(new URL(value).protocol);
    } catch {
        return false;
    }
};

/** Parses `/hcp/connect?client=&name=&categories=&purpose=&purposeCode=&duration=`. */
const FIELD_PROBLEM = {
    client: 'app',
    name: 'name',
    categories: 'categories',
    purpose: 'purpose',
    purposeCode: 'purpose',
    duration: 'duration',
} as const satisfies Record<string, LinkProblem>;

/**
 * `/hcp/connect?contract=<uri>[&client=<did>]` (LC-2421): the brain resolves what the
 * contract offers. `client` picks one agent when the contract names several.
 */
const parseContractLink = (params: URLSearchParams): ParsedLink => {
    if (params.getAll('contract').length > 1 || params.getAll('client').length > 1)
        return { kind: 'bad', problem: 'contract' };
    const contractUri = params.get('contract')?.trim() ?? '';
    const client = params.get('client')?.trim() || null;
    if (!contractUri.startsWith('lc:network:') || contractUri.length > 2048)
        return { kind: 'bad', problem: 'contract' };
    if (client !== null && (!DID.test(client) || client.length > 2048))
        return { kind: 'bad', problem: 'app' };
    return { kind: 'contract', contractUri, client };
};

export const parseConsentLink = (search: string, now: Date = new Date()): ParsedLink => {
    const params = new URLSearchParams(search);
    if (params.has('oauth_request')) {
        const tickets = params.getAll('oauth_request');
        const signIn = tickets.length === 1 ? parseOAuthRequest(tickets[0]!, now) : null;
        return signIn ? { kind: 'oauth', signIn } : { kind: 'bad', problem: 'oauth' };
    }
    if (params.has('contract')) return parseContractLink(params);
    // A repeated field is ambiguous: refuse it rather than pick one copy.
    const repeated = (Object.keys(FIELD_PROBLEM) as (keyof typeof FIELD_PROBLEM)[]).find(
        field => params.getAll(field).length > 1
    );
    if (repeated) return { kind: 'bad', problem: FIELD_PROBLEM[repeated] };
    const client = params.get('client')?.trim() ?? '';
    const name = params.get('name')?.trim() ?? '';
    const categories = (params.get('categories') ?? '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
    const description = params.get('purpose')?.trim() ?? '';
    const code = params.get('purposeCode')?.trim() || DEFAULT_PURPOSE_CODE;
    const duration = params.get('duration')?.trim() || '1h';
    const [first, ...rest] = categories;

    if (!DID.test(client) || client.length > 2048) return { kind: 'bad', problem: 'app' };
    if (!name || name.length > 200) return { kind: 'bad', problem: 'name' };
    if (
        first === undefined ||
        categories.length > 20 ||
        new Set(categories).size !== categories.length ||
        !categories.every(id => isRegisteredCategory(id) || isCustomCategory(id))
    )
        return { kind: 'bad', problem: 'categories' };
    if (!description || description.length > 1000 || !isAbsoluteUrl(code))
        return { kind: 'bad', problem: 'purpose' };
    if (!isDuration(duration)) return { kind: 'bad', problem: 'duration' };

    // LC-2423: absent = read-only Allow; exactly suggest=1 = write + canWrite false.
    const suggestValues = params.getAll('suggest');
    if (suggestValues.length > 1) return { kind: 'bad', problem: 'suggest' };
    const suggest = suggestValues[0]?.trim();
    if (suggest !== undefined && suggest !== '1') return { kind: 'bad', problem: 'suggest' };
    const canSuggest = suggest === '1';

    return {
        kind: 'ok',
        request: {
            client: { id: client, name },
            categories: [first, ...rest],
            purpose: { code, description },
            duration,
            ...(canSuggest ? { canSuggest: true } : {}),
        },
    };
};

/**
 * Exactly the requested categories, temporary unless the app asked for ongoing.
 * Default: read only. With canSuggest (LC-2423): read+write and canWrite false so
 * writes land as suggestions until the person accepts.
 */
export const grantRequestFor = (request: AccessRequest, now: Date): HcpGrantRequest => ({
    client: request.client,
    access: [
        {
            actions: request.canSuggest ? ['read', 'write'] : ['read'],
            categories: request.categories,
            purposes: [request.purpose],
        },
    ],
    ...(request.canSuggest ? { canWrite: false } : {}),
    ...(request.duration === 'ongoing'
        ? { grantType: 'persistent' }
        : {
              grantType: 'temporary',
              expiresAt: new Date(
                  now.getTime() + Number.parseInt(request.duration, 10) * HOUR
              ).toISOString(),
          }),
});

/**
 * The request a contract offers to one agent: the only one it names, or the one the
 * link picked. Null when the link names an agent the contract does not.
 */
export const requestFromOffer = (
    offer: HcpContractOffer,
    client: string | null
): AccessRequest | null => {
    const agent = client ?? (offer.agents.length === 1 ? offer.agents[0] : undefined);
    if (agent === undefined || !offer.agents.includes(agent)) return null;
    const categories = [...new Set(offer.access.flatMap(detail => detail.categories))];
    const purpose = offer.access[0]?.purposes[0];
    const [first, ...rest] = categories;
    if (first === undefined || !purpose) return null;
    return {
        client: { id: agent, name: offer.name },
        categories: [first, ...rest],
        purpose,
        duration: offer.duration,
        offeredBy: offer.owner.displayName,
    };
};

/** Allow under the contract version the person reviewed; the brain fills in the rest. */
export const contractGrantRequest = (
    offer: HcpContractOffer,
    clientDid: string
): HcpGrantRequest => ({
    client: { id: clientDid },
    source: { type: 'consentflow', contractUri: offer.contractUri, contractVersion: offer.version },
});
