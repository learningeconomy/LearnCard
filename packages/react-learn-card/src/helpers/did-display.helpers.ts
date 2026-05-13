/**
 * DID display utilities for credential cards.
 *
 * Converts raw DID strings into human-friendly display names, avatar letters,
 * and deterministic avatar colors so that credential cards always look polished
 * regardless of the data shape.
 */

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** Returns true when the string looks like a DID (starts with "did:"). */
export const isDid = (str: string): boolean => /^did:/i.test(str);

const LC_NETWORK_USER_RE = /^did:web:network\.learncard\.com:users:(.+)$/i;

/** Returns true when the DID belongs to a LearnCard Network user. */
export const isLearnCardNetworkDid = (did: string): boolean => LC_NETWORK_USER_RE.test(did);

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

/**
 * Converts a DID into a short, user-friendly display string.
 *
 * | Input                                              | Output          |
 * |----------------------------------------------------|-----------------|
 * | `did:web:network.learncard.com:users:donny`        | `donny`         |
 * | `did:web:example.com`                              | `example.com`   |
 * | `did:key:z6Mku1yR3226QyTfM…CUSsYuoPb48Uyw`        | `z6Mk…8Uyw`     |
 * | `did:jwk:eyJrdHkiOiJPS1Ai…`                        | `eyJr…XVQQ`     |
 * | (empty / falsy)                                     | `""`            |
 */
export const formatDidDisplayName = (did: string): string => {
    if (!did) return '';

    const lcMatch = did.match(LC_NETWORK_USER_RE);
    if (lcMatch) return lcMatch[1]; // username segment

    const parts = did.split(':');
    if (parts[0] !== 'did' || parts.length < 3) return did;

    const method = parts[1];

    if (method === 'web') {
        // did:web segments after `did:web:` use ":" as a path separator
        return parts.slice(2).join('.');
    }

    // key / jwk / other — show a short fingerprint
    const material = parts.slice(2).join(':');
    if (material.length > 12) {
        return `${material.slice(0, 4)}…${material.slice(-4)}`;
    }
    return material;
};

// ---------------------------------------------------------------------------
// Avatar letter
// ---------------------------------------------------------------------------

/**
 * Picks a meaningful single character to display inside an avatar circle.
 *
 * - LearnCard Network DID  → first letter of the username segment
 * - did:web                → first letter of the domain
 * - did:key / did:jwk      → first letter of the key material
 * - empty / no useful data → empty string (caller should show an icon instead)
 */
export const getAvatarLetterFromDid = (did: string): string => {
    if (!did) return '';

    const lcMatch = did.match(LC_NETWORK_USER_RE);
    if (lcMatch) return lcMatch[1][0] ?? '';

    const parts = did.split(':');
    if (parts[0] !== 'did' || parts.length < 3) return did[0] ?? '';

    const method = parts[1];

    if (method === 'web') {
        // First char of the domain / first path segment
        return (parts[2] ?? '')[0] ?? '';
    }

    // key / jwk — first char of the raw key material
    return (parts[2] ?? '')[0] ?? '';
};

// ---------------------------------------------------------------------------
// Avatar color
// ---------------------------------------------------------------------------

const AVATAR_PALETTE = [
    'bg-indigo-600',
    'bg-emerald-700',
    'bg-cyan-800',
    'bg-spice-600',
    'bg-indigo-700',
    'bg-emerald-600',
] as const;

/**
 * Returns a deterministic Tailwind background-color class derived from a
 * string hash so that different entities get visually distinct avatars.
 */
export const getAvatarColorFromString = (str: string): string => {
    if (!str) return 'bg-grayscale-600';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

// ---------------------------------------------------------------------------
// Composite helper — resolve "display name" for a Profile-or-string value
// ---------------------------------------------------------------------------

/**
 * Given a Profile (object or string) that may be a DID, a name, or empty,
 * returns `{ displayName, avatarLetter, avatarColor, isDid, isLCNetwork }`.
 *
 * This is the single entry-point most components should use.
 */
export const resolveProfileDisplay = (
    profile: any,
    fallbackLabel: string
): {
    displayName: string;
    avatarLetter: string;
    avatarColor: string;
    isMissing: boolean;
    isDidValue: boolean;
    isLCNetwork: boolean;
} => {
    // 1. Extract raw name string
    let rawName = '';
    let rawId = '';
    if (typeof profile === 'string') {
        rawName = profile; // could be a DID or a plain name
    } else if (profile && typeof profile === 'object') {
        rawName = profile.name || profile.displayName || '';
        rawId = profile.id || '';
    }

    // 2. If we have a human-readable name, use it directly
    if (rawName && !isDid(rawName)) {
        return {
            displayName: rawName,
            avatarLetter: rawName[0] ?? '',
            avatarColor: getAvatarColorFromString(rawName),
            isMissing: false,
            isDidValue: false,
            isLCNetwork: false,
        };
    }

    // 3. We have a DID (either as the name or the id)
    const didStr = isDid(rawName) ? rawName : rawId;
    if (didStr && isDid(didStr)) {
        const lcNetwork = isLearnCardNetworkDid(didStr);
        return {
            displayName: formatDidDisplayName(didStr),
            avatarLetter: getAvatarLetterFromDid(didStr),
            avatarColor: getAvatarColorFromString(didStr),
            isMissing: false,
            isDidValue: !lcNetwork,
            isLCNetwork: lcNetwork,
        };
    }

    // 4. Completely missing — use the fallback label
    return {
        displayName: fallbackLabel,
        avatarLetter: '',
        avatarColor: 'bg-grayscale-600',
        isMissing: true,
        isDidValue: false,
        isLCNetwork: false,
    };
};
