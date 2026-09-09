/**
 * Options for sanitizeImageUrl
 */
export type SanitizeImageUrlOptions = {
    /**
     * Allow blob: URLs (e.g., from URL.createObjectURL for local file previews).
     * Default: false
     */
    allowBlobUrls?: boolean;
};

/**
 * Sanitizes an image URL to prevent XSS via javascript: or other malicious URL schemes.
 * Only allows http: and https: protocols by default.
 * Optionally allows blob: URLs for local file preview scenarios.
 *
 * @param url - The URL to sanitize
 * @param options - Optional configuration
 * @returns The sanitized URL, or undefined if the URL is invalid or uses a disallowed protocol
 */
export const sanitizeImageUrl = (
    url: string | undefined,
    options: SanitizeImageUrlOptions = {}
): string | undefined => {
    if (!url) return undefined;

    const { allowBlobUrls = false } = options;

    try {
        const parsed = new URL(url);

        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return parsed.href;
        }

        if (allowBlobUrls && parsed.protocol === 'blob:') {
            return parsed.href;
        }

        return undefined;
    } catch {
        return undefined;
    }
};
