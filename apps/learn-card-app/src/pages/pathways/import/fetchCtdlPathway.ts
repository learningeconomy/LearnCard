/**
 * fetchCtdlPathway — live-network helper that assembles a
 * `CtdlGraph` from the Credential Engine Registry.
 *
 * Given a CTID (`ce-<uuid>`) or a full resource URI, this function
 * fetches the pathway root and every referenced component, returning
 * the parsed graph ready for `fromCtdlPathway` to consume.
 *
 * ### CORS caveat
 *
 * Direct browser access to `credentialengineregistry.org` may be
 * blocked by CORS depending on the user's origin. Two mitigations:
 *
 *   - Pass a `fetch` implementation that proxies through our own
 *     backend (preferred for production — backend handles caching,
 *     rate-limiting, and CORS in one place).
 *   - Fall back to the default `fetch` during dev; the registry does
 *     serve `Access-Control-Allow-Origin: *` on its public resource
 *     endpoints as of 2025, but treat this as "probably works" rather
 *     than guaranteed.
 *
 * The `fetch` implementation is injected for both reasons: the unit
 * test in `fromCtdlPathway.test.ts` uses fixtures directly and never
 * exercises this module, but if we want integration tests later they
 * can pass an in-memory fetch mock.
 *
 * ### Polite crawling
 *
 * Components are fetched in *parallel* but we bound concurrency with
 * `DEFAULT_CONCURRENCY` so a fan-in pathway of 30 children doesn't
 * spawn 30 simultaneous requests against the registry. The registry
 * is public infrastructure — be a good citizen.
 */

import {
    extractRefIds,
    getPathwayMemberRefs,
    type CtdlCredential,
    type CtdlGraph,
    type CtdlPathway,
    type CtdlPathwayComponent,
} from './ctdlTypes';

export const DEFAULT_REGISTRY_BASE =
    'https://credentialengineregistry.org/resources';

const DEFAULT_CONCURRENCY = 6;

export interface FetchCtdlPathwayOptions {
    /**
     * Either a bare CTID (`ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf`)
     * or a full resource URL. Both are normalized internally.
     */
    ctidOrUrl: string;

    /** Base URL of the registry. Defaults to the public one. */
    registryBase?: string;

    /**
     * Injected fetch. Omit to use the global `fetch`. Useful for
     * proxying through a backend endpoint or for testing.
     */
    fetchImpl?: typeof fetch;

    /**
     * Maximum number of components fetched concurrently. Default: 6.
     */
    concurrency?: number;
}

export class CtdlFetchError extends Error {
    constructor(
        message: string,
        public readonly cause?: unknown,
    ) {
        super(message);
        this.name = 'CtdlFetchError';
    }
}

/**
 * Fetch a CTDL pathway and all of its referenced components.
 */
export const fetchCtdlPathway = async (
    opts: FetchCtdlPathwayOptions,
): Promise<CtdlGraph> => {
    const {
        ctidOrUrl,
        registryBase = DEFAULT_REGISTRY_BASE,
        fetchImpl = fetch,
        concurrency = DEFAULT_CONCURRENCY,
    } = opts;

    const rootUrl = normalizeToUrl(ctidOrUrl, registryBase);

    const pathway = await fetchJson<CtdlPathway>(rootUrl, fetchImpl);

    // Gather every @id we need to resolve (root-level parts +
    // destination) then walk transitively through any component-level
    // hasChild relationships.
    const components: Record<string, CtdlPathwayComponent> = {};
    const queue: string[] = [
        ...getPathwayMemberRefs(pathway),
        ...extractRefIds(pathway['ceterms:hasDestinationComponent']),
    ];
    const seen = new Set<string>();

    while (queue.length > 0) {
        const batch = queue.splice(0, concurrency).filter(uri => {
            if (seen.has(uri)) return false;
            seen.add(uri);

            return true;
        });

        if (batch.length === 0) continue;

        const results = await Promise.all(
            batch.map(uri => fetchJson<CtdlPathwayComponent>(uri, fetchImpl)),
        );

        for (const component of results) {
            components[component['@id']] = component;

            // Enqueue any transitively-referenced components.
            for (const childUri of extractRefIds(component['ceterms:hasChild'])) {
                if (!seen.has(childUri)) queue.push(childUri);
            }
        }
    }

    // Second pass — resolve `ceterms:proxyFor` references. A CTDL
    // `CredentialComponent` typically carries only the display name of
    // what will be earned; the learner-facing data (landing page URL,
    // badge image, longer description) lives on the proxied
    // `ceterms:Badge` / `ceterms:Certificate` / etc. Without this pass
    // the importer gets a title and nothing else to show — which is
    // what the IMA "AI in Finance" pathway looks like in practice.
    //
    // Failures are swallowed per-proxy rather than propagated: the
    // pathway is still importable without its artwork, and a single
    // dead-letter link shouldn't sink the whole operation.
    const proxies: Record<string, CtdlCredential> = {};

    const proxyUris = new Set<string>();

    for (const component of Object.values(components)) {
        const proxyRef = component['ceterms:proxyFor'];

        if (typeof proxyRef === 'string' && /^https?:\/\//i.test(proxyRef)) {
            proxyUris.add(proxyRef);
        }
    }

    const proxyQueue = [...proxyUris];

    while (proxyQueue.length > 0) {
        const batch = proxyQueue.splice(0, concurrency);

        const results = await Promise.allSettled(
            batch.map(uri => fetchJson<CtdlCredential>(uri, fetchImpl)),
        );

        for (const [i, settled] of results.entries()) {
            if (settled.status === 'fulfilled') {
                const credential = settled.value;

                proxies[credential['@id'] ?? batch[i]] = credential;
            }
            // Rejected fetches leave the proxy out; the importer falls
            // back to whatever the component itself carries. We don't
            // warn here because individual proxy misses are a
            // reasonable steady state (some registry records are
            // incomplete).
        }
    }

    return { pathway, components, proxies };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CTID_RE = /^ce-[a-f0-9-]+$/i;

const normalizeToUrl = (ctidOrUrl: string, registryBase: string): string => {
    const trimmed = ctidOrUrl.trim();

    if (!trimmed) {
        throw new CtdlFetchError('`ctidOrUrl` is empty.');
    }

    if (CTID_RE.test(trimmed)) {
        return `${registryBase.replace(/\/$/, '')}/${trimmed}`;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    throw new CtdlFetchError(
        `\`ctidOrUrl\` "${ctidOrUrl}" is neither a CTID nor an http(s) URL.`,
    );
};

const fetchJson = async <T>(url: string, fetchImpl: typeof fetch): Promise<T> => {
    let response: Response;

    try {
        response = await fetchImpl(url, {
            headers: { Accept: 'application/json' },
        });
    } catch (err) {
        throw new CtdlFetchError(
            `Network error while fetching CTDL resource ${url}.`,
            err,
        );
    }

    if (!response.ok) {
        throw new CtdlFetchError(
            `CTDL resource ${url} returned HTTP ${response.status} ${response.statusText}.`,
        );
    }

    try {
        return (await response.json()) as T;
    } catch (err) {
        throw new CtdlFetchError(
            `CTDL resource ${url} returned invalid JSON.`,
            err,
        );
    }
};
