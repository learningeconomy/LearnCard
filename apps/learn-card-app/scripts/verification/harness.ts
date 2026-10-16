import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Browser, BrowserContext, Page } from '@playwright/test';

import { expect } from './expect';
import { DIDKIT_WASM_PATH, STACK } from './constants';
import type { VerificationLearnCard } from './sdk';
import { getVerificationProfile } from './sdk';
import { queryMongo, queryNeo4j } from './inspect';
import type {
    NewContextOptions,
    NewPageOptions,
    SignInOptions,
    VerificationActor,
    VerificationContext,
} from './types';

export const BASE_URL = STACK.app;
export const WALLET = /\/wallet(?:[?#]|$)/;
/** First render in a fresh browser context against the Vite dev server. */
export const FIRST_LOAD_TIMEOUT = 120_000;

/** Owned local services. Anything else is blocked and recorded, never silently proxied. */
const OWNED_ORIGINS: Record<string, true> = {
    'http://localhost:3000': true,
    'http://localhost:4000': true,
    'http://localhost:4100': true,
    'http://localhost:5100': true,
    // The app-store journey's real Partner Connect example app.
    'http://localhost:4321': true,
};
/** Read-only static hosts (fonts, JSON-LD contexts, images) the real app depends on. */
const STATIC_HOSTS: Record<string, true> = {
    'cdn.jsdelivr.net': true,
    'cdn.filestackcontent.com': true,
    'fonts.googleapis.com': true,
    'fonts.gstatic.com': true,
    'tetunori.github.io': true,
    'ctx.learncard.com': true,
    'www.w3.org': true,
    'w3id.org': true,
    'purl.imsglobal.org': true,
    // Default tenant badge pack (Boost a Friend) and its badge images.
    'peerbadges.com': true,
};
const WASM_CDN_URL = 'https://cdn.filestackcontent.com/HReKwBTm2Wha4Wlo4uwe';

export interface NetworkRecord {
    method: string;
    url: string;
    allowed: boolean;
}

export const safeName = (name: string): string =>
    name.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 100);

export const newRunId = (): string =>
    `${new Date().toISOString().replaceAll(':', '-')}-${randomBytes(4).toString('hex')}`;

export const saveJson = async (file: string, value: unknown): Promise<void> => {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    await writeFile(file, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
};

/** Profile IDs are public handles: lowercase, unique per run and role, never reused. */
export const createActor = (runId: string, role: string): VerificationActor => {
    const suffix = runId
        .replace(/[^a-z0-9]/gi, '')
        .slice(-10)
        .toLowerCase();
    const handle = role
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 20);
    return {
        role,
        seed: randomBytes(32).toString('hex'),
        profileId: `v-${suffix}-${handle}-${randomBytes(2).toString('hex')}`,
        displayName: `Verify ${role[0]!.toUpperCase()}${role.slice(1)}`,
    };
};

/**
 * Apply the verification network policy: real owned services, the checkout's DIDKit WASM in
 * place of its CDN download (same bytes, no fake crypto), read-only static hosts, nothing else.
 */
export const configureContext = async (
    context: BrowserContext,
    network: NetworkRecord[]
): Promise<void> => {
    context.setDefaultTimeout(30_000);
    context.setDefaultNavigationTimeout(120_000);
    const wasm = await readFile(DIDKIT_WASM_PATH);
    // The app origin is owned and serves ~3k unbundled dev modules per page load. Excluding it
    // in a RegExp (matched browser-side) keeps those requests off this process's event loop,
    // which may be busy with SDK cryptography; everything cross-origin is still policed.
    const appOrigin = BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await context.route(new RegExp(`^(?!${appOrigin}/)`), async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.url() === WASM_CDN_URL) {
            network.push({ method: request.method(), url: WASM_CDN_URL, allowed: true });
            await route.fulfill({ status: 200, contentType: 'application/wasm', body: wasm });
            return;
        }
        const allowed =
            OWNED_ORIGINS[url.origin] === true ||
            (url.protocol === 'https:' &&
                STATIC_HOSTS[url.hostname] === true &&
                ['GET', 'HEAD'].includes(request.method()));
        network.push({ method: request.method(), url: url.origin + url.pathname, allowed });
        if (allowed) await route.continue();
        else await route.abort('blockedbyclient');
    });
    await context.routeWebSocket(/.*/, socket => {
        const url = new URL(socket.url());
        const allowed = OWNED_ORIGINS[`http://${url.host}`] === true;
        network.push({ method: 'WEBSOCKET', url: url.origin + url.pathname, allowed });
        if (allowed) socket.connectToServer();
        else socket.close();
    });
};

