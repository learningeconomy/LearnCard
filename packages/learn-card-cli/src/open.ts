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

const launchBrowser = (url: string): void => {
    const [cmd, args] =
        process.platform === 'darwin'
            ? ['open', [url]]
            : process.platform === 'win32'
              ? ['cmd', ['/c', 'start', '', url]]
              : ['xdg-open', [url]];
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
};

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
            'No SECURE_SEED in .env. Run a command that creates one first, e.g. npx @learncard/cli send you@example.com'
        );

    const path = openPath(target, project.env);
    if (!path)
        throw new Error(
            `Nothing saved for "${target}" yet. Run the command that creates it first (send --template, consent-contract, or embed).`
        );

    const { network } = resolveServices(project.env, options.network);
    if (!options.appUrl && network !== PRODUCTION_NETWORK && network !== STAGING_NETWORK)
        throw new Error(
            `${network} has no hosted LearnCard app. Pass --app-url <url> for the app connected to it.`
        );
    const appUrl = appUrlFor(network, options.appUrl);
    const noBrowser = impliesNoBrowser(options, !!process.stdout.isTTY);

    let url: string;
    let seedDelivery: SeedDelivery;
    if (options.urlFragment) {
        url = signInUrl(appUrl, path, seed);
        out.log(
            'Warning: --url-fragment puts your seed in the browser URL (history, screenshots).'
        );
        seedDelivery = 'fragment';
    } else {
        url = signInUrl(appUrl, path);
        try {
            await clipboard.write(seed);
            out.log(`Copied your seed to the clipboard (clears in ${CLIPBOARD_TTL_MS / 1000}s).`);
            seedDelivery = 'clipboard';
            setTimeout(async () => {
                if ((await clipboard.read().catch(() => '')) === seed)
                    await clipboard.write('').catch(() => {});
            }, CLIPBOARD_TTL_MS).unref();
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
};
