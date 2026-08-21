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
            recordDiagnosticLog({ level: 'info', message: `entry-${index}` });
        }
        const records = getDiagnosticLogs();
        expect(records).toHaveLength(200);
        expect(records[0].message).toBe('entry-5');
        expect(records[199].message).toBe('entry-204');
    });

    it('records scope, level, and an ISO timestamp', () => {
        recordDiagnosticLog({ level: 'warning', scope: 'wallet', message: 'low balance' });

        const entry = getDiagnosticLogs()[0];
        expect(entry.level).toBe('warning');
        expect(entry.scope).toBe('wallet');
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
            message: 'boom',
        });
        expect('scope' in entry).toBe(false);
        expect('data' in entry).toBe(false);
    });

    it('drops oldest entries one at a time as new ones arrive', () => {
        for (let index = 0; index < 200; index += 1) {
            recordDiagnosticLog({ level: 'info', message: `entry-${index}` });
        }
        recordDiagnosticLog({ level: 'info', message: 'entry-200' });

        const records = getDiagnosticLogs();
        expect(records).toHaveLength(200);
        expect(records[0].message).toBe('entry-1');
        expect(records[199].message).toBe('entry-200');
    });
});

// ---------------------------------------------------------------------------
// Forced sanitization
// ---------------------------------------------------------------------------

describe('diagnosticLogBuffer sanitization', () => {
    it('always scrubs keys and sensitive string shapes', () => {
        recordDiagnosticLog({
            level: 'error',
            message: 'failed for alice@example.com did:key:z6Secret',
            data: {
                allowPii: true,
                accessToken: 'secret',
                header: 'Bearer abc.def.ghi',
                url: 'https://learncard.app/claim?token=secret#fragment',
            },
        });
        expect(getDiagnosticLogs()[0]).toMatchObject({
            message: 'failed for [scrubbed-email] [scrubbed-did]',
            data: {
                accessToken: '[scrubbed]',
                header: '[scrubbed]',
                url: 'https://learncard.app/claim',
            },
        });
        // allowPii must be stripped entirely — the buffer never trusts the bypass flag
        expect('allowPii' in (getDiagnosticLogs()[0].data as Record<string, unknown>)).toBe(false);
    });

    it('scrubs PII keys recursively in nested objects and arrays', () => {
        recordDiagnosticLog({
            level: 'warning',
            message: 'batch failed',
            data: {
                user: { email: 'alice@example.com', code: 404 },
                items: [{ accessToken: 'tok-1' }, { did: 'did:key:z6MkSecret' }],
                safe: 'visible',
            },
        });

        expect(getDiagnosticLogs()[0].data).toEqual({
            user: { email: '[scrubbed]', code: 404 },
            items: [{ accessToken: '[scrubbed]' }, { did: '[scrubbed]' }],
            safe: 'visible',
        });
    });

    it('redacts emails, DIDs, bearer tokens, and JWTs embedded in messages', () => {
        recordDiagnosticLog({
            level: 'error',
            message:
                'auth failed for bob@example.org with did:web:example.com header Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c retry',
        });

        expect(getDiagnosticLogs()[0].message).toBe(
            'auth failed for [scrubbed-email] with [scrubbed-did] header [scrubbed] retry'
        );
    });

    it('redacts standalone JWT-shaped strings in data values', () => {
        recordDiagnosticLog({
            level: 'info',
            message: 'rejected token',
            data: { payload: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123_-DEF' },
        });

        expect(getDiagnosticLogs()[0].data).toEqual({ payload: '[scrubbed]' });
    });

    it('strips query strings and fragments from URLs in strings', () => {
        recordDiagnosticLog({
            level: 'info',
            message: 'navigated to https://learncard.app/claim?token=secret#fragment ok',
            data: { deepLink: 'https://learncard.app/wallet?email=alice@example.com' },
        });

        expect(getDiagnosticLogs()[0].message).toBe('navigated to https://learncard.app/claim ok');
        expect(getDiagnosticLogs()[0].data).toEqual({ deepLink: 'https://learncard.app/wallet' });
    });

    it('sanitizes Error values to name and message', () => {
        const err = new Error('failed for alice@example.com');
        recordDiagnosticLog({ level: 'error', message: 'crashed', data: { cause: err } });

        expect(getDiagnosticLogs()[0].data).toEqual({
            cause: { name: 'Error', message: 'failed for [scrubbed-email]' },
        });
    });

    it('replaces circular references', () => {
        const data: Record<string, unknown> = { label: 'outer' };
        data.self = data;

        recordDiagnosticLog({ level: 'error', message: 'circular', data });

        expect(getDiagnosticLogs()[0].data).toMatchObject({
            label: 'outer',
            self: '[circular]',
        });
    });

    it('caps nesting depth at 10 levels', () => {
        let data: Record<string, unknown> = { leaf: 'value' };
        for (let index = 0; index < 15; index += 1) data = { child: data };

        recordDiagnosticLog({ level: 'info', message: 'deep', data });

        let walked: unknown = getDiagnosticLogs()[0].data;
        for (let index = 0; index < 11; index += 1) {
            walked = (walked as Record<string, unknown>).child;
        }
        expect(walked).toBe('[truncated]');
    });

    it('truncates strings longer than 1000 characters', () => {
        const long = 'x'.repeat(1500);
        recordDiagnosticLog({ level: 'info', message: long, data: { blob: long } });

        const entry = getDiagnosticLogs()[0];
        expect(entry.message.startsWith('x'.repeat(1000))).toBe(true);
        expect(entry.message.endsWith('[truncated]')).toBe(true);
        expect(entry.message.length).toBeLessThanOrEqual(1000 + '[truncated]'.length);
        expect((entry.data as Record<string, string>).blob.endsWith('[truncated]')).toBe(true);
    });

    it('keeps primitive values untouched', () => {
        recordDiagnosticLog({
            level: 'info',
            message: 'flags',
            data: { enabled: true, count: 42, ratio: 0.5, nothing: null },
        });

        expect(getDiagnosticLogs()[0].data).toEqual({
            enabled: true,
            count: 42,
            ratio: 0.5,
            nothing: null,
        });
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
        expect(getDiagnosticLogs()[0].message).toBe('recorded');
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
            data: { nested: { key: 'value' } },
        });

        const first = getDiagnosticLogs();
        first[0].message = 'tampered';
        (first[0].data as Record<string, unknown>).nested = 'tampered';
        first.pop();

        const second = getDiagnosticLogs();
        expect(second).toHaveLength(1);
        expect(second[0].message).toBe('original');
        expect(second[0].data).toEqual({ nested: { key: 'value' } });
    });
});
