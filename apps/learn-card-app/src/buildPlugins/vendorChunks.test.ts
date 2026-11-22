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
        expect(packageOf(nm('@ionic/react/dist/index.js'))).toBe('@ionic/react');
        expect(packageOf(nm('@ionic/react/node_modules/@ionic/core/components/index.js'))).toBe(
            '@ionic/core'
        );
        expect(packageOf(app('index.tsx'))).toBeUndefined();
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
        expect(vendorChunkOf(nm('@ionic/react/css/core.css?inline'))).toBeUndefined();
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
        const core = nm('@ionic/core/components/index.js');
        const shims = nm('@ionic/core/components/input-shims.js');
        const shimHelper = nm('@ionic/core/components/index7.js');
        const shared = nm('@ionic/core/components/helpers.js');
        const meta = metaFrom({
            [core]: { importers: [app('App.tsx')] },
            [shims]: { dynamicImporters: [core] },
            [shimHelper]: { importers: [shims] },
            [shared]: { importers: [shims, core] },
        });
        const chunk = manualChunks();
        expect(chunk(core, meta)).toBe('vendor-ionic');
        expect(chunk(shims, meta)).toBeUndefined();
        expect(chunk(shimHelper, meta)).toBeUndefined();
        expect(chunk(shared, meta)).toBe('vendor-ionic');
    });

    it('keeps a vendor module in its group when app code imports it lazily', () => {
        const swiper = nm('swiper/swiper-react.mjs');
        const meta = metaFrom({ [swiper]: { dynamicImporters: [app('pages/Carousel.tsx')] } });
        expect(manualChunks()(swiper, meta)).toBe('vendor-swiper');
    });

    it('survives import cycles inside a vendor', () => {
        const a = nm('@ionic/core/components/a.js');
        const b = nm('@ionic/core/components/b.js');
        const meta = metaFrom({
            [a]: { importers: [b], dynamicImporters: [nm('@ionic/core/components/index.js')] },
            [b]: { importers: [a] },
        });
        const chunk = manualChunks();
        expect(chunk(a, meta)).toBe('vendor-ionic');
        expect(chunk(b, meta)).toBe('vendor-ionic');
    });
});
