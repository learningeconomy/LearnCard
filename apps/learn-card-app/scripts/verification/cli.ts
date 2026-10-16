import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import net from 'node:net';

import { chromium } from '@playwright/test';
import type { Browser, BrowserContext } from '@playwright/test';

import { verificationFeatures } from './catalog';
import { expect } from './expect';
import { BASE_URL, configureContext, createHarness, newRunId, saveJson, signIn } from './harness';
import type { NetworkRecord, VerificationHarness } from './harness';
import { queryMongo, queryNeo4j, serviceLogs } from './inspect';
import { runLearnCardCli, stopLearnCardCommands } from './learncard-cli';
import { createScriptContext, loadScript, writeInlineScript } from './script';
import { doctorStack, startStack, stopStack } from './stack';
import type { FeatureDefinition, VerificationActor } from './types';
import { getVerificationLearnCard } from './sdk';

const DEFAULT_ROOT = '/tmp/learncard-verification';
/** The harness owns shutdown: Playwright's own signal handlers would close Chromium before
 * traces and sessions are saved. */
const OWN_SIGNALS = { handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false } as const;

const help = (): void => {
    console.log(`LearnCard verification: real local services, owned stacks, retained evidence.

Lifecycle
  lc verify up --dir DIR                 Start an owned stack and save signed-in learner/recipient sessions
  lc verify doctor --dir DIR             Read-only: is this stack ours, healthy, and signed in?
  lc verify down --dir DIR               Stop only the owned stack; evidence stays in DIR

Scripted coverage
  lc verify list [--json]                Catalog features, surfaces, and required entries
  lc verify run [all|FEATURE...]         Run journeys (fresh stack unless --dir names a live one)
      [--dir DIR] [--keep] [--headed] [--video]

Drive anything else (needs a live --dir)
  lc verify script FILE --dir DIR        Run an ad-hoc journey: default-export async (v) => {...}
  lc verify script -e 'CODE' --dir DIR   Same, inline; the body sees the context as \`v\`
      [--headed] [--video] [--name LABEL]
  lc verify browser --dir DIR            Hold an authenticated Chromium open with a CDP port
      [--session RELATIVE_PATH] [--cdp-port 9223] [--headed]
  lc verify learncard --dir DIR [--workdir NAME] -- ARGS...
                                         Run the checkout's \`learncard\` CLI against the owned network
  lc verify db --dir DIR neo4j 'CYPHER'  Read-only graph query (brain-service)
  lc verify db --dir DIR mongo DB [COLLECTION] [FILTER_JSON] [--limit N]
  lc verify logs --dir DIR SERVICE [--tail N]   frontend, brain, cloud, api, neo4j, mongodb, ...

\`all\` means every catalog entry, not every LearnCard route. Evidence (traces, sessions, CLI
.env files) can contain disposable seeds and bearer links: keep DIR private.`);
};

const requireStack = async (directory: string): Promise<Record<string, unknown>> => {
    const status = await doctorStack(directory);
    assert.equal(status.ok, true, `Owned stack is not ready: ${JSON.stringify(status)}`);
    return status;
};

const readSessionActor = async (file: string): Promise<VerificationActor> => {
    const actor = JSON.parse(await readFile(file, 'utf8')).verificationActor as
        VerificationActor | undefined;
    assert(
        actor &&
            typeof actor.seed === 'string' &&
            /^[a-f0-9]{64}$/i.test(actor.seed) &&
            typeof actor.profileId === 'string' &&
            actor.profileId &&
            typeof actor.displayName === 'string' &&
            typeof actor.role === 'string',
        'Session lacks a reusable verification identity. Run lc verify up to create one; raw storageState cannot restore CryptoKey objects.'
    );
    return actor;
};

