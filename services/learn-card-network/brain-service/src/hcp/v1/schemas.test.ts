import { describe, expect, it } from 'vitest';

import {
    CategorySchema,
    CreateEntryInputSchema,
    CreateGrantInputSchema,
    orderCategories,
} from './schemas';
import { entryInput } from './service/test-harness';

describe('HCP v1 category identifiers (Draft 3 §4.5)', () => {
    it.each([
        'general_preferences',
        'health_context',
        'https://learncard.com/hcp/categories/badges',
        'https://categories.learncard.com/badges?v=1',
        'http://learncard.com/hcp/badges',
        'https://xn--bcher-kva.example.org/c',
    ])('accepts %s', id => {
        expect(CategorySchema.safeParse(id).success).toBe(true);
    });

    it.each([
        ['an unregistered slug', 'my_custom_category'],
        ['a slug with the wrong case', 'General_Preferences'],
        ['a relative reference', '/hcp/categories/badges'],
        ['a URN, which has no domain', 'urn:learncard:badges'],
        ['a DID, which has no domain', 'did:web:learncard.com'],
        ['a non-http scheme', 'ftp://learncard.com/badges'],
        ['a single-label host', 'https://localhost/badges'],
        ['an IP host', 'https://10.0.0.1/badges'],
        ['an IPv6 host', 'https://[::1]/badges'],
        ['userinfo', 'https://user@learncard.com/badges'],
        ['a non-canonical host', 'https://LearnCard.com/badges'],
        ['a missing path slash', 'https://learncard.com'],
        ['whitespace', 'https://learncard.com/my badges'],
        ['the spec namespace', 'https://hcp.example/categories/badges'],
        ['a spec namespace subdomain', 'https://x.hcp.example/badges'],
        ['an over-long URI', `https://learncard.com/${'a'.repeat(2048)}`],
        ['the empty string', ''],
    ])('rejects %s', (_, id) => {
        expect(CategorySchema.safeParse(id).success).toBe(false);
    });

    it('rejects a create naming a malformed category as an invalid request', () => {
        const input = { ...entryInput(), classification: { categories: ['urn:x:y'] } };
        const parsed = CreateEntryInputSchema.safeParse(input);
        expect(parsed.success).toBe(false);
        expect(parsed.error?.issues[0]?.path).toEqual(['classification', 'categories', 0]);
    });

    it('orders registered categories by registry, then custom categories, without repeats', () => {
        expect(
            orderCategories([
                'https://b.learncard.com/x',
                'work_context',
                'https://a.learncard.com/x',
                'general_preferences',
                'work_context',
            ])
        ).toEqual([
            'general_preferences',
            'work_context',
            'https://a.learncard.com/x',
            'https://b.learncard.com/x',
        ]);
    });
});

describe('HCP v1 grant input forms (LC-2421)', () => {
    const access = [
        {
            actions: ['read'],
            categories: ['general_preferences'],
            purposes: [{ code: 'https://purpose.example/a', description: 'A' }],
        },
    ];

    it('requires a direct grant to name its client and access', () => {
        expect(
            CreateGrantInputSchema.safeParse({ client: { id: 'did:key:z6MkA' }, access }).success
        ).toBe(false);
        expect(
            CreateGrantInputSchema.safeParse({ client: { id: 'did:key:z6MkA', name: 'A' } }).success
        ).toBe(false);
        expect(
            CreateGrantInputSchema.parse({ client: { id: 'did:key:z6MkA', name: 'A' }, access })
                .source
        ).toEqual({ type: 'direct' });
    });

    it('accepts a contract grant with only the agent and the reviewed version', () => {
        const source = {
            type: 'consentflow',
            contractUri: 'lc:network:x/trpc:contract:c',
            contractVersion: 2,
        };
        expect(CreateGrantInputSchema.parse({ client: { id: 'did:key:z6MkA' }, source })).toEqual({
            client: { id: 'did:key:z6MkA' },
            source,
        });
        expect(
            CreateGrantInputSchema.safeParse({
                client: { id: 'did:key:z6MkA' },
                source: { ...source, contractVersion: '2' },
            }).success
        ).toBe(false);
    });
});