/** UI developer seed sign-in. `?profileId=` makes the page create the network profile itself. */
export const signIn = async (
    page: Page,
    actor: VerificationActor,
    { createProfile = true }: SignInOptions = {}
): Promise<void> => {
    await page.goto(
        createProfile
            ? `/developer/sign-in?profileId=${encodeURIComponent(actor.profileId)}`
            : '/developer/sign-in'
    );
    // Deliberately a password input: getByRole('textbox') cannot find it. A fresh context loads
    // ~2.7k unbundled dev modules with no cache (~25s), so the first render gets a long budget.
    await page
        .getByPlaceholder('64 characters, 0–9 and a–f')
        .fill(actor.seed, { timeout: FIRST_LOAD_TIMEOUT });
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    // Poll rather than waitForURL: sign-in may reload the page, aborting a pending navigation.
    await expect(page).toHaveURL(WALLET, { timeout: 120_000 });
    await expect(page.getByRole('button', { name: 'Open profile', exact: true })).toBeVisible({
        timeout: 60_000,
    });
};

interface ManagedContext {
    context: BrowserContext;
    label: string;
    network: NetworkRecord[];
    errors: string[];
}

export interface HarnessOptions {
    /** The owned stack directory, for read-only database inspection. */
    stackDirectory?: string;
    /** Record WebM video for every context (evidence for PRs, footage for demos). */
    video?: boolean;
}

export interface VerificationHarness {
    context: VerificationContext;
    /** Screenshot every open page; call on failure so the final state is always evidence. */
    captureOpenPages: (label: string) => Promise<void>;
    close: () => Promise<void>;
}

/**
 * Evidence-producing context for one feature (or one ad-hoc script). Every browser context it
 * creates is traced, network-logged, and saved (session + trace) when the harness closes.
 */
