import React, { useMemo, useState } from 'react';
import { Award, ShieldAlert } from 'lucide-react';

import { IssuerHeader } from 'learn-card-base';

import type {
    CredentialOffer,
    CredentialIssuerMetadata,
    TxCode,
} from '@learncard/openid4vc-plugin';

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

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-6 space-y-5">
                    <div>
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                            Accept credential?
                        </h1>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            An issuer wants to send you the following credentials. Review the details before accepting.
                        </p>
                    </div>

                    <IssuerHeader
                        issuerUrl={offer.credential_issuer}
                        display={issuerDisplay}
                    />

                    <div>
                        <p className="text-xs font-medium text-grayscale-700 mb-2 uppercase tracking-wide">
                            Credentials being offered
                        </p>

                        <ul className="space-y-2">
                            {credentialItems.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-grayscale-200 bg-white"
                                >
                                    <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-emerald-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-grayscale-900 truncate">
                                            {item.title}
                                        </p>

                                        {item.description && (
                                            <p className="text-xs text-grayscale-500 leading-relaxed mt-0.5 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}

                                        {item.format && (
                                            <p className="text-[10px] text-grayscale-400 font-mono mt-0.5">
                                                {item.format}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
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
                                The issuer will redirect you to sign in before issuing this credential. We&apos;ll bring you right back when they&apos;re done.
                            </span>
                        </div>
                    )}

                    <div className="space-y-3 pt-1">
                        <button
                            onClick={() => onAccept({ txCode: txCode.trim() || undefined })}
                            disabled={!txCodeValid}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isAuthCodeOnly ? 'Continue to issuer' : 'Accept and continue'}
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Cancel
                        </button>
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
              }
            | undefined;

        const display = pickFirstDisplay(config?.display);
        const title =
            (display && stringField(display, 'name'))
            || stringField(config, 'scope')
            || id;

        const description =
            display && stringField(display, 'description')
                ? stringField(display, 'description')
                : undefined;

        const format = config && stringField(config, 'format');

        return {
            id,
            title,
            description,
            format,
        };
    });
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
