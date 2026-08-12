/**
 * [draft-13-compat] OID4VCI Draft 13 wire-shape shims.
 *
 * The plugin targets OID4VCI 1.0 (final). Some deployed issuers (notably
 * walt.id) still speak Draft 13, whose Credential Request and metadata
 * discovery differ from 1.0. Every Draft-13-specific construction lives here
 * so the whole compat layer can be removed in one pass once those issuers
 * migrate:
 *
 *   1. Delete this file.
 *   2. Drop the `'draft-13'` arm from `SpecVersion` in ./types.
 *   3. `grep -rn "draft-13-compat"` and remove each tagged block (the
 *      metadata append fallback, the request-body branch, and the params
 *      plumbed through accept.ts / auth-code.ts / request.ts).
 *
 * Nothing outside a `[draft-13-compat]`-tagged call site imports this module.
 */

export interface Draft13CredentialRequestArgs {
    credentialIdentifier?: string;
    credentialConfigurationId?: string;
    format?: string;
    /** The issuer-metadata configuration entry, for format-specific fields. */
    configDef?: Record<string, unknown>;
    proofJwt: string;
}

/**
 * Build a Draft 13 §7.2 Credential Request body: `format` + the format's
 * identifying field + a singular `proof` object. (OID4VCI 1.0 §8.2 replaced
 * all of this with `credential_configuration_id` + a `proofs` array.)
 */
export const buildDraft13CredentialRequestBody = (
    args: Draft13CredentialRequestArgs
): Record<string, unknown> => {
    const body: Record<string, unknown> = {
        proof: { proof_type: 'jwt', jwt: args.proofJwt },
    };

    if (typeof args.credentialIdentifier === 'string' && args.credentialIdentifier.length > 0) {
        body.credential_identifier = args.credentialIdentifier;
        return body;
    }

    const format = args.format ?? 'jwt_vc_json';
    body.format = format;

    return { ...body, ...draft13FormatSpecificFields(format, args.configDef) };
};

/**
 * The format-specific field(s) a Draft 13 Credential Request must echo from
 * the issuer metadata: `credential_definition` for W3C VC formats, `vct` for
 * SD-JWT VC formats. Returns an empty object when none apply.
 */
const draft13FormatSpecificFields = (
    format: string,
    configDef: Record<string, unknown> | undefined
): Record<string, unknown> => {
    if (!configDef) return {};

    if (format === 'jwt_vc_json' || format === 'jwt_vc_json-ld' || format === 'ldp_vc') {
        const def = configDef.credential_definition;
        return def && typeof def === 'object' ? { credential_definition: def } : {};
    }

    if (format === 'vc+sd-jwt' || format === 'dc+sd-jwt' || format === 'sd-jwt-vc') {
        return typeof configDef.vct === 'string' ? { vct: configDef.vct } : {};
    }

    return {};
};
