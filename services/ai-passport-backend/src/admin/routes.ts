import { recoveryPassRequestSchema } from './supplemental-recovery';
import { EmbeddingResumeBlockedError } from './embedding-recovery';
import { isGenerationRetryPolicy } from './generation-retry';
import {
    listRuns,
    diagnoseMetadata,
    getPlanStatus,
    planRun,
    startRun,
    stopRun,
    resumeRun,
    recoverRunOnce,
} from './runs';
import { authService } from '../auth/service';
import { costPricing } from './cost-model';
import {
    coverageFailureReason,
    coverageFailureStage,
    coverageVectorFailure,
} from './coverage-error';
import {
    listBatches,
    recoverBatch,
    batchPreflight,
    startBatch,
    advanceBatch,
    stopBatch,
    assertNoBatch,
} from './batches';
import { listRepairJobs, createRepairJob, repairJobAction } from './legacy-repair';
import { trustedAdminReadOrigin, trustedOrigins } from '../auth/trusted-origin';
import { readGenerationStatus } from '../ai/read-generation';
import { migrationCoverage } from './coverage';
import { db } from '../db';
import { recoverSourceVectorCleanup } from '../db/qdrant';
// Loaded on use: the sweep and retirement modules pull in collection config.
const legacySweep = () => import('./legacy-vector-sweep');
const legacyRetirement = () => import('./legacy-retirement');
const SWEEP_MAX_PAGES = 8;
import { LEARNCARD_DID_WEB, CORS_ORIGINS, DOMAIN } from '../constants/env';
import { getLearnCard } from '../learncard';
import { NOVA_IDENTITY } from '../ai/embedding-generation';
import { isServicePrincipal, isFreshAdmin, csrfToken, validAdminMutation } from './security';
import { listJobs, createJob, stepJob, cancelJob, costPlan } from './backfill';
export async function handleAdminRoute(
    req: Request,
    session: { did: string; authenticatedAt?: number } | null,
    sessionId: string | undefined
): Promise<Response | null> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/admin/')) return null;
    const json = (body: unknown, status = 200) =>
        Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (process.env.EMBEDDINGS_ADMIN_ENABLED !== 'true')
        return json({ error: 'Administration disabled' }, 404);
    if (!session || !sessionId) return json({ error: 'Authentication required' }, 401);
    try {
        const actual = (await getLearnCard()).id.did();
        if (!isServicePrincipal(session, LEARNCARD_DID_WEB, actual))
            return json({ error: 'Configured service profile required' }, 403);
        const origin = trustedAdminReadOrigin(req, DOMAIN, CORS_ORIGINS);
        if (!origin) return json({ error: 'Trusted origin required' }, 403);
        if (req.method === 'GET' && url.pathname === '/admin/embeddings/metadata-diagnosis') {
            try {
                return json(await diagnoseMetadata());
            } catch {
                return json(
                    {
                        error: 'Metadata diagnosis unavailable; no complete counts returned.',
                    },
                    503
                );
            }
        }
        const reviewStatus = /^\/admin\/embeddings\/runs\/plan\/([0-9a-f-]{36})$/.exec(
            url.pathname
        );
        if (req.method === 'GET' && reviewStatus) {
            const preparation = await getPlanStatus(reviewStatus[1], session.did);
            return preparation ? json(preparation) : json({ error: 'Review not found' }, 404);
        }
        if (req.method === 'GET' && url.pathname === '/admin/embeddings/preflight')
            return json(await batchPreflight());
        if (req.method === 'GET' && url.pathname === '/admin/embeddings/coverage') {
            try {
                return json(await migrationCoverage());
            } catch (error) {
                return json(
                    {
                        error: 'Coverage inventory unavailable',
                        reason: coverageFailureReason(error),
                        stage: coverageFailureStage(error),
                        vector: coverageVectorFailure(error),
                    },
                    503
                );
            }
        }
        if (req.method === 'GET' && url.pathname === '/admin/embeddings') {
            const jobs = await listJobs();
            const readControl = await readGenerationStatus();
            return json({
                generation: readControl.effective,
                readControl,
                target: NOVA_IDENTITY,
                pricing: costPricing(process.env),
                enabled: process.env.BEDROCK_EMBEDDINGS_ENABLED === 'true',
                dualWrite: process.env.EMBEDDINGS_DUAL_WRITE === 'true',
                fresh: isFreshAdmin(session),
                csrf: csrfToken(sessionId, origin),
                cleanup: await db.sourceCleanupSummary(),
                runs: await listRuns(),
                batches: await listBatches(),
                repairJobs: await listRepairJobs(),
                jobs: jobs.map(job => ({
                    ...job,
                    plan: costPlan(job.embeddingRequests, job.representationCalls, job.usage),
                })),
            });
        }
        if (req.method === 'GET' && url.pathname === '/admin/embeddings/legacy-collections')
            return json(await (await legacyRetirement()).legacyRetirementStatus());
        if (req.method !== 'POST') return json({ error: 'Unknown admin endpoint' }, 404);
        if (!validAdminMutation(req, sessionId, trustedOrigins(DOMAIN, CORS_ORIGINS)))
            return json({ error: 'Origin or CSRF rejected' }, 403);
        // An authenticated owner may always reduce an existing run's authority.
        // New starts and resumes still require the usual fresh profile proof.
        const stopOnly = /^\/admin\/embeddings\/runs\/[0-9a-f-]{36}\/(pause|cancel)$/.test(
            url.pathname
        );
        if (!stopOnly && !isFreshAdmin(session))
            return json({ error: 'Fresh profile login required' }, 401);
        if (Number(req.headers.get('Content-Length') ?? 0) > 2048)
            return json({ error: 'Request too large' }, 413);
        const text = await req.text();
        if (text.length > 2048) return json({ error: 'Request too large' }, 413);
        const body = JSON.parse(text);
        if (!body || typeof body !== 'object' || Array.isArray(body))
            return json({ error: 'Object body required' }, 400);
        const principal = async () => {
            const current = await authService.getSession(sessionId);
            const configured = (await getLearnCard()).id.did();
            if (!isServicePrincipal(current, LEARNCARD_DID_WEB, configured))
                throw new Error('Current service session required');
        };
        if (url.pathname === '/admin/embeddings/runs/plan') {
            if (
                Object.keys(body).some(key => !['requestId', 'recordLimit'].includes(key)) ||
                !/^[0-9a-f-]{36}$/.test(body.requestId ?? '') ||
                (body.recordLimit !== undefined &&
                    (!Number.isInteger(body.recordLimit) ||
                        body.recordLimit < 1 ||
                        body.recordLimit > 10000))
            )
                return json({ error: 'Plan request ID required' }, 400);
            const preparation = await planRun(body.requestId, session.did, body.recordLimit);
            return json(preparation, preparation?.state === 'preparing' ? 202 : 200);
        }
        if (url.pathname === '/admin/embeddings/runs') {
            if (
                Object.keys(body).some(
                    key =>
                        ![
                            'requestId',
                            'planId',
                            'paidAuthorized',
                            'replaceRunId',
                            'generationRetryPolicy',
                        ].includes(key)
                ) ||
                !/^[0-9a-f-]{36}$/.test(body.requestId ?? '') ||
                !/^[0-9a-f-]{36}$/.test(body.planId ?? '') ||
                body.paidAuthorized !== true ||
                (body.generationRetryPolicy !== undefined &&
                    !isGenerationRetryPolicy(body.generationRetryPolicy)) ||
                (body.replaceRunId !== undefined && !/^[0-9a-f-]{36}$/.test(body.replaceRunId))
            )
                return json(
                    { error: 'Reviewed plan and explicit paid authorization required' },
                    400
                );
            return json(
                await startRun(
                    body.requestId,
                    body.planId,
                    true,
                    principal,
                    session.did,
                    body.replaceRunId,
                    body.generationRetryPolicy
                ),
                201
            );
        }
        const recovery = /^\/admin\/embeddings\/runs\/([0-9a-f-]{36})\/recover-once$/.exec(
            url.pathname
        );
        if (recovery) {
            const parsed = recoveryPassRequestSchema.safeParse(body);
            if (!parsed.success) return json({ error: 'Invalid recovery confirmation' }, 400);
            return json(await recoverRunOnce(recovery[1], principal, session.did, parsed.data));
        }
        const run = /^\/admin\/embeddings\/runs\/([0-9a-f-]{36})\/(pause|cancel|resume)$/.exec(
            url.pathname
        );
        if (run) {
            if (
                run[2] === 'resume'
                    ? Object.keys(body).some(key => key !== 'generationRetryPolicy') ||
                      (body.generationRetryPolicy !== undefined &&
                          !isGenerationRetryPolicy(body.generationRetryPolicy))
                    : Object.keys(body).length
            )
                return json({ error: 'Invalid run action' }, 400);
            await principal();
            return json(
                run[2] === 'resume'
                    ? await resumeRun(run[1], principal, session.did, body.generationRetryPolicy)
                    : await stopRun(run[1], run[2] === 'cancel', session.did)
            );
        }
        if (url.pathname === '/admin/embeddings/batches') {
            if (
                Object.keys(body).some(
                    k => !['requestId', 'jobId', 'kind', 'limit', 'paidAuthorized'].includes(k)
                ) ||
                !/^[0-9a-f-]{36}$/.test(body.requestId ?? '') ||
                !/^[0-9a-f-]{36}$/.test(body.jobId ?? '') ||
                !['verification', 'apply'].includes(body.kind) ||
                !Number.isInteger(body.limit) ||
                body.limit < 1 ||
                body.limit > 100 ||
                (body.kind === 'apply' && body.paidAuthorized !== true)
            )
                return json({ error: 'Explicit bounded batch required' }, 400);
            return json(
                await startBatch(
                    body.requestId,
                    body.jobId,
                    body.kind,
                    body.limit,
                    body.paidAuthorized === true
                )
            );
        }
        const batch =
            /^\/admin\/embeddings\/batches\/([0-9a-f-]{36})\/(advance|pause|cancel|recover)$/.exec(
                url.pathname
            );
        if (batch) {
            if (batch[2] === 'advance') {
                if (
                    Object.keys(body).some(k => k !== 'sequence') ||
                    !Number.isInteger(body.sequence) ||
                    body.sequence < 0
                )
                    return json({ error: 'Exact batch sequence required' }, 400);
                return json(await advanceBatch(batch[1], body.sequence));
            }
            if (Object.keys(body).length) return json({ error: 'Empty action required' }, 400);
            if (batch[2] === 'recover') return json(await recoverBatch(batch[1]));
            return json(await stopBatch(batch[1], batch[2] === 'cancel'));
        }
        if (url.pathname === '/admin/embeddings/legacy-repair/jobs') {
            if (
                Object.keys(body).some(key => !['requestId', 'continuationOf'].includes(key)) ||
                !/^[0-9a-f-]{36}$/.test(body.requestId ?? '') ||
                (body.continuationOf !== undefined && !/^[0-9a-f-]{36}$/.test(body.continuationOf))
            )
                return json({ error: 'Repair request ID required' }, 400);
            return json(await createRepairJob(body.requestId, body.continuationOf), 201);
        }
        const repair =
            /^\/admin\/embeddings\/legacy-repair\/jobs\/([0-9a-f-]{36})\/(preview|verify)$/.exec(
                url.pathname
            );
        if (repair) {
            if (Object.keys(body).length)
                return json({ error: 'One-record repair takes no source input' }, 400);
            await assertNoBatch(repair[1], 'verification');
            return json(await repairJobAction(repair[1], repair[2] === 'verify'));
        }
        if (url.pathname === '/admin/embeddings/cleanup/step') {
            if (
                Object.keys(body).some(key => key !== 'limit') ||
                !Number.isInteger(body.limit ?? 1) ||
                (body.limit ?? 1) < 1 ||
                (body.limit ?? 1) > 5
            )
                return json({ error: 'Cleanup unit limit must be 1–5' }, 400);
            return json(await recoverSourceVectorCleanup({ limit: body.limit ?? 1 }));
        }
        if (url.pathname === '/admin/embeddings/legacy-sweep') {
            const cursor = body.cursor;
            if (
                Object.keys(body).some(key => !['apply', 'pages', 'cursor'].includes(key)) ||
                typeof body.apply !== 'boolean' ||
                (body.pages !== undefined &&
                    (!Number.isInteger(body.pages) ||
                        body.pages < 1 ||
                        body.pages > SWEEP_MAX_PAGES)) ||
                (cursor !== undefined &&
                    (!cursor ||
                        typeof cursor !== 'object' ||
                        Object.keys(cursor).some(
                            key => !['collectionIndex', 'offset'].includes(key)
                        ) ||
                        !Number.isInteger(cursor.collectionIndex) ||
                        (cursor.offset !== undefined &&
                            typeof cursor.offset !== 'string' &&
                            !Number.isInteger(cursor.offset))))
            )
                return json(
                    {
                        error: `apply boolean, pages 1–${SWEEP_MAX_PAGES} and an optional cursor required`,
                    },
                    400
                );
            await principal();
            const { sweepLegacyVectors } = await legacySweep();
            return json(
                await sweepLegacyVectors({
                    apply: body.apply,
                    pages: body.pages ?? 1,
                    cursor,
                })
            );
        }
        if (url.pathname === '/admin/embeddings/legacy-collections/drop') {
            if (
                Object.keys(body).some(key => !['collections', 'confirm'].includes(key)) ||
                !Array.isArray(body.collections) ||
                body.collections.some((name: unknown) => typeof name !== 'string') ||
                typeof body.confirm !== 'string'
            )
                return json({ error: 'Exact collection list and confirmation required' }, 400);
            await principal();
            const { dropLegacyCollections, LegacyDropRefused } = await legacyRetirement();
            try {
                return json(await dropLegacyCollections(body.collections, body.confirm));
            } catch (error) {
                if (error instanceof LegacyDropRefused)
                    return json({ error: error.message, code: error.code }, 409);
                throw error;
            }
        }
        if (url.pathname === '/admin/embeddings/jobs') {
            if (
                typeof body.dryRun !== 'boolean' ||
                Object.keys(body).some(
                    k =>
                        ![
                            'dryRun',
                            'requestId',
                            'regenerationAuthorized',
                            'continuationOf',
                        ].includes(k)
                ) ||
                !/^[0-9a-f-]{36}$/.test(body.requestId ?? '') ||
                (body.continuationOf !== undefined &&
                    (typeof body.continuationOf !== 'string' ||
                        !/^[0-9a-f-]{36}$/.test(body.continuationOf))) ||
                (!body.dryRun && body.regenerationAuthorized !== true)
            )
                return json({ error: 'dryRun boolean required' }, 400);
            return json(
                await createJob(
                    body.dryRun,
                    body.requestId,
                    body.regenerationAuthorized === true,
                    body.continuationOf
                ),
                201
            );
        }
        const match = /^\/admin\/embeddings\/jobs\/([0-9a-f-]{36})\/(step|cancel)$/.exec(
            url.pathname
        );
        if (!match) return json({ error: 'Unknown admin endpoint' }, 404);
        if (match[2] === 'cancel') {
            await cancelJob(match[1]);
            return json({ cancelled: true });
        }
        await assertNoBatch(match[1], 'apply');
        return json(await stepJob(match[1], body.limit ?? 1));
    } catch (error) {
        if (error instanceof EmbeddingResumeBlockedError)
            return json({ error: error.message, code: error.code, record: error.record }, 409);
        return json({ error: 'Admin operation unavailable' }, 503);
    }
}
