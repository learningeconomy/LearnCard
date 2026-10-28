import { afterEach, expect, mock, test } from 'bun:test';
import type { VC } from '@learncard/types';
import { configureProductionLogging, logSafeEvent, VERIFIER_ERROR_KINDS } from '../logging';
import {
    classifyVerifierErrors,
    CredentialVerificationUnavailableError,
    verifyCredentialForIngestion,
    type CredentialConsentReceipt,
} from './verification';

const input = {
    credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        id: 'urn:uuid:00000000-0000-4000-8000-000000000001',
        issuer: 'did:example:private-issuer',
        proof: {
            type: 'Ed25519Signature2020',
            created: '2026-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:private-issuer#key',
        },
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:private-learner', name: 'private' },
    } as VC,
    credentialUri: 'https://private.example/credential',
    subjectDid: 'did:example:private-learner',
    consent: {
        contractUri: 'private:contract',
        receiptId: 'private:receipt',
        status: 'live',
        updatedAt: '2026-01-01T00:00:00Z',
        contractUpdatedAt: '2026-01-01T00:00:00Z',
        categories: [],
        credentialUris: [],
        personalFields: [],
        purpose: 'credential-ingestion',
        revision: 'private-revision',
        guardian: { required: false, approved: false },
    } as CredentialConsentReceipt,
};

// One verifier string per kind, in the shapes the pinned SDK produces.
const samples: Record<(typeof VERIFIER_ERROR_KINDS)[number], string[]> = {
    boost_authenticity_exception: [
        'Boost authenticity could not be verified.',
        'Boost Credential could not be verified.',
    ],
    did_resolution: ['Error parsing resolution result: did:example:private-issuer not found'],
    jsonld_context: ['Remote context loading failed: https://private.example/context.json'],
    undefined_jsonld_term: [
        'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: privateTerm',
    ],
    status_list: ['Unable to fetch status list credential: https://private.example/status'],
    other: ['private credential error'],
};

const originalWarn = console.warn;
afterEach(() => {
    console.warn = originalWarn;
});

test('every verifier error kind has a sample', () => {
    expect(Object.keys(samples).toSorted()).toEqual([...VERIFIER_ERROR_KINDS].toSorted());
});

for (const [kind, errors] of Object.entries(samples))
    test(`maps ${kind} verifier errors to a fixed kind`, () => {
        expect(classifyVerifierErrors(errors)).toBe(kind as never);
    });

test('undefined JSON-LD terms are split out; unknown contexts stay jsonld_context', () => {
    /* The production boost shape: two term errors plus the boost wrapper. */
    expect(
        classifyVerifierErrors([
            'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: a',
            'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: b',
            'Boost Credential could not be verified.',
        ])
    ).toBe('undefined_jsonld_term');
    expect(classifyVerifierErrors(['Undefined JSON-LD term: x'])).toBe('undefined_jsonld_term');
    expect(classifyVerifierErrors(['Invalid relative IRI: x'])).toBe('undefined_jsonld_term');
    expect(classifyVerifierErrors(['Unknown context: https://private.example/ctx'])).toBe(
        'jsonld_context'
    );
    /* A status list outage on the same credential still names the outage. */
    expect(
        classifyVerifierErrors([
            'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: a',
            'Unable to fetch status list credential: HTTP 500',
        ])
    ).toBe('status_list');
});

test('the lowercase boost catch string wins over other unlisted errors', () => {
    expect(
        classifyVerifierErrors([
            'Remote context loading failed: x',
            'Boost authenticity could not be verified.',
        ])
    ).toBe('boost_authenticity_exception');
    // The capitalized mismatch string is a confirmed failure, not a kind.
    expect(
        classifyVerifierErrors([
            'Boost Authenticity could not be verified: Boost ID metadata is mismatched.',
            'something new',
        ])
    ).toBe('other');
});

test('an unrecognized verify result carries the kind, never the text', async () => {
    const error = await verifyCredentialForIngestion({
        ...input,
        verify: async () => ({
            errors: ['Boost authenticity could not be verified.', 'private claim'],
            checks: [],
            warnings: [],
        }),
    }).catch(failure => failure);
    expect(error).toBeInstanceOf(CredentialVerificationUnavailableError);
    expect(error.verificationSubreason).toBe('unrecognized_verifier_error');
    expect(error.verifierErrorKind).toBe('boost_authenticity_exception');
    expect(JSON.stringify(error)).not.toContain('private');
});

test('other subreasons carry no kind', async () => {
    const error = await verifyCredentialForIngestion({
        ...input,
        verify: async () => ({ errors: [], checks: [], warnings: [] }),
    }).catch(failure => failure);
    expect(error.verificationSubreason).toBe('proof_not_confirmed');
    expect(Object.hasOwn(error, 'verifierErrorKind')).toBe(false);
});

test('logging keeps a known kind only beside unrecognized_verifier_error', () => {
    const output: unknown[] = [];
    console.warn = mock((...data: unknown[]) => output.push(...data));
    const restore = configureProductionLogging('production');
    try {
        for (const code of ['credential_preload_failed', 'credential_context_failed'] as const) {
            logSafeEvent('warn', code, {
                failureCode: 'credential_verification_unavailable',
                verificationSubreason: 'unrecognized_verifier_error',
                verifierErrorKind: 'did_resolution',
            });
            logSafeEvent('warn', code, {
                failureCode: 'credential_verification_unavailable',
                verificationSubreason: 'unrecognized_verifier_error',
                verifierErrorKind: 'private text' as never,
            });
            logSafeEvent('warn', code, {
                failureCode: 'credential_verification_unavailable',
                verificationSubreason: 'sdk_timeout',
                verifierErrorKind: 'did_resolution',
            });
        }
    } finally {
        restore();
    }
    expect(output).toHaveLength(6);
    expect(output.map(event => (event as Record<string, unknown>).verifierErrorKind)).toEqual([
        'did_resolution',
        undefined,
        undefined,
        'did_resolution',
        undefined,
        undefined,
    ]);
    expect(JSON.stringify(output)).not.toContain('private');
});