export const createHarness = async (
    browser: Browser,
    directory: string,
    runId: string,
    options: HarnessOptions = {}
): Promise<VerificationHarness> => {
    const managed: ManagedContext[] = [];
    const actions: Array<Record<string, unknown>> = [];
    const wallets = new Map<string, Promise<VerificationLearnCard>>();
    const sessionActors = new WeakMap<BrowserContext, VerificationActor>();
    let sequence = 0;
    await mkdir(directory, { recursive: true, mode: 0o700 });
    let closing: Promise<void> | undefined;
    const requireStackDirectory = (): string => {
        if (!options.stackDirectory)
            throw new Error('Database inspection needs the stack directory');
        return options.stackDirectory;
    };

    const capture = async (page: Page, label: string): Promise<void> => {
        const name = `${String(++sequence).padStart(3, '0')}-${safeName(label)}`;
        await page.screenshot({
            path: join(directory, `${name}.png`),
            fullPage: true,
            animations: 'disabled',
            mask: [page.locator('input[type=password]')],
        });
        await writeFile(
            join(directory, `${name}.aria.txt`),
            await page.locator('body').ariaSnapshot(),
            { mode: 0o600 }
        );
    };

    const context: VerificationContext = {
        baseUrl: BASE_URL,
        artifactsDir: directory,
        runId,
        browser,
        actors: {
            learner: createActor(runId, 'learner'),
            recipient: createActor(runId, 'recipient'),
            issuer: createActor(runId, 'issuer'),
        },
        newActor: role => createActor(runId, role),
        newContext: async (label, contextOptions: NewContextOptions = {}) => {
            if (closing) throw new Error('Verification evidence is closing; cannot open a context');
            const entryLabel = `${managed.length}-${safeName(label)}`;
            const video = contextOptions.video ?? options.video;
            const entry: ManagedContext = {
                context: await browser.newContext({
                    baseURL: BASE_URL,
                    locale: 'en-US',
                    viewport: { width: 1440, height: 1000 },
                    serviceWorkers: 'block',
                    ...(video && {
                        recordVideo: {
                            dir: join(directory, `${entryLabel}-video`),
                            size: { width: 1440, height: 1000 },
                        },
                    }),
                }),
                label: entryLabel,
                network: [],
                errors: [],
            };
            managed.push(entry);
            await configureContext(entry.context, entry.network);
            entry.context.on('page', page =>
                page.on('pageerror', error => entry.errors.push(error.message))
            );
            await entry.context.tracing.start({
                screenshots: true,
                snapshots: true,
                sources: true,
            });
            return entry.context;
        },
        signIn: async (page, actor, signInOptions) => {
            await signIn(page, actor, signInOptions);
            sessionActors.set(page.context(), actor);
        },
        newPage: async (label, pageOptions: NewPageOptions = {}) => {
            const browserContext = await context.newContext(label, pageOptions);
            const page = await browserContext.newPage();
            if (pageOptions.signInAs) {
                await context.signIn(page, pageOptions.signInAs, {
                    createProfile: pageOptions.createProfile,
                });
            }
            return page;
        },
        sdk: actor => {
            let wallet = wallets.get(actor.seed);
            if (!wallet) {
                wallet = getVerificationProfile(actor.profileId, actor.displayName, actor.seed);
                wallets.set(actor.seed, wallet);
            }
            return wallet;
        },
        capture,
        inspect: {
            neo4j: async cypher => {
                return queryNeo4j(requireStackDirectory(), cypher);
            },
            mongo: async (database, collection, filter = {}) => {
                return queryMongo(
                    requireStackDirectory(),
                    database,
                    collection,
                    JSON.stringify(filter)
                );
            },
        },
        record: async (label, value) => {
            const file = join(
                directory,
                `${String(++sequence).padStart(3, '0')}-${safeName(label)}.json`
            );
            await saveJson(file, value);
            return file;
        },
        step: async (page, label, action) => {
            const record: Record<string, unknown> = {
                label,
                startedAt: new Date().toISOString(),
                url: page.url(),
            };
            actions.push(record);
            await capture(page, `${label}-before`);
            try {
                const result = await action();
                record.status = 'passed';
                await capture(page, `${label}-after`);
                return result;
            } catch (error) {
                record.status = 'failed';
                record.error = String(error);
                await capture(page, `${label}-failure`).catch(() => {});
                throw error;
            } finally {
                record.finishedAt = new Date().toISOString();
                record.url = page.url();
                await saveJson(join(directory, 'actions.json'), actions);
            }
        },
    };

    return {
        context,
        captureOpenPages: async label => {
            for (const entry of managed) {
                for (const page of entry.context.pages()) {
                    await capture(page, `${label}-${entry.label}`).catch(() => {});
                }
            }
        },
        // Idempotent: an interrupt may save evidence while the journey's own cleanup also runs.
        close: () =>
            (closing ??= (async () => {
                const failures: string[] = [];
                const retain = async (
                    label: string,
                    action: () => Promise<unknown>
                ): Promise<void> => {
                    try {
                        await action();
                    } catch (error) {
                        failures.push(`${label}: ${String(error)}`);
                    }
                };
                for (const entry of managed) {
                    await retain(`${entry.label} network`, () =>
                        saveJson(join(directory, `${entry.label}-network.json`), entry.network)
                    );
                    await retain(`${entry.label} errors`, () =>
                        saveJson(join(directory, `${entry.label}-errors.json`), entry.errors)
                    );
                    // One failed artifact must not prevent saving the trace or other contexts.
                    // Sessions and traces contain disposable credentials and bearer links: private.
                    await retain(`${entry.label} session`, async () =>
                        saveJson(join(directory, `${entry.label}-session.json`), {
                            ...(await entry.context.storageState({ indexedDB: true })),
                            // JSON cannot preserve the app's non-extractable IndexedDB CryptoKey.
                            // Reuse this disposable identity through real seed sign-in instead.
                            verificationActor: sessionActors.get(entry.context),
                        })
                    );
                    await retain(`${entry.label} trace`, () =>
                        entry.context.tracing.stop({
                            path: join(directory, `${entry.label}-trace.zip`),
                        })
                    );
                    // Closing the context is what flushes recorded video to disk.
                    await retain(`${entry.label} close`, () => entry.context.close());
                }
                await retain('actions', () => saveJson(join(directory, 'actions.json'), actions));
                if (failures.length)
                    throw new Error(`Evidence capture failed: ${failures.join('; ')}`);
            })()),
    };
};
