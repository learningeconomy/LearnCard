import path from 'node:path';

import type { Config } from '@react-router/dev/config';

import { finalizeStaticBuild } from './scripts/finalize-static-build';
import { PRERENDER_PATHS, safePrerenderPaths } from './src/routing/prerender';

const prerender = safePrerenderPaths(PRERENDER_PATHS);

export default {
    appDirectory: 'src',
    buildDirectory: 'build',
    // SPA mode: static files only (Capacitor, Capgo, Netlify, nginx). Never '/', which stays the
    // SPA fallback that every other path, including private links, is served from.
    ssr: false,
    prerender,
    async buildEnd({ viteConfig, reactRouterConfig }) {
        const { html } = await finalizeStaticBuild(
            path.resolve(viteConfig.root, reactRouterConfig.buildDirectory),
            prerender
        );
        viteConfig.logger.info(`Static HTML in build/: ${html.join(', ')}`);
    },
} satisfies Config;
