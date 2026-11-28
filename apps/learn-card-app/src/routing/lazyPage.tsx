import React, { useState, type ComponentType } from 'react';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';

/** A page whose code loads on demand: route modules render it, clientLoaders and prefetches load it. */
export type LazyPage<P extends object = object> = {
    /** Starts loading the page's chunk. Never rejects: the render path retries a failed load. */
    preload: () => Promise<void>;
    /** Renders the page: synchronously once its chunk has loaded, otherwise it suspends. */
    Component: ComponentType<P>;
};

/**
 * React.lazy suspends on its first render even when the module has already loaded, which flashed
 * the route Suspense fallback on every navigation (LC-2415). Once the chunk is in, this renders the
 * page directly. The choice is fixed per mount, so the element type never flips under a mounted tree.
 */
export const lazyPage = <P extends object = object>(
    factory: () => Promise<{ default: ComponentType<P> }>
): LazyPage<P> => {
    let loaded: ComponentType<P> | null = null;
    const Lazy = lazyWithRetry(() =>
        factory().then(module => {
            loaded = module.default;
            return module;
        })
    ) as unknown as ComponentType<P> & { preload: () => Promise<void> };

    const Component = (props: P) => {
        const [Page] = useState(() => loaded ?? Lazy);
        return <Page {...props} />;
    };

    return { preload: Lazy.preload, Component };
};

/** A named export of a module as a lazy page. */
export const lazyNamedPage = <M, K extends keyof M>(factory: () => Promise<M>, name: K): LazyPage =>
    lazyPage(() =>
        factory().then(module => ({ default: module[name] as unknown as ComponentType }))
    );

/** A page that its route renders with fixed props (routes pass no props of their own). */
export const lazyPageWith = <P extends object>(
    factory: () => Promise<{ default: ComponentType<P> }>,
    props: P
): LazyPage =>
    lazyPage(() => factory().then(({ default: Page }) => ({ default: () => <Page {...props} /> })));
