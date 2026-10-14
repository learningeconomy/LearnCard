/**
 * Hosts used only for AI app-builder editor previews, never for published apps.
 * Published namespaces (`*.lovable.app`, `*.vercel.app`, `*.replit.app`,
 * `*.bolt.host`, `*.csb.app`) are deliberately absent: real users open apps there.
 */
const PREVIEW_HOST_SUFFIXES = [
    '.lovableproject.com', // Lovable editor sandbox
    '.webcontainer-api.io', // Bolt.new / StackBlitz WebContainers
    '.replit.dev', // Replit development URLs (deployments use .replit.app)
    '.vusercontent.net', // v0 generated previews (deployments use .vercel.app)
] as const;

/** Lovable shares `*.lovable.app` with published apps; only this prefix marks a preview. */
const LOVABLE_PREVIEW_PREFIX = 'id-preview--';
const LOVABLE_APP_SUFFIX = '.lovable.app';

const EDITOR_HOSTS = [
    'lovable.dev',
    'bolt.new',
    'stackblitz.com',
    'v0.dev',
    'v0.app',
    'replit.com',
] as const;

/** Whether a hostname belongs to an app builder's editor preview rather than a published app. */
export const isAppBuilderPreviewHost = (hostname: string): boolean => {
    const host = hostname.toLowerCase();

    if (host.startsWith(LOVABLE_PREVIEW_PREFIX) && host.endsWith(LOVABLE_APP_SUFFIX)) {
        return true;
    }

    return PREVIEW_HOST_SUFFIXES.some(suffix => host.endsWith(suffix));
};

/** Whether an origin is an app builder's editor, i.e. the frame around an app being built. */
export const isAppBuilderEditorOrigin = (origin: string): boolean => {
    try {
        const { protocol, hostname } = new URL(origin);
        if (protocol !== 'https:') return false;

        const host = hostname.toLowerCase().replace(/^www\./, '');
        return (EDITOR_HOSTS as readonly string[]).includes(host);
    } catch {
        return false;
    }
};
