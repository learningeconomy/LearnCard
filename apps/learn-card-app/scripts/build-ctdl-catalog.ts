#!/usr/bin/env tsx
/**
 * build-ctdl-catalog.ts
 * ---------------------
 *
 * One-shot tool for expanding the curated pathway catalog at
 * `src/pages/pathways/import/catalog/catalog.ts`.
 *
 * Does two independent things, both optional:
 *
 *   1. **search**   — Given a CE Registry Assistant API key, query for
 *                     published pathways and print the `ce-<uuid>` CTIDs
 *                     (plus names / owner, for sanity checks).
 *   2. **enrich**   — Given a list of CTIDs (on stdin or as args), fetch
 *                     the pathway JSON from the PUBLIC resource endpoint
 *                     (no key needed), extract name/description/owner/
 *                     image, and emit ready-to-paste TypeScript
 *                     `CatalogEntry` literals.
 *
 * The two modes are split on purpose so you can:
 *   - run `search` once, review the results, hand-edit the CTID list to
 *     drop test records / dupes / things you don't want in the catalog,
 *   - then run `enrich` against the curated list.
 *
 * There's also a convenience `all` subcommand that pipes search → enrich
 * in-memory for when you just want every published pathway.
 *
 * ## Why not wire this into the UI?
 *
 * See the earlier architectural decision: the CE search API requires a
 * server-held key we haven't provisioned yet. This script is the
 * stop-gap — you run it locally when you want to refresh the catalog,
 * paste its output into `catalog.ts`, commit, done. No runtime key,
 * no backend route, no CORS fight.
 *
 * ## Usage
 *
 * ```bash
 * # Env: API key (required for `search` / `all`; ignored by `enrich`).
 * export CE_API_KEY=...
 *
 * # 1. List every published pathway (tab-separated: CTID<TAB>name<TAB>owner).
 * pnpm tsx scripts/build-ctdl-catalog.ts search --take 200 > ctids.tsv
 *
 * # 2. Edit ctids.tsv, keep only the rows you want.
 *
 * # 3. Pipe CTIDs back in to produce TS entries:
 * cut -f1 ctids.tsv | pnpm tsx scripts/build-ctdl-catalog.ts enrich > entries.ts
 *
 * # Or skip the review step and do it all in one go:
 * pnpm tsx scripts/build-ctdl-catalog.ts all --take 200 > entries.ts
 *
 * # Then paste the contents of entries.ts into CATALOG[] in catalog.ts.
 * ```
 *
 * ## Environment
 *
 * - `CE_API_KEY`      — CE Registry Assistant API key (search only).
 * - `CE_SEARCH_URL`   — Override search endpoint. Defaults to CE's
 *                       public Assistant search. Set if CE moves the URL.
 * - `CE_REGISTRY_URL` — Override resource endpoint. Defaults to
 *                       `https://credentialengineregistry.org/resources`.
 *
 * ## Stability
 *
 * This script is defensive but opinionated:
 * - Unknown pathways are skipped with a warning on stderr, never
 *   inserted with placeholders.
 * - Tags are always empty by default — the curator is expected to add
 *   editorial tags before committing. We don't invent them.
 * - `featured` is always `false` in output. Flip manually for hand-
 *   picked headline entries.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_SEARCH_URL =
    process.env.CE_SEARCH_URL ??
    'https://apps.credentialengine.org/assistant/search/ctdl';

const DEFAULT_REGISTRY_URL =
    process.env.CE_REGISTRY_URL ?? 'https://credentialengineregistry.org/resources';

const API_KEY = process.env.CE_API_KEY ?? '';

// Fetch concurrency for `enrich` — CE's resource endpoint is generally
// fast but we don't want to hammer it. 6 is the same limit
// `fetchCtdlPathway.ts` uses in the app.
const FETCH_CONCURRENCY = 6;

// ---------------------------------------------------------------------------
// CLI plumbing
// ---------------------------------------------------------------------------

type Args = {
    command: 'search' | 'enrich' | 'all' | 'help';
    take: number;
    skip: number;
    positional: string[];
};

const parseArgs = (argv: string[]): Args => {
    const [, , command = 'help', ...rest] = argv;

    let take = 100;
    let skip = 0;
    const positional: string[] = [];

    for (let i = 0; i < rest.length; i += 1) {
        const arg = rest[i];

        if (arg === '--take' && rest[i + 1]) {
            take = Number.parseInt(rest[i + 1], 10);
            i += 1;
        } else if (arg === '--skip' && rest[i + 1]) {
            skip = Number.parseInt(rest[i + 1], 10);
            i += 1;
        } else {
            positional.push(arg);
        }
    }

    const normalized = (command === 'search' || command === 'enrich' || command === 'all')
        ? command
        : 'help';

    return { command: normalized, take, skip, positional };
};

const USAGE = `
Usage:
  build-ctdl-catalog.ts <command> [options]

Commands:
  search [--take N] [--skip N]     List pathway CTIDs via CE search API.
                                    Requires CE_API_KEY. Emits TSV on stdout:
                                       <ctid>\\t<name>\\t<owner>

  enrich [ctid ...]                 Read CTIDs from args or stdin (one per
                                    line, blank lines ignored), fetch each
                                    pathway's public JSON, emit TypeScript
                                    CatalogEntry literals on stdout.

  all    [--take N]                 search | enrich, all in one pass.
                                    Requires CE_API_KEY.

Env:
  CE_API_KEY        Required for 'search' and 'all'.
  CE_SEARCH_URL     Override search endpoint (default: CE Assistant).
  CE_REGISTRY_URL   Override resource base (default: registry public).
`.trim();

// ---------------------------------------------------------------------------
// CTID helpers
// ---------------------------------------------------------------------------

const CTID_RE = /ce-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

/**
 * Accept either a raw CTID, a registry URL, or any string containing a
 * CTID and extract the CTID. Returns null if nothing CTID-shaped found.
 */
