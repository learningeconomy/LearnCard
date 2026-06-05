/**
 * Minimal URL query helpers backed by `URLSearchParams`, replacing the two
 * `query-string` call sites in the image helpers. `query-string@9` is ESM-only
 * and pulls in ESM-only transitive deps, which broke the CommonJS build of
 * `@learncard/helpers` for external consumers on Node 18.
 */

export type ParsedUrl = {
    url: string;
    query: Record<string, string>;
    fragmentIdentifier?: string;
};

export const parseUrl = (input: string): ParsedUrl => {
    const hashIndex = input.indexOf('#');
    const fragmentIdentifier = hashIndex === -1 ? undefined : input.slice(hashIndex + 1);
    const withoutFragment = hashIndex === -1 ? input : input.slice(0, hashIndex);

    const queryIndex = withoutFragment.indexOf('?');
    const url = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
    const search = queryIndex === -1 ? '' : withoutFragment.slice(queryIndex + 1);

    const query: Record<string, string> = {};
    for (const [key, value] of new URLSearchParams(search)) query[key] = value;

    return {
        url,
        query,
        ...(fragmentIdentifier !== undefined ? { fragmentIdentifier } : {}),
    };
};

export const stringifyUrl = (parsed: ParsedUrl): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(parsed.query)) {
        if (value === undefined || value === null) continue;
        params.append(key, String(value));
    }

    // URLSearchParams encodes spaces as `+`; normalize to `%20` so output stays
    // byte-stable for consumers that use the URL as a cache key.
    const search = params.toString().replace(/\+/g, '%20');
    const fragment = parsed.fragmentIdentifier ? `#${parsed.fragmentIdentifier}` : '';

    return `${parsed.url}${search ? `?${search}` : ''}${fragment}`;
};
