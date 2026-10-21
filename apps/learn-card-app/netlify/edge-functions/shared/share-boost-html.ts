export type PublicSharePreview = { name: string; issuer: string; image?: string };

const escapeHtml = (value: string): string =>
    value.replace(
        /[&<>"']/g,
        character =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character]!
    );

/** Render only the explicitly public preview fields and a scrubbed canonical URL. */
export const renderCredentialSharePreviewHtml = (
    preview: PublicSharePreview,
    canonicalUrl: string
): string => {
    const tags = [
        `<title>${escapeHtml(preview.name)}</title>`,
        `<meta name="description" content="${escapeHtml(preview.issuer)}">`,
        `<meta property="og:title" content="${escapeHtml(preview.name)}">`,
        `<meta property="og:description" content="${escapeHtml(preview.issuer)}">`,
        `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
        `<meta name="twitter:card" content="${preview.image ? 'summary_large_image' : 'summary'}">`,
        ...(preview.image
            ? [
                  `<meta property="og:image" content="${escapeHtml(preview.image)}">`,
                  `<meta name="twitter:image" content="${escapeHtml(preview.image)}">`,
              ]
            : []),
    ].join('');
    return `<!doctype html><html><head>${tags}</head><body></body></html>`;
};
