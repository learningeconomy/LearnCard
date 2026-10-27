import { withAiInsightStage } from '../diagnostics/ai-insight';
import type { VerificationOrigin, VerificationSubreason, VerifierErrorKind } from '../logging';
import { createHash } from 'crypto';
import { LearnCardTimeoutError } from '../learncard/errors';
import { VCValidator, VerificationCheckValidator } from '@learncard/types';
import type { CredentialVerificationMetadata, VC } from '@learncard/types';
import { dependencies } from '../../package.json';

export const CREDENTIAL_VERIFIER_VERSION = `@learncard/init-${dependencies['@learncard/init']};@learncard/didkit-plugin-${dependencies['@learncard/didkit-plugin']}`;

export type CredentialConsentReceipt = CredentialVerificationMetadata['consent'];

// The persisted contract has only valid/invalid. An incomplete verification must
// not overwrite that record or be converted to BullMQ's UnrecoverableError.
export class CredentialVerificationUnavailableError extends Error {
    readonly retryable = true;

    readonly verificationSubreason?: VerificationSubreason;

    /** Only for unrecognized_verifier_error: a fixed bucket, never the text. */
    declare readonly verifierErrorKind?: VerifierErrorKind;

    constructor(
        verificationSubreason?: VerificationSubreason,
        verifierErrorKind?: VerifierErrorKind
    ) {
        super('Credential verification is unavailable');
        this.name = 'CredentialVerificationUnavailableError';
        this.verificationSubreason = verificationSubreason;
        if (verifierErrorKind) this.verifierErrorKind = verifierErrorKind;
    }
}

type VerifyCredential = (credential: VC) => Promise<unknown>;

type VerifyCredentialInput = {
    credential: VC;
    credentialUri: string;
    subjectDid: string;
    consent: CredentialConsentReceipt;
    verify: VerifyCredential;
    checkedAt?: string;
    verificationOrigin?: VerificationOrigin;
};
type VerificationPayload = {
    verificationCredential: VC;
    subjectCredential: VC;
    verifiedPayload: 'credential' | 'boostCredential';
};

const stableStringify = (value: unknown): string => {
    if (value === null) return 'null';

    if (typeof value !== 'object') return JSON.stringify(value) ?? 'null';

    if (Array.isArray(value)) {
        return `[${value.map(item => stableStringify(item)).join(',')}]`;
    }

    const record = value as Record<string, unknown>;

    return `{${Object.keys(record)
        .filter(key => record[key] !== undefined)
        .toSorted()
        .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
        .join(',')}}`;
};

export const fingerprintCredential = (credential: VC): string =>
    createHash('sha256').update(stableStringify(credential)).digest('hex');

// Verifier text can contain arbitrary credential claims. Persist only recognized
// check identifiers and fixed outcome codes, never messages or unknown codes.
const SAFE_CHECKS: Record<string, true> = {
    proof: true,
    credentialStatus: true,
    status: true,
    credentialSchema: true,
};

// Exact completed-failure outcomes from the pinned DIDKit/SSI verifier and
// expiration plugin. Do not broaden these to substring matches: resolver and
// JSON-LD failures can embed arbitrary text, including these same words.
// New/unknown SDK errors are unverifiable, not evidence for deleting a VC.
const CONFIRMED_INVALID_ERRORS: Record<string, true> = {
    'Invalid signature': true,
    'signature error': true,
    'signature error: Verification equation was not satisfied': true,
    'No applicable proof': true,
    'Missing proof': true,
    'Missing Proof Signature': true,
    'Missing Verification Method': true,
    'Missing proof purpose': true,
    'Verification Method Mismatch': true,
    'Algorithm in JWS header does not match JWK': true,
    'Invalid issuer': true,
    'Invalid subject': true,
    'Empty credential subject': true,
    'Credential is revoked.': true,
    'Credential is suspended.': true,
    'expiration error: Credential is expired': true,
    'expiration error: Credential is not valid yet': true,
    'expiration error: Credential is no longer valid': true,
    'Boost Authenticity could not be verified: Boost ID metadata is mismatched.': true,
};

