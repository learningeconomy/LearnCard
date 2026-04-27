import React, { useState } from 'react';
import { ShieldCheck, Eye } from 'lucide-react';

/**
 * Subset of OID4VP `client_metadata` we render on the consent screen.
 * Verifier metadata fields are loosely-typed in the spec (each verifier
 * can extend); we accept a forgiving shape and pull just what we display.
 */
export interface VerifierDisplayInfo {
    /** Human-readable verifier name (`client_metadata.client_name`). */
    name?: string;
    /** Logo URI (`client_metadata.logo_uri` or `client_metadata.client_logo`). */
    logoUri?: string;
    /** Verifier-supplied policy URL. */
    policyUri?: string;
    /** Verifier-supplied terms-of-service URL. */
    tosUri?: string;
}

export interface VerifierHeaderProps {
    /**
     * The `client_id` from the Authorization Request. Often a URL whose
     * host we display; for `did:` / opaque schemes we render verbatim.
     */
    clientId: string;

    /**
     * Verifier identity scheme from the request. Currently only used to
     * decide whether to render an HTTPS affordance \u2014 `redirect_uri` and
     * `x509_san_dns` schemes use HTTPS URLs as the `client_id`, while
     * `did` / `pre-registered` do not.
     */
    clientIdScheme?: string;

    /**
     * Pre-resolved display info, typically extracted from
     * `client_metadata`. When omitted, we fall back to the URL host (or
     * the raw `client_id` when it isn\u2019t a URL).
     */
    display?: VerifierDisplayInfo;

    /** Optional caption above the verifier name. Defaults to "Requested by". */
    caption?: string;
}

/**
 * Compact verifier-identity card for OID4VP consent screens. Sibling to
 * {@link IssuerHeader} \u2014 same visual language, swapped iconography.
 */
export const VerifierHeader: React.FC<VerifierHeaderProps> = ({
    clientId,
    clientIdScheme,
    display,
    caption = 'Requested by',
}) => {
    const host = safeHost(clientId);
    const isHttps = clientId.startsWith('https://');
    const displayName = display?.name?.trim() || host || clientId;
    const showHttpsAffordance =
        isHttps
        && (!clientIdScheme || clientIdScheme === 'redirect_uri' || clientIdScheme.startsWith('x509'));

    const showHostRow = displayName !== host && displayName !== clientId;

    return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-grayscale-10 border border-grayscale-200">
            <VerifierAvatar
                logoUri={display?.logoUri}
                domain={host}
                seed={host || clientId}
                altText={`${displayName} logo`}
            />

            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-grayscale-500 mb-0.5">
                    {caption}
                </p>

                <p className="text-base font-semibold text-grayscale-900 truncate">
                    {displayName}
                </p>

                {(showHostRow || showHttpsAffordance) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {showHttpsAffordance && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}

                        {showHostRow && (
                            <p className="text-xs text-grayscale-500 truncate">
                                {host || clientId}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                          three-tier avatar chain                           */
/* -------------------------------------------------------------------------- */

interface VerifierAvatarProps {
    logoUri?: string;
    domain?: string;
    seed: string;
    altText: string;
}

/**
 * Three-tier verifier avatar (logo → favicon → gradient initials).
 * Mirrors the IssuerHeader chain so OID4VCI and OID4VP consent
 * screens have identical trust affordances. The fallback `Eye` icon
 * is reserved for non-URL `client_id`s like opaque DID schemes,
 * where no domain favicon makes sense.
 */
const VerifierAvatar: React.FC<VerifierAvatarProps> = ({
    logoUri,
    domain,
    seed,
    altText,
}) => {
    const fallbackFavicon = domain
        ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
        : undefined;

    const [tier, setTier] = useState<0 | 1 | 2>(() => {
        if (logoUri) return 0;
        if (fallbackFavicon) return 1;
        return 2;
    });

    const handleError = () => {
        setTier(prev => {
            if (prev === 0 && fallbackFavicon) return 1;
            return 2;
        });
    };

    if (tier === 2) {
        if (!domain) {
            // Opaque (non-URL) client_id — no meaningful host or
            // favicon, so render the neutral Eye glyph rather than a
            // hash-derived gradient that misleadingly suggests
            // "I know this verifier".
            return (
                <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-grayscale-200 overflow-hidden flex items-center justify-center">
                    <Eye className="w-6 h-6 text-grayscale-500" />
                </div>
            );
        }
        const { background, initials } = avatarGradient(seed);
        return (
            <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background }}
            >
                <span className="text-base font-bold text-white">{initials}</span>
            </div>
        );
    }

    const src = tier === 0 ? logoUri : fallbackFavicon;
    if (!src) {
        return (
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-grayscale-200 overflow-hidden flex items-center justify-center">
                <Eye className="w-6 h-6 text-grayscale-500" />
            </div>
        );
    }

    return (
        <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-grayscale-200 overflow-hidden flex items-center justify-center">
            <img
                src={src}
                alt={altText}
                className="w-full h-full object-contain"
                onError={handleError}
            />
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

const safeHost = (url: string): string | undefined => {
    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
};

const avatarGradient = (
    seed: string
): { background: string; initials: string } => {
    if (!seed) {
        return {
            background: 'linear-gradient(135deg, #8B91A7 0%, #6F7590 100%)',
            initials: '?',
        };
    }
    let h = 5381;
    for (let i = 0; i < seed.length; i += 1) {
        h = ((h << 5) + h) + seed.charCodeAt(i);
        h = h | 0;
    }
    const hash = Math.abs(h);
    const hueA = hash % 360;
    const hueB = (hueA + 40) % 360;

    const cleaned = seed.replace(/^https?:\/\//, '').split(/[/.:]/).filter(Boolean);
    const sld =
        cleaned.length >= 2
            ? cleaned[cleaned.length - 2]
            : cleaned[0] ?? seed;
    const initials = (sld[0] ?? '?').toUpperCase();

    return {
        background: `linear-gradient(135deg, hsl(${hueA}, 62%, 52%) 0%, hsl(${hueB}, 58%, 42%) 100%)`,
        initials,
    };
};

export default VerifierHeader;
