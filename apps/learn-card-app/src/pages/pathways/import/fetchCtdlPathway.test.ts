/**
 * Unit tests for `fetchCtdlPathway`. The live-network tests in
 * `fetchCtdlPathway.live.test.ts` exercise the real registry only when
 * opted in; these tests use an injected `fetchImpl` so they run in
 * every CI invocation without hitting the network.
 *
 * We focus on:
 *
 *   - The second-pass proxy resolution (`ceterms:proxyFor` → fetch and
 *     return under `graph.proxies`). This is where the bulk of the
 *     learner-facing data — badge image, landing page — actually lives.
 *   - Graceful degradation when a single proxy fetch fails: the
 *     pathway should still import, just without the failed proxy.
 *   - Non-http proxy refs being skipped (not even attempted), since
 *     registry-canonical `ce-<uuid>` refs are metadata.
 */

import { describe, expect, it, vi } from 'vitest';

import { fetchCtdlPathway } from './fetchCtdlPathway';

const REGISTRY = 'https://credentialengineregistry.org/resources';

/**
 * Build a `typeof fetch` stub that serves JSON bodies from an in-memory
 * map keyed by URL. Unknown URLs produce a 404 by default so missing
 * keys read as real fetch failures rather than silent undefined JSON.
 */
const makeFetch = (
    bodies: Record<string, unknown>,
    overrides?: Record<string, () => Promise<Response>>,
): typeof fetch => {
    return vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : (input as URL).toString();

        if (overrides?.[url]) return overrides[url]();

        if (url in bodies) {
            return new Response(JSON.stringify(bodies[url]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;
};

describe('fetchCtdlPathway — proxy resolution (second pass)', () => {
    it('fetches each component\'s `ceterms:proxyFor` and returns the proxies under `graph.proxies`', async () => {
        // Graph: one pathway → one CredentialComponent → one proxied
        // Badge. The Badge holds the learner-facing subjectWebpage
        // and image that we rely on downstream.
        const PATHWAY_URL = `${REGISTRY}/ce-pathway`;
        const COMPONENT_URL = `${REGISTRY}/ce-component`;
        const PROXY_URL = `${REGISTRY}/ce-badge`;

        const fetchImpl = makeFetch({
            [PATHWAY_URL]: {
                '@id': PATHWAY_URL,
                '@type': 'ceterms:Pathway',
                'ceterms:ctid': 'ce-pathway',
                'ceterms:name': 'Pathway',
                'ceterms:hasPart': [COMPONENT_URL],
                'ceterms:hasDestinationComponent': [COMPONENT_URL],
            },
            [COMPONENT_URL]: {
                '@id': COMPONENT_URL,
                '@type': 'ceterms:CredentialComponent',
                'ceterms:ctid': 'ce-component',
                'ceterms:name': 'Component',
                'ceterms:proxyFor': PROXY_URL,
            },
            [PROXY_URL]: {
                '@id': PROXY_URL,
                '@type': 'ceterms:Badge',
                'ceterms:ctid': 'ce-badge',
                'ceterms:name': 'Badge',
                'ceterms:subjectWebpage': 'https://issuer.example/landing',
                'ceterms:image': 'https://images.example/badge.png',
            },
        });

        const graph = await fetchCtdlPathway({
            ctidOrUrl: PATHWAY_URL,
            fetchImpl,
        });

        expect(graph.proxies).toBeDefined();
        expect(graph.proxies?.[PROXY_URL]).toBeDefined();
        expect(graph.proxies?.[PROXY_URL]?.['ceterms:subjectWebpage']).toBe(
            'https://issuer.example/landing',
        );
        expect(graph.proxies?.[PROXY_URL]?.['ceterms:image']).toBe(
            'https://images.example/badge.png',
        );
    });

    it('deduplicates proxy fetches when multiple components point at the same credential', async () => {
        // Two CredentialComponents (A and B) both proxy the same
        // Badge. The Badge resource should be requested exactly once.
        const PATHWAY_URL = `${REGISTRY}/ce-pathway`;
        const COMP_A = `${REGISTRY}/ce-a`;
        const COMP_B = `${REGISTRY}/ce-b`;
        const PROXY_URL = `${REGISTRY}/ce-shared-badge`;

        const bodies = {
            [PATHWAY_URL]: {
                '@id': PATHWAY_URL,
                '@type': 'ceterms:Pathway',
                'ceterms:ctid': 'ce-pathway',
                'ceterms:name': 'Pathway',
                'ceterms:hasPart': [COMP_A, COMP_B],
                'ceterms:hasDestinationComponent': [COMP_A],
            },
            [COMP_A]: {
                '@id': COMP_A,
                '@type': 'ceterms:CredentialComponent',
                'ceterms:name': 'A',
                'ceterms:proxyFor': PROXY_URL,
            },
            [COMP_B]: {
                '@id': COMP_B,
                '@type': 'ceterms:CredentialComponent',
                'ceterms:name': 'B',
                'ceterms:proxyFor': PROXY_URL,
            },
            [PROXY_URL]: {
                '@id': PROXY_URL,
                '@type': 'ceterms:Badge',
                'ceterms:name': 'Shared Badge',
            },
        };

        const fetchImpl = makeFetch(bodies);

        await fetchCtdlPathway({ ctidOrUrl: PATHWAY_URL, fetchImpl });

        const proxyCalls = (fetchImpl as unknown as { mock: { calls: unknown[][] } })
            .mock.calls.filter(([url]) => url === PROXY_URL);

        expect(proxyCalls).toHaveLength(1);
    });

    it('skips non-http `proxyFor` refs without attempting a fetch', async () => {
        // Registry `ce-<uuid>` refs occasionally end up in the
        // proxyFor field un-expanded; they are not resolvable so we
        // shouldn't turn them into network requests.
        const PATHWAY_URL = `${REGISTRY}/ce-pathway`;
        const COMPONENT_URL = `${REGISTRY}/ce-component`;

        const fetchImpl = makeFetch({
            [PATHWAY_URL]: {
                '@id': PATHWAY_URL,
                '@type': 'ceterms:Pathway',
                'ceterms:ctid': 'ce-pathway',
                'ceterms:name': 'Pathway',
                'ceterms:hasPart': [COMPONENT_URL],
                'ceterms:hasDestinationComponent': [COMPONENT_URL],
            },
            [COMPONENT_URL]: {
                '@id': COMPONENT_URL,
                '@type': 'ceterms:CredentialComponent',
                'ceterms:name': 'Component',
                'ceterms:proxyFor': 'ce-not-a-url',
            },
        });

        const graph = await fetchCtdlPathway({
            ctidOrUrl: PATHWAY_URL,
            fetchImpl,
        });

        expect(graph.proxies).toEqual({});

        // And no fetch call was issued for the bare CTID.
        const mockCalls = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls;

        expect(mockCalls.map(([url]) => url)).not.toContain('ce-not-a-url');
    });

    it('swallows individual proxy fetch failures so the pathway still imports', async () => {
        // One of two proxied Badges fails (e.g., 500). The successful
        // one should still land under `graph.proxies`; the failing one
        // is silently dropped.
        const PATHWAY_URL = `${REGISTRY}/ce-pathway`;
        const COMP_OK = `${REGISTRY}/ce-ok`;
        const COMP_FAIL = `${REGISTRY}/ce-fail`;
        const PROXY_OK = `${REGISTRY}/ce-badge-ok`;
        const PROXY_FAIL = `${REGISTRY}/ce-badge-fail`;

        const fetchImpl = makeFetch(
            {
                [PATHWAY_URL]: {
                    '@id': PATHWAY_URL,
                    '@type': 'ceterms:Pathway',
                    'ceterms:ctid': 'ce-pathway',
                    'ceterms:name': 'Pathway',
                    'ceterms:hasPart': [COMP_OK, COMP_FAIL],
                    'ceterms:hasDestinationComponent': [COMP_OK],
                },
                [COMP_OK]: {
                    '@id': COMP_OK,
                    '@type': 'ceterms:CredentialComponent',
                    'ceterms:name': 'Ok',
                    'ceterms:proxyFor': PROXY_OK,
                },
                [COMP_FAIL]: {
                    '@id': COMP_FAIL,
                    '@type': 'ceterms:CredentialComponent',
                    'ceterms:name': 'Fail',
                    'ceterms:proxyFor': PROXY_FAIL,
                },
                [PROXY_OK]: {
                    '@id': PROXY_OK,
                    '@type': 'ceterms:Badge',
                    'ceterms:name': 'Healthy Badge',
                    'ceterms:image': 'https://images.example/ok.png',
                },
            },
            {
                [PROXY_FAIL]: async () =>
                    new Response('Server Error', { status: 500 }),
            },
        );

        const graph = await fetchCtdlPathway({
            ctidOrUrl: PATHWAY_URL,
            fetchImpl,
        });

        expect(graph.proxies?.[PROXY_OK]).toBeDefined();
        expect(graph.proxies?.[PROXY_FAIL]).toBeUndefined();
        // And all components remain — the pathway itself imports fine.
        expect(Object.keys(graph.components)).toHaveLength(2);
    });

    it('returns an empty `proxies` record when no component has a `proxyFor`', async () => {
        // Authored pathways and older CTDL shapes don't use proxyFor;
        // we shouldn't produce a missing field (the importer gates on
        // `graph.proxies` being a record, so `undefined` would be
        // fine but an explicit `{}` is tidier).
        const PATHWAY_URL = `${REGISTRY}/ce-pathway`;
        const COMPONENT_URL = `${REGISTRY}/ce-component`;

        const fetchImpl = makeFetch({
            [PATHWAY_URL]: {
                '@id': PATHWAY_URL,
                '@type': 'ceterms:Pathway',
                'ceterms:ctid': 'ce-pathway',
                'ceterms:name': 'Pathway',
                'ceterms:hasPart': [COMPONENT_URL],
                'ceterms:hasDestinationComponent': [COMPONENT_URL],
            },
            [COMPONENT_URL]: {
                '@id': COMPONENT_URL,
                '@type': 'ceterms:CredentialComponent',
                'ceterms:name': 'Component',
            },
        });

        const graph = await fetchCtdlPathway({
            ctidOrUrl: PATHWAY_URL,
            fetchImpl,
        });

        expect(graph.proxies).toEqual({});
    });
});
