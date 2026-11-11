import type { TenantConfig } from 'learn-card-base/src/config/tenantConfigSchema';

/** Shared by deployment preparation and isolated verification frontends. */
export const renderTenantHtml = (template: string, branding: TenantConfig['branding']): string => {
    const escapeHtml = (value: string): string =>
        value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    let html = template.replace(
        /<title>[^<]*<\/title>/,
        () => `<title>${escapeHtml(branding.name)}</title>`
    );
    html = html.replace(
        /(<meta\s+name="apple-mobile-web-app-title"\s+content=")[^"]*(")/,
        (_, prefix: string, suffix: string) =>
            `${prefix}${escapeHtml(branding.shortName ?? branding.name)}${suffix}`
    );
    if (!html.includes('apple-touch-icon')) {
        html = html.replace(
            /(<link rel="shortcut icon"[^>]*>)/,
            '$1\n        <link rel="apple-touch-icon" href="/assets/icon/apple-touch-icon.png" />'
        );
    }
    return html;
};
