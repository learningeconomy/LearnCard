import { writeFile } from 'node:fs/promises';
import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { RegistryClient } from '@digitalcredentials/issuer-registry-client';
import { knownDIDRegistryQueryOptions } from './issuerRegistry';

const catalogues = [
    'https://registries.learncard.com/known-did-registries.json',
    'https://registries.learncard.com/untrusted-did-registries.json',
];
const trusted = [
    ...Array.from({ length: 5 }, (_, i) => ({
        type: 'dcc-legacy',
        name: `Trusted registry ${i}`,
        url: `https://registry.example/${i}.json`,
    })),
    { type: 'oidf', name: 'Federation', trustAnchorEC: 'https://registry.example/anchor' },
];
const untrusted = [
    { type: 'dcc-legacy', name: 'Untrusted', url: 'https://registry.example/untrusted.json' },
];
const dids = Array.from({ length: 16 }, (_, i) => `did:example:issuer-${i}`);
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
afterEach(() => {
    client.clear();
    vi.unstubAllGlobals();
});

it('reduces 16 distinct issuer lookups from 144 shared-document requests to nine', async () => {
    const fetchMock = vi.fn(async (url: string) => {
        if (url === catalogues[0]) return Response.json(trusted);
        if (url === catalogues[1]) return Response.json(untrusted);
        if (url.endsWith('/anchor'))
            return new Response(
                `e30.${Buffer.from(
                    JSON.stringify({
                        metadata: {
                            federation_entity: {
                                federation_fetch_endpoint: 'https://registry.example/fetch',
                            },
                        },
                    })
                ).toString('base64url')}.x`
            );
        if (url.includes('/fetch?')) return new Response('', { status: 404 });
        return Response.json({
            registry: Object.fromEntries(
                dids.map(did => [
                    did,
                    {
                        name: did,
                        url: 'https://issuer.example',
                        location: 'Example',
                    },
                ])
            ),
        });
    });
    vi.stubGlobal('fetch', fetchMock);
    // Exercise the actual dependency and main's per-issuer lookup pattern.
    const baseline = await Promise.all(
        dids.map(async did => {
            const [known, unknown] = await Promise.all(
                catalogues.map(async url => (await fetch(url)).json())
            );
            const trustedClient = new RegistryClient();
            const untrustedClient = new RegistryClient();
            trustedClient.use({ registries: known });
            untrustedClient.use({ registries: unknown });
            const [a, b] = await Promise.all([
                trustedClient.lookupIssuersFor(did),
                untrustedClient.lookupIssuersFor(did),
            ]);
            return {
                source: a.matchingIssuers.length
                    ? 'trusted'
                    : b.matchingIssuers.length
                      ? 'untrusted'
                      : 'unknown',
                results: a,
            };
        })
    );
    const measure = () => ({
        sharedDocuments: fetchMock.mock.calls.filter(([url]) => !url.includes('/fetch?')).length,
        issuerLookups: fetchMock.mock.calls.filter(([url]) => url.includes('/fetch?')).length,
        total: fetchMock.mock.calls.length,
    });
    const before = measure();
    fetchMock.mockClear();
    const results = await Promise.all(
        dids.map(did => client.fetchQuery(knownDIDRegistryQueryOptions(client, did)))
    );
    const after = measure();
    expect(before).toEqual({ sharedDocuments: 144, issuerLookups: 16, total: 160 });
    expect(after).toEqual({ sharedDocuments: 9, issuerLookups: 16, total: 25 });
    results.forEach((result, i) => {
        expect(result.source).toBe(baseline[i].source);
        expect(result.results).toEqual(baseline[i].results);
    });
    await Promise.all(
        dids.map(did => client.fetchQuery(knownDIDRegistryQueryOptions(client, did)))
    );
    expect(measure()).toEqual(after);
    const evidence = {
        scenario:
            '16 distinct issuers; two catalogues, six legacy documents, one federation anchor',
        network:
            'deterministic mocked fetch; actual RegistryClient baseline, query adapter candidate',
        before,
        after,
        documentReductionPercent: 93.75,
        totalReductionPercent: 84.375,
        sameIssuerMetadata: true,
        warmRepeatAdditionalRequests: 0,
        limitations: 'Request counts only; not a deployed latency or server-load measurement.',
    };
    if (process.env.LC2233_EVIDENCE_JSON)
        await writeFile(process.env.LC2233_EVIDENCE_JSON, JSON.stringify(evidence, null, 2) + '\n');
});
