/**
 * Pure content/recipient decisions for the managed credential-refresh update
 * email (LC-2198).
 *
 * Kept dependency-free (no database, delivery, or model imports) so the
 * privacy-sensitive decisions — what minimal context is rendered and which
 * verified contact method is targeted — are exhaustively unit testable.
 *
 * Rendering and delivery live in `credential-refresh-email.helpers.ts`.
 */

/** Upper bound on a persisted credential display title, in characters. */
export const MAX_CREDENTIAL_DISPLAY_TITLE_LENGTH = 120;

/**
 * Normalizes an issuer-supplied credential title into a bounded, single-line
 * string safe to persist and render. Control characters (including newlines)
 * become spaces, runs of whitespace collapse, and the result is truncated to
 * `maxLength`. Returns `undefined` for non-strings or values that normalize to
 * nothing, so callers can fall back to generic copy.
 */
export const extractBoundedCredentialDisplayTitle = (
    value: unknown,
    maxLength: number = MAX_CREDENTIAL_DISPLAY_TITLE_LENGTH
): string | undefined => {
    if (typeof value !== 'string') return undefined;

    // Control characters (C0, DEL, C1) become spaces rather than being dropped.
    const withoutControlCharacters = Array.from(value, character => {
        const code = character.charCodeAt(0);

        return code <= 0x1f || (code >= 0x7f && code <= 0x9f) ? ' ' : character;
    }).join('');

    const sanitized = withoutControlCharacters
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)
        .trim();

    return sanitized.length > 0 ? sanitized : undefined;
};

/** Minimal shape of a contact method used by the pure selection logic. */
export type CredentialRefreshEmailContactMethod = {
    type: string;
    value: string;
    isVerified: boolean;
    isPrimary?: boolean;
};

/** A profile that may manage the holder, plus its verified contact methods. */
export type CredentialRefreshEmailManager = {
    locale?: string;
    contactMethods: CredentialRefreshEmailContactMethod[];
};

export type CredentialRefreshEmailTargetParams = {
    holder: { locale?: string };
    holderContactMethods: CredentialRefreshEmailContactMethod[];
    /** Profiles that manage the holder (guardians/managers). Empty = unmanaged. */
    managers: CredentialRefreshEmailManager[];
};

export type CredentialRefreshEmailTarget =
    | {
          status: 'resolved';
          kind: 'holder' | 'guardian';
          locale?: string;
          contactMethod: { type: 'email'; value: string };
      }
    | {
          status: 'skipped';
          reason: 'no-verified-holder-email' | 'no-verified-guardian-email';
      };

const isUsableVerifiedEmail = (contactMethod: CredentialRefreshEmailContactMethod): boolean =>
    contactMethod.type === 'email' &&
    contactMethod.isVerified === true &&
    typeof contactMethod.value === 'string' &&
    contactMethod.value.trim().length > 0;

const pickVerifiedEmail = (
    contactMethods: CredentialRefreshEmailContactMethod[]
): CredentialRefreshEmailContactMethod | undefined => {
    const verified = contactMethods.filter(isUsableVerifiedEmail);

    return verified.find(contactMethod => contactMethod.isPrimary) ?? verified[0];
};

/**
 * Chooses the single verified email that should receive an update notice.
 *
 * - Unmanaged holders are emailed at their own verified email (primary preferred).
 * - Managed holders are NEVER emailed directly: the notice goes to a verified
 *   manager's email, or is skipped when none is available. Falling back to the
 *   child's address is intentionally impossible.
 * - Callers always resolve contact methods from the bound holder profile — the
 *   original inbox address and any caller-supplied address are never used.
 */
export const chooseCredentialRefreshEmailTarget = (
    params: CredentialRefreshEmailTargetParams
): CredentialRefreshEmailTarget => {
    const { holder, holderContactMethods, managers } = params;

    if (managers.length > 0) {
        const candidates = managers.flatMap(manager =>
            manager.contactMethods
                .filter(isUsableVerifiedEmail)
                .map(contactMethod => ({ manager, contactMethod }))
        );
        const chosen =
            candidates.find(candidate => candidate.contactMethod.isPrimary) ?? candidates[0];

        if (!chosen) return { status: 'skipped', reason: 'no-verified-guardian-email' };

        return {
            status: 'resolved',
            kind: 'guardian',
            locale: chosen.manager.locale,
            contactMethod: { type: 'email', value: chosen.contactMethod.value },
        };
    }

    const contactMethod = pickVerifiedEmail(holderContactMethods);

    if (!contactMethod) return { status: 'skipped', reason: 'no-verified-holder-email' };

    return {
        status: 'resolved',
        kind: 'holder',
        locale: holder.locale,
        contactMethod: { type: 'email', value: contactMethod.value },
    };
};

/**
 * Builds the minimal template model for `credential-updated`.
 *
 * Exactly two optional values are allowed: the issuer display name and the
 * bounded credential title. No summary, subject, recipient, grade, evidence, or
 * credential body content can be expressed by this shape.
 */
export const buildCredentialUpdatedEmailModel = (params: {
    issuerDisplayName?: string;
    credentialTitle?: string;
}): { issuer?: { name?: string }; credential?: { name?: string } } => {
    const model: { issuer?: { name?: string }; credential?: { name?: string } } = {};
    const title = extractBoundedCredentialDisplayTitle(params.credentialTitle);

    if (params.issuerDisplayName) model.issuer = { name: params.issuerDisplayName };
    if (title) model.credential = { name: title };

    return model;
};
