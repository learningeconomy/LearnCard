import { environment } from '@environment';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { generateLearnCard } from '@learncard/core';
import type { LearnCard } from '@learncard/core';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import type { CryptoPluginType } from '@learncard/crypto-plugin';
import type { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import type { DidKeyPlugin } from '@learncard/didkey-plugin';
import { getEncryptionPlugin } from '@learncard/encryption-plugin';
import type { EncryptionPluginType } from '@learncard/encryption-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import type { VCPlugin } from '@learncard/vc-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import type { VCTemplatePlugin } from '@learncard/vc-templates-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import type { ExpirationPlugin } from '@learncard/expiration-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';
import type { LearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin } from '@learncard/did-web-plugin';
import type { DidWebPlugin } from '@learncard/did-web-plugin';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';
import type { JWE } from '@learncard/types';

// The DIDKit WASM is copied next to the compiled handler at build time (see
// esbuildPlugins.cjs). The Lambda bundle's node_modules layout doesn't match what
// require.resolve expects (the package is a hoisted workspace symlink), so prefer the
// co-located copy and fall back to package resolution for local dev / Docker.
const DIDKIT_WASM_SPECIFIER = '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm';

const resolveDidkitWasmPath = (): string => {
    const colocated = join(__dirname, 'didkit_wasm_bg.wasm');
    if (existsSync(colocated)) return colocated;

    return require.resolve(DIDKIT_WASM_SPECIFIER);
};

// Which DIDKit engine actually loaded — exposed via the deep health check so
// native-vs-wasm is observable from an HTTP probe instead of CloudWatch spelunking.
let didKitEngine: 'native' | 'wasm' | 'unloaded' = 'unloaded';
export const getDidKitEngine = (): 'native' | 'wasm' | 'unloaded' => didKitEngine;

// Try native plugin first, fall back to WASM
const didKitPluginPromises = new Map<boolean, Promise<DIDKitPlugin>>();

const resolveDidKitPluginFactory = (
    module: Record<string, unknown>
): ((input?: unknown, allowRemoteContexts?: boolean) => Promise<DIDKitPlugin>) => {
    const factory =
        (module as { getDidKitPlugin?: unknown }).getDidKitPlugin ??
        (module as { default?: { getDidKitPlugin?: unknown } }).default?.getDidKitPlugin;

    if (typeof factory !== 'function') {
        throw new Error('DIDKit plugin factory not found in module exports');
    }

    return factory as (input?: unknown, allowRemoteContexts?: boolean) => Promise<DIDKitPlugin>;
};

const getDidKitPlugin = async (allowRemoteContexts = false): Promise<DIDKitPlugin> => {
    const cached = didKitPluginPromises.get(allowRemoteContexts);

    if (cached) return cached;

    const promise = (async () => {
        if (environment.SKIP_DIDKIT_NAPI) {
            const didkitModule = await import('@learncard/didkit-plugin');
            const getWasmPlugin = resolveDidKitPluginFactory(didkitModule);
            const wasmBuffer = await readFile(resolveDidkitWasmPath());
            const plugin = await getWasmPlugin(wasmBuffer, allowRemoteContexts);
            didKitEngine = 'wasm';
            return plugin;
        }

        try {
            const didkitModule = await import('@learncard/didkit-plugin-node');
            const getNativePlugin = resolveDidKitPluginFactory(didkitModule);
            const plugin = await getNativePlugin(undefined, allowRemoteContexts);
            didKitEngine = 'native';
            return plugin;
        } catch (error) {
            // Surface the fallback — a silent catch here hid a months-long "native never
            // actually loads in Lambda" gap (see PR #1341 investigation).
            console.warn('[didkit] native plugin unavailable, falling back to WASM:', error);
            const didkitModule = await import('@learncard/didkit-plugin');
            const getWasmPlugin = resolveDidKitPluginFactory(didkitModule);
            const wasmBuffer = await readFile(resolveDidkitWasmPath());
            const plugin = await getWasmPlugin(wasmBuffer, allowRemoteContexts);
            didKitEngine = 'wasm';
            return plugin;
        }
    })();

    didKitPluginPromises.set(allowRemoteContexts, promise);

    return promise;
};

export type EmptyLearnCard = LearnCard<
    [CryptoPluginType, DIDKitPlugin, ExpirationPlugin, VCTemplatePlugin, LearnCardPlugin]
>;

export type SeedLearnCard = LearnCard<
    [
        CryptoPluginType,
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        EncryptionPluginType,
        VCPlugin,
        VCTemplatePlugin,
        ExpirationPlugin,
        LearnCardPlugin,
    ]
>;

export type DidWebLearnCard = LearnCard<
    [
        CryptoPluginType,
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        EncryptionPluginType,
        VCPlugin,
        VCTemplatePlugin,
        ExpirationPlugin,
        LearnCardPlugin,
        DidWebPlugin,
    ]
>;

/**
 * The wallet level captured _before_ the Encryption plugin is added. Its
 * `invoke.createDagJwe` is the lower-level DIDKit method, which encrypts for
 * exactly the given recipients.
 */
export type DidKeyLearnCard = LearnCard<[CryptoPluginType, DIDKitPlugin, DidKeyPlugin<DidMethod>]>;

let emptyLearnCard: EmptyLearnCard;

const learnCards: Record<string, SeedLearnCard> = {};
const didKeyLearnCards: Record<string, DidKeyLearnCard> = {};
let didWebLearnCard: DidWebLearnCard;

const IS_OFFLINE = environment.IS_OFFLINE;

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard> => {
    if (!emptyLearnCard || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin());

        const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

        const templateLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

        emptyLearnCard = await templateLc.addPlugin(getLearnCardPlugin(templateLc));
    }

    return emptyLearnCard;
};