// A past expiry is not a reason to hide a credential the owner still shares:
// the proof and subject are checked as usual and the result carries the
// `credential_expired` warning so the projection can mark it for the model.
// "Not valid yet" stays a confirmed failure.
const EXPIRED_ERRORS: Record<string, true> = {
    'expiration error: Credential is expired': true,
    'expiration error: Credential is no longer valid': true,
};
export const CREDENTIAL_EXPIRED_WARNING = 'credential_expired';

const isExpiryOnly = (errors: string[]): boolean =>
    errors.some(error => Object.hasOwn(EXPIRED_ERRORS, error)) &&
    errors.every(
        error =>
            Object.hasOwn(EXPIRED_ERRORS, error) ||
            error === 'Boost Credential could not be verified.'
    );

const hasOnlyConfirmedInvalidErrors = (errors: string[]): boolean =>
    errors.some(error => Object.hasOwn(CONFIRMED_INVALID_ERRORS, error)) &&
    errors.every(
        error =>
            Object.hasOwn(CONFIRMED_INVALID_ERRORS, error) ||
            // The wrapper appends this only alongside the inner credential's errors.
            error === 'Boost Credential could not be verified.'
    );

// Bucket the verifier strings that made a result unrecognized, for logs only.
// Unlike CONFIRMED_INVALID_ERRORS these are loose matches: the result is
// unavailable either way, and a wrong bucket costs a diagnosis, not a VC.
// The SDK's VerifyBoost plugin pushes the lowercase "Boost authenticity could
// not be verified." from its catch when verifying the boost itself throws. The
// other patterns follow DIDKit's resolver, JSON-LD and status list messages.
const BOOST_AUTHENTICITY_EXCEPTION = 'Boost authenticity could not be verified.';
const VERIFIER_ERROR_PATTERNS: ReadonlyArray<
    readonly [Exclude<VerifierErrorKind, 'boost_authenticity_exception' | 'other'>, RegExp]
> = [
    ['status_list', /status ?list|revocation ?list|credentialStatus/i],
    ['did_resolution', /resolution|resolv|invalidDid|dereferenc|DID document/i],
    // DIDKit's expansion check: a term the credential's contexts do not define.
    // Checked before the broader JSON-LD bucket; "Unknown context" stays there.
    ['undefined_jsonld_term', /DATA_LOSS_DETECTION_ERROR|undefined JSON-?LD term|relative IRI/i],
    ['jsonld_context', /json-?ld|@context|remote (context|document)|\bcontext\b/i],
];

