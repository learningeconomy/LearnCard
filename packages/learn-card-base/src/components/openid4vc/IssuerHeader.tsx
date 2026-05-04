import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * The subset of `CredentialIssuerMetadata` (from `@learncard/openid4vc-plugin`)
 * we actually render. Kept inline so this component can be used both with
 * fully-typed metadata and with hand-built objects in tests / storybooks.
 */
export interface IssuerDisplayInfo {
    /** Localized display name. Falls back to the issuer URL host. */
    name?: string;
    /** Logo URI (full absolute URL). */
    logo?: { uri?: string; alt_text?: string };
    /** Optional locale tag (`en`, `en-US`, etc.). */
    locale?: string;
}

export interface IssuerHeaderProps {
    /** The `credential_issuer` URL from the offer (or any HTTPS URL). */
    issuerUrl: string;
    /**
     * Pre-resolved display info, typically the first entry of
     * `metadata.display`. When omitted, we fall back to the URL host.
     */
    display?: IssuerDisplayInfo;
    /** Optional caption above the issuer name. Defaults to "Issued by". */
    caption?: string;
}

/**
 * Compact issuer-identity card for OID4VCI consent screens. Renders:
 *   - A three-tier avatar (issuer logo → favicon → gradient initials)
 *   - The display name (or URL host as fallback)
 *   - The full issuer URL host as a secondary line for transparency,
 *     auto-deduplicated when the display name and host are the same
 *   - An HTTPS shield when the issuer URL is HTTPS
 *
 * The avatar fallback chain is the single biggest trust signal we
 * have when an issuer doesn't ship branded metadata. A globe icon
 * for `localhost:7002` reads as sketchy; a colored gradient with the
 * letter "L" reads as deliberate. Production-grade wallets layer a
 * trust badge on top once a verifier-trust framework lands; until
 * then, the user sees the host so they know who they’re trusting.
 */
export const IssuerHeader: React.FC<IssuerHeaderProps> = ({
    issuerUrl,
    display,
    caption = 'Issued by',
}) => {
    const host = safeHost(issuerUrl);
    const isHttps = issuerUrl.startsWith('https://');
    const displayName = display?.name?.trim() || host || issuerUrl;
    const showHostRow = displayName !== host && displayName !== issuerUrl;
    const logoUri = display?.logo?.uri;
    const logoAlt = display?.logo?.alt_text || `${displayName} logo`;

    return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-grayscale-10 border border-grayscale-200">
            <IssuerAvatar
                logoUri={logoUri}
                domain={host}
                seed={host || issuerUrl}
                altText={logoAlt}
            />

            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-grayscale-500 mb-0.5">
                    {caption}
                </p>

                <p className="text-base font-semibold text-grayscale-900 truncate">
                    {displayName}
                </p>

                {(showHostRow || isHttps) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {isHttps && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}

                        {showHostRow && (
                            <p className="text-xs text-grayscale-500 truncate">
                                {host || issuerUrl}
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

interface IssuerAvatarProps {
    logoUri?: string;
    domain?: string;
    seed: string;
    altText: string;
}

/**
 * Avatar fallback chain:
 *   1. Issuer's branded `metadata.display.logo.uri`
 *   2. Google s2 favicon for the domain (works for any HTTPS issuer)
 *   3. Deterministic gradient + initials tile (Slack-style)
 *
 * The component tracks the active tier in state so `<img onError>`
 * can advance the chain without a re-mount.
 */
const IssuerAvatar: React.FC<IssuerAvatarProps> = ({
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

/**
 * Deterministic two-color gradient + initials fallback. Inlined here
 * (instead of importing from learn-card-app's display helpers) so
 * `learn-card-base` stays self-contained.
 */
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

export default IssuerHeader;
