import { describe, expect, it } from 'vitest';

import { STATIC_CONTEXTS, getStaticContext } from './staticContexts';

const CLR_2_0_1 = 'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json';

describe('staticContexts', () => {
    it('serves the CLR v2p0 2.0.1 context without a network fetch', () => {
        const ctx = getStaticContext(CLR_2_0_1);

        expect(ctx).toBeDefined();
        expect(ctx).toMatchObject({
            '@context': {
                ClrCredential: { '@context': { partial: { '@type': 'xsd:boolean' } } },
                ClrSubject: {
                    '@context': {
                        identifier: { '@type': 'obi:Identifier' },
                        obi: 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#',
                    },
                },
            },
        });
    });

    it('returns undefined for unknown urls so the WASM loader can take over', () => {
        expect(getStaticContext('https://example.com/unknown.json')).toBeUndefined();
    });

    it('every registered url is an absolute https url', () => {
        for (const url of Object.keys(STATIC_CONTEXTS)) expect(url).toMatch(/^https:\/\//);
    });
});
