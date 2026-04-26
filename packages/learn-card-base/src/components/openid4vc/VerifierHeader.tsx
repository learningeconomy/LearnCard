import React from 'react';
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

    return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-grayscale-10 border border-grayscale-200">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-grayscale-200 overflow-hidden flex items-center justify-center">
                {display?.logoUri ? (
                    <img
                        src={display.logoUri}
                        alt={`${displayName} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <Eye className="w-6 h-6 text-grayscale-500" />
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
                    {showHttpsAffordance && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}

                    <p className="text-xs text-grayscale-500 truncate">
                        {host || clientId}
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

export default VerifierHeader;