const extractCtid = (input: string): string | null => {
    const match = input.trim().match(CTID_RE);
    return match ? match[0].toLowerCase() : null;
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

type SearchHit = {
    ctid: string;
    name: string;
    owner: string;
};

/**
 * Hit CE's CTDL Search with a minimal pathway-type filter. The exact
 * body shape CE accepts has drifted over time; we send both the legacy
 * `Filters` array and the newer `Query` block so the script tolerates
 * either backend without code changes. CE ignores unknown fields.
 */
const search = async (take: number, skip: number): Promise<SearchHit[]> => {
    if (!API_KEY) {
        throw new Error(
            'CE_API_KEY is not set. Export your CE Registry Assistant key before running `search` / `all`.',
        );
    }

    const body = {
        Skip: skip,
        Take: take,
        Filters: [{ URI: '@type', ItemTexts: ['ceterms:Pathway'] }],
        Query: { '@type': 'ceterms:Pathway' },
    };

    const res = await fetch(DEFAULT_SEARCH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `ApiToken ${API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `CE search failed: ${res.status} ${res.statusText}\n${text.slice(0, 500)}`,
        );
    }

    const json: unknown = await res.json();

    // CE's response shape has varied; support the two documented ones.
    // Both wrap an array of records in either `data` or top-level.
    const records = Array.isArray(json)
        ? json
        : Array.isArray((json as { data?: unknown }).data)
          ? ((json as { data: unknown[] }).data)
          : [];

    const hits: SearchHit[] = [];

    for (const record of records) {
        if (!record || typeof record !== 'object') continue;

        const r = record as Record<string, unknown>;

        // CE uses `ceterms:ctid` for the canonical ID, sometimes also
        // surfaces `CTID`, and sometimes just `@id` that embeds it.
        const rawCtid =
            (typeof r['ceterms:ctid'] === 'string' && r['ceterms:ctid']) ||
            (typeof r.CTID === 'string' && r.CTID) ||
            (typeof r['@id'] === 'string' && r['@id']) ||
            '';

        const ctid = extractCtid(rawCtid);
        if (!ctid) continue;

        const name = pickString(r, ['ceterms:name', 'Name', 'name']) ?? '(untitled pathway)';
        const owner = pickString(r, ['ceterms:ownedBy', 'ownedBy', 'Owner']) ?? '';

        hits.push({ ctid, name, owner });
    }

    return hits;
};

// ---------------------------------------------------------------------------
// Enrich (fetch a single pathway's public resource JSON)
// ---------------------------------------------------------------------------

type CatalogEntryDraft = {
    ctid: string;
    name: string;
    description: string;
    issuer: string;
    issuerUrl?: string;
    image?: string;
    componentCount?: number;
    // credentialType / tags / featured are left to the curator.
};

/**
 * Fetch a CTDL pathway resource from the public CE registry and
 * distill it into the subset of fields we surface in the catalog UI.
 *
 * No API key is sent — the `/resources/{ctid}` endpoint is public
 * (same path `fetchCtdlPathway.ts` uses at runtime).
 */
const fetchEntry = async (ctid: string): Promise<CatalogEntryDraft | null> => {
    const url = `${DEFAULT_REGISTRY_URL}/${encodeURIComponent(ctid)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!res.ok) {
        process.stderr.write(
            `[skip] ${ctid}: HTTP ${res.status} ${res.statusText}\n`,
        );
        return null;
    }

    const json = (await res.json()) as Record<string, unknown>;

    // Registry serves one of two envelopes: either the raw resource or
    // a `{ ..., "@graph": [ resource, ... ] }` wrapper. Unwrap.
    const resource = Array.isArray(json['@graph'])
        ? ((json['@graph'] as unknown[]).find(
              (n): n is Record<string, unknown> =>
                  !!n &&
                  typeof n === 'object' &&
                  (n as Record<string, unknown>)['@type'] === 'ceterms:Pathway',
          ) ?? null)
        : json;

    if (!resource) {
        process.stderr.write(`[skip] ${ctid}: no Pathway node in response\n`);
        return null;
    }

    const name = pickLangString(resource, ['ceterms:name', 'name']);
    const description = pickLangString(resource, ['ceterms:description', 'description']);

    if (!name || !description) {
        process.stderr.write(
            `[skip] ${ctid}: missing name or description (name=${!!name}, desc=${!!description})\n`,
        );
        return null;
    }

    // `ceterms:ownedBy` is a ref URI to an Organization. Fetch its
    // name + url so the card shows a human-readable issuer. Falls back
    // to the raw URI if the fetch fails — better than empty.
    const ownerRef = pickString(resource, ['ceterms:ownedBy']);
    let issuer = ownerRef ?? 'Unknown issuer';
    let issuerUrl: string | undefined;

    if (ownerRef) {
        const owner = await fetchOwner(ownerRef);
        if (owner) {
            issuer = owner.name;
            issuerUrl = owner.url;
        }
    }

    const image = pickString(resource, ['ceterms:image', 'image']) ?? undefined;

    // `ceterms:hasChild` is the set of PathwayComponent refs the
    // pathway pulls in. A count gives the card a "N components" badge
    // and lets us flag single-node pathways which are rarely useful.
    const components = resource['ceterms:hasChild'];
    const componentCount = Array.isArray(components) ? components.length : undefined;

    return { ctid, name, description, issuer, issuerUrl, image, componentCount };
};

const fetchOwner = async (
    ref: string,
): Promise<{ name: string; url?: string } | null> => {
    const ownerCtid = extractCtid(ref);
    const url = ownerCtid
        ? `${DEFAULT_REGISTRY_URL}/${encodeURIComponent(ownerCtid)}`
        : ref;

    try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return null;

        const json = (await res.json()) as Record<string, unknown>;

        const resource = Array.isArray(json['@graph'])
            ? ((json['@graph'] as unknown[]).find(
                  (n): n is Record<string, unknown> => !!n && typeof n === 'object',
              ) ?? json)
            : json;

        const name = pickLangString(resource, ['ceterms:name', 'name']);
        const ownerUrl = pickString(resource, [
            'ceterms:subjectWebpage',
            'ceterms:socialMedia',
            'url',
        ]);

        return name ? { name, url: ownerUrl ?? undefined } : null;
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------------------
// CTDL field extraction helpers
// ---------------------------------------------------------------------------

const pickString = (
    obj: Record<string, unknown>,
    keys: string[],
): string | null => {
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
};

/**
 * CTDL language-tagged strings come in as either a plain string, a
 * `{ "en": "value" }` map, or an array of the former. Flatten to a
 * single English-preferred string.
 */
const pickLangString = (
    obj: Record<string, unknown>,
    keys: string[],
): string | null => {
    for (const key of keys) {
        const value = obj[key];

        if (typeof value === 'string' && value.trim()) return value.trim();

        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string' && item.trim()) return item.trim();
            }
        }

        if (value && typeof value === 'object') {
            const map = value as Record<string, unknown>;
            const en = map['en'] ?? map['en-US'];
            if (typeof en === 'string' && en.trim()) return en.trim();

            // Fallback: first string-valued entry.
            for (const v of Object.values(map)) {
                if (typeof v === 'string' && v.trim()) return v.trim();
            }
        }
    }

    return null;
};

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

/**
 * Emit a single TypeScript object literal matching `CatalogEntry`.
 * Escapes strings safely so paste-in never breaks the source file.
 * Leaves `credentialType` / `tags` / `featured` as placeholders so the
 * curator MUST fill them in consciously before commit.
 */
const formatEntry = (e: CatalogEntryDraft): string => {
    const parts: string[] = [];

    parts.push(`    {`);
    parts.push(`        ctid: ${str(e.ctid)},`);
    parts.push(`        name: ${str(e.name)},`);
    parts.push(`        description: ${str(e.description)},`);
    parts.push(`        issuer: ${str(e.issuer)},`);

    if (e.issuerUrl) parts.push(`        issuerUrl: ${str(e.issuerUrl)},`);

    // Curator fills these in — left as TODO so they're noticeable.
    parts.push(`        credentialType: 'Pathway', // TODO: refine`);
    parts.push(`        tags: [], // TODO: add editorial tags`);

    if (e.image) parts.push(`        image: ${str(e.image)},`);
    if (e.componentCount !== undefined) {
        parts.push(`        componentCount: ${e.componentCount},`);
    }

    parts.push(`        featured: false,`);
    parts.push(`    },`);

    return parts.join('\n');
};

/** Safe TS string literal — single-quoted, escapes \\ and '. */
const str = (s: string): string => {
    return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}'`;
};

