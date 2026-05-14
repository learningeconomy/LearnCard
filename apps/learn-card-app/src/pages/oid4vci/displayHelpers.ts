/**
 * Display-time helpers shared across the OID4VCI consent / finished /
 * storing screens. These exist to **kill the engineering smell** that
 * otherwise leaks through the wallet UI \u2014 raw configuration ids like
 * `UniversityDegree_jwt_vc_json`, format slugs like `dc+sd-jwt`, and
 * generic globe icons whenever an issuer doesn't ship branded metadata.
 *
 * Every function here is a pure transform on strings or simple data
 * \u2014 no React, no plugin imports \u2014 so they're trivially unit-testable
 * and safe to use in any phase component.
 */

/* -------------------------------------------------------------------------- */
/*                          credential id prettifier                          */
/* -------------------------------------------------------------------------- */

/**
 * Strip OID4VCI format suffixes from a credential configuration id and
 * format it as a human title. The plugin gives us ids like:
 *
 *   - `UniversityDegree_jwt_vc_json`
 *   - `eu.europa.ec.eudi.diploma_vc_sd_jwt`
 *   - `pid_mso_mdoc`
 *
 * Issuers SHOULD ship a `display.name` in their metadata. When they
 * don't (walt.id frequently doesn't, custom dev issuers rarely do),
 * we fall back to this function so end users never see the raw slug.
 *
 * Algorithm:
 *   1. If the issuer-provided display name is non-empty, prefer that.
 *   2. Otherwise, take the *last* dot-segment of the id (drops EUDI's
 *      `eu.europa.ec.eudi.` prefix).
 *   3. Strip known format suffixes (`_jwt_vc_json`, `_vc_sd_jwt`, etc.).
 *   4. Convert snake_case + camelCase \u2192 Title Case.
 *
 * Returns the original id unchanged if the result would be empty
 * (better to show something engineering-y than nothing).
 */
