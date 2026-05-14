import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

import {
    avatarGradient,
    extractDomain,
    faviconUrl,
} from '../displayHelpers';

export interface CredentialPreviewClaim {
    /** Human label for the claim (e.g. "Full Name"). */
    label: string;
    /**
     * Concrete claim value when known (post-issuance). When omitted on
     * a pre-issuance preview, we render a dashed placeholder line so
     * the user understands "this credential will contain this field,
     * but the value is set when you accept".
     */
    value?: string;
}

export interface CredentialPreviewCardProps {
    /** Prettified credential title, e.g. "University Degree". */
    title: string;
    /** Optional one-line description from the issuer's metadata. */
    description?: string;
    /**
     * Pre-issuance: list of claim labels the credential will contain,
     * with no values. Post-issuance: same labels plus actual values.
     * Omit entirely when no claim metadata is available \u2014 the card
     * still renders a tasteful "this credential is on its way" state.
     */
    claims?: CredentialPreviewClaim[];
    /**
     * The issuer's `credential_issuer` URL or display URL. Used for
     * the avatar fallback chain (favicon \u2192 gradient initials) when
     * `issuerLogoUri` is absent.
     */
    issuerUrl: string;
    /** Issuer display name; falls back to the URL host. */
    issuerName?: string;
    /** Branded logo URI from `metadata.display.logo.uri`. */
    issuerLogoUri?: string;
    /**
     * When true, render a small "Saved" pill in the top-right of the
     * card. Used by the post-issuance success screen to differentiate
     * from the pre-issuance preview.
     */
    showSaved?: boolean;
}

/**
 * Compact credential preview rendered inside the consent + finished
 * screens. Goal: give the user **a real sense of what's about to land
 * (or just landed) in their wallet** before they commit \u2014 the digital
 * equivalent of seeing the diploma before signing for it.
 *
 * Visual: gradient header keyed deterministically by issuer domain
 * (so the same issuer always looks the same), with the issuer's
 * favicon / logo / initials avatar overlaid; below it, the credential
 * title + description + claim labels.
 *
 * Deliberately avoids any value comparison with the wallet's full
 * `VCDisplayCard2` \u2014 this is a *preview* meant to set expectations,
 * not the canonical full render.
 */
const CredentialPreviewCard: React.FC<CredentialPreviewCardProps> = ({
    title,
    description,
    claims,
    issuerUrl,
    issuerName,
    issuerLogoUri,
    showSaved = false,
}) => {
    const domain = extractDomain(issuerUrl);
    const seed = domain ?? issuerUrl;
    const gradient = avatarGradient(seed);
    const fallbackFavicon = faviconUrl(domain, 64);

    const displayedIssuerName =
        issuerName?.trim()
        || domain
        || issuerUrl;

    return (
        <div className="rounded-2xl overflow-hidden border border-grayscale-200 shadow-sm bg-white">
            {/* Brand band \u2014 gradient keyed to issuer domain. The header
                has a fixed height so cards line up across the consent
                + finished screens, regardless of branding presence. */}
            <div
                className="relative h-20 flex items-center px-4"
                style={{ background: gradient.background }}
            >
                <IssuerAvatar
                    logoUri={issuerLogoUri}
                    fallbackFavicon={fallbackFavicon}
                    initials={gradient.initials}
                    altText={displayedIssuerName}
                />

                <div className="ml-3 min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-white/80">
                        Issued by
                    </p>

                    <p className="text-sm font-semibold text-white truncate">
                        {displayedIssuerName}
                    </p>
                </div>

                {showSaved ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        <ShieldCheck className="w-3 h-3" />
                        Saved
                    </span>
                ) : (
                    <Award
                        className="ml-2 w-5 h-5 text-white/80"
                        aria-hidden="true"
                    />
                )}
            </div>

            <div className="px-4 py-4 space-y-3">
                <div>
                    <h2 className="text-base font-semibold text-grayscale-900 leading-snug">
                        {title}
                    </h2>

                    {description && (
                        <p className="text-xs text-grayscale-500 leading-relaxed mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                </div>

                {claims && claims.length > 0 && (
                    <ClaimList claims={claims} />
                )}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                avatar chain                                */
/* -------------------------------------------------------------------------- */

interface IssuerAvatarProps {
    logoUri: string | undefined;
    fallbackFavicon: string | undefined;
    initials: string;
    altText: string;
}

/**
 * Three-tier avatar fallback:
 *   1. Issuer-provided `metadata.display.logo.uri` (the brand asset)
 *   2. Google s2 favicon for the domain (gives any HTTPS issuer a
 *      passable identity even without metadata)
 *   3. Gradient + initials tile (deterministic from domain)
 *
 * The component starts at tier 1 if a logo URI is present, falls
 * through on `onError`. We track the active tier in state because
 * `<img onError>` doesn't compose with `<img src=fallback>` cleanly
 * \u2014 we need a re-render with a new src to retry.
 */
const IssuerAvatar: React.FC<IssuerAvatarProps> = ({
    logoUri,
    fallbackFavicon,
    initials,
    altText,
}) => {
    const [tier, setTier] = React.useState<0 | 1 | 2>(() => {
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
        return (
            <div className="shrink-0 w-10 h-10 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center">
                <span className="text-sm font-bold text-grayscale-900">
                    {initials}
                </span>
            </div>
        );
    }

    const src = tier === 0 ? logoUri : fallbackFavicon;
    if (!src) {
        return (
            <div className="shrink-0 w-10 h-10 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center">
                <span className="text-sm font-bold text-grayscale-900">
                    {initials}
                </span>
            </div>
        );
    }

    return (
        <div className="shrink-0 w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center">
            <img
                src={src}
                alt={`${altText} logo`}
                className="w-full h-full object-contain"
                onError={handleError}
            />
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                 claim list                                 */
/* -------------------------------------------------------------------------- */

const ClaimList: React.FC<{ claims: CredentialPreviewClaim[] }> = ({ claims }) => (
    <dl className="grid grid-cols-1 gap-y-1.5">
        {claims.slice(0, 4).map((claim, i) => (
            <div
                key={`${claim.label}-${i}`}
                className="flex items-baseline gap-3"
            >
                <dt className="text-[11px] font-medium uppercase tracking-wide text-grayscale-500 shrink-0 min-w-[88px]">
                    {claim.label}
                </dt>

                <dd className="text-xs text-grayscale-900 truncate flex-1">
                    {claim.value ? (
                        claim.value
                    ) : (
                        <span
                            aria-label="To be filled in by the issuer"
                            className="inline-block w-16 h-1 rounded-full bg-grayscale-200 align-middle"
                        />
                    )}
                </dd>
            </div>
        ))}

        {claims.length > 4 && (
            <p className="text-[11px] text-grayscale-400 italic">
                +{claims.length - 4} more
            </p>
        )}
    </dl>
);

export default CredentialPreviewCard;