const doctor = async (directory: string): Promise<Record<string, unknown>> => {
    const stack = await requireStack(directory);
    const session = join(directory, 'sessions', 'learner.json');
    if (!existsSync(session)) {
        return {
            ...stack,
            authenticated: false,
            session:
                'No reusable session (stack was started by `run`). Journeys still sign in their own actors.',
        };
    }
    const actor = await readSessionActor(session);
    const wallet = await getVerificationLearnCard(actor.seed);
    const profile = await wallet.invoke.getProfile(actor.profileId);
    assert(
        profile && 'did' in profile && profile.did === wallet.id.did(),
        'Saved learner does not match its network profile'
    );
    // This protected request requires fresh DID authentication, not a cached browser shell.
    await wallet.invoke.getIncomingCredentials();
    return { ...stack, authenticated: true, profileId: actor.profileId, session };
};

/** Sign in reusable actors through the real UI; retain their disposable seeds privately. */
const bootstrapSessions = async (
    directory: string,
    headed: boolean,
    onReady: (browser: Browser, harness: VerificationHarness) => void
): Promise<void> => {
    const browser = await chromium.launch({ ...OWN_SIGNALS, headless: !headed });
    const runId = newRunId();
    const harness = await createHarness(
        browser,
        join(directory, 'sessions', 'bootstrap', runId),
        runId
    );
    onReady(browser, harness);
    try {
        const profiles: Record<string, unknown> = {};
        for (const role of ['learner', 'recipient'] as const) {
            const actor = harness.context.actors[role];
            const page = await harness.context.newPage(role, { signInAs: actor });
            await page.reload();
            await expect(
                page.getByRole('button', { name: 'Open profile', exact: true })
            ).toBeVisible({
                timeout: 60_000,
            });
            await harness.context.capture(page, `${role}-ready`);
            await saveJson(join(directory, 'sessions', `${role}.json`), {
                ...(await page.context().storageState({ indexedDB: true })),
                verificationActor: actor,
            });
            profiles[role] = { profileId: actor.profileId, displayName: actor.displayName };
        }
        await saveJson(join(directory, 'sessions', 'profiles.json'), profiles);
    } finally {
        try {
            await harness.close();
        } finally {
            await browser.close();
        }
    }
};

const selectFeatures = (requested: string[]): FeatureDefinition[] => {
    if (requested.length === 0 || (requested.length === 1 && requested[0] === 'all')) {
        return verificationFeatures;
    }
    const selected = requested.map(id => {
        const feature = verificationFeatures.find(candidate => candidate.id === id);
        assert(feature, `Unknown feature ${id}; use lc verify list`);
        return feature;
    });
    assert(new Set(selected.map(feature => feature.id)).size === selected.length, 'Duplicate IDs');
    return selected;
};

const runBrowser = async (
    directory: string,
    values: { session?: string; 'cdp-port'?: string; headed?: boolean }
): Promise<void> => {
    await requireStack(directory);
    const session = resolve(directory, values.session ?? 'sessions/learner.json');
    const sessionRelative = relative(directory, session);
    assert(
        sessionRelative && !sessionRelative.startsWith('..') && !isAbsolute(sessionRelative),
        'Session must be inside this verification directory'
    );
    const actor = await readSessionActor(session);
    const port = Number(values['cdp-port'] ?? 9223);
    assert(Number.isInteger(port) && port >= 1024 && port <= 65535, 'Invalid CDP port');
    await new Promise<void>((accept, reject) => {
        const probe = net.createServer();
        probe.once('error', reject);
        probe.listen(port, '127.0.0.1', () => probe.close(() => accept()));
    });
    const browser = await chromium.launch({
        ...OWN_SIGNALS,
        headless: !values.headed,
        args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'],
    });
    const network: NetworkRecord[] = [];
    const manualDirectory = join(directory, 'manual', newRunId());
    await mkdir(manualDirectory, { recursive: true, mode: 0o700 });
    let context: BrowserContext | undefined;
    let finish: () => void = () => {};
    const finished = new Promise<void>(accept => {
        finish = accept;
    });
    browser.once('disconnected', () => finish());
    process.on('SIGINT', finish);
    process.on('SIGTERM', finish);
    try {
        context = await browser.newContext({
            baseURL: BASE_URL,
            serviceWorkers: 'block',
        });
        await configureContext(context, network);
        const page = await context.newPage();
        await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
        // Never restore storageState's JSON-serialized CryptoKey: it is no longer a usable key.
        await signIn(page, actor);
        console.log(
            `Authenticated browser on CDP http://127.0.0.1:${port} (connectOverCDP). Ctrl-C saves evidence and closes it.`
        );
        await finished;
    } finally {
        try {
            await saveJson(join(manualDirectory, 'network.json'), network);
            if (context && browser.isConnected()) {
                await saveJson(join(manualDirectory, 'session.json'), {
                    ...(await context.storageState({ indexedDB: true })),
                    verificationActor: actor,
                });
                await context.tracing.stop({ path: join(manualDirectory, 'trace.zip') });
            } else {
                await saveJson(join(manualDirectory, 'capture-error.json'), {
                    error: 'Browser closed before the trace was saved; stop with Ctrl-C instead.',
                });
            }
        } finally {
            await browser.close();
            process.removeListener('SIGINT', finish);
            process.removeListener('SIGTERM', finish);
        }
        console.log(`Manual evidence: ${manualDirectory}`);
    }
};

