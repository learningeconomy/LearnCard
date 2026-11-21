import { describe, expect, it } from 'vitest';

import {
    DEFAULT_PURPOSE_CODE,
    contractGrantRequest,
    grantRequestFor,
    OAUTH_PURPOSE_CODE,
    parseConsentLink,
    requestFromOAuth,
    requestFromOffer,
} from './consentLink';

const CLIENT = 'did:key:z6MkDemoTutor';
const link = (params: Record<string, string>) => `?${new URLSearchParams(params).toString()}`;
const valid = {
    client: CLIENT,
    name: 'Demo Tutor',
    categories: 'goals_and_constraints,https://tutor.example/categories/study-habits',
    purpose: 'Help you study',
};

describe('HCP consent links', () => {
    it('parses a valid link with safe defaults', () => {
        expect(parseConsentLink(link(valid))).toEqual({
            kind: 'ok',
            request: {
                client: { id: CLIENT, name: 'Demo Tutor' },
                categories: [
                    'goals_and_constraints',
                    'https://tutor.example/categories/study-habits',
                ],
                purpose: { code: DEFAULT_PURPOSE_CODE, description: 'Help you study' },
                duration: '1h',
            },
        });
    });

    it.each([
        ['app', { ...valid, client: 'not-a-did' }],
        ['name', { ...valid, name: '' }],
        ['categories', { ...valid, categories: '' }],
        ['categories', { ...valid, categories: 'made_up' }],
        ['categories', { ...valid, categories: 'work_context,work_context' }],
        ['categories', { ...valid, categories: 'https://hcp.example/categories/x' }],
        ['categories', { ...valid, categories: 'https://192.168.0.1/x' }],
        ['categories', { ...valid, categories: 'https://tutor.123/x' }],
        ['categories', { ...valid, categories: 'https://-bad.example/x' }],
        ['purpose', { ...valid, purpose: '' }],
        ['purpose', { ...valid, purposeCode: 'not a url' }],
        ['duration', { ...valid, duration: '7d' }],
    ])('rejects a bad %s', (problem, params) => {
        expect(parseConsentLink(link(params))).toEqual({ kind: 'bad', problem });
    });

    it('rejects a link that repeats a field', () => {
        expect(parseConsentLink(`${link(valid)}&client=did:key:z6MkOther`)).toEqual({
            kind: 'bad',
            problem: 'app',
        });
        expect(parseConsentLink(`${link(valid)}&categories=health_context`)).toEqual({
            kind: 'bad',
            problem: 'categories',
        });
    });

    it('asks for read only, exactly the requested categories, and a short expiry', () => {
        const parsed = parseConsentLink(link({ ...valid, duration: '4h' }));
        if (parsed.kind !== 'ok') throw new Error('expected a valid link');
        expect(grantRequestFor(parsed.request, new Date('2026-11-17T20:00:00.000Z'))).toEqual({
            client: { id: CLIENT, name: 'Demo Tutor' },
            access: [
                {
                    actions: ['read'],
                    categories: parsed.request.categories,
                    purposes: [{ code: DEFAULT_PURPOSE_CODE, description: 'Help you study' }],
                },
            ],
            grantType: 'temporary',
            expiresAt: '2026-11-18T00:00:00.000Z',
        });
    });

    it('makes an ongoing request a persistent grant with no expiry', () => {
        const parsed = parseConsentLink(link({ ...valid, duration: 'ongoing' }));
        if (parsed.kind !== 'ok') throw new Error('expected a valid link');
        expect(grantRequestFor(parsed.request, new Date())).toMatchObject({
            grantType: 'persistent',
        });
        expect(grantRequestFor(parsed.request, new Date())).not.toHaveProperty('expiresAt');
    });

    it('suggest=1 asks for write with canWrite false; default stays read-only', () => {
        const suggesting = parseConsentLink(link({ ...valid, suggest: '1' }));
        if (suggesting.kind !== 'ok') throw new Error('expected a valid link');
        expect(suggesting.request.canSuggest).toBe(true);
        expect(grantRequestFor(suggesting.request, new Date('2026-11-17T20:00:00.000Z'))).toEqual({
            client: { id: CLIENT, name: 'Demo Tutor' },
            access: [
                {
                    actions: ['read', 'write'],
                    categories: suggesting.request.categories,
                    purposes: [{ code: DEFAULT_PURPOSE_CODE, description: 'Help you study' }],
                },
            ],
            canWrite: false,
            grantType: 'temporary',
            expiresAt: '2026-11-17T21:00:00.000Z',
        });

        const plain = parseConsentLink(link(valid));
        if (plain.kind !== 'ok') throw new Error('expected a valid link');
        expect(plain.request.canSuggest).toBeUndefined();
        expect(grantRequestFor(plain.request, new Date())).not.toHaveProperty('canWrite');
        expect(grantRequestFor(plain.request, new Date()).access[0]?.actions).toEqual(['read']);
    });

    it('rejects a bad or repeated suggest param', () => {
        expect(parseConsentLink(link({ ...valid, suggest: 'true' }))).toEqual({
            kind: 'bad',
            problem: 'suggest',
        });
        expect(parseConsentLink(`${link(valid)}&suggest=1&suggest=1`)).toEqual({
            kind: 'bad',
            problem: 'suggest',
        });
    });
});

