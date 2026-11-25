import type { Server } from 'node:http';
import { initLearnCard } from '@learncard/init';
import {
    connect,
    createPrompts,
    ensureIdentity,
    ensureProfile,
    KEYS,
    loadProject,
    localizeSnippet,
    resolveServices,
    saveProject,
    type ProjectOptions,
    PRODUCTION_NETWORK,
} from './project';
import { DEFAULT_BADGE, invalidRecipientReason, templateCredential } from './send';
import { WEBHOOK_MJS } from './generated/snippets';
import { writeSnippet } from './snippet-files';
import { setupSigning } from './setup-signing';
import { out } from './out';
import { UsageError } from './errors';

interface WebhookModule {
    extractBearer: (header: unknown) => string | undefined;
    webhookDedupeKey: (payload: unknown) => string | undefined;
    createWebhookReceiver: (
        verifier: {
            invoke: {
                verifyPresentation: (
                    token: string,
                    options: { proofFormat: 'jwt' }
                ) => Promise<{ errors: unknown[] }>;
            };
        },
        expectedDid?: string
    ) => Server;
}

export const webhookConfig = (
    env: Record<string, string>,
    options: { port?: string },
    runtime: Record<string, string | undefined> = process.env
): { port: number; expectedDid: string | undefined } => {
    const port = Number(options.port ?? runtime.PORT ?? env.PORT ?? 8787);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw new Error('Port must be 1–65535.');
    return { port, expectedDid: runtime.EXPECTED_NETWORK_DID ?? env.EXPECTED_NETWORK_DID };
};

export const closeWebhookReceiver = (server: Server): Promise<void> =>
    new Promise((resolve, reject) => {
        // Verification may be waiting on a remote DID. Do not let it block Ctrl+C indefinitely.
        const timer = setTimeout(() => server.closeAllConnections(), 1000);
        timer.unref();
        server.close(error => {
            clearTimeout(timer);
            if (error) reject(error);
            else resolve();
        });
    });

/** Execute the embedded, canonical receiver, never a possibly edited file from the cwd. */
export const loadWebhookModule = async (): Promise<WebhookModule> => {
    return import(`data:text/javascript;base64,${Buffer.from(WEBHOOK_MJS).toString('base64')}`);
};

export interface WebhookEvent {
    type: string;
    status?: string;
    issuanceId?: string;
    recipient?: string;
}

/** The embedded receiver logs one space-separated line per event: type, status, issuanceId, recipient DID. */
export const parseWebhookLogLine = (line: string): WebhookEvent | undefined => {
    const [type, status, issuanceId, recipient] = line.trim().split(/\s+/);
    if (!type) return undefined;
    return {
        type,
        ...(status && { status }),
        ...(issuanceId && { issuanceId }),
        ...(recipient && { recipient }),
    };
};

/**
 * `--json` mode does not stream: intercept the receiver's own console.log lines (never
 * forwarding them to real stdout) and resolve with everything seen once ISSUANCE_DELIVERED
 * (and ISSUANCE_CLAIMED, if requested) has arrived, or once the timeout elapses.
 */
export const collectWebhookEvents = (
    timeoutMs: number,
    waitForClaim: boolean,
    registerStop?: (stop: () => void) => void
): Promise<WebhookEvent[]> =>
    new Promise(resolve => {
        const events: WebhookEvent[] = [];
        const originalLog = console.log;
        const finish = (): void => {
            clearTimeout(timer);
            console.log = originalLog;
            resolve(events);
        };
        const timer = setTimeout(finish, Math.max(0, timeoutMs));
        registerStop?.(finish);
        console.log = (...args: unknown[]): void => {
            const [first] = args;
            const event = typeof first === 'string' ? parseWebhookLogLine(first) : undefined;
            if (!event) return;
            events.push(event);
            const delivered = events.some(e => e.type === 'ISSUANCE_DELIVERED');
            const claimed = events.some(e => e.type === 'ISSUANCE_CLAIMED');
            if (delivered && (!waitForClaim || claimed)) finish();
        };
    });

const DEFAULT_TIMEOUT_SECONDS = 60;

/** `--timeout <seconds>` in milliseconds: a positive number, default 60s. */
export const parseWebhookTimeout = (value: string | undefined): number => {
    if (value === undefined) return DEFAULT_TIMEOUT_SECONDS * 1000;
    const seconds = Number(value);
    if (!value.trim() || !Number.isFinite(seconds) || seconds <= 0)
        throw new UsageError(`Invalid --timeout "${value}". Use a positive number of seconds.`);
    return seconds * 1000;
};

/**
 * Human mode at a terminal waits for Ctrl+C. Without a terminal on stdin (CI, an agent's
 * shell) nobody can press Ctrl+C, so the run ends after `--timeout` like `--json` does.
 */
export const humanWaitTimeoutMs = (timeoutMs: number, stdinIsTTY: boolean): number | undefined =>
    stdinIsTTY ? undefined : timeoutMs;

/** Recipient checks for `webhook --url`, before any identity or network work. */
export const validateWebhookUrl = (url: string, production: boolean): void => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new UsageError(`Invalid --url "${url}". Use a public HTTPS URL.`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol))
        throw new UsageError(`Invalid --url "${url}". Use a public HTTPS URL.`);
    if (production && parsed.protocol !== 'https:')
        throw new UsageError('--url must be a public HTTPS URL when using the production network.');
};

