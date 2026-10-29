import type { Context } from '@netlify/edge-functions';
import { renderCredentialSharePreviewHtml } from './share-boost-html.ts';

type TenantConfig = { apis?: Record<string, unknown> };
type Dependencies = {
    resolveTenantConfig: (hostname: string) => TenantConfig;
    getTenantOrigin: (requestUrl: string) => string;
    fetch: typeof fetch;
};
const crawlerUserAgent =
    /(LinkedInBot|Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|WhatsApp|TelegramBot)/i;
const validPreview = (
    value: unknown
): value is { name: string; issuer: string; image?: string } => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const preview = value as Record<string, unknown>;
    if (Object.keys(preview).some(key => !['name', 'issuer', 'image'].includes(key))) return false;
    if (typeof preview.name !== 'string' || !preview.name.trim() || preview.name.length > 160)
        return false;
    if (typeof preview.issuer !== 'string' || !preview.issuer.trim() || preview.issuer.length > 160)
        return false;
    if (preview.image !== undefined) {
        if (typeof preview.image !== 'string' || preview.image.length > 2048) return false;
        try {
            if (new URL(preview.image).protocol !== 'https:') return false;
        } catch {
            return false;
        }
    }
    return true;
};

export const createShareBoostHandler =
    (dependencies: Dependencies) =>
    async (request: Request, context: Context): Promise<Response> => {
        const fallback = () => context.next();
        if (!crawlerUserAgent.test(request.headers.get('user-agent') ?? '')) return fallback();
        const requestUrl = new URL(request.url);
        const previewId = requestUrl.searchParams.get('preview');
        const shareUri = requestUrl.searchParams.get('uri');
        if (
            !shareUri ||
            shareUri.length > 4096 ||
            !previewId ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                previewId
            )
        )
            return fallback();
        try {
            const tenant = dependencies.resolveTenantConfig(requestUrl.hostname);
            if (typeof tenant.apis?.brainServiceApi !== 'string') return fallback();
            const api = new URL(tenant.apis.brainServiceApi);
            if (api.protocol !== 'https:' && api.hostname !== 'localhost') return fallback();
            const target = new URL(
                `${api.pathname.replace(/\/$/, '')}/credential-share-previews/${previewId}`,
                api.origin
            );
            target.searchParams.set('shareUri', shareUri);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);
            let data: unknown;
            try {
                const response = await dependencies.fetch(target, {
                    method: 'GET',
                    redirect: 'error',
                    signal: controller.signal,
                    headers: { accept: 'application/json' },
                });
                if (!response.ok) return fallback();
                data = await response.json();
            } finally {
                clearTimeout(timeout);
            }
            if (!validPreview(data)) return fallback();
            const canonical = new URL(dependencies.getTenantOrigin(request.url));
            canonical.pathname = '/share-boost';
            for (const key of ['uri', 'seed', 'pin', 'preview']) {
                const value = requestUrl.searchParams.get(key);
                if (value !== null) canonical.searchParams.set(key, value);
            }
            return new Response(renderCredentialSharePreviewHtml(data, canonical.toString()), {
                status: 200,
                headers: {
                    'content-type': 'text/html; charset=utf-8',
                    'cache-control': 'private, no-store',
                    vary: 'User-Agent',
                },
            });
        } catch {
            return fallback();
        }
    };
