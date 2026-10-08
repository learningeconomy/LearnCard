import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearDiagnosticLogs,
    getDiagnosticLogs,
    recordDiagnosticLog,
    setDiagnosticLogCollectionEnabled,
} from './diagnosticLogBuffer';

// ---------------------------------------------------------------------------
// Reset module state between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
    clearDiagnosticLogs();
    setDiagnosticLogCollectionEnabled(true);
});

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

describe('diagnosticLogBuffer capacity', () => {
    it('keeps only the newest 200 records', () => {
        for (let index = 0; index < 205; index += 1) {
            recordDiagnosticLog({
                level: 'info',
                message: `entry-${index}`,
                data: { count: index },
            });
        }
        const records = getDiagnosticLogs();
        expect(records).toHaveLength(200);
        expect(records[0].data).toEqual({ count: 5 });
        expect(records[199].data).toEqual({ count: 204 });
    });

    it('records scope, level, and an ISO timestamp', () => {
        recordDiagnosticLog({ level: 'warning', scope: 'wallet', message: 'low balance' });

        const entry = getDiagnosticLogs()[0];
        expect(entry.level).toBe('warning');
        expect(entry.scope).toBe('wallet');
        expect(entry.message).toBe('[scrubbed]');
        expect(entry.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
        );
    });

    it('omits scope and data when not provided', () => {
        recordDiagnosticLog({ level: 'error', message: 'boom' });

        const entry = getDiagnosticLogs()[0];
        expect(entry).toEqual({
            timestamp: entry.timestamp,
            level: 'error',
            message: '[scrubbed]',
        });
        expect('scope' in entry).toBe(false);
        expect('data' in entry).toBe(false);
    });

    it('drops oldest entries one at a time as new ones arrive', () => {
        for (let index = 0; index < 200; index += 1) {
            recordDiagnosticLog({
                level: 'info',
                message: `entry-${index}`,
                data: { count: index },
            });
        }
        recordDiagnosticLog({ level: 'info', message: 'entry-200', data: { count: 200 } });

        const records = getDiagnosticLogs();
        expect(records).toHaveLength(200);
        expect(records[0].data).toEqual({ count: 1 });
        expect(records[199].data).toEqual({ count: 200 });
    });
});

// ---------------------------------------------------------------------------
// Forced sanitization
// ---------------------------------------------------------------------------

