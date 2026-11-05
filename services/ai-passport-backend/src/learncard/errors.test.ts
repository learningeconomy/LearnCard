import { describe, expect, test } from 'bun:test';
import { TRPCClientError } from '@trpc/client';

import {
    classifyLearnCardFailure,
    describeLearnCardFailure,
    describeLearnCardInitFailure,
    isTransientLearnCardFailure,
    learnCardFailureLogFields,
    LearnCardTimeoutError,
    LearnCardUnavailableError,
} from './errors';

// The shape network.learncard.com returns from contracts.getConsentedDataForDid
// when the subject DID has no LearnCard profile.
const trpcFailure = (code: string, httpStatus: number) =>
    TRPCClientError.from({
        error: {
            message: 'synthetic-private-payload',
            code: -32004,
            data: { code, httpStatus, path: 'contracts.getConsentedDataForDid' },
        },
    });

// What a refused connection looks like once tRPC wraps the fetch failure.
const networkFailure = (errno: string) =>
    TRPCClientError.from(
        Object.assign(new TypeError('fetch failed: synthetic-private-url'), {
            cause: Object.assign(new Error('connect synthetic-private-host'), {
                code: errno,
            }),
        })
    );

describe('classifyLearnCardFailure', () => {
    test('classifies a missing LearnCard profile from the tRPC code', () => {
        expect(classifyLearnCardFailure(trpcFailure('NOT_FOUND', 404))).toBe(
            'learncard_subject_not_found'
        );
    });

    test.each([
        ['UNAUTHORIZED', 401],
        ['FORBIDDEN', 403],
    ])('gives a rejected service identity its own code (%s)', (code, status) => {
        expect(classifyLearnCardFailure(trpcFailure(code, status))).toBe('learncard_unauthorized');
    });

    test('classifies other tRPC failures as unavailable', () => {
        expect(classifyLearnCardFailure(trpcFailure('INTERNAL_SERVER_ERROR', 500))).toBe(
            'learncard_unavailable'
        );
    });

    test('classifies a network failure as unavailable and keeps its errno', () => {
        const error = networkFailure('ECONNREFUSED');
        expect(classifyLearnCardFailure(error)).toBe('learncard_unavailable');
        expect(describeLearnCardFailure(error)).toEqual({
            errorClass: 'TRPCClientError',
            causeErrno: 'ECONNREFUSED',
        });
    });

    test('classifies service initialization failures from their kept cause', () => {
        expect(classifyLearnCardFailure(new LearnCardUnavailableError())).toBe(
            'learncard_unavailable'
        );
        const unauthorized = new LearnCardUnavailableError(
            describeLearnCardFailure(trpcFailure('UNAUTHORIZED', 401))
        );
        expect(classifyLearnCardFailure(unauthorized)).toBe('learncard_unauthorized');
        expect(unauthorized.detail).toEqual({
            errorClass: 'TRPCClientError',
            trpcCode: 'UNAUTHORIZED',
            httpStatus: 401,
        });
    });

    test('classifies our own call bound as a timeout', () => {
        const error = new LearnCardTimeoutError();
        expect(error.name).toBe('TimeoutError');
        expect(classifyLearnCardFailure(error)).toBe('learncard_timeout');
    });

    test('leaves unrelated failures unclassified', () => {
        expect(classifyLearnCardFailure(new Error('other'))).toBeUndefined();
        expect(classifyLearnCardFailure('not-an-error')).toBeUndefined();
    });
});

describe('learnCardFailureLogFields', () => {
    test('keeps only structured fields, never messages, paths or values', () => {
        const fields = learnCardFailureLogFields(trpcFailure('UNAUTHORIZED', 401));
        expect(fields).toEqual({
            learncardErrorClass: 'TRPCClientError',
            trpcCode: 'UNAUTHORIZED',
            httpStatus: 401,
        });
        expect(JSON.stringify(fields)).not.toContain('synthetic-private');
        expect(JSON.stringify(fields)).not.toContain('contracts.');
    });

    test('drops codes and classes outside the allowlists', () => {
        const error = Object.assign(new Error('x'), {
            name: 'did:web:synthetic-private-name',
            data: { code: 'seed-synthetic-private', httpStatus: 9999 },
            cause: { code: 'has spaces synthetic-private' },
        });
        expect(learnCardFailureLogFields(error)).toEqual({
            learncardErrorClass: 'Error',
        });
    });
});

test("an init failure keeps what kind of cause it was, never the cause's text", () => {
    const secret = 'did:web:private.example:users:PRIVATE_SENTINEL';
    const detail = describeLearnCardInitFailure(
        `error sending request for url (https://private.example/${secret}/did.json): dns error`,
        2
    );
    expect(detail).toEqual({
        errorClass: 'unknown',
        causeKind: 'other',
        initAttempts: 2,
    });
    expect(JSON.stringify(detail)).not.toContain('PRIVATE_SENTINEL');
    expect(describeLearnCardInitFailure(42, 99)).toEqual({
        errorClass: 'unknown',
        initAttempts: 10,
    });
});

// The exact strings DIDKit throws from initLearnCard, reproduced against the
// real service init with a seed outside the did:web document and with a
// did:web the network has no profile for.
describe('service identity misconfiguration', () => {
    test("SEED's key missing from the did:web document is key_mismatch, and not transient", () => {
        const detail = describeLearnCardInitFailure('Key mismatch', 1);
        expect(detail).toEqual({
            errorClass: 'unknown',
            causeKind: 'key_mismatch',
            initAttempts: 1,
        });
        expect(isTransientLearnCardFailure(detail)).toBe(false);
    });

    test('a did:web the network does not know is did_not_found, and not transient', () => {
        const detail = describeLearnCardInitFailure('notFound', 1);
        expect(detail.causeKind).toBe('did_not_found');
        expect(isTransientLearnCardFailure(detail)).toBe(false);
    });

    test('a did.json fetch blip stays transient', () => {
        const detail = describeLearnCardInitFailure(
            'Error sending HTTP request (https://example.test/did.json)',
            1
        );
        expect(detail.causeKind).toBe('other');
        expect(isTransientLearnCardFailure(detail)).toBe(true);
    });
});
