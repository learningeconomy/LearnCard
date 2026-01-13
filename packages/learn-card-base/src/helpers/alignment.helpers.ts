/**
 * Parses a targetUrl to extract framework and skill IDs.
 * Format: https://domain/frameworks/{frameworkId}/skills/{skillId}
 */
export const parseAlignmentUrl = (url?: string): { frameworkId?: string; skillId?: string } => {
    if (!url) return {};

    const urlMatch = url.match(/frameworks\/([^/]+)\/skills\/([^/?]+)/);
    if (urlMatch) {
        return {
            frameworkId: decodeURIComponent(urlMatch[1]),
            skillId: decodeURIComponent(urlMatch[2]),
        };
    }

    return {};
};

/**
 * Enriches an alignment object with frameworkId and targetCode if they can be parsed from the targetUrl.
 */
export const enrichAlignment = <T extends { targetUrl?: string; frameworkId?: string; targetCode?: string }>(
    alignment: T
): T => {
    const { frameworkId, skillId } = parseAlignmentUrl(alignment.targetUrl);

    return {
        ...alignment,
        frameworkId: alignment.frameworkId || frameworkId,
        targetCode: alignment.targetCode || skillId,
    };
};