const runScript = async (
    directory: string,
    positionals: string[],
    values: { eval?: string; name?: string; headed?: boolean; video?: boolean }
): Promise<void> => {
    await requireStack(directory);
    const runId = newRunId();
    const label = values.name ?? (values.eval ? 'inline' : (positionals[1] ?? 'script'));
    const artifacts = join(
        directory,
        'scripts',
        `${runId}-${label.replace(/[^\w-]+/g, '-').slice(-40)}`
    );
    await mkdir(artifacts, { recursive: true, mode: 0o700 });
    const report: Record<string, unknown> = {
        runId,
        script: values.eval ? 'inline-script.ts' : positionals[1],
        status: 'running',
        startedAt: new Date().toISOString(),
    };
    let browser: Browser | undefined;
    let harness: VerificationHarness | undefined;
    let failed = false;
    let failure: unknown;
    let interrupted = false;
    let rejectInterrupt: (error: Error) => void = () => {};
    const interruption = new Promise<never>((_accept, reject) => {
        rejectInterrupt = reject;
    });
    // A signal during setup is checked before driving; it must not become an unhandled rejection.
    void interruption.catch(() => {});
    const onSignal = (): void => {
        interrupted = true;
        rejectInterrupt(new Error('Verification script interrupted'));
    };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    try {
        await saveJson(join(artifacts, 'report.json'), report);
        const file = values.eval
            ? await writeInlineScript(artifacts, values.eval)
            : (assert(positionals[1], 'script requires FILE or -e CODE'), positionals[1]);
        report.script = file;
        const script = await loadScript(file);
        assert(!interrupted, 'Verification script interrupted');
        browser = await chromium.launch({ ...OWN_SIGNALS, headless: !values.headed });
        assert(!interrupted, 'Verification script interrupted');
        harness = await createHarness(browser, artifacts, runId, {
            video: values.video,
            stackDirectory: directory,
        });
        assert(!interrupted, 'Verification script interrupted');
        const result = await Promise.race([
            script(createScriptContext(harness.context, artifacts)),
            interruption,
        ]);
        assert(!interrupted, 'Verification script interrupted');
        // Unsupported results must fail within the reporting lifecycle, not erase the report.
        if (result !== undefined) report.result = JSON.parse(JSON.stringify(result));
        report.status = 'passed';
    } catch (error) {
        failed = true;
        failure = error;
        await harness?.captureOpenPages(interrupted ? 'interrupted' : 'failure-state');
        report.status = interrupted ? 'interrupted' : 'failed';
        report.error = error instanceof Error ? error.stack : String(error);
    } finally {
        try {
            await harness?.close();
        } catch (error) {
            report.status = interrupted ? 'interrupted' : 'failed';
            report.evidenceError = String(error);
            failed = true;
            failure ??= error;
        }
        try {
            await stopLearnCardCommands();
            await browser?.close();
        } catch (error) {
            report.status = interrupted ? 'interrupted' : 'failed';
            report.cleanupError = String(error);
            failed = true;
            failure ??= error;
        }
        process.removeListener('SIGINT', onSignal);
        process.removeListener('SIGTERM', onSignal);
        if (interrupted) {
            failed = true;
            report.status = 'interrupted';
            failure ??= new Error('Verification script interrupted');
        }
        report.finishedAt = new Date().toISOString();
        if (harness) {
            report.actors = Object.fromEntries(
                Object.entries(harness.context.actors).map(([role, actor]) => [
                    role,
                    actor.profileId,
                ])
            );
        }
        await saveJson(join(artifacts, 'report.json'), report);
        console.log(JSON.stringify({ status: report.status, result: report.result }, null, 2));
        console.log(`Evidence retained: ${artifacts}`);
    }
    if (failed) throw failure;
};

