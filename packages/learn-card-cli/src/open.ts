import { spawn } from 'node:child_process';
import clipboard from 'clipboardy';

import {
    appUrlFor,
    loadProject,
    PRODUCTION_NETWORK,
    resolveServices,
    STAGING_NETWORK,
    type ProjectOptions,
} from './project';
import { out } from './out';

export type OpenTarget = 'portal' | 'wallet' | 'template' | 'contract' | 'integration';

export const OPEN_TARGETS: Record<OpenTarget, string> = {
    portal: 'the Developer Portal',
    wallet: 'your wallet',
    template: 'the template you last sent from',
    contract: 'your consent contract',
    integration: "your Claim button's integration",
};

/** App path for a target, given the project's .env. Returns null when the .env lacks what the target needs. */
export const openPath = (target: OpenTarget, env: Record<string, string>): string | null => {
    switch (target) {
        case 'portal':
            return '/app-store/developer';
        case 'wallet':
            return '/wallet';
        case 'template':
            return env.TEMPLATE_URI
                ? `/app-store/developer?template=${encodeURIComponent(env.TEMPLATE_URI)}`
                : null;
        case 'contract':
            return env.CONTRACT_URI
                ? `/app-store/developer?contract=${encodeURIComponent(env.CONTRACT_URI)}`
                : null;
        case 'integration':
            return env.INTEGRATION_ID
                ? `/app-store/developer/integrations/${encodeURIComponent(env.INTEGRATION_ID)}`
                : null;
    }
};

export const signInUrl = (appUrl: string, next: string, seedInFragment?: string): string => {
    const url = new URL('/developer/sign-in', appUrl);
    url.searchParams.set('next', next);
    if (seedInFragment) url.hash = `seed=${seedInFragment}`;
    return url.toString();
};

const CLIPBOARD_TTL_MS = 60_000;

/** Only plain http(s) URLs may reach the OS browser launcher or seed a sign-in link. */
const isHttpUrl = (value: string): boolean => {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
};

const launchBrowser = (url: string): void => {
    const [cmd, args] =
        process.platform === 'darwin'
            ? ['open', [url]]
            : process.platform === 'win32'
              ? // No shell involved: rundll32 receives the URL as a normal argv entry, so
                // cmd.exe metacharacters (&, |, ^, etc.) in the URL are never interpreted.
                ['rundll32', ['url.dll,FileProtocolHandler', url]]
              : ['xdg-open', [url]];
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
};

/**
 * Clears the clipboard after the TTL, or immediately on Ctrl-C, but only if it still holds the
 * seed we wrote (the user may have copied something else). Resolves once the clipboard is safe.
 */
const waitForClipboardClear = (seed: string): Promise<void> =>
    new Promise(resolve => {
        let settled = false;
        const finish = async (): Promise<void> => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            process.removeListener('SIGINT', onSigint);
            if ((await clipboard.read().catch(() => '')) === seed)
                await clipboard.write('').catch(() => {});
            out.log('Clipboard cleared.');
            resolve();
        };
        const onSigint = (): void => {
            void finish();
        };
        const timer = setTimeout(() => void finish(), CLIPBOARD_TTL_MS);
        process.once('SIGINT', onSigint);
    });

export interface OpenOptions extends ProjectOptions {
    appUrl?: string;
    urlFragment?: boolean;
    /** commander's attribute name for `--no-browser`; false only when that flag is passed. */
    browser?: boolean;
}

export type SeedDelivery = 'clipboard' | 'fragment' | 'none';

/** A script or `--json` run has nowhere to click "paste"; never launch a browser for it. */
export const impliesNoBrowser = (
    options: { browser?: boolean; json?: boolean },
    isTTY: boolean
): boolean => options.browser === false || !isTTY || !!options.json;

export const runOpen = async (
    target: OpenTarget = 'portal',
    options: OpenOptions
): Promise<void> => {
    const project = await loadProject(process.cwd());
    const seed = project.env.SECURE_SEED;
    if (!seed)
        throw new Error(
            'No SECURE_SEED in .env. Run a command that creates one first, e.g. npx @learncard/cli send'
        );

    const path = openPath(target, project.env);
    if (!path)
        throw new Error(
            `Nothing saved for "${target}" yet. Run the command that creates it first (send --template, consent-contract, or embed).`
        );

    const { network } = resolveServices(project.env, options.network);
    if (options.appUrl && !isHttpUrl(options.appUrl))
        throw new Error('--app-url must be a valid http(s) URL.');
    if (!options.appUrl && network !== PRODUCTION_NETWORK && network !== STAGING_NETWORK)
        throw new Error(
            `${network} has no hosted LearnCard app. Pass --app-url <url> for the app connected to it.`
        );
    const appUrl = appUrlFor(network, options.appUrl);
    const noBrowser = impliesNoBrowser(options, !!process.stdout.isTTY);

    let url: string;
    let seedDelivery: SeedDelivery;
    let clipboardCleared: Promise<void> | undefined;
    if (options.urlFragment) {
        url = signInUrl(appUrl, path, seed);
        out.log(
            'Warning: --url-fragment puts your seed in the browser URL (history, screenshots).'
        );
        seedDelivery = 'fragment';
    } else if (out.json) {
        // Non-interactive: nobody is there to paste, and blocking a script for the clipboard TTL
        // would be worse than not copying. Scripts that need the seed use --url-fragment.
        url = signInUrl(appUrl, path);
        out.log(
            'Seed not copied in --json mode. Paste it from .env, or re-run with --url-fragment.'
        );
        seedDelivery = 'none';
    } else {
        url = signInUrl(appUrl, path);
        try {
            await clipboard.write(seed);
            out.log(`Copied your seed to the clipboard (clears in ${CLIPBOARD_TTL_MS / 1000}s).`);
            seedDelivery = 'clipboard';
            clipboardCleared = waitForClipboardClear(seed);
        } catch {
            out.log(
                'Clipboard unavailable. Paste the seed from .env, or re-run with --url-fragment.'
            );
            seedDelivery = 'none';
        }
    }

    if (!options.urlFragment) out.log('→ Click "Paste from clipboard", then Sign in.');
    if (!noBrowser) launchBrowser(url);
    // Printed last so `$(cli open | tail -1)` captures this line in non-json mode.
    out.log(
        `Opening ${OPEN_TARGETS[target]}: ${options.urlFragment ? url.split('#')[0] + '#seed=…' : url}`
    );

    out.set({ url, target, next: path, seedDelivery });

    // Keep the process alive until the clipboard is actually cleared (or Ctrl-C clears it early);
    // index.tsx's runCommand exits right after this promise resolves.
    await clipboardCleared;
};