export const runWebhook = async (
    email: string | undefined,
    options: ProjectOptions & {
        to?: string;
        url?: string;
        port?: string;
        timeout?: string;
        waitForClaim?: boolean;
    }
): Promise<void> => {
    const project = await loadProject(process.cwd());
    const { port, expectedDid } = webhookConfig(project.env, options);
    const timeoutMs = parseWebhookTimeout(options.timeout);
    const production = resolveServices(project.env, options.network).network === PRODUCTION_NETWORK;
    if (options.url) validateWebhookUrl(options.url, production);
    // Settle the recipient before creating an identity or connecting (only needed with --url).
    let recipient = '';
    if (options.url) {
        const prompts = createPrompts(options.yes);
        try {
            recipient =
                email || options.to || (await prompts.ask('Recipient email (--to <email>)', ''));
        } finally {
            prompts.close();
        }
        recipient = recipient.trim();
        if (!recipient) throw new UsageError('Provide an email argument or --to <email>.');
        const reason = invalidRecipientReason(recipient);
        if (reason) throw new UsageError(reason);
    }
    const identity = await ensureIdentity(project, options);
    const learnCard = await connect(project, { ...options, lca: true });
    await ensureProfile(learnCard, identity, project);
    const wroteWebhookMjs = await writeSnippet(
        'webhook.mjs',
        localizeSnippet(WEBHOOK_MJS, resolveServices(project.env, options.network))
    );
    const verifier = await initLearnCard({ ...(options.didkit && { didkit: options.didkit }) });
    const { createWebhookReceiver } = await loadWebhookModule();
    const server = createWebhookReceiver(verifier, expectedDid);
    server.requestTimeout = 5000;
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, () => {
            server.removeListener('error', reject);
            resolve();
        });
    });
    out.log(`Listening on http://localhost:${port}`);
    try {
        if (!options.url) {
            out.log(
                `Next: expose port ${port} with ngrok/cloudflared and re-run with --url <publicUrl>. No credential sent.`
            );
            out.set({ port, files: wroteWebhookMjs ? ['./webhook.mjs'] : [] });
            return;
        }
        if (!expectedDid) {
            out.log(
                'Demo: signatures are verified, but any DID is accepted. Set EXPECTED_NETWORK_DID to your trusted network DID before production.'
            );
        }
        // Template claims need a hosted signer; the demo does not persist signer configuration.
        await setupSigning(project, learnCard, undefined, { persist: false });
        if (!project.env[KEYS.TEMPLATE_URI]) {
            const uri = await learnCard.invoke.createBoost(templateCredential(learnCard.id.did()), {
                name: DEFAULT_BADGE.name,
                category: 'Achievement',
                status: 'LIVE',
            });
            await saveProject(project, { [KEYS.TEMPLATE_URI]: uri });
        }
        const templateUri = project.env[KEYS.TEMPLATE_URI]!;
        // Start collecting before send() so an ISSUANCE_DELIVERED that arrives mid-call isn't missed.
        let stopCollectingEvents: (() => void) | undefined;
        const eventsPromise = out.json
            ? collectWebhookEvents(timeoutMs, !!options.waitForClaim, stop => {
                  stopCollectingEvents = stop;
              })
            : undefined;
        const onServerError = (): void => {};
        if (eventsPromise) server.on('error', onServerError);
        const result = await learnCard.invoke
            .send({
                type: 'boost',
                recipient,
                templateUri,
                options: { webhookUrl: options.url },
            })
            .catch(error => {
                if (eventsPromise) {
                    server.removeListener('error', onServerError);
                    stopCollectingEvents?.();
                }
                throw error;
            });
        out.log(`Sent. Watch for ISSUANCE_DELIVERED ${result.inbox?.status ?? ''}.`);
        out.log(
            result.inbox?.status === 'PENDING'
                ? `Next: click the claim link in your email to see ISSUANCE_CLAIMED. Ctrl+C to stop.`
                : 'Next: this recipient already has LearnCard; no claim event is expected. Ctrl+C to stop.'
        );
        if (eventsPromise) {
            const events = await eventsPromise;
            server.removeListener('error', onServerError);
            out.set({
                port,
                url: options.url,
                templateUri,
                issuanceId: result.inbox?.issuanceId,
                events,
            });
            return;
        }
        const waitMs = humanWaitTimeoutMs(timeoutMs, !!process.stdin.isTTY);
        await new Promise<void>((resolve, reject) => {
            const timer =
                waitMs === undefined
                    ? undefined
                    : setTimeout(() => {
                          out.log(`Stopped after ${waitMs / 1000}s (no terminal; see --timeout).`);
                          stop();
                      }, waitMs);
            const stop = (): void => {
                cleanup();
                resolve();
            };
            const fail = (error: Error): void => {
                cleanup();
                reject(error);
            };
            const cleanup = (): void => {
                if (timer) clearTimeout(timer);
                process.removeListener('SIGINT', stop);
                process.removeListener('SIGTERM', stop);
                server.removeListener('error', fail);
            };
            process.once('SIGINT', stop);
            process.once('SIGTERM', stop);
            server.once('error', fail);
        });
    } finally {
        await closeWebhookReceiver(server);
    }
};
