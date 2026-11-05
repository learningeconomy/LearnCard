import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { generateEd25519PrivateKey } from '@learncard/sss-key-manager';
import { identifier, measurementsSchema, serverUrlSchema } from '../src/config';
import { createSdk } from '../src/sdk';
import { randomPin } from '../src/provision/flow';
import { checkIdToken, createLoginClient } from '../src/provision/login';
import { containConsole } from '../src/provision/output';
import { LoadRefusal, refuse } from '../src/load/errors';
import {
    checkBudgets,
    checkDomain,
    checkFirebaseProject,
    checkPrefix,
    checkRoughtimeAck,
    checkRunId,
    checkServerUrl,
    credentialProjectId,
    parseMaxEmails,
    parseMaxUsers,
} from '../src/load/guards';
import {
    deleteUsersInBatches,
    findRunUsers,
    runEmailMatcher,
    type AdminAuth,
} from '../src/load/identity';
import { buildPlan, parseStages } from '../src/load/plan';
import { instrumentFetch, newRequestCounters } from '../src/load/requests';
import { runLoad, type StopSignal } from '../src/load/run';
import { narrowLoadStrategy } from '../src/load/scenarios';

/**
 * Escrow load test: STAGING ONLY. See README.md "Load testing (staging only)".
 * Run the BUILT bundle with Node 22 (the SDK loads didkit.wasm next to it):
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=<staging service-account json> \
 *   FIREBASE_API_KEY=... ESCROW_KEY_ID=... AUTHORITY_GENERATION=... ESCROW_MEASUREMENTS_JSON='[...]' \
 *   node services/escrow-canary/dist/load.mjs \
 *     --lca-api-url https://<staging host>/api --staging-host <staging host> --tenant-id <id> \
 *     --firebase-project <staging project id> --domain <canary inbox domain> \
 *     --stages <rate:sec,...> --max-in-flight <n> --pin-ratio <0..1> --pin-pool <n> \
 *     --max-users <n> --max-emails <n> --i-understand-roughtime [--dry-run] > summary.json
 *
 *   node services/escrow-canary/dist/load.mjs cleanup --run <id> --domain <domain> \
 *     --firebase-project <id> [--prefix <p>] [--dry-run]
 *
 * Plan and progress lines go to stderr; the final JSON summary is the only stdout.
 * Nothing prints keys, PINs, tokens, shares or email addresses (counts and run id only).
 *
 * EMAIL FINDINGS (read from code, 2026-11-05; re-check if these files change):
 * - Enrolment sends NO email. `POST /keys/escrow/opt-in` only records the opt-in
 *   (lca-api `src/routes/escrow.ts:940-950`); `POST /keys/escrow` (enroll) has no
 *   notification call (`escrow.ts:668-926`); the enclave's only email messages are
 *   `OneTimeCode`, `RecoveryStarted` and `ReleaseWarning`
 *   (escrow-enclave-app `src/authority/email.rs:98-107`), sent from create-hold,
 *   confirm-hold, release-warning and resend-code (`src/policy/authority.rs:595,1123,1200,1347`),
 *   never from `apply_enrollment_intent` (`authority.rs:222`). Create-hold sends the
 *   code only for `ReleasePolicy::Hold` (`authority.rs:496`, `:587-601`).
 *   Activation and `/keys/auth-share` send nothing (no delivery call in those routes).
 * - PIN recovery sends TWO emails per verified recipient through lca-api's delivery
 *   service, not the enclave's SES sender: Postmark when POSTMARK_* is configured, else
 *   a log-only adapter (`src/services/delivery/delivery.factory.ts:24-45`); which one
 *   staging uses is not visible in this repo:
 *   `escrow-hold-started` when the PIN hold is created (a PIN hold is not
 *   authority-managed, `escrow.ts:1098-1099`, so `escrow.ts:1174-1182` notifies), and
 *   `escrow-pin-sign-in` on release (`escrow.ts:1670-1675`). Recipients are the login
 *   address plus any verified recovery email/confirmed method, deduplicated
 *   (`src/services/escrow-enclave/notifications.ts:145-165`): one for these accounts.
 *   Push notifications are also attempted (`notifications.ts:342-356`).
 * - Upper bound 3 per PIN recovery: a hold left pending after a failed release keeps
 *   `startedNotificationPending` (`escrow.ts:1136`) and the reminder job retries
 *   `started` (`src/jobs/escrowHoldReminders.ts`), or a failure path sends `cancelled`.
 *   `--max-emails` must cover 3 x planned PIN recoveries.
 * - Firebase Admin `createUser` with `emailVerified: true` and custom-token sign-in
 *   send no email themselves. UNVERIFIED: any staging-only trigger outside this repo.
 */
