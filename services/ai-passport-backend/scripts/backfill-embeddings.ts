// Operator client: uses the same profile-authenticated, CSRF-protected dashboard API.
// Inert unless explicitly run; never opens the database or bypasses learner consent.
import { randomUUID } from 'node:crypto';
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(
        'NOVA_BACKFILL_API, NOVA_BACKFILL_ORIGIN and NOVA_BACKFILL_SESSION are required. Default: create/run one bounded dry-run job. --recover-cleanup --cleanup-steps N runs 1–100 bounded cleanup units (default 1) without models. --request-id UUID retries a create with the same printed identifier. --job UUID resumes an existing job. --apply --authorize-regeneration requests paid apply after separate approval. --cancel --job UUID cancels. Stop at errors, expired admin freshness, cancellation or job budget; do not auto-extend budgets.'
    );
    process.exit(0);
}
const api = process.env.NOVA_BACKFILL_API;
const origin = process.env.NOVA_BACKFILL_ORIGIN;
const session = process.env.NOVA_BACKFILL_SESSION;
if (!api || !origin || !session)
    throw new Error(
        'Authorized profile session, API and exact frontend origin required; see --help'
    );
const endpoint = new URL(api);
if (endpoint.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(endpoint.hostname))
    throw new Error('HTTPS required');
if (new URL(origin).origin !== origin) throw new Error('Exact origin required');
async function request(path: string, body?: object, csrf?: string) {
    const response = await fetch(new URL(path, endpoint), {
        method: body ? 'POST' : 'GET',
        redirect: 'error',
        headers: {
            Authorization: `Bearer ${session}`,
            Origin: origin!,
            ...(body ? { 'Content-Type': 'application/json', 'X-Passport-CSRF': csrf! } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
        throw new Error(
            `Dashboard API refused operation (${response.status}); inspect dashboard and reauthenticate before retrying`
        );
    return response.json();
}
const status = await request('/admin/embeddings');
if (args.includes('--recover-cleanup')) {
    const index = args.indexOf('--cleanup-steps');
    const steps = index >= 0 ? Number(args[index + 1]) : 1;
    if (!Number.isInteger(steps) || steps < 1 || steps > 100)
        throw new Error('Cleanup steps must be 1–100');
    for (let unit = 0; unit < steps; unit++) {
        const result = await request('/admin/embeddings/cleanup/step', { limit: 1 }, status.csrf);
        console.log(JSON.stringify(result));
        if (!result.pendingTasks && !result.pendingPoints) break;
    }
    process.exit(0);
}
const existingIndex = args.indexOf('--job');
let jobId = existingIndex >= 0 ? args[existingIndex + 1] : undefined;
if (args.includes('--cancel')) {
    if (!jobId) throw new Error('--job required');
    await request(`/admin/embeddings/jobs/${jobId}/cancel`, {}, status.csrf);
    console.log('Cancellation requested');
    process.exit(0);
}
if (!jobId) {
    const apply = args.includes('--apply');
    if (apply && !args.includes('--authorize-regeneration'))
        throw new Error('Explicit regeneration authorization required');
    const requestIndex = args.indexOf('--request-id');
    const requestId = requestIndex >= 0 ? args[requestIndex + 1] : randomUUID();
    if (!requestId) throw new Error('--request-id UUID required');
    console.log(JSON.stringify({ requestId }));
    const job = await request(
        '/admin/embeddings/jobs',
        { dryRun: !apply, requestId, regenerationAuthorized: apply },
        status.csrf
    );
    jobId = job._id;
}
console.log(JSON.stringify({ jobId }));
let stop = false;
process.on('SIGINT', () => {
    stop = true;
});
while (!stop) {
    const job = await request(`/admin/embeddings/jobs/${jobId}/step`, { limit: 1 }, status.csrf);
    console.log(
        JSON.stringify({
            jobId,
            state: job.state,
            scanned: job.scanned,
            written: job.written,
            skipped: job.skipped,
            errors: job.errors,
            corpusComplete: job.corpusComplete,
        })
    );
    if (['completed', 'cancelled'].includes(job.state) || job.lastError) break;
}
