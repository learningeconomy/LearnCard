import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Proxy BFF routes so the SPA shares its origin: keeps the httpOnly session cookie
// first-party (no CORS, no SameSite=None/HTTPS needed for local dev).
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const bffUrl = env.BFF_URL ?? 'http://localhost:3200';

    const proxy = Object.fromEntries(
        ['/auth', '/health', '/p'].map(path => [path, { target: bffUrl, changeOrigin: true }])
    );

    return {
        plugins: [react()],
        server: { port: 5173, proxy },
    };
});