// ---------------------------------------------------------------------------
// Concurrency helper (same shape as the app's internal limiter)
// ---------------------------------------------------------------------------

const mapWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;

    const worker = async () => {
        for (;;) {
            const i = nextIndex;
            nextIndex += 1;
            if (i >= items.length) return;
            results[i] = await fn(items[i]);
        }
    };

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
};

// ---------------------------------------------------------------------------
// Stdin helper
// ---------------------------------------------------------------------------

const readStdin = async (): Promise<string> => {
    if (process.stdin.isTTY) return '';

    let data = '';
    process.stdin.setEncoding('utf8');

    for await (const chunk of process.stdin) data += chunk;
    return data;
};

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const runSearch = async (take: number, skip: number): Promise<SearchHit[]> => {
    const hits = await search(take, skip);
    return hits;
};

const runEnrich = async (ctids: string[]): Promise<CatalogEntryDraft[]> => {
    const cleaned = Array.from(
        new Set(
            ctids
                .map(extractCtid)
                .filter((c): c is string => c !== null),
        ),
    );

    if (cleaned.length !== ctids.length) {
        process.stderr.write(
            `[info] ${ctids.length - cleaned.length} input line(s) did not contain a CTID; skipping.\n`,
        );
    }

    process.stderr.write(`[info] enriching ${cleaned.length} CTID(s)...\n`);

    const drafts = await mapWithConcurrency(cleaned, FETCH_CONCURRENCY, fetchEntry);
    return drafts.filter((d): d is CatalogEntryDraft => d !== null);
};

