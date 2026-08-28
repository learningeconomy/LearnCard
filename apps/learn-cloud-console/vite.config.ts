import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Proxy BFF routes so the SPA shares its origin: keeps the httpOnly session cookie
// first-party (no CORS, no SameSite=None/HTTPS needed for local dev).
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const bffUrl = env.BFF_URL ?? 'http://localhost:3200';

    // '^/p/' is a regex, not a prefix: a plain '/p' entry also captures SPA routes like
    // /plugins and serves them from the BFF instead of index.html. Vite skips
    // changeOrigin for regex keys, so Host is pinned explicitly to keep the forwarded
    // Host identical to what the prefix entry produced.
    const proxy = Object.fromEntries(
        ['/auth', '/health', '^/p/', '/trpc'].map(path => [
            path,
            { target: bffUrl, changeOrigin: true, headers: { host: new URL(bffUrl).host } },
        ])
    );

    return {
        plugins: [react()],
        server: { port: 5173, proxy },
    };
});