const runFeatures = async (
    command: 'up' | 'run',
    directory: string,
    requested: string[],
    values: { keep?: boolean; headed?: boolean; video?: boolean }
): Promise<void> => {
    const selected = selectFeatures(requested);
    const ownsStack = !existsSync(join(directory, 'state.json'));
    const runId = newRunId();
    const artifacts = join(directory, 'runs', runId);
    const results: Array<Record<string, unknown>> = [];
    const report = async (status: string): Promise<void> =>
        saveJson(join(artifacts, 'report.json'), {
            runId,
            baseUrl: BASE_URL,
            status,
            selected: selected.map(feature => feature.id),
            results,
            notRun: selected
                .filter(feature => !results.some(result => result.feature === feature.id))
                .map(feature => feature.id),
            notSelected: verificationFeatures
                .filter(feature => !selected.includes(feature))
                .map(feature => feature.id),
        });
    let browser: Browser | undefined;
    let current: VerificationHarness | undefined;
    let interrupted = false;
    const onSignal = (): void => {
        if (interrupted) return;
        interrupted = true;
        // Save the in-flight feature's screenshots, traces and sessions before closing Chromium.
        const harness = current;
        void (async () => {
            await harness?.captureOpenPages('interrupted').catch(() => {});
            await harness?.close().catch(() => {});
            await stopLearnCardCommands();
            await browser?.close();
        })();
    };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    let failed = false;
    let failure: unknown;
    const cleanupErrors: unknown[] = [];
    try {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        console.log(`Verification directory: ${directory}`);
        if (ownsStack) await startStack(directory);
        else await requireStack(directory);
        assert(!interrupted, 'Verification interrupted');
        if (command === 'up') {
            const reusable = await Promise.all(
                ['learner', 'recipient'].map(role =>
                    readSessionActor(join(directory, 'sessions', `${role}.json`)).then(
                        () => true,
                        () => false
                    )
                )
            );
            if (!reusable.every(Boolean)) {
                await bootstrapSessions(
                    directory,
                    Boolean(values.headed),
                    (activeBrowser, harness) => {
                        browser = activeBrowser;
                        current = harness;
                    }
                );
            }
            assert(!interrupted, 'Verification interrupted');
            console.log(JSON.stringify(await doctor(directory), null, 2));
            assert(!interrupted, 'Verification interrupted');
            console.log(`Ready. Next: lc verify run all --dir ${directory}`);
        } else {
            await mkdir(artifacts, { recursive: true, mode: 0o700 });
            await report('running');
            await saveJson(join(artifacts, 'doctor.json'), await requireStack(directory));
            browser = await chromium.launch({ ...OWN_SIGNALS, headless: !values.headed });
            for (const feature of selected) {
                assert(!interrupted, 'Verification interrupted');
                const harness = await createHarness(
                    browser,
                    join(artifacts, feature.id),
                    `${runId}-${feature.id}`,
                    { video: values.video, stackDirectory: directory }
                );
                current = harness;
                const result: Record<string, unknown> = {
                    feature: feature.id,
                    surface: feature.surface,
                    requiredEntries: feature.entries,
                    startedAt: new Date().toISOString(),
                };
                console.log(`${feature.id}: running`);
                try {
                    const proof = await feature.run(harness.context);
                    assert(!interrupted, 'Verification interrupted');
                    assert.deepEqual(
                        [...proof.entries].sort(),
                        [...feature.entries].sort(),
                        'Feature did not exercise every catalog entry'
                    );
                    Object.assign(result, { status: 'passed', ...proof });
                } catch (error) {
                    failed = true;
                    await harness.captureOpenPages('failure-state');
                    Object.assign(result, {
                        status: 'failed',
                        error: error instanceof Error ? error.stack : String(error),
                    });
                } finally {
                    try {
                        await harness.close();
                    } catch (error) {
                        failed = true;
                        result.status = 'failed';
                        result.evidenceError = String(error);
                    }
                    result.finishedAt = new Date().toISOString();
                    results.push(result);
                    await report('running');
                    const firstLine = String(result.error ?? '').split('\n')[0];
                    console.log(
                        `${feature.id}: ${result.status}${firstLine ? ` — ${firstLine}` : ''}`
                    );
                }
            }
            assert(!interrupted, 'Verification interrupted');
            await report(failed ? 'failed' : 'passed');
            assert(!failed, `Verification failed; inspect ${join(artifacts, 'report.json')}`);
        }
    } catch (error) {
        failed = true;
        if (command === 'run') await report(interrupted ? 'interrupted' : 'failed');
        await saveJson(join(directory, 'last-error.json'), {
            error: error instanceof Error ? error.stack : String(error),
            artifacts,
        });
        failure = error;
    } finally {
        const teardown =
            ownsStack && (failed || interrupted || (command === 'run' && !values.keep));
        try {
            await stopLearnCardCommands();
            await browser?.close();
        } catch (error) {
            cleanupErrors.push(error);
        }
        try {
            if (teardown) await stopStack(directory);
        } catch (error) {
            cleanupErrors.push(error);
        }
        process.removeListener('SIGINT', onSignal);
        process.removeListener('SIGTERM', onSignal);
        if (command === 'run') {
            await saveJson(join(artifacts, 'cleanup.json'), {
                stackStopped: teardown && cleanupErrors.length === 0,
                retainedByRequest: !teardown,
                evidenceRetained: artifacts,
                error: cleanupErrors.length ? cleanupErrors.map(String).join('; ') : undefined,
            });
            if (cleanupErrors.length) await report(interrupted ? 'interrupted' : 'failed');
            console.log(`Evidence retained: ${artifacts}`);
            if (!teardown)
                console.log(
                    `This run did not stop the stack. If needed: lc verify down --dir ${directory}`
                );
        }
    }
    if (cleanupErrors.length) {
        throw new AggregateError(
            failed ? [failure, ...cleanupErrors] : cleanupErrors,
            'Verification cleanup failed'
        );
    }
    if (failed) throw failure;
};

