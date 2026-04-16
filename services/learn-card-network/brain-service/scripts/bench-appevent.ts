#!/usr/bin/env tsx
/**
 * LC-1644 backend-only benchmark for the appEvent / send-credential flow.
 *
 * Measures:
 *   - Client-side wall-clock time per appEvent call
 *   - Server-side phase breakdowns via PerfTracker (LC_PERF_LOG=1)
 *
 * Usage:
 *   pnpm bench:appevent
 *   PERF_LABEL=baseline pnpm bench:appevent
 *   PERF_ITERATIONS=20 PERF_WARMUP=2 PERF_LABEL=after-task-2 pnpm bench:appevent
 *
 * Requires:
 *   - brain-service running locally with LC_PERF_LOG=1
 *   - Neo4j on bolt://localhost:7687
 *   - Docker compose stack up (for log scraping)
 */

import { execSync } from 'child_process';
import * as path from 'path';

import { initLearnCard } from '@learncard/init';
import { getClient } from '@learncard/network-brain-client';

import { seedBench } from './bench-helpers/seed';
import { scrapeBackendPerfLogs } from './bench-helpers/log-scraper';
import { aggregate, writeReport } from './bench-helpers/aggregate';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ITERATIONS = Number(process.env.PERF_ITERATIONS || 20);
const WARMUP = Number(process.env.PERF_WARMUP || 2);
const LABEL = process.env.PERF_LABEL || 'unlabeled';
const TARGET_P50_TOTAL_MS = 4000;
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:4000/trpc';
const TEST_SEED = process.env.TEST_SEED || '1'.repeat(64);

// ---------------------------------------------------------------------------
// tRPC client with DID-Auth
// ---------------------------------------------------------------------------

async function buildClient() {
    const lc = await initLearnCard({ seed: TEST_SEED, network: BRAIN_URL });

    const didAuthFn = async (challenge?: string): Promise<string> => {
        const vp = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
        if (typeof vp !== 'string') throw new Error('getDidAuthVp returned non-string');
        return vp;
    };

    const client = await getClient(BRAIN_URL, didAuthFn);
    const getDid = () => lc.id.did();

    return { client, getDid };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const startTs = new Date().toISOString();

    console.log(`\n[bench] LC-1644 appEvent benchmark`);
    console.log(`[bench]   label=${LABEL} iterations=${ITERATIONS} warmup=${WARMUP}`);
    console.log(`[bench]   commit=${commitSha.slice(0, 8)}`);
    console.log(`[bench]   brain=${BRAIN_URL}\n`);

    // 1. Build authenticated client (need DID before creating profile)
    console.log('[bench] Building tRPC client...');
    // 1. Seed FIRST (creates issuer profile with matching DID in Neo4j directly) —
    //    avoids needing the tRPC `createProfile` call which routes through the init's
    //    network plugin that defaults to cloud.learncard.com.
    console.log('[bench] Seeding...');
    const seeded = await seedBench();
    console.log(`[bench] Seeded: listingId=${seeded.listingId} templateAlias=${seeded.templateAlias}\n`);

    // 2. Now build authenticated client (seed has already populated profile with our DID)
    const { getDid } = await buildClient();
    const did = getDid();
    console.log(`[bench] DID ready: did=${did}\n`);

    // 4. Run iterations — rebuild client per iteration to avoid challenge-reuse
    //    (brain-client pre-fetches challenges but they have to be unique per request;
    //    something about the batch+async pattern triggers UNAUTHORIZED after iter 1).
    console.log(`[bench] Running ${WARMUP} warmup + ${ITERATIONS} measured iterations...\n`);
    const iterationTimes: number[] = [];
    let errorCount = 0;

    for (let i = 0; i < WARMUP + ITERATIONS; i++) {
        const isWarmup = i < WARMUP;
        const t0 = performance.now();
        let failed = false;

        try {
            // Fresh client per iteration (isolates auth state; adds ~50ms overhead
            // to iteration time but avoids false UNAUTHORIZED errors)
            const { client } = await buildClient();
            await client.appStore.appEvent.mutate({
                listingId: seeded.listingId,
                event: {
                    type: 'send-credential',
                    templateAlias: seeded.templateAlias,
                    templateData: { issuedAt: new Date().toISOString() },
                },
            });
        } catch (e: any) {
            errorCount++;
            failed = true;
            console.error(`[bench] Iteration ${i + 1} FAILED: ${e?.message ?? e}`);
        }

        const dt = performance.now() - t0;
        if (!isWarmup) iterationTimes.push(dt);

        const tag = isWarmup ? 'warmup' : 'iter';
        console.log(`  [${tag}] ${i + 1}/${WARMUP + ITERATIONS} — ${Math.round(dt)}ms${failed ? ' (err)' : ''}`);
    }

    console.log(`\n[bench] Done. ${iterationTimes.length} samples, ${errorCount} errors.`);

    // 5. Scrape backend perf logs
    console.log('[bench] Scraping backend perf logs...');
    // Compose file is at repo root — pnpm --filter runs CWD inside the service dir,
    // so we need to resolve the path back up to the monorepo root
    const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
    const samples = scrapeBackendPerfLogs({
        since: startTs,
        composeFile: process.env.COMPOSE_FILE ?? path.join(repoRoot, 'apps/learn-card-app/compose-local.yaml'),
    });
    console.log(`[bench] Scraped ${samples.length} backend perf samples\n`);

    // 6. Aggregate
    const flat: Array<{ label: string; ms: number }> = [];

    for (const t of iterationTimes) {
        flat.push({ label: 'client:appEvent:total', ms: t });
    }

    for (const s of samples) {
        flat.push({ label: s.label, ms: s.totalMs });
        for (const [phase, ms] of Object.entries(s.phases || {})) {
            flat.push({ label: `${s.label}:${phase}`, ms: ms as number });
        }
    }

    const stats = aggregate(flat);

    // Print summary
    const clientTotal = stats.get('client:appEvent:total');
    if (clientTotal) {
        console.log(`[bench] Client total: p50=${clientTotal.p50}ms p95=${clientTotal.p95}ms mean=${clientTotal.mean}ms`);
    }

    const backendTotal = stats.get('handleSendCredentialEvent');
    if (backendTotal) {
        console.log(`[bench] Backend total: p50=${backendTotal.p50}ms p95=${backendTotal.p95}ms`);
    }

    // 7. Write report
    const date = new Date().toISOString().slice(0, 10);
    const outPath = path.join(
        // Write relative to repo root (go up from brain-service/scripts → 4 levels)
        path.resolve(__dirname, '../../../..'),
        'docs/superpowers/reports',
        `${date}-lc-1644-${LABEL}-backend.md`
    );

    await writeReport({
        outPath,
        label: `${LABEL}-backend`,
        commitSha,
        iterations: ITERATIONS,
        warmup: WARMUP,
        stats,
        targetTotalMs: TARGET_P50_TOTAL_MS,
        errors: errorCount,
    });

    console.log(`\n[bench] Report written to: ${outPath}`);
}

main().catch((e) => {
    console.error('[bench] Fatal error:', e);
    process.exit(1);
});