describe('HCP contract links (LC-2421)', () => {
    const CONTRACT = 'lc:network:localhost%3A4324/trpc:contract:tutor';
    const offer = {
        contractUri: CONTRACT,
        version: 2,
        name: 'Demo Tutor',
        owner: { profileId: 'tutor-co', displayName: 'Tutor Co' },
        agents: [CLIENT, 'did:key:z6MkOther'],
        access: [
            {
                type: 'https://hcp.example/spec/authorization/context-access' as const,
                actions: ['read' as const],
                categories: ['goals_and_constraints'],
                purposes: [{ code: 'https://purpose.example/tutoring', description: 'Tutoring' }],
            },
        ],
        duration: '4h' as const,
        expiresAt: null,
    };

    it('parses a contract link, which wins over the direct fields', () => {
        expect(parseConsentLink(link({ contract: CONTRACT }))).toEqual({
            kind: 'contract',
            contractUri: CONTRACT,
            client: null,
        });
        expect(parseConsentLink(link({ ...valid, contract: CONTRACT }))).toEqual({
            kind: 'contract',
            contractUri: CONTRACT,
            client: CLIENT,
        });
    });

    it('refuses a contract link that is not a LearnCard contract URI, or repeats a field', () => {
        expect(parseConsentLink(link({ contract: 'https://evil.example' }))).toEqual({
            kind: 'bad',
            problem: 'contract',
        });
        expect(parseConsentLink(`?contract=${CONTRACT}&contract=${CONTRACT}`)).toEqual({
            kind: 'bad',
            problem: 'contract',
        });
        expect(parseConsentLink(link({ contract: CONTRACT, client: 'nope' }))).toEqual({
            kind: 'bad',
            problem: 'app',
        });
    });

    it('needs the link to pick an agent when the contract names several', () => {
        expect(requestFromOffer(offer, null)).toBeNull();
        expect(requestFromOffer(offer, 'did:key:z6MkStranger')).toBeNull();
        expect(requestFromOffer(offer, CLIENT)).toEqual({
            client: { id: CLIENT, name: 'Demo Tutor' },
            categories: ['goals_and_constraints'],
            purpose: { code: 'https://purpose.example/tutoring', description: 'Tutoring' },
            duration: '4h',
            offeredBy: 'Tutor Co',
        });
        expect(requestFromOffer({ ...offer, agents: [CLIENT] }, null)?.client.id).toBe(CLIENT);
    });

    it('allows under the reviewed version only', () => {
        expect(contractGrantRequest(offer, CLIENT)).toEqual({
            client: { id: CLIENT },
            source: { type: 'consentflow', contractUri: CONTRACT, contractVersion: 2 },
        });
    });
});

describe('HCP OAuth sign-in links', () => {
    const NOW = new Date('2026-11-20T12:00:00Z');
    const exp = Math.floor(NOW.getTime() / 1000) + 600;
    const DID = 'did:web:127.0.0.1%3A18767:hcp:oauth-clients:hcp_oauth_abc';
    const ticket = (claims: Record<string, unknown>) =>
        ['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');
    const claims = {
        typ: 'hcp-oauth-request',
        client_name: 'Claude Code',
        client_did: DID,
        scope: 'hcp:health_context:read hcp:general_preferences:read',
        exp,
    };

    it('decodes the ticket for display and keeps it for approve', () => {
        const t = ticket(claims);
        const parsed = parseConsentLink(link({ oauth_request: t }), NOW);
        expect(parsed).toEqual({
            kind: 'oauth',
            signIn: {
                ticket: t,
                clientName: 'Claude Code',
                clientDid: DID,
                scopes: ['hcp:health_context:read', 'hcp:general_preferences:read'],
                categories: ['health_context', 'general_preferences'],
                canWrite: false,
            },
        });
        if (parsed.kind !== 'oauth') throw new Error('expected oauth');
        expect(requestFromOAuth(parsed.signIn, 'Use it')).toEqual({
            client: { id: DID, name: 'Claude Code' },
            categories: ['health_context', 'general_preferences'],
            purpose: { code: OAUTH_PURPOSE_CODE, description: 'Use it' },
            duration: '1h',
        });
    });

    it.each([
        ['expired', ticket({ ...claims, exp: exp - 601 })],
        ['wrong typ', ticket({ ...claims, typ: 'hcp-consent' })],
        ['no DID', ticket({ ...claims, client_did: 'nope' })],
        ['custom scope', ticket({ ...claims, scope: 'hcp:https://x.example/c:read' })],
        ['no scopes', ticket({ ...claims, scope: '' })],
        ['not a JWT', 'abc'],
    ])('refuses %s', (_label, value) => {
        expect(parseConsentLink(link({ oauth_request: value }), NOW)).toEqual({
            kind: 'bad',
            problem: 'oauth',
        });
    });

    it('refuses a repeated ticket', () => {
        const t = ticket(claims);
        expect(parseConsentLink(`?oauth_request=${t}&oauth_request=${t}`, NOW)).toEqual({
            kind: 'bad',
            problem: 'oauth',
        });
    });
});