describe('diagnosticLogBuffer sanitization', () => {
    it('retains only event-safe messages and removes credential paths and arbitrary prose', () => {
        recordDiagnosticLog({
            level: 'error',
            message:
                'claim failed at /claim/credential-secret and https://learncard.app/claim/secret?token=hidden',
        });
        recordDiagnosticLog({ level: 'warning', message: 'feedback.screenshot.capture_failed' });

        expect(getDiagnosticLogs().map(entry => entry.message)).toEqual([
            '[scrubbed]',
            'feedback.screenshot.capture_failed',
        ]);
    });

    it('redacts sensitive shapes in event messages', () => {
        recordDiagnosticLog({
            level: 'error',
            message: 'failed for alice@example.com did:key:z6Secret',
        });

        expect(getDiagnosticLogs()[0].message).toBe('[scrubbed]');
    });

    it('allows only bounded boolean, count, and status metadata', () => {
        recordDiagnosticLog({
            level: 'warning',
            message: 'retry failed',
            data: {
                enabled: true,
                count: 3,
                attempt: 2,
                status: 'pending',
                ratio: 0.5,
                arbitrary: 'private input',
                unknownStatus: 'failure',
                invalidStatus: 'profile-secret',
            },
        });

        expect(getDiagnosticLogs()[0].data).toEqual({
            enabled: true,
            count: 3,
            attempt: 2,
            status: 'pending',
        });
    });

    it('redacts emails, DIDs, bearer tokens, and JWTs embedded in messages', () => {
        recordDiagnosticLog({
            level: 'error',
            message:
                'auth failed for bob@example.org with did:web:example.com header Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c retry',
        });

        expect(getDiagnosticLogs()[0].message).toBe('[scrubbed]');
    });

    it('omits data that contains no allowlisted metadata', () => {
        recordDiagnosticLog({
            level: 'info',
            message: 'rejected token',
            data: { payload: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123_-DEF' },
        });

        expect('data' in getDiagnosticLogs()[0]).toBe(false);
    });

    it('omits arbitrary messages even when a URL has no query string', () => {
        recordDiagnosticLog({
            level: 'info',
            message: 'navigated to https://learncard.app/claim?token=secret#fragment ok',
            data: { deepLink: 'https://learncard.app/wallet?email=alice@example.com' },
        });

        expect(getDiagnosticLogs()[0].message).toBe('[scrubbed]');
        expect('data' in getDiagnosticLogs()[0]).toBe(false);
    });

    it('omits overlong arbitrary messages', () => {
        const long = 'x'.repeat(1500);
        recordDiagnosticLog({ level: 'info', message: long, data: { blob: long } });

        const entry = getDiagnosticLogs()[0];
        expect(entry.message).toBe('[scrubbed]');
        expect('data' in entry).toBe(false);
    });

    it('keeps only allowlisted bounded diagnostic metadata from realistic credential logs', () => {
        const secretSymbol = Symbol('secret');

        recordDiagnosticLog({
            level: 'error',
            scope: 'credential-claim',
            message: 'credential claim failed',
            data: {
                status: 'failure',
                count: 2,
                enabled: false,
                uri: 'https://learncard.app/claim/secret?token=hidden',
                credentialId: 'urn:uuid:credential-secret',
                claimUrl: '/claim/secret-code',
                arbitrary: 'a free-form value must not leave the device',
                credential: {
                    credentialSubject: { name: 'Private badge' },
                    boost: { uri: 'lc:boost:private' },
                },
                entries: ['private value', { profileId: 'profile-secret' }],
                bigint: 42n,
                callback: () => undefined,
                symbol: secretSymbol,
            },
        });

        const [entry] = getDiagnosticLogs();

        expect(entry.data).toEqual({ status: 'failure', count: 2, enabled: false });
        expect(() => JSON.stringify(entry)).not.toThrow();
    });

    it('redacts a scope that is not a bounded logger namespace', () => {
        recordDiagnosticLog({ level: 'info', scope: 'profile id: private', message: 'opened' });

        expect(getDiagnosticLogs()[0].scope).toBe('[scrubbed]');
    });
});

// ---------------------------------------------------------------------------
// Collection control
// ---------------------------------------------------------------------------

describe('diagnosticLogBuffer collection control', () => {
    it('does not record while collection is disabled', () => {
        setDiagnosticLogCollectionEnabled(false);

        recordDiagnosticLog({ level: 'info', message: 'hidden' });

        expect(getDiagnosticLogs()).toEqual([]);
    });

    it('clears the buffer when collection is disabled', () => {
        recordDiagnosticLog({ level: 'info', message: 'before' });

        setDiagnosticLogCollectionEnabled(false);

        expect(getDiagnosticLogs()).toEqual([]);
    });

    it('resumes recording when collection is re-enabled', () => {
        setDiagnosticLogCollectionEnabled(false);
        setDiagnosticLogCollectionEnabled(true);

        recordDiagnosticLog({ level: 'info', message: 'recorded' });

        expect(getDiagnosticLogs()).toHaveLength(1);
        expect(getDiagnosticLogs()[0].message).toBe('[scrubbed]');
    });

    it('clears all entries', () => {
        recordDiagnosticLog({ level: 'info', message: 'one' });
        recordDiagnosticLog({ level: 'info', message: 'two' });

        clearDiagnosticLogs();

        expect(getDiagnosticLogs()).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Copy-on-read
// ---------------------------------------------------------------------------

describe('diagnosticLogBuffer copy-on-read', () => {
    it('returns copies that cannot mutate the buffer', () => {
        recordDiagnosticLog({
            level: 'info',
            message: 'original',
            data: { count: 1 },
        });

        const first = getDiagnosticLogs();
        first[0].message = 'tampered';
        (first[0].data as Record<string, unknown>).count = 2;
        first.pop();

        const second = getDiagnosticLogs();
        expect(second).toHaveLength(1);
        expect(second[0].message).toBe('[scrubbed]');
        expect(second[0].data).toEqual({ count: 1 });
    });
});
