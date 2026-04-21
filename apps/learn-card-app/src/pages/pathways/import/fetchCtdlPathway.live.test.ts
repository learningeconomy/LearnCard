/**
 * Live contract tests against the real Credential Engine Registry.
 *
 * ### These are opt-in — they do NOT run by default.
 *
 * They hit `credentialengineregistry.org` over the network, which is
 * (a) slower than fixture-based tests, (b) subject to outages outside
 * our control, and (c) uses a shared public service that we shouldn't
 * hammer on every CI run.
 *
 * Instead, they run only when `LEARNCARD_PATHWAYS_LIVE_TESTS=1` is set:
 *
 * ```
 * pnpm test:live-ctdl
 * ```
 *
 * or
 *
 * ```
 * LEARNCARD_PATHWAYS_LIVE_TESTS=1 pnpm exec vitest run src/pages/pathways/import/fetchCtdlPathway.live.test.ts
 * ```
 *
 * ### What these test catches that fixtures can't
 *
 *   - **Vocabulary drift.** The bug we fixed in `extractRefIds`
 *     (bare-string refs + `hasPart` vs. `hasChild`) would have been
 *     caught the first time these ran against real data.
 *   - **Network-adapter correctness.** `fetchCtdlPathway` parses live
 *     JSON-LD, walks the transitive closure, and assembles the graph
 *     — all real-world failure modes (HTTP errors, malformed JSON,
 *     redirects, etc.) only appear on the wire.
 *   - **Publisher variance.** Different CTDL publishers emit
 *     subtly different shapes. Add a new CTID to `LIVE_PATHWAYS`
 *     below any time we hit a publisher-specific surprise.
 *
 * ### Design of the assertions
 *
 * Assertions are **loose by design** — we don't hardcode "exactly 7
 * nodes" because real data can change upstream. We check that the
 * import succeeds, produces a non-empty graph, finds a destination,
 * and passes Zod validation. If something's off, the unit tests +
 * the live test's console output will still narrow it down.
 */

import { describe, expect, it } from 'vitest';

import { PathwaySchema } from '../types';

import {
    fetchCtdlPathway,
    CtdlFetchError,
} from './fetchCtdlPathway';
import { fromCtdlPathway } from './fromCtdlPathway';
import { toCtdlPathway } from '../projection/toCtdlPathway';

// Flip this to `true` temporarily (never commit!) to run locally
// without exporting an env var. Keep the default `false`.
const LIVE = process.env.LEARNCARD_PATHWAYS_LIVE_TESTS === '1';

// Per-test timeout: the registry can take a few seconds when cold, and
// we issue multiple requests per pathway.
const LIVE_TIMEOUT_MS = 30_000;

// Catalog of real-world pathways we want to keep parseable. Each entry
// is a known-good CTID plus loose expectations. Add an entry any time
// we encounter a publisher shape we didn't handle before — the entry
// becomes a regression fence for that pattern.
const LIVE_PATHWAYS: ReadonlyArray<{
    label: string;
    ctid: string;
    minNodes: number;
    mustHaveDestination: boolean;
}> = [
    {
        label: 'IMA · AI in Finance Micro-credential',
        ctid: 'ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
        // Six badges + one destination cert at time of writing. The
        // publisher could add/remove badges; assert lower bound only.
        minNodes: 5,
        mustHaveDestination: true,
    },
];

describe.skipIf(!LIVE)('CTDL live contract tests', () => {
    if (!LIVE) {
        // This describe body runs at collection time; the console.info
        // gives a friendly hint when someone wonders why these skipped.
        // (When `skipIf(true)`, vitest still prints the describe label
        //  but doesn't run the bodies. This log is a belt-and-braces.)
        // eslint-disable-next-line no-console
        console.info(
            '[ctdl-live] Skipping live CTDL tests. Set LEARNCARD_PATHWAYS_LIVE_TESTS=1 to enable.',
        );
    }

    for (const entry of LIVE_PATHWAYS) {
        describe(entry.label, () => {
            it(
                'fetches the pathway graph from the real registry',
                async () => {
                    const graph = await fetchCtdlPathway({ ctidOrUrl: entry.ctid });

                    expect(graph.pathway['ceterms:ctid']).toBe(entry.ctid);
                    expect(Object.keys(graph.components).length).toBeGreaterThan(0);
                },
                LIVE_TIMEOUT_MS,
            );

            it(
                'imports into a LearnCard Pathway that passes schema validation',
                async () => {
                    const graph = await fetchCtdlPathway({ ctidOrUrl: entry.ctid });

                    const { pathway, warnings } = fromCtdlPathway({
                        graph,
                        ownerDid: 'did:key:z-live-test',
                        now: new Date().toISOString(),
                    });

                    // Log warnings so a failing CI job surfaces *why*
                    // without having to re-run locally.
                    if (warnings.length > 0) {
                        // eslint-disable-next-line no-console
                        console.info(
                            `[ctdl-live] ${entry.label} produced ${warnings.length} warning(s):`,
                            warnings,
                        );
                    }

                    const result = PathwaySchema.safeParse(pathway);

                    expect(result.success).toBe(true);
                    expect(pathway.nodes.length).toBeGreaterThanOrEqual(entry.minNodes);

                    if (entry.mustHaveDestination) {
                        expect(pathway.destinationNodeId).toBeDefined();

                        const dest = pathway.nodes.find(
                            n => n.id === pathway.destinationNodeId,
                        );

                        expect(dest).toBeDefined();
                        expect(dest?.title.length).toBeGreaterThan(0);
                    }

                    // No self-loop edges — the destination is listed in
                    // both `hasPart` and `hasDestinationComponent` and we
                    // specifically guard against a dest→dest edge.
                    const selfLoops = pathway.edges.filter(e => e.from === e.to);

                    expect(selfLoops).toHaveLength(0);
                },
                LIVE_TIMEOUT_MS,
            );

            it(
                'round-trips without losing any nodes (CTDL → Pathway → CTDL → Pathway)',
                async () => {
                    const graph = await fetchCtdlPathway({ ctidOrUrl: entry.ctid });

                    const first = fromCtdlPathway({
                        graph,
                        ownerDid: 'did:key:z-live-test',
                        now: new Date().toISOString(),
                    });

                    const projected = toCtdlPathway({ pathway: first.pathway });

                    const second = fromCtdlPathway({
                        graph: projected.graph,
                        ownerDid: 'did:key:z-live-test',
                        now: new Date().toISOString(),
                    });

                    expect(second.pathway.nodes.length).toBe(first.pathway.nodes.length);
                    expect(second.pathway.destinationNodeId).toBeDefined();
                },
                LIVE_TIMEOUT_MS,
            );
        });
    }

    it(
        'surfaces a friendly CtdlFetchError for a bogus CTID',
        async () => {
            let err: unknown = null;

            try {
                await fetchCtdlPathway({ ctidOrUrl: 'ce-0000-0000-not-a-real-ctid' });
            } catch (caught) {
                err = caught;
            }

            expect(err).toBeInstanceOf(CtdlFetchError);
        },
        LIVE_TIMEOUT_MS,
    );
});
