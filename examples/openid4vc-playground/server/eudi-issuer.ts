/**
 * Server-side EUDI issuer client \u2014 hand-constructs OID4VCI credential
 * offers pointing at the **hosted** EU Digital Identity Wallet
 * reference issuer at https://issuer.eudiw.dev/.
 *
 * # Why hand-construct?
 *
 * Unlike walt.id (whose admin API mints credential offers via
 * `POST /openid4vc/jwt/issue`), the EUDI reference issuer doesn't
 * expose a public "create offer" endpoint \u2014 its
 * `credential_offer_endpoint` field is absent from
 * `.well-known/openid-credential-issuer`. In production, EUDI
 * credential offers are minted internally after a citizen
 * authenticates on the EU portal, which isn't a flow the playground
 * can replicate.
 *
 * The OID4VCI v1.0 spec, however, defines `credential_offer` as
 * a stand-alone JSON object \u2014 any party that knows the issuer's
 * URL and a published `credential_configuration_id` can construct
 * a valid offer locally and hand it to a wallet. The wallet then
 * does the auth-code dance against EUDI's OAuth server, where the
 * dev/test instance of EUDI presents a self-serve login (the
 * citizen never had to be "really" authenticated for EUDI to issue
 * the credential).
 *
 * This is functionally identical to walt.id's admin API for our
 * purposes \u2014 we get a credential offer URL, the wallet handles
 * the rest. The trade-off is we don't go through the EUDI portal
 * (where users would normally pick a credential), so we have to
 * hard-code which `credential_configuration_id`s to request.
 *
 * # Wire-level differences from walt.id (worth knowing)
 *
 *   - **OID4VCI draft-15** (vs walt.id's draft-13). Field names
 *     are mostly stable but a few have shifted; `credential_offer`
 *     itself is unchanged in draft-15 so we're safe here.
 *   - **No pre-authorized code grant** \u2014 EUDI only supports
 *     `authorization_code`. The wallet must do the full
 *     PKCE-protected redirect.
 *   - **DPoP** is supported on the token endpoint and may be
 *     required depending on the credential. The wallet plugin
 *     needs DPoP support for these to succeed end-to-end.
 *   - **Credential response encryption** is supported (ECDH-ES /
 *     A128GCM). Whether it's required varies per credential.
 *
 * The playground's job is to surface these end-to-end — if the
 * plugin has gaps, the failure mode (and where in the flow it
 * happens) tells us exactly what to implement next.
 */
import { EUDI_PROXY_PUBLIC_BASE_URL } from './eudi-proxy';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface MintHostedEudiOfferOptions {
    /**
     * The EUDI issuer base URL. Defaults to the hosted EU dev
     * instance. Override via env to point at a self-hosted EUDI
     * issuer if one ever lands in the playground stack.
     */
    issuerBaseUrl?: string;
    /**
     * One or more `credential_configuration_id`s the wallet should
     * request. Must match an entry advertised on the issuer's
     * `.well-known/openid-credential-issuer`. See README.md or
     * curl the metadata for the live list.
     *
     * Common picks:
     *   - `eu.europa.ec.eudi.diploma_vc_sd_jwt` (academic diploma, dc+sd-jwt)
     *   - `eu.europa.ec.eudi.pid_vc_sd_jwt`     (Personal ID, dc+sd-jwt)
     *   - `eu.europa.ec.eudi.mdl_mdoc`          (mobile driving licence, mso_mdoc)
     */
    credentialConfigurationIds: string[];
    /**
     * Optional `issuer_state` to round-trip back from the
     * authorization request. The hosted EUDI issuer doesn't
     * require it, but supplying one keeps multi-tab dev sessions
     * disambiguated server-side.
     */
    issuerState?: string;
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * The wallet sees this as `credential_issuer`. It points at the
 * playground's reverse proxy (`/api/eudi-proxy`) rather than the
 * real EUDI issuer because EUDI's token endpoint lacks CORS headers
 * for `localhost:3000`. See `./eudi-proxy.ts` for the gory details.
 *
 * Override `EUDI_HOSTED_ISSUER_BASE_URL` env var to bypass the
 * proxy (useful when running the wallet in a non-browser context
 * where CORS doesn't apply, or when EUDI eventually adds CORS).
 */
const DEFAULT_EUDI_ISSUER =
    process.env.EUDI_HOSTED_ISSUER_BASE_URL ?? EUDI_PROXY_PUBLIC_BASE_URL;

/**
 * Build a wallet-ready `openid-credential-offer://?credential_offer=<json>`
 * URI for the hosted EUDI reference issuer. No network calls \u2014 the
 * offer is a pure spec-defined JSON object.
 *
 * Returns the inlined (`credential_offer`) variant, not the
 * `credential_offer_uri` variant, for the same reason walt.id
 * scenarios resolve to-by-value: it sidesteps any wallet-side
 * `https`-only / fetch-validation guards on offer URIs.
 */
export const mintHostedEudiOffer = (
    opts: MintHostedEudiOfferOptions
): { rawOfferUri: string } => {
    if (
        !opts.credentialConfigurationIds ||
        opts.credentialConfigurationIds.length === 0
    ) {
        throw new Error(
            'mintHostedEudiOffer requires at least one credentialConfigurationId'
        );
    }

    const offer: Record<string, unknown> = {
        credential_issuer: opts.issuerBaseUrl ?? DEFAULT_EUDI_ISSUER,
        credential_configuration_ids: opts.credentialConfigurationIds,
        grants: {
            authorization_code: opts.issuerState
                ? { issuer_state: opts.issuerState }
                : {},
        },
    };

    const rawOfferUri =
        'openid-credential-offer://?credential_offer=' +
        encodeURIComponent(JSON.stringify(offer));

    return { rawOfferUri };
};
