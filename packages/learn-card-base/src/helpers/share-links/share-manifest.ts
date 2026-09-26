import {
    SHARE_LINK_PROTOCOL,
    SharePayloadValidator,
    classifyShareManifest,
    type ShareEndorsementEntry,
    type ShareManifestClassification,
    type ShareManifestClassificationCode,
    type ShareManifestPresentation,
    type SharePayload,
    type ShareSelectionEntry,
    type ShareSharer,
} from '@learncard/types';

/**
 * Recipient-manifest construction and structural validation.
 *
 * Construction never rearranges, clones or rewrites credential contents: the
 * holder-signed presentation is carried by reference and only the index-only
 * `selection`/`endorsements` arrays are rebuilt. Validation is *structural*.
 * A successful result must never be surfaced as "verified" — cryptographic
 * holder/issuer verification is a separate boundary (see
 * {@link ShareManifestProofVerifier}).
 */

export interface BuildShareManifestInput {
    shareId: string;
    contentVersion: number;
    createdAt: string;
    sharer: ShareSharer;
    /** Holder-signed presentation whose members are referenced by index. */
    presentation: ShareManifestPresentation;
    /** Ordered selection (order is owner intent and is preserved verbatim). */
    selection: readonly ShareSelectionEntry[];
    endorsements?: readonly ShareEndorsementEntry[];
}

/**
 * Build the recipient manifest. Unlike schema parsing, this tolerates a not-yet
 * valid selection (for example an empty one); call
 * {@link validateShareManifest} or `SharePayloadValidator` before publishing.
 */
export const buildShareManifest = ({
    shareId,
    contentVersion,
    createdAt,
    sharer,
    presentation,
    selection,
    endorsements = [],
}: BuildShareManifestInput): SharePayload => ({
    protocol: SHARE_LINK_PROTOCOL,
    shareId,
    contentVersion,
    createdAt,
    sharer: { ...sharer },
    presentation,
    selection: selection.map(entry => ({ credentialIndex: entry.credentialIndex })),
    endorsements: endorsements.map(entry => ({
        credentialIndex: entry.credentialIndex,
        targetCredentialIndex: entry.targetCredentialIndex,
    })),
});

export type ShareManifestValidationFailureCode =
    ShareManifestClassificationCode | 'INVALID_MANIFEST' | 'SHARE_ID_MISMATCH' | 'VERSION_MISMATCH';

export type ShareManifestValidationResult =
    | { ok: true; manifest: SharePayload; classification: ShareManifestClassification }
    | {
          ok: false;
          code: ShareManifestValidationFailureCode;
          message: string;
          path: (string | number)[];
      };

export interface ValidateShareManifestContext {
    /** Share id from the URL / authenticated request. */
    shareId: string;
    /** Content version from the envelope / AAD / visible server version. */
    contentVersion: number;
}

/**
 * Validate a decrypted recipient manifest and bind it to the expected share id
 * and content version. All failures fail closed with a stable code:
 * - shape/classification codes come from `SharePayloadValidator`;
 * - `SHARE_ID_MISMATCH` / `VERSION_MISMATCH` bind manifest to request/AAD.
 *
 * Independent VP and issuer signature verification is explicitly out of scope.
 */
export const validateShareManifest = (
    manifest: unknown,
    { shareId, contentVersion }: ValidateShareManifestContext
): ShareManifestValidationResult => {
    const parsed = SharePayloadValidator.safeParse(manifest);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const params = issue as unknown as
            { params?: { shareLinkCode?: ShareManifestClassificationCode } } | undefined;
        const code = params?.params?.shareLinkCode ?? 'INVALID_MANIFEST';

        return {
            ok: false,
            code,
            message: issue?.message ?? 'manifest is invalid',
            path: (issue?.path ?? []) as (string | number)[],
        };
    }

    const payload = parsed.data;

    if (payload.shareId !== shareId) {
        return {
            ok: false,
            code: 'SHARE_ID_MISMATCH',
            message: 'manifest share id does not match the expected share id',
            path: ['shareId'],
        };
    }

    if (payload.contentVersion !== contentVersion) {
        return {
            ok: false,
            code: 'VERSION_MISMATCH',
            message: 'manifest content version does not match the expected content version',
            path: ['contentVersion'],
        };
    }

    const classification = classifyShareManifest(payload);

    if (!classification.ok) {
        return {
            ok: false,
            code: classification.code,
            message: classification.message,
            path: classification.path,
        };
    }

    return { ok: true, manifest: payload, classification: classification.classification };
};

export interface ShareManifestProofResult {
    presentationVerified: boolean;
    credentialsVerified: boolean;
    endorsementsVerified: boolean;
    failures: string[];
}

/**
 * Boundary for independent signature verification. A wallet implementation
 * verifies the holder VP proof, each selected credential and each endorsement
 * (bound to its target) and resolves status/issuer trust. None of that is
 * provided by this batch: the injected adapter is required so no caller can
 * mistake structural validation for verification.
 */
export interface ShareManifestProofVerifier {
    verifyShareManifestProofs(manifest: SharePayload): Promise<ShareManifestProofResult>;
}

/** Marker used in reports/tests: wallet-backed proof verification is pending. */
export const SHARE_MANIFEST_PROOF_VERIFICATION_PENDING = 'wallet-vp-verification-required' as const;

/**
 * Run an injected proof verifier. A verifier must never be inferred from a
 * successful decrypt or a successful `validateShareManifest` call.
 */
export const verifyShareManifestProofs = async (
    verifier: ShareManifestProofVerifier,
    manifest: SharePayload
): Promise<ShareManifestProofResult> => verifier.verifyShareManifestProofs(manifest);
