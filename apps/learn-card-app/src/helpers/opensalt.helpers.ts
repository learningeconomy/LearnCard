const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const trimSlashes = (value: string): string => value.replace(/\/+$/, '');

export const normalizeOpenSaltUrl = (value?: string | null): string | null => {
    if (!value) return null;
    return trimSlashes(value.trim().toLowerCase());
};

export const extractOpenSaltFrameworkId = (value?: string | null): string | null => {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (UUID_PATTERN.test(trimmed)) return trimmed;

    const withoutTrailingSlash = trimSlashes(trimmed);

    const cfDocumentsMatch = withoutTrailingSlash.match(/\/CFDocuments\/([^/?#]+)/i);
    if (cfDocumentsMatch?.[1]) return decodeURIComponent(cfDocumentsMatch[1]);

    const cftreeDocMatch = withoutTrailingSlash.match(/\/cftree\/doc\/([^/?#]+)/i);
    if (cftreeDocMatch?.[1]) return decodeURIComponent(cftreeDocMatch[1]);

    const cfpackageDocMatch = withoutTrailingSlash.match(/\/cfpackage\/doc\/([^/?#]+)/i);
    if (cfpackageDocMatch?.[1]) {
        return decodeURIComponent(cfpackageDocMatch[1].replace(/\.json$/i, ''));
    }

    const uriPackageMatch = withoutTrailingSlash.match(/\/uri\/p([^/?#]+)/i);
    if (uriPackageMatch?.[1]) return decodeURIComponent(uriPackageMatch[1]);

    const uriObjectMatch = withoutTrailingSlash.match(/\/uri\/([^/?#]+)/i);
    if (uriObjectMatch?.[1]) return decodeURIComponent(uriObjectMatch[1]);

    return null;
};

export const isOpenSaltRef = (value?: string | null): boolean => {
    if (!value) return false;

    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;

    return (
        normalized.includes('opensalt.') ||
        normalized.includes('/ims/case/v1p0/cfdocuments/') ||
        normalized.includes('/cftree/doc/') ||
        normalized.includes('/cfpackage/doc/') ||
        normalized.includes('/uri/p') ||
        normalized.includes('/uri/')
    );
};

export const isOpenSaltFramework = (framework: { id: string; sourceURI?: string }): boolean => {
    if (isOpenSaltRef(framework.sourceURI)) return true;
    return false;
};

export const isFrameworkAllowedByOpenSaltAllowlist = (
    framework: { id: string; sourceURI?: string },
    allowlist?: string[]
): boolean => {
    if (!allowlist || allowlist.length === 0) return true;

    const frameworkId = framework.id;
    const frameworkSource = normalizeOpenSaltUrl(framework.sourceURI);
    const frameworkSourceId = extractOpenSaltFrameworkId(framework.sourceURI);

    for (const rawEntry of allowlist) {
        const entry = rawEntry?.trim();
        if (!entry) continue;

        if (entry === frameworkId) return true;

        const entryId = extractOpenSaltFrameworkId(entry);
        if (entryId && entryId === frameworkId) return true;

        if (entryId && frameworkSourceId && entryId === frameworkSourceId) return true;

        const entryUrl = normalizeOpenSaltUrl(entry);
        if (entryUrl && frameworkSource && entryUrl === frameworkSource) return true;
    }

    return false;
};