export const getLearnCard = async (
    seed = environment.SEED,
    allowRemoteContexts = false
): Promise<SeedLearnCard> => {
    if (!seed) throw new Error('No seed set!');

    const cacheKey = `${seed}:${allowRemoteContexts}`;

    if (!learnCards[cacheKey] || IS_OFFLINE) {
        const emptyLc = await generateLearnCard();

        const cryptoLc = allowRemoteContexts
            ? await (await emptyLc.addPlugin(DynamicLoaderPlugin)).addPlugin(CryptoPlugin)
            : await emptyLc.addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(allowRemoteContexts));

        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
        );

        didKeyLearnCards[cacheKey] = didkeyLc as DidKeyLearnCard;

        const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

        const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

        const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

        const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

        learnCards[cacheKey] = (await expirationLc.addPlugin(
            getLearnCardPlugin(expirationLc)
        )) as SeedLearnCard;
    }

    const learnCard = learnCards[cacheKey];

    if (!learnCard) {
        throw new Error('LearnCard not initialized');
    }

    return learnCard;
};

/**
 * Encrypts `cleartext` for exactly `recipients` — no implicit caller recipient.
 *
 * The Encryption plugin's convenience `createDagJwe` always adds the calling
 * wallet's own DID, which would hand this service a persistent decrypt capability
 * for every managed refresh payload. Managed credential refresh (LC-2135) requires
 * holder-only payloads, so this helper deliberately uses the lower-level DIDKit
 * plugin method on the wallet level captured before the Encryption plugin is added.
 *
 * Private to brain-service: do not re-export beyond this service's helpers.
 */
export const createDagJweForRecipients = async <T>(
    cleartext: T,
    recipients: string[],
    seed = process.env.SEED
): Promise<JWE> => {
    await getLearnCard(seed);

    const wallet = didKeyLearnCards[`${seed}:false`];

    if (!wallet) throw new Error('LearnCard not initialized');

    return wallet.invoke.createDagJwe(cleartext, recipients);
};

export const getServerDidWebDID = (): string => {
    const domainName = environment.DOMAIN_NAME;
    const isOffline = !!environment.IS_OFFLINE;

    // Misconfig guard: a deployed (non-offline) environment without DOMAIN_NAME
    // would silently fall back to localhost and produce an unresolvable did:web,
    // breaking every signing operation. Fail loud at first call instead.
    if (!domainName && !isOffline) {
        throw new Error(
            'getServerDidWebDID: DOMAIN_NAME must be set when IS_OFFLINE is not set ' +
                '(missing both → unresolvable did:web). Set DOMAIN_NAME on the Lambda ' +
                'or run with IS_OFFLINE=true for local development.'
        );
    }

    // IS_OFFLINE forces localhost even if DOMAIN_NAME is set — preserves dev/prod
    // isolation so an inherited prod env var can't leak into a local dev session.
    const domain = isOffline ? `localhost%3A${environment.PORT || 3000}` : domainName!;
    return `did:web:${domain}`;
};

export const isServersDidWebDID = (did: string): boolean => {
    return did === getServerDidWebDID();
};

export const isTrustedLoginProviderDID = (did: string): boolean => {
    const loginProviderDid = environment.LOGIN_PROVIDER_DID;

    return did === getServerDidWebDID() || (loginProviderDid ? did === loginProviderDid : false);
};

export const getDidWebLearnCard = async (): Promise<DidWebLearnCard> => {
    const seed = environment.SEED;

    const didWeb = getServerDidWebDID();

    if (!seed) throw new Error('No seed set!');

    if (!didWebLearnCard || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin());

        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
        );

        const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

        const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

        const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

        const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

        const lcLc = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));

        didWebLearnCard = await lcLc.addPlugin(await getDidWebPlugin(lcLc, didWeb));
    }

    return didWebLearnCard;
};