export const prettifyConfigurationId = (
    configurationId: string,
    options?: { displayName?: string | null | undefined }
): string => {
    if (
        options?.displayName
        && typeof options.displayName === 'string'
        && options.displayName.trim().length > 0
    ) {
        return options.displayName.trim();
    }

    if (!configurationId) return configurationId;

    // Drop a namespace prefix like `eu.europa.ec.eudi.` so the last
    // segment carries the meaning. We only strip when there's a dot
    // so single-segment ids like `UniversityDegree_jwt_vc_json` are
    // left whole.
    const lastSegment = configurationId.includes('.')
        ? configurationId.split('.').pop() ?? configurationId
        : configurationId;

    // Strip OID4VCI format suffixes. These are almost always the
    // *trailing* tokens of the id; we don't try to be clever about
    // the middle.
    const formatSuffixes = [
        '_jwt_vc_json-ld',
        '_jwt_vc_json',
        '_vc_sd_jwt',
        '_vc+sd-jwt',
        '_dc+sd-jwt',
        '_sd_jwt_vc',
        '_mso_mdoc',
        '_mdoc',
        '_ldp_vc',
        '_jwt_vc',
    ];

    let core = lastSegment;
    for (const suffix of formatSuffixes) {
        if (core.toLowerCase().endsWith(suffix)) {
            core = core.slice(0, -suffix.length);
            break;
        }
    }

    if (core.length === 0) return configurationId;

    // Insert a space before any uppercase letter that follows a
    // lowercase letter or digit (camelCase \u2192 camel Case), then
    // replace separators (_ - .) with spaces, collapse, and
    // Title-Case each word.
    const spaced = core
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (spaced.length === 0) return configurationId;

    // Title-case while preserving acronyms that were already all-caps
    // (e.g. "PID" stays "PID", not "Pid").
    return spaced
        .split(' ')
        .map(word => {
            if (word.length === 0) return word;
            // Heuristic: if the word is 2-4 chars and all-uppercase,
            // it's an acronym \u2014 leave it.
            if (word.length <= 4 && word === word.toUpperCase()) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

/* -------------------------------------------------------------------------- */
/*                           format \u2192 human label                            */
/* -------------------------------------------------------------------------- */

/**
 * Map an OID4VCI format string to a short human label suitable for a
 * "Details" disclosure. Returns `undefined` when the format isn't
 * recognized so callers can hide the line entirely (better than
 * leaking the raw slug).
 */
export const humanizeFormat = (format: string | undefined): string | undefined => {
    if (!format) return undefined;
    switch (format.toLowerCase()) {
        case 'jwt_vc_json':
        case 'jwt_vc':
            return 'JWT-VC';
        case 'jwt_vc_json-ld':
            return 'JWT-VC (JSON-LD)';
        case 'ldp_vc':
            return 'JSON-LD VC';
        case 'vc+sd-jwt':
        case 'dc+sd-jwt':
        case 'sd_jwt_vc':
            return 'SD-JWT VC';
        case 'mso_mdoc':
        case 'mdoc':
            return 'Mobile Document';
        default:
            return undefined;
    }
};

/* -------------------------------------------------------------------------- */
/*                           issuer-avatar fallbacks                          */
/* -------------------------------------------------------------------------- */

/**
 * Hostname extraction safe against malformed URLs. Returns `undefined`
 * when the URL can't be parsed so callers can skip rendering the
 * affected affordance instead of crashing.
 */
export const extractDomain = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
};

/**
 * Return a Google s2 favicon URL for a given domain. Used as the
 * **second** fallback in the issuer-avatar chain (after metadata
 * `display.logo.uri`, before the gradient initials avatar).
 *
 * We deliberately use the s2 endpoint instead of the hosted
 * `/favicon.ico` because:
 *   1. It rasterizes regardless of the issuer's icon format
 *   2. It serves at a requested size (no scaling artifacts)
 *   3. It tolerates issuers that don't host a favicon at all (returns
 *      a neutral globe \u2014 same as our final fallback would do)
 *   4. It bypasses the cross-origin/CORB issues you hit reading
 *      `<link rel="icon">` from a third-party HTML response
 */
export const faviconUrl = (
    domain: string | undefined,
    sizePx = 128
): string | undefined => {
    if (!domain) return undefined;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        domain
    )}&sz=${sizePx}`;
};

/**
 * Deterministic two-color gradient + initials avatar fallback used
 * when no logo or favicon resolves. Inspired by Slack workspace
 * avatars and Linear assignee avatars \u2014 a colored tile keyed by the
 * domain hash so the same issuer always gets the same colors.
 *
 * Returns inline-style values rather than Tailwind classes because
 * Tailwind's JIT can't statically infer dynamic class names.
 */
export const avatarGradient = (
    seed: string | undefined
): { background: string; initials: string } => {
    if (!seed || seed.length === 0) {
        return {
            background: 'linear-gradient(135deg, #8B91A7 0%, #6F7590 100%)',
            initials: '?',
        };
    }

    const hash = stringHash(seed);
    // Two complementary hues, 40\u00b0 apart, with controlled saturation +
    // lightness so the result reads as branded but never neon.
    const hueA = hash % 360;
    const hueB = (hueA + 40) % 360;
    const colorA = `hsl(${hueA}, 62%, 52%)`;
    const colorB = `hsl(${hueB}, 58%, 42%)`;

    const initials = computeInitials(seed);

    return {
        background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`,
        initials,
    };
};

const stringHash = (s: string): number => {
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) {
        h = ((h << 5) + h) + s.charCodeAt(i);
        h = h | 0;
    }
    return Math.abs(h);
};

const computeInitials = (seed: string): string => {
    // For a domain like `issuer.eudiw.dev`, take the first letter of
    // the SLD ("e"). For `localhost`, fall back to "L".
    const cleaned = seed.replace(/^https?:\/\//, '').split(/[/.:]/).filter(Boolean);
    if (cleaned.length === 0) return seed[0]?.toUpperCase() ?? '?';

    // Prefer the second-to-last label (the SLD). For `eudiw.dev`,
    // that's "eudiw"; for `localhost:7002`, falls back to "localhost".
    const sld =
        cleaned.length >= 2
            ? cleaned[cleaned.length - 2]
            : cleaned[0];

    return (sld[0] ?? '?').toUpperCase();
};
