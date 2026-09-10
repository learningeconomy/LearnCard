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
import { DEFAULT_BADGE, templateCredential } from './send';
import { WEBHOOK_MJS } from './generated/snippets';
import { writeSnippet } from './snippet-files';
import { setupSigning } from './setup-signing';

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

export const runWebhook = async (
    email: string | undefined,
    options: ProjectOptions & { to?: string; url?: string; port?: string }
): Promise<void> => {
    const project = await loadProject(process.cwd());
    const { port, expectedDid } = webhookConfig(project.env, options);
    const production = resolveServices(project.env, options.network).network === PRODUCTION_NETWORK;
    if (options.url && production && new URL(options.url).protocol !== 'https:') {
        throw new Error('--url must be a public HTTPS URL when using the production network.');
    }
    const identity = await ensureIdentity(project, options);
    const learnCard = await connect(project, { ...options, lca: true });
    await ensureProfile(learnCard, identity);
    await writeSnippet(
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
    console.log(`Listening on http://localhost:${port}`);
    try {
        if (!options.url) {
            console.log(
                `Next: expose port ${port} with ngrok/cloudflared and re-run with --url <publicUrl>. No credential sent.`
            );
            return;
        }
        if (!expectedDid) {
            console.log(
                'Demo: signatures are verified, but any DID is accepted. Set EXPECTED_NETWORK_DID to your trusted network DID before production.'
            );
        }
        const prompts = createPrompts(options.yes);
        let recipient: string;
        try {
            recipient = email || options.to || (await prompts.ask('Recipient email', ''));
        } finally {
            prompts.close();
        }
        if (!recipient) throw new Error('Provide an email argument or --to <email>.');
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
        const result = await learnCard.invoke.send({
            type: 'boost',
            recipient,
            templateUri: project.env[KEYS.TEMPLATE_URI]!,
            options: { webhookUrl: options.url },
        });
        console.log(`Sent. Watch for ISSUANCE_DELIVERED ${result.inbox?.status ?? ''}.`);
        console.log(
            result.inbox?.status === 'PENDING'
                ? `Next: click the claim link in your email to see ISSUANCE_CLAIMED. Ctrl+C to stop.`
                : 'Next: this recipient already has LearnCard; no claim event is expected. Ctrl+C to stop.'
        );
        await new Promise<void>((resolve, reject) => {
            const stop = (): void => {
                cleanup();
                resolve();
            };
            const fail = (error: Error): void => {
                cleanup();
                reject(error);
            };
            const cleanup = (): void => {
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
