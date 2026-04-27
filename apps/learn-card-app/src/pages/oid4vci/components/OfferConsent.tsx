import React, { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

import { IssuerHeader } from 'learn-card-base';

import type {
    CredentialOffer,
    CredentialIssuerMetadata,
    TxCode,
} from '@learncard/openid4vc-plugin';

import {
    humanizeFormat,
    prettifyConfigurationId,
} from '../displayHelpers';
import CredentialPreviewCard, {
    type CredentialPreviewClaim,
} from './CredentialPreviewCard';
import FlowSteps from './FlowSteps';
import WhatIsACredential from './WhatIsACredential';

export interface OfferConsentProps {
    offer: CredentialOffer;

    /**
     * Optional issuer metadata fetched from
     * `${credential_issuer}/.well-known/openid-credential-issuer`. When
     * provided, we use it to render display names + logos. When omitted,
     * we fall back to showing raw configuration ids and the issuer host.
     */
    metadata?: CredentialIssuerMetadata;

    /**
     * Called with the optional `txCode` value when the user clicks
     * "Accept and continue". The parent component drives the actual
     * acceptance + storage flow.
     */
    onAccept: (params: { txCode?: string }) => void;

    onCancel: () => void;
}

const PRE_AUTH_GRANT_KEY = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';

/**
 * Consent screen for an incoming OpenID4VCI credential offer. Shows the
 * issuer's identity, the credentials being offered, and (when required)
 * a transaction-code input. Only after the user explicitly clicks
 * "Accept and continue" does the parent kick off the issuance flow.
 */
const OfferConsent: React.FC<OfferConsentProps> = ({
    offer,
    metadata,
    onAccept,
    onCancel,
}) => {
    const txCodeSpec = useMemo(
        () => offer.grants?.[PRE_AUTH_GRANT_KEY]?.tx_code,
        [offer]
    );

    const isAuthCodeOnly = useMemo(() => {
        const hasPreAuth = Boolean(offer.grants?.[PRE_AUTH_GRANT_KEY]);
        const hasAuthCode = Boolean(offer.grants?.authorization_code);
        return hasAuthCode && !hasPreAuth;
    }, [offer]);

    const [txCode, setTxCode] = useState('');

    const txCodeRequired = Boolean(txCodeSpec);
    const txCodeValid = !txCodeRequired || txCode.trim().length > 0
        ? true
        : false;

    const issuerDisplay = useMemo(() => {
        const display = pickFirstDisplay(
            (metadata as { display?: unknown[] } | undefined)?.display
        );
        return display
            ? {
                  name: typeof display.name === 'string' ? display.name : undefined,
                  logo:
                      display.logo && typeof display.logo === 'object'
                          ? {
                                uri: stringField(display.logo, 'uri'),
                                alt_text: stringField(display.logo, 'alt_text'),
                            }
                          : undefined,
                  locale: stringField(display, 'locale'),
              }
            : undefined;
    }, [metadata]);

    const credentialItems = useMemo(
        () => describeCredentials(offer, metadata),
        [offer, metadata]
    );

    const issuerDisplayName = issuerDisplay?.name?.trim();

    const headlineLead = issuerDisplayName
        ? `${issuerDisplayName} wants to add`
        : 'An issuer wants to add';

    const credentialNoun =
        credentialItems.length === 1
            ? credentialItems[0].title.toLowerCase().includes('credential')
                ? credentialItems[0].title
                : `your ${credentialItems[0].title}`
            : `${credentialItems.length} credentials`;

    const primaryCtaLabel = isAuthCodeOnly
        ? 'Continue to sign in'
        : credentialItems.length > 1
        ? 'Save all to wallet'
        : 'Save to Wallet';

    return (
        <div
            className="min-h-full flex items-center justify-center font-poppins"
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
            }}
        >
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden animate-fade-in-up">
                <div className="p-6 space-y-5">
                    <FlowSteps current={1} />

                    <div>
                        <h1 className="text-xl font-semibold text-grayscale-900 leading-snug">
                            {headlineLead} {credentialNoun} to your wallet.
                        </h1>

                        <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                            Your wallet keeps it forever — share it whenever you need to prove what it says.
                        </p>
                    </div>

                    <IssuerHeader
                        issuerUrl={offer.credential_issuer}
                        display={issuerDisplay}
                    />

                    <div className="space-y-3">
                        {credentialItems.slice(0, 3).map(item => (
                            <CredentialPreviewCard
                                key={item.id}
                                title={item.title}
                                description={item.description}
                                claims={item.claims}
                                issuerUrl={offer.credential_issuer}
                                issuerName={issuerDisplayName}
                                issuerLogoUri={issuerDisplay?.logo?.uri}
                            />
                        ))}

                        {credentialItems.length > 3 && (
                            <p className="text-xs text-grayscale-500 text-center">
                                +{credentialItems.length - 3} more credential
                                {credentialItems.length - 3 === 1 ? '' : 's'} in this offer
                            </p>
                        )}

                        {credentialItems.some(item => item.format) && (
                            <details className="group">
                                <summary className="text-xs text-grayscale-400 cursor-pointer hover:text-grayscale-600 transition-colors">
                                    Technical details
                                </summary>

                                <ul className="mt-2 space-y-1 text-xs text-grayscale-500">
                                    {credentialItems.map(item => (
                                        <li key={`fmt-${item.id}`} className="flex items-baseline gap-2">
                                            <span className="font-medium text-grayscale-700">
                                                {item.title}
                                            </span>
                                            {item.format && (
                                                <span className="text-grayscale-400">
                                                    · {humanizeFormat(item.format) ?? item.format}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </div>

                    {txCodeSpec && (
                        <TxCodeField
                            spec={txCodeSpec}
                            value={txCode}
                            onChange={setTxCode}
                        />
                    )}

                    {isAuthCodeOnly && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                            <ShieldAlert className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />

                            <span className="text-xs text-amber-800 leading-relaxed">
                                The issuer will ask you to sign in before issuing this credential. We&apos;ll bring you right back when they&apos;re done.
                            </span>
                        </div>
                    )}

                    <div className="space-y-3 pt-1">
                        <button
                            onClick={() => onAccept({ txCode: txCode.trim() || undefined })}
                            disabled={!txCodeValid}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {primaryCtaLabel}
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Not now
                        </button>
                    </div>

                    <div className="flex justify-center pt-2">
                        <WhatIsACredential />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TxCodeFieldProps {
    spec: TxCode;
    value: string;
    onChange: (next: string) => void;
}

const TxCodeField: React.FC<TxCodeFieldProps> = ({ spec, value, onChange }) => {
    const inputMode = spec.input_mode === 'text' ? 'text' : 'numeric';
    const placeholder = spec.length
        ? `${spec.length}-digit code`
        : 'Code from issuer';

    return (
        <div>
            <label
                htmlFor="oid4vci-tx-code"
                className="block text-xs font-medium text-grayscale-700 mb-1.5"
            >
                Transaction code
            </label>

            <input
                id="oid4vci-tx-code"
                type={inputMode === 'numeric' ? 'tel' : 'text'}
                inputMode={inputMode}
                autoComplete="one-time-code"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={spec.length}
                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            />

            {spec.description && (
                <p className="text-xs text-grayscale-500 mt-1.5 leading-relaxed">
                    {spec.description}
                </p>
            )}
        </div>
    );
};

// -----------------------------------------------------------------
// Display helpers
// -----------------------------------------------------------------

interface CredentialItem {
    id: string;
    title: string;
    description?: string;
    format?: string;
    /**
     * Pre-issuance claim labels extracted from `credential_configurations_supported[id].claims`
     * (or, for ldp_vc / jwt_vc_json, `credential_definition.credentialSubject`). Empty when the
     * issuer ships no claim metadata. Values are intentionally unset — they're filled in by the
     * issuer at issuance time, and the preview card shows a placeholder line for each.
     */
    claims?: CredentialPreviewClaim[];
}

const describeCredentials = (
    offer: CredentialOffer,
    metadata?: CredentialIssuerMetadata
): CredentialItem[] => {
    const configsSupported = (metadata?.credential_configurations_supported
        ?? {}) as Record<string, unknown>;

    return offer.credential_configuration_ids.map((id) => {
        const config = configsSupported[id] as
            | {
                  format?: unknown;
                  display?: unknown[];
                  scope?: unknown;
                  claims?: unknown;
                  credential_definition?: unknown;
              }
            | undefined;

        const display = pickFirstDisplay(config?.display);

        // Run the metadata-supplied display name (when present) through the
        // prettifier as a safety net — some issuers ship snake_cased names
        // that should still be Title-Cased before render.
        const rawTitle =
            (display && stringField(display, 'name'))
            || stringField(config, 'scope')
            || undefined;
        const title = prettifyConfigurationId(id, { displayName: rawTitle });

        const description =
            display && stringField(display, 'description')
                ? stringField(display, 'description')
                : undefined;

        const format = config && stringField(config, 'format');
        const claims = extractClaimLabels(config);

        return {
            id,
            title,
            description,
            format,
            claims: claims.length > 0 ? claims : undefined,
        };
    });
};

/**
 * Best-effort extractor for claim label metadata. Walks the multiple
 * shapes OID4VCI defines depending on credential format:
 *
 *   - `dc+sd-jwt` / `vc+sd-jwt`: `claims` is a record keyed by claim name
 *     with `{ display: [{ name }], mandatory? }`.
 *   - `jwt_vc_json` / `ldp_vc`: claim labels live under
 *     `credential_definition.credentialSubject.<name>.display[0].name`.
 *   - `mso_mdoc`: `claims` is a record keyed by namespace, each containing
 *     a record of claim names. We flatten the first namespace.
 *
 * Returns an empty array when nothing matches — the preview card
 * gracefully omits the claim list in that case.
 */
const extractClaimLabels = (
    config:
        | {
              format?: unknown;
              claims?: unknown;
              credential_definition?: unknown;
          }
        | undefined
): CredentialPreviewClaim[] => {
    if (!config) return [];

    // Shape 1: SD-JWT / draft-15 — `claims` is a flat record.
    const claimsRecord = config.claims;
    if (claimsRecord && typeof claimsRecord === 'object' && !Array.isArray(claimsRecord)) {
        const flat = flattenClaimRecord(claimsRecord as Record<string, unknown>);
        if (flat.length > 0) return flat;
    }

    // Shape 2: jwt_vc_json / ldp_vc — dive into
    // `credential_definition.credentialSubject`.
    const credDef = config.credential_definition;
    if (credDef && typeof credDef === 'object') {
        const subj = (credDef as Record<string, unknown>).credentialSubject;
        if (subj && typeof subj === 'object' && !Array.isArray(subj)) {
            const flat = flattenClaimRecord(subj as Record<string, unknown>);
            if (flat.length > 0) return flat;
        }
    }

    return [];
};

const flattenClaimRecord = (
    record: Record<string, unknown>
): CredentialPreviewClaim[] => {
    const out: CredentialPreviewClaim[] = [];
    for (const [key, value] of Object.entries(record)) {
        if (!value || typeof value !== 'object') continue;
        const v = value as Record<string, unknown>;
        const display = Array.isArray(v.display) ? v.display[0] : undefined;
        const labelFromDisplay =
            display && typeof display === 'object'
                ? stringField(display, 'name')
                : undefined;

        // Use the displayed label when ship it, else humanize the key.
        const label = labelFromDisplay ?? humanizeKey(key);
        if (label) out.push({ label });
    }
    return out;
};

const humanizeKey = (key: string): string => {
    return key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join(' ');
};

const pickFirstDisplay = (
    display: unknown
): Record<string, unknown> | undefined => {
    if (!Array.isArray(display) || display.length === 0) return undefined;
    const first = display[0];
    return first && typeof first === 'object' ? (first as Record<string, unknown>) : undefined;
};

const stringField = (
    obj: Record<string, unknown> | unknown,
    key: string
): string | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
};

export default OfferConsent;
