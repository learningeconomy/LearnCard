import type { FastifyInstance } from 'fastify';

import type { ShareContentRepository } from '@accesslayer/share-content';
import {
    createDidkitPresentationVerifier,
    createShareContentAuthorizationVerifier,
    type LearnCardLike,
    type ReplayStore,
} from '@helpers/share-content-auth';

import { resolveShareContentConfig, toShareContentPluginOptions } from './config';
import { shareContentFastifyPlugin } from './plugin';
import { SHARE_CONTENT_PLUGIN_PREFIX, type ShareContentPluginOptions } from './types';

/**
 * Startup wrapper for the service-only share-content routes.
 *
 * The builder owns the fail-closed boot order: resolve the explicit config,
 * then (only when it is valid and enabled) open the repository, *await* its
 * index initialization, build the DIDKit verifier and the real Redis replay
 * store, and return injectable plugin options. A disabled configuration returns
 * immediately and performs none of those side effects, so a disabled boot never
 * installs indexes or opens connections.
 */

export type ShareContentRuntimeDependencies = {
    /** Existing DIDKit verification seam; never constructed at import time. */
    getLearnCard: () => Promise<LearnCardLike>;
    /** Real `SET NX EX` replay store (tests may inject an explicit double). */
    createReplayStore: () => { store: ReplayStore; close: () => Promise<void> };
    /** Repository factory; must not connect until the enabled branch. */
    getRepository: () => Promise<ShareContentRepository>;
};

export type EnabledShareContentRuntime = {
    enabled: true;
    pluginOptions: ShareContentPluginOptions;
    /** Releases the replay-store connection. Repository pooling is owned by @mongo. */
    close: () => Promise<void>;
};

export type ShareContentRuntime = { enabled: false } | EnabledShareContentRuntime;

export const buildShareContentRuntime = async (
    rawConfig: unknown,
    dependencies: ShareContentRuntimeDependencies
): Promise<ShareContentRuntime> => {
    const resolved = resolveShareContentConfig(rawConfig);

    if (resolved.status === 'disabled') return { enabled: false };

    if (resolved.status === 'invalid') {
        // Explicit startup failure: never fall back to a weaker check.
        throw new Error(
            `Invalid LC-2187 share-content configuration: ${resolved.errors.join('; ')}`
        );
    }

    const repository = await dependencies.getRepository();

    // Enabled boot awaits index initialization before any route can serve.
    await repository.initialize();

    const replayStore = dependencies.createReplayStore();

    const verifier = createShareContentAuthorizationVerifier({
        config: resolved.trustConfig,
        verifyPresentation: createDidkitPresentationVerifier(dependencies.getLearnCard),
        replayStore: replayStore.store,
    });

    return {
        enabled: true,
        pluginOptions: toShareContentPluginOptions(resolved, { verifier, repository }),
        close: async () => {
            await replayStore.close();
        },
    };
};

/** Register the routes under the fixed prefix on an already-built Fastify server. */
export const registerShareContentRoutes = async (
    fastify: FastifyInstance,
    runtime: EnabledShareContentRuntime
): Promise<void> => {
    await fastify.register(shareContentFastifyPlugin, {
        prefix: SHARE_CONTENT_PLUGIN_PREFIX,
        ...runtime.pluginOptions,
    });
};