const write = (line: string): void => {
    process.stderr.write(`${line}\n`);
};
const exit = (code: number): never => process.exit(code);

const USAGE =
    'Usage: node dist/load.mjs --lca-api-url <url> --staging-host <host> --tenant-id <id> ' +
    '--firebase-project <id> --domain <inbox domain> --stages <rate:sec,...> --max-users <n> ' +
    '--max-emails <n> --i-understand-roughtime [--prefix <p>] [--run-id <id>] [--max-in-flight <n>] ' +
    '[--pin-ratio <0..1>] [--pin-pool <n>] [--enrol-with-pin] [--setup-rate <n/s>] ' +
    '[--progress-sec <n>] [--stop-error-rate <0..1>] [--late-ms <n>] [--dry-run]\n' +
    '       node dist/load.mjs cleanup --run <id> --domain <domain> --firebase-project <id> [--prefix <p>] [--dry-run]';

const parsed = (() => {
    try {
        return parseArgs({
            options: {
                'lca-api-url': { type: 'string' },
                'staging-host': { type: 'string' },
                'tenant-id': { type: 'string' },
                'firebase-project': { type: 'string' },
                domain: { type: 'string' },
                prefix: { type: 'string', default: 'escrow-load' },
                'run-id': { type: 'string' },
                run: { type: 'string' },
                stages: { type: 'string' },
                'max-in-flight': { type: 'string', default: '50' },
                'pin-ratio': { type: 'string', default: '0' },
                'pin-pool': { type: 'string', default: '0' },
                'enrol-with-pin': { type: 'boolean', default: false },
                'setup-rate': { type: 'string', default: '2' },
                'progress-sec': { type: 'string', default: '10' },
                'stop-error-rate': { type: 'string', default: '0.5' },
                'late-ms': { type: 'string', default: '500' },
                'max-users': { type: 'string' },
                'max-emails': { type: 'string' },
                'i-understand-roughtime': { type: 'boolean', default: false },
                'dry-run': { type: 'boolean', default: false },
            },
            strict: true,
            allowPositionals: true,
        });
    } catch {
        write(USAGE);
        return exit(2);
    }
})();
const flags = parsed.values;

const number = (value: string, reason: string, min: number, max: number): number => {
    const n = Number(value);
    if (!/^[0-9]+(\.[0-9]+)?$/.test(value) || !(n >= min && n <= max)) throw refuse(reason);
    return n;
};

/** Reads only `type`/`project_id` for the guard; the Admin SDK reads the file itself. */
const adminAuth = (expectedProject: string | undefined): (() => AdminAuth) => {
    const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!path) throw refuse('google_application_credentials_required');
    let raw: string;
    try {
        raw = readFileSync(path, 'utf8');
    } catch {
        throw refuse('credentials_unreadable');
    }
    checkFirebaseProject(expectedProject, credentialProjectId(raw));
    return () =>
        getAuth(
            initializeApp({ credential: cert(path), projectId: expectedProject }, 'escrow-load')
        ) as unknown as AdminAuth;
};

