import { defineConfig } from 'vite';
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
 * Run with `pnpm dev`. For phone testing, run `pnpm dev --host`
 * to bind on the LAN; see README for ngrok/cloudflare-tunnel
 * options when the wallet is on a separate network.
 */
export default defineConfig({
    plugins: [react(), playgroundApiPlugin()],
    server: {
        port: 5173,
    },
});