export const classifyVerifierErrors = (errors: readonly string[]): VerifierErrorKind => {
    const unknown = errors.filter(
        error =>
            !Object.hasOwn(CONFIRMED_INVALID_ERRORS, error) &&
            error !== 'Boost Credential could not be verified.'
    );
    if (unknown.includes(BOOST_AUTHENTICITY_EXCEPTION)) return 'boost_authenticity_exception';
    for (const [kind, pattern] of VERIFIER_ERROR_PATTERNS)
        if (unknown.some(error => pattern.test(error))) return kind;
    return 'other';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/*
 * The signed payload whose claims reach the model. Stock LearnCard
 * verifyCredential runs no schema parse of its own: DIDKit decides. The outer
 * credential already passed VCValidator in the SDK read, so this only asks for
 * what projection needs: an object with a credential subject. A string or
 * missing `type`, a string `@context`, or a Data Integrity proof without
 * `created` are all VC-legal and are left to the verifier.
 */
export const getSubjectPayloadShape = (value: unknown): VC | undefined => {
    if (!isRecord(value)) return undefined;
    const subject = value.credentialSubject;
    const subjects = Array.isArray(subject) ? subject : [subject];
    if (subjects.length === 0 || !subjects.every(isRecord)) return undefined;
    return value as VC;
};

const getVerificationPayload = (credential: VC): VerificationPayload => {
    const boostCredential =
        'boostCredential' in credential ? credential.boostCredential : undefined;

    if (boostCredential) {
        return {
            verificationCredential: credential,
            subjectCredential: boostCredential as VC,
            verifiedPayload: 'boostCredential',
        };
    }

    return {
        verificationCredential: credential,
        subjectCredential: credential,
        verifiedPayload: 'credential',
    };
};

const getCredentialSubjectDids = (credential: VC): string[] => {
    const subjects = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject
        : [credential.credentialSubject];

    return subjects.flatMap(subject => {
        if (!subject || typeof subject !== 'object') return [];

        const subjectDid = (subject as Record<string, unknown>).id;
        return typeof subjectDid === 'string' ? [subjectDid] : [];
    });
};

const verifyCredential = async ({
    credential,
    credentialUri,
    subjectDid,
    consent,
    verify,
    checkedAt = new Date().toISOString(),
}: VerifyCredentialInput): Promise<CredentialVerificationMetadata> => {
    const contentHash = fingerprintCredential(credential);
    const metadata = {
        credentialUri,
        contentHash,
        checkedAt,
        verifier: {
            name: 'LearnCard credential verifier',
            version: CREDENTIAL_VERIFIER_VERSION,
        },
        provenance: {
            source: 'wallet' as const,
            retrievedAt: checkedAt,
        },
        consent,
    };
    let verificationPayload: VerificationPayload;

    try {
        VCValidator.parse(credential);
        verificationPayload = getVerificationPayload(credential);
        if (!getSubjectPayloadShape(verificationPayload.subjectCredential))
            throw new Error('Credential subject payload is not an object');
    } catch {
        return {
            ...metadata,
            status: 'invalid',
            verifiedPayload: 'boostCredential',
            checks: [],
            errors: ['verification_payload_invalid'],
            warnings: [],
        };
    }

    let rawResult: unknown;
    try {
        // Preserve the original signed object; parsed validator output is not the
        // signed payload and must not be substituted before cryptographic checks.
        rawResult = await verify(verificationPayload.verificationCredential);
    } catch (error) {
        // Never retain a raw SDK error (or its cause); it can contain private claims.
        // Only our own bound's timeout is named; any other failure is sdk_exception.
        throw new CredentialVerificationUnavailableError(
            error instanceof LearnCardTimeoutError ? 'sdk_timeout' : 'sdk_exception'
        );
    }
    const parsedResult = VerificationCheckValidator.safeParse(rawResult);

    if (!parsedResult.success) {
        throw new CredentialVerificationUnavailableError('result_schema');
    }

    const result = parsedResult.data;
    if (result.errors.length > 0 && !hasOnlyConfirmedInvalidErrors(result.errors)) {
        throw new CredentialVerificationUnavailableError(
            'unrecognized_verifier_error',
            classifyVerifierErrors(result.errors)
        );
    }
    if (result.errors.length === 0 && !result.checks.includes('proof')) {
        throw new CredentialVerificationUnavailableError('proof_not_confirmed');
    }

    const checks = [
        ...new Set(result.checks.filter(check => Object.hasOwn(SAFE_CHECKS, check))),
    ].sort();
    const expired = isExpiryOnly(result.errors);
    const errors = result.errors.length && !expired ? ['verification_error'] : [];
    const warnings = result.warnings.length ? ['verification_warning'] : [];
    if (expired) warnings.push(CREDENTIAL_EXPIRED_WARNING);
    if (!checks.includes('proof')) errors.push('proof_check_missing');

    if (!getCredentialSubjectDids(verificationPayload.subjectCredential).includes(subjectDid)) {
        errors.push('credential_subject_mismatch');
    }

    return {
        ...metadata,
        status: errors.length > 0 ? 'invalid' : 'valid',
        verifiedPayload: verificationPayload.verifiedPayload,
        checks,
        errors: [...new Set(errors)].toSorted(),
        warnings,
    };
};

export const verifyCredentialForIngestion = (
    input: VerifyCredentialInput,
    reportRequestFailure = true
): Promise<CredentialVerificationMetadata> =>
    // An individual eligibility rejection is not a failed insight request.
    reportRequestFailure
        ? withAiInsightStage(
              'credential_verification',
              () => verifyCredential(input),
              input.verificationOrigin
          )
        : verifyCredential(input);
