/**
 * The runner's own demo LMS: a child process (cwd examples/demo-lms) with the
 * service-account secret injected into its environment. `--no-env-file` keeps a
 * developer's examples/demo-lms/.env.local (their hand-started LMS on :4321) out of it.
 */
import { createServer } from 'node:net';
import { z } from 'zod';
import { spawn, type ChildProcess, type StdioOptions } from 'node:child_process';
import { once } from 'node:events';
import { DEMO_LMS_DIR } from '../../env';
import { ScenarioError } from '../../core/expect';
import { registerSecret } from '../../core/report';
import type { SubmitView } from '../../port';
import type { PlatformJwk } from './brain-client';

export type DemoLmsSpawnConfig = {
    port: number;
    origin: string;
    brainOrigin: string;
    serviceAccountId: string;
    secret: string;
    installId: string;
    ecosystemId: string;
    platformJwk: PlatformJwk;
};

const CompleteJsonValidator = z.union([
    z.object({
        ok: z.literal(true),
        recordId: z.string(),
        status: z.enum(['ACCEPTED', 'DUPLICATE']),
        issuance: z
            .discriminatedUnion('status', [
                z.object({ status: z.literal('ISSUED'), credentialUri: z.string() }),
                z.object({ status: z.literal('OFFERED'), offerUri: z.string() }),
                z.object({ status: z.literal('ISSUE_FAILED') }),
                z.object({ status: z.literal('PENDING') }),
            ])
            .optional(),
        offerUrl: z.string().optional(),
    }),
    z.object({ ok: z.literal(false), code: z.string(), message: z.string() }),
]);

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const portFree = (port: number): Promise<boolean> =>
    new Promise(resolve => {
        const server = createServer();
        server.once('error', () => resolve(false));
        server.listen(port, 'localhost', () => server.close(() => resolve(true)));
    });

const STOP_GRACE_MS = 3_000;
const KILL_GRACE_MS = 2_000;

const hasExited = (child: ChildProcess): boolean =>
    child.exitCode !== null || child.signalCode !== null;

export class DemoLmsProcess {
    private child: ChildProcess | undefined;
    private output: string[] = [];

    constructor(private readonly keep: boolean) {
        // Last resort if close() never runs: 'exit' handlers must be synchronous, so kill
        // whichever child is current. One hook per instance, not one per start().
        if (!keep) process.once('exit', () => this.child?.kill('SIGKILL'));
    }

    get running(): boolean {
        return this.child !== undefined && !hasExited(this.child);
    }

    /** (Re)starts the LMS with this credential; resolves once it answers on /health. */
    async start(config: DemoLmsSpawnConfig): Promise<void> {
        await this.stop();
        if (!(await portFree(config.port))) {
            throw new ScenarioError({
                code: 'PORT_IN_USE',
                message: `:${config.port} is in use; stop whatever holds it or set DEMO_LMS_PORT to a free port`,
            });
        }
        registerSecret(config.secret);
        this.output = [];
        // A kept LMS must outlive the runner: detached, and not writing into our pipes.
        const stdio: StdioOptions = this.keep ? 'ignore' : ['ignore', 'pipe', 'pipe'];
        const child: ChildProcess = spawn(process.execPath, ['--no-env-file', 'src/server.ts'], {
            cwd: DEMO_LMS_DIR,
            env: {
                NODE_ENV: 'development',
                PATH: process.env.PATH ?? '',
                HOME: process.env.HOME ?? '',
                DEMO_LMS_PORT: String(config.port),
                BRAIN_URL: config.brainOrigin,
                DEMO_LMS_HEALTH_URL: `${config.origin}/health`,
                SERVICE_ACCOUNT_ID: config.serviceAccountId,
                SERVICE_ACCOUNT_SECRET: config.secret,
                INSTALL_ID: config.installId,
                ECOSYSTEM_ID: config.ecosystemId,
                PLATFORM_JWK: JSON.stringify(config.platformJwk),
            },
            stdio,
            detached: this.keep,
        });
        this.child = child;
        const collect = (chunk: Buffer): void => {
            this.output.push(chunk.toString());
            if (this.output.length > 200) this.output.shift();
        };
        child.stdout?.on('data', collect);
        child.stderr?.on('data', collect);
        for (let attempt = 0; attempt < 50; attempt++) {
            if (hasExited(child)) break;
            try {
                // Without a challenge the health route answers 401: the server is up.
                const response = await fetch(`${config.origin}/health`, {
                    signal: AbortSignal.timeout(1_000),
                });
                if (response.status === 401 || response.status === 204) return;
            } catch {
                // Not listening yet.
            }
            await sleep(200);
        }
        const tail = this.output.join('').split('\n').slice(-5).join(' | ');
        await this.stop();
        throw new ScenarioError({
            code: 'DEMO_LMS_START',
            message: `demo LMS did not come up on ${config.origin}: ${tail || 'no output'}`,
        });
    }

    /** POST /complete with Accept: application/json, as a scripted caller. */
    async submit(
        origin: string,
        input: { learner: string; courseId: string; completionId: string }
    ): Promise<{ ok: true; result: SubmitView } | { ok: false; code: string; message: string }> {
        if (!this.running) {
            throw new ScenarioError({
                code: 'DEMO_LMS_DOWN',
                message: 'the runner’s demo LMS is not running (S06 starts it)',
            });
        }
        const form = new FormData();
        form.set('learner', input.learner);
        form.set('course', input.courseId);
        form.set('completionId', input.completionId);
        const response = await fetch(`${origin}/complete`, {
            method: 'POST',
            body: form,
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(60_000),
        });
        const body = CompleteJsonValidator.parse(await response.json());
        if (!body.ok) return body;
        return {
            ok: true,
            result: {
                recordId: body.recordId,
                status: body.status,
                issuance: body.issuance,
                offerUrl: body.offerUrl,
            },
        };
    }

    /** SIGTERM, then SIGKILL if the child outlives the grace period. */
    async stop(): Promise<void> {
        const child = this.child;
        this.child = undefined;
        if (!child || hasExited(child)) return;
        const exited = once(child, 'exit').then(() => true);
        child.kill('SIGTERM');
        if (await Promise.race([exited, sleep(STOP_GRACE_MS).then(() => false)])) return;
        child.kill('SIGKILL');
        await Promise.race([exited, sleep(KILL_GRACE_MS)]);
    }

    /** Leaves the process running (--keep-lms) but stops tracking it. */
    detach(): number | undefined {
        const pid = this.child?.pid;
        this.child?.unref();
        this.child = undefined;
        return pid;
    }
}