const cleanup = async (): Promise<void> => {
    if (!flags.run) throw refuse('run_required');
    const domain = checkDomain(flags.domain);
    checkPrefix(flags.prefix!);
    checkRunId(flags.run);
    const auth = adminAuth(flags['firebase-project'])();
    const matches = runEmailMatcher({ prefix: flags.prefix!, runId: flags.run, domain });
    const uids = await findRunUsers(auth, matches);
    write(`cleanup run=${flags.run} matched_users=${uids.length} dry-run=${flags['dry-run']}`);
    if (flags['dry-run'] || uids.length === 0) return;
    const result = await deleteUsersInBatches(auth, uids);
    write(`cleanup run=${flags.run} deleted=${result.deleted} failed=${result.failed}`);
    write(
        'note: lca-api user keys, escrow authority records and holds for these accounts remain in staging (see README)'
    );
};

const run = async (): Promise<number> => {
    // ---- Guards (no network) ----
    const serverUrlInput = flags['lca-api-url'];
    if (!serverUrlInput) throw refuse('lca_api_url_required');
    checkServerUrl(serverUrlInput, flags['staging-host']);
    const serverUrl = serverUrlSchema.safeParse(serverUrlInput);
    if (!serverUrl.success) throw refuse('server_url');
    const tenantId = identifier.safeParse(flags['tenant-id']);
    if (!tenantId.success) throw refuse('tenant_id');
    const keyId = identifier.safeParse(process.env.ESCROW_KEY_ID);
    const generation = identifier.safeParse(process.env.AUTHORITY_GENERATION);
    let measurementsJson: unknown;
    try {
        measurementsJson = JSON.parse(process.env.ESCROW_MEASUREMENTS_JSON ?? 'null');
    } catch {
        throw refuse('measurements');
    }
    const measurements = measurementsSchema.safeParse(measurementsJson);
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!keyId.success || !generation.success || !measurements.success || !firebaseApiKey)
        throw refuse('trust_config');
    const domain = checkDomain(flags.domain);
    checkPrefix(flags.prefix!);
    const runId = flags['run-id'] ?? randomBytes(4).toString('hex');
    checkRunId(runId);
    checkRoughtimeAck(flags['i-understand-roughtime']);
    const maxUsers = parseMaxUsers(flags['max-users']);
    const maxEmails = parseMaxEmails(flags['max-emails']);
    const pinRatio = number(flags['pin-ratio']!, 'pin_ratio', 0, 1);
    const pinPool = number(flags['pin-pool']!, 'pin_pool', 0, 10_000);
    if (!Number.isInteger(pinPool)) throw refuse('pin_pool');
    const maxInFlight = number(flags['max-in-flight']!, 'max_in_flight', 1, 1_000);
    if (!Number.isInteger(maxInFlight)) throw refuse('max_in_flight');
    const setupRate = number(flags['setup-rate']!, 'setup_rate', 0.01, 50);
    const progressSec = number(flags['progress-sec']!, 'progress_sec', 0, 3_600);
    const stopErrorRate = number(flags['stop-error-rate']!, 'stop_error_rate', 0, 1);
    const lateMs = number(flags['late-ms']!, 'late_ms', 1, 60_000);
    const plan = buildPlan({
        stages: parseStages(flags.stages),
        pinRatio,
        pinPool,
        enrolWithPin: flags['enrol-with-pin']!,
    });
    checkBudgets(plan, maxUsers, maxEmails);
    const admin = adminAuth(flags['firebase-project']);

    // ---- Plan (printed before anything is sent) ----
    write(
        `plan run=${runId} host=${new URL(serverUrl.data).hostname} tenant=${tenantId.data} firebase-project=${flags['firebase-project']} dry-run=${flags['dry-run']}`
    );
    write(
        `plan stages=${plan.stages.map(s => `${s.rate}/s x ${s.durationSec}s`).join(', ')} duration=${plan.durationSec}s setup-rate=${setupRate}/s max-in-flight=${maxInFlight}`
    );
    write(
        `plan operations: arrivals=${plan.arrivals} enrol=${plan.enrolOps}${flags['enrol-with-pin'] ? ' (+PIN)' : ''} pin-recovery=${plan.pinOps} pin-pool=${plan.pinPool} firebase-users=${plan.users} (max-users ${maxUsers})`
    );
    write(
        `plan emails: expected=${plan.expectedEmails} upper-bound=${plan.maxEmails} (max-emails ${maxEmails}); enrolment sends none, each PIN recovery sends 2 via lca-api delivery`
    );
    write(
        `plan roughtime: every enclave time sample queries Cloudflare, int08h and time.txryan.com; estimated <= ${plan.roughtimePerServerEstimate} requests PER SERVER for this plan (estimate from LAUNCH-DECISIONS.md RT, not measured)`
    );
    if (flags['dry-run']) {
        write('dry-run: guards passed; nothing sent');
        return 0;
    }

    // ---- Run ----
    const counters = newRequestCounters();
    globalThis.fetch = instrumentFetch(globalThis.fetch, serverUrl.data, counters);
    const sdk = createSdk({
        serverUrl: serverUrl.data,
        tenantId: tenantId.data,
        keyId: keyId.data,
        authorityGeneration: generation.data,
        measurements: measurements.data,
    });
    const login = createLoginClient({
        serverUrl: serverUrl.data,
        tenantId: tenantId.data,
        firebaseApiKey,
    });
    const stop: StopSignal = { requested: false };
    process.on('SIGINT', () => {
        if (stop.requested) exit(130);
        stop.requested = true;
        write('interrupt: no new starts; waiting for in-flight operations (Ctrl-C again to abort)');
    });
    const summary = await runLoad(
        {
            plan,
            address: { prefix: flags.prefix!, runId, domain },
            pinRatio,
            enrolWithPin: flags['enrol-with-pin']!,
            maxInFlight,
            lateMs,
            setupRate,
            progressSec,
            stopErrorRate,
        },
        {
            admin: admin(),
            exchange: customToken => login.exchange(customToken),
            checkToken: (idToken, email) =>
                checkIdToken(idToken, email, Date.now(), flags['firebase-project']),
            sdk,
            strategy: storage => narrowLoadStrategy(sdk.strategy(storage)),
            randomKey: generateEd25519PrivateKey,
            randomPin,
            now: () => performance.now(),
            sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
            every: (ms, callback) => {
                const timer = setInterval(callback, ms);
                return () => clearInterval(timer);
            },
            out: write,
        },
        stop
    );
    process.stdout.write(`${JSON.stringify({ ...summary, requests: counters }, null, 2)}\n`);
    write(
        `done run=${runId} stopped=${summary.stopped ?? 'no'} (cleanup: load.mjs cleanup --run ${runId})`
    );
    return typeof summary.stopped === 'string' && summary.stopped.startsWith('fatal_') ? 3 : 0;
};

process.on('uncaughtException', () => {
    write('load: unexpected failure (details suppressed)');
    exit(1);
});
process.on('unhandledRejection', () => {
    write('load: unexpected failure (details suppressed)');
    exit(1);
});

const command = parsed.positionals[0];
if (parsed.positionals.length > 1 || (command !== undefined && command !== 'cleanup')) {
    write(USAGE);
    exit(2);
}
const containment = containConsole();
try {
    const code = command === 'cleanup' ? (await cleanup(), 0) : await run();
    write(`(${containment.suppressed()} SDK console lines suppressed)`);
    exit(code);
} catch (error) {
    if (error instanceof LoadRefusal) {
        write(`refused ${error.reason} exit=2`);
        exit(2);
    }
    const name =
        error && typeof error === 'object' && 'name' in error && typeof error.name === 'string'
            ? error.name
            : 'Error';
    write(`stopped unexpected ${/^[A-Za-z]{1,64}$/.test(name) ? name : 'Error'} exit=1`);
    exit(1);
}
