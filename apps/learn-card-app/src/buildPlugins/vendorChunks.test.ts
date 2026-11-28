import { describe, expect, it } from 'vitest';

import {
    createManualChunks,
    packageOf,
    PARAGLIDE_MESSAGES_CHUNK,
    vendorChunkOf,
    type ChunkMeta,
    type ChunkModuleInfo,
} from './vendorChunks';

const nm = (path: string) => `/repo/node_modules/${path}`;
const app = (path: string) => `/repo/apps/learn-card-app/src/${path}`;

const metaFrom = (graph: Record<string, Partial<ChunkModuleInfo>>): ChunkMeta => ({
    getModuleInfo: id =>
        id in graph ? { importers: [], dynamicImporters: [], ...graph[id] } : null,
});

describe('packageOf', () => {
    it('reads plain and scoped package names from the innermost node_modules', () => {
        expect(packageOf(nm('swiper/shared/utils.mjs'))).toBe('swiper');
        expect(packageOf(nm('@sentry/react/build/esm/index.js'))).toBe('@sentry/react');
        expect(packageOf(nm('@sentry/react/node_modules/@sentry/core/build/esm/index.js'))).toBe(
            '@sentry/core'
        );
        expect(packageOf(app('index.tsx'))).toBeUndefined();
    });

    it('normalizes Windows separators in scoped names', () => {
        expect(packageOf('C:\\repo\\node_modules\\@sentry\\react\\build\\esm\\index.js')).toBe(
            '@sentry/react'
        );
    });
});

describe('vendorChunkOf', () => {
    it('groups by package name and scope prefix', () => {
        expect(vendorChunkOf(nm('react-dom/client.js'))).toBe('vendor-react');
        expect(vendorChunkOf(nm('@firebase/auth/dist/esm/index.js'))).toBe('vendor-firebase');
        expect(vendorChunkOf(nm('@sentry-internal/replay/build/index.js'))).toBe('vendor-sentry');
    });

    it('does not match a package that only shares a prefix', () => {
        expect(vendorChunkOf(nm('react-lottie/index.js'))).toBeUndefined();
        expect(vendorChunkOf(nm('swiperjs-extra/index.js'))).toBeUndefined();
    });

    it('leaves stylesheets and app code to the default chunking', () => {
        expect(vendorChunkOf(nm('swiper/modules/pagination.css'))).toBeUndefined();
        expect(vendorChunkOf(nm('@firebase/auth/dist/auth.css?inline'))).toBeUndefined();
        expect(vendorChunkOf(app('pages/login/LoginPage.tsx'))).toBeUndefined();
    });
});

describe('createManualChunks', () => {
    const manualChunks = () => createManualChunks({ paraglideBaseLocale: 'en' });

    it('puts the base locale and the message dispatchers in one chunk, not other locales', () => {
        const chunk = manualChunks();
        const meta = metaFrom({});
        expect(chunk(app('paraglide/messages/_index.js'), meta)).toBe(PARAGLIDE_MESSAGES_CHUNK);
        expect(chunk(app('paraglide/messages/en.js'), meta)).toBe(PARAGLIDE_MESSAGES_CHUNK);
        expect(chunk(app('paraglide/runtime.js'), meta)).toBe(PARAGLIDE_MESSAGES_CHUNK);
        expect(chunk(app('paraglide/messages/es.js'), meta)).toBeUndefined();
        expect(chunk(app('paraglide/messages.js'), meta)).toBeUndefined();
    });

    it('keeps modules a vendor only loads through import() out of its group', () => {
        const core = nm('@firebase/auth/dist/esm/index.js');
        const shims = nm('@firebase/auth/dist/esm/input-shims.js');
        const shimHelper = nm('@firebase/auth/dist/esm/index7.js');
        const shared = nm('@firebase/auth/dist/esm/helpers.js');
        const meta = metaFrom({
            [core]: { importers: [app('App.tsx')] },
            [shims]: { dynamicImporters: [core] },
            [shimHelper]: { importers: [shims] },
            [shared]: { importers: [shims, core] },
        });
        const chunk = manualChunks();
        expect(chunk(core, meta)).toBe('vendor-firebase');
        expect(chunk(shims, meta)).toBeUndefined();
        expect(chunk(shimHelper, meta)).toBeUndefined();
        expect(chunk(shared, meta)).toBe('vendor-firebase');
    });

    it('keeps a vendor module in its group when app code imports it lazily', () => {
        const swiper = nm('swiper/swiper-react.mjs');
        const meta = metaFrom({ [swiper]: { dynamicImporters: [app('pages/Carousel.tsx')] } });
        expect(manualChunks()(swiper, meta)).toBe('vendor-swiper');
    });

    it('survives import cycles inside a vendor', () => {
        const a = nm('@firebase/auth/dist/esm/a.js');
        const b = nm('@firebase/auth/dist/esm/b.js');
        const meta = metaFrom({
            [a]: { importers: [b], dynamicImporters: [nm('@firebase/auth/dist/esm/index.js')] },
            [b]: { importers: [a] },
        });
        const chunk = manualChunks();
        expect(chunk(a, meta)).toBe('vendor-firebase');
        expect(chunk(b, meta)).toBe('vendor-firebase');
    });
});