const collectCtidInputs = async (positional: string[]): Promise<string[]> => {
    if (positional.length > 0) return positional;

    const piped = await readStdin();
    if (!piped.trim()) {
        throw new Error(
            'No CTIDs supplied. Pass CTIDs as args, or pipe them on stdin (one per line).',
        );
    }

    return piped
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const main = async () => {
    const args = parseArgs(process.argv);

    switch (args.command) {
        case 'search': {
            const hits = await runSearch(args.take, args.skip);
            for (const hit of hits) {
                process.stdout.write(`${hit.ctid}\t${hit.name}\t${hit.owner}\n`);
            }
            process.stderr.write(`[ok] ${hits.length} pathway(s) found.\n`);
            break;
        }

        case 'enrich': {
            const inputs = await collectCtidInputs(args.positional);
            const drafts = await runEnrich(inputs);
            for (const draft of drafts) {
                process.stdout.write(`${formatEntry(draft)}\n`);
            }
            process.stderr.write(
                `[ok] ${drafts.length} entry/entries written (of ${inputs.length} input line(s)).\n`,
            );
            break;
        }

        case 'all': {
            const hits = await runSearch(args.take, 0);
            process.stderr.write(`[info] search returned ${hits.length} CTID(s). enriching...\n`);

            const drafts = await runEnrich(hits.map(h => h.ctid));
            for (const draft of drafts) {
                process.stdout.write(`${formatEntry(draft)}\n`);
            }
            process.stderr.write(
                `[ok] ${drafts.length} entry/entries written (of ${hits.length} search hits).\n`,
            );
            break;
        }

        case 'help':
        default:
            process.stdout.write(`${USAGE}\n`);
            break;
    }
};

main().catch(err => {
    process.stderr.write(`[fatal] ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
});