/** Entry point for `lc verify ...`; see `help()` for the command surface. */
export const runVerificationCli = async (args: string[]): Promise<void> => {
    const separator = args.indexOf('--');
    const passthrough = separator >= 0 ? args.slice(separator + 1) : [];
    const { values, positionals } = parseArgs({
        args: separator >= 0 ? args.slice(0, separator) : args,
        allowPositionals: true,
        strict: true,
        options: {
            dir: { type: 'string' },
            keep: { type: 'boolean' },
            headed: { type: 'boolean' },
            video: { type: 'boolean' },
            session: { type: 'string' },
            'cdp-port': { type: 'string' },
            json: { type: 'boolean' },
            eval: { type: 'string', short: 'e' },
            name: { type: 'string' },
            workdir: { type: 'string' },
            tail: { type: 'string' },
            limit: { type: 'string' },
            help: { type: 'boolean', short: 'h' },
        },
    });
    const command = positionals[0] ?? 'help';
    if (values.help || command === 'help') return help();
    if (command === 'list') {
        const rows = verificationFeatures.map(({ id, title, surface, entries, requires }) => ({
            id,
            title,
            surface,
            entries,
            ...(requires && { requires }),
        }));
        if (values.json) return console.log(JSON.stringify(rows, null, 2));
        for (const row of rows) {
            console.log(`${row.id.padEnd(14)} ${row.surface.padEnd(14)} ${row.title}`);
            console.log(`${''.padEnd(30)}${row.entries.join(', ')}`);
        }
        return;
    }
    const known = ['up', 'doctor', 'run', 'browser', 'down', 'script', 'learncard', 'db', 'logs'];
    assert(known.includes(command), `Unknown verification command: ${command}; see lc verify help`);
    if (command !== 'run') assert(values.dir, `${command} requires --dir`);
    // `bun run --cwd …` hides the caller's directory, so a relative --dir would be ambiguous.
    assert(!values.dir || isAbsolute(values.dir), `--dir must be an absolute path: ${values.dir}`);
    const directory = values.dir ? resolve(values.dir) : join(DEFAULT_ROOT, newRunId());

    switch (command) {
        case 'doctor':
            return console.log(JSON.stringify(await doctor(directory), null, 2));
        case 'down':
            await stopStack(directory);
            return console.log(`Stopped owned stack; evidence retained at ${directory}`);
        case 'browser':
            return runBrowser(directory, values);
        case 'script':
            return runScript(directory, positionals, values);
        case 'learncard': {
            await requireStack(directory);
            assert(passthrough.length > 0, 'Usage: lc verify learncard --dir DIR -- ARGS...');
            const workdir = join(
                directory,
                'cli',
                (values.workdir ?? 'default').replace(/[^\w-]/g, '-')
            );
            const transcriptPath = join(workdir, `transcript-${newRunId()}.json`);
            const onSignal = (): void => {
                void stopLearnCardCommands();
            };
            process.on('SIGINT', onSignal);
            process.on('SIGTERM', onSignal);
            let transcript;
            try {
                transcript = await runLearnCardCli(passthrough, workdir, transcriptPath);
            } finally {
                process.removeListener('SIGINT', onSignal);
                process.removeListener('SIGTERM', onSignal);
            }
            process.stdout.write(transcript.stdout);
            process.stderr.write(transcript.stderr);
            console.error(
                `\n[lc verify] exit ${transcript.exitCode}; transcript: ${transcriptPath}`
            );
            if (transcript.exitCode !== 0) process.exitCode = transcript.exitCode ?? 1;
            return;
        }
        case 'db': {
            const [, engine, ...rest] = positionals;
            if (engine === 'neo4j') {
                assert(
                    rest[0],
                    "Usage: lc verify db --dir DIR neo4j 'MATCH (p:Profile) RETURN p LIMIT 5'"
                );
                return console.log(await queryNeo4j(directory, rest[0]));
            }
            assert(engine === 'mongo', 'db engine must be neo4j or mongo');
            assert(
                rest[0],
                'Usage: lc verify db --dir DIR mongo DATABASE [COLLECTION] [FILTER_JSON]'
            );
            return console.log(
                await queryMongo(
                    directory,
                    rest[0],
                    rest[1],
                    rest[2] ?? '{}',
                    Number(values.limit ?? 20)
                )
            );
        }
        case 'logs': {
            assert(positionals[1], 'Usage: lc verify logs --dir DIR SERVICE');
            return console.log(
                await serviceLogs(directory, positionals[1], Number(values.tail ?? 200))
            );
        }
        default:
            return runFeatures(command as 'up' | 'run', directory, positionals.slice(1), values);
    }
};
