import { describe, expect, it } from 'vitest';

import { DEFAULT_PURPOSE_CODE, grantRequestFor, parseConsentLink } from './consentLink';

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
});
