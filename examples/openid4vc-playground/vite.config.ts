import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

import { playgroundApiPlugin } from './server/middleware';

/**
 * Playground Vite config.
 *
 * The custom `playgroundApiPlugin` wires the server-side admin
 * endpoints (`/api/launch/:id`, `/api/status/:provider/:state`) into
 * the dev server. The browser code never touches the walt.id Docker
 * stack directly \u2014 it goes through this middleware so secrets
 * (issuer signing keys) stay server-side.
 *
 * Run with `bun run dev`. For phone testing, run `bun run dev --host`
 * to bind on the LAN; see README for ngrok/cloudflare-tunnel
 * options when the wallet is on a separate network.
 */
export default defineConfig({
    // `@vitejs/plugin-react` bundles its own nested copy of Vite, so the
    // `Plugin` it returns is nominally a different type from this package's
    // Vite instance even though the versions match. Cast to this package's
    // `PluginOption` to reconcile the duplicate-instance type mismatch.
    plugins: [react(), playgroundApiPlugin()] as PluginOption[],
    server: {
        port: 5173,
    },
});
