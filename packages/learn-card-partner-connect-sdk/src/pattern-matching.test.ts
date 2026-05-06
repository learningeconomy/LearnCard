/**
 * Direct unit tests for `PartnerConnect.matchesOriginPattern`.
 *
 * These complement the integration-level tests in `origin-resolution.test.ts`
 * by exercising the pure pattern matcher in isolation, without spinning up the
 * full SDK / jsdom location stub. The matcher is the security-critical core
 * of the whitelist, so it gets its own focused test file.
 */

import { PartnerConnect } from './index';

const matches = PartnerConnect.matchesOriginPattern.bind(PartnerConnect);

describe('PartnerConnect.matchesOriginPattern', () => {
    describe('exact matches (no wildcard)', () => {
        test.each([
            ['https://learncard.app', 'https://learncard.app'],
            ['https://vetpass.app', 'https://vetpass.app'],
            ['http://localhost:3000', 'http://localhost:3000'],
            ['capacitor://localhost', 'capacitor://localhost'],
        ])('%s matches itself', (origin, pattern) => {
            expect(matches(origin, pattern)).toBe(true);
        });

        test.each([
            // Different protocol.
            ['http://learncard.app', 'https://learncard.app'],
            // Different port.
            ['https://learncard.app:8443', 'https://learncard.app'],
            // Different host entirely.
            ['https://other.com', 'https://learncard.app'],
            // Trailing path is part of the input — only the origin should match.
            ['https://learncard.app/foo', 'https://learncard.app'],
        ])('%s does not match %s', (candidate, pattern) => {
            expect(matches(candidate, pattern)).toBe(false);
        });
    });

    describe('leading-label wildcards', () => {
        const PATTERN = 'https://*.learncard.app';

        test.each([
            'https://staging.learncard.app',
            'https://alpha.learncard.app',
            'https://pr-123.learncard.app',
            // Multi-label prefix is allowed.
            'https://pr-123.preview.learncard.app',
            'https://a.b.c.learncard.app',
        ])('matches %s', candidate => {
            expect(matches(candidate, PATTERN)).toBe(true);
        });

        test.each([
            // Apex of the trusted domain — caller must add the bare origin
            // explicitly if they want to trust it.
            'https://learncard.app',
            // Protocol mismatch.
            'http://staging.learncard.app',
            // Port mismatch.
            'https://staging.learncard.app:8443',
            // Suffix confusion: the trusted suffix is somewhere in the host
            // string, but the actual eTLD+1 is `attacker.com`.
            'https://learncard.app.attacker.com',
            'https://staging.learncard.app.attacker.com',
            // Trailing dot / double dot edge cases.
            'https://.learncard.app',
            // Host with leading `.` after a label is rejected by URL parser
            // already, but also covered.
            'https://..learncard.app',
            // Different domain entirely.
            'https://staging.vetpass.app',
        ])('rejects %s', candidate => {
            expect(matches(candidate, PATTERN)).toBe(false);
        });
    });

    describe('disallowed wildcard shapes', () => {
        // Wildcards may only be a leading label. The matcher must reject any
        // exotic placement so the rule stays predictable and auditable.
        test.each([
            // Wildcard in the middle.
            ['https://staging.learncard.app', 'https://staging.*.app'],
            // Wildcard as a partial label.
            ['https://api-staging.learncard.app', 'https://api-*.learncard.app'],
            // Wildcard in the TLD position.
            ['https://learncard.app', 'https://learncard.*'],
            // Wildcard with no following label.
            ['https://staging.learncard.app', 'https://*'],
            // Multiple disjoint wildcards.
            ['https://a.b.learncard.app', 'https://*.*.learncard.app'],
        ])('rejects %s against %s', (candidate, pattern) => {
            expect(matches(candidate, pattern)).toBe(false);
        });
    });

    describe('port handling', () => {
        test('matches when both pattern and candidate share the same port', () => {
            expect(
                matches('https://staging.learncard.app:8443', 'https://*.learncard.app:8443')
            ).toBe(true);
        });

        test('rejects when only the candidate specifies a port', () => {
            expect(
                matches('https://staging.learncard.app:8443', 'https://*.learncard.app')
            ).toBe(false);
        });

        test('rejects when only the pattern specifies a port', () => {
            expect(
                matches('https://staging.learncard.app', 'https://*.learncard.app:8443')
            ).toBe(false);
        });
    });

    describe('malformed input', () => {
        test.each([
            ['', 'https://learncard.app'],
            ['not a url', 'https://learncard.app'],
            ['https://staging.learncard.app', ''],
            ['https://staging.learncard.app', 'not a url'],
            ['https://staging.learncard.app', 'https://*'],
        ])('rejects (%s, %s)', (candidate, pattern) => {
            expect(matches(candidate, pattern)).toBe(false);
        });
    });

    describe('cross-protocol wildcards', () => {
        test('http wildcard pattern only matches http origins', () => {
            expect(matches('http://staging.dev.local', 'http://*.dev.local')).toBe(true);
            expect(matches('https://staging.dev.local', 'http://*.dev.local')).toBe(false);
        });
    });
});
