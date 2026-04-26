import React from 'react';
import { ShieldCheck, Globe } from 'lucide-react';

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
 *   - The display name (or URL host as fallback)
 *   - The issuer logo (or a generic globe icon)
 *   - The full issuer URL host as a secondary line for transparency
 *   - A "verified by HTTPS" affordance when the URL is HTTPS
 *
 * This is consciously minimal \u2014 production wallets layer a trust badge on
 * top once they wire to a verifier-trust framework. Until then, the user
 * sees the bare URL so they know who they\u2019re actually trusting.
 */
export const IssuerHeader: React.FC<IssuerHeaderProps> = ({
    issuerUrl,
    display,
    caption = 'Issued by',
}) => {
    const host = safeHost(issuerUrl);
    const isHttps = issuerUrl.startsWith('https://');
    const displayName = display?.name?.trim() || host || issuerUrl;
    const logoUri = display?.logo?.uri;
    const logoAlt = display?.logo?.alt_text || `${displayName} logo`;

    return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-grayscale-10 border border-grayscale-200">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-grayscale-200 overflow-hidden flex items-center justify-center">
                {logoUri ? (
                    <img
                        src={logoUri}
                        alt={logoAlt}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <Globe className="w-6 h-6 text-grayscale-500" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-grayscale-500 mb-0.5">
                    {caption}
                </p>

                <p className="text-base font-semibold text-grayscale-900 truncate">
                    {displayName}
                </p>

                <div className="flex items-center gap-1.5 mt-0.5">
                    {isHttps && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}

                    <p className="text-xs text-grayscale-500 truncate">
                        {host || issuerUrl}
                    </p>
                </div>
            </div>
        </div>
    );
};

const safeHost = (url: string): string | undefined => {
    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
};

export default IssuerHeader;
