import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFixture, isCredentialFixture } from '@learncard/credential-library';
import { prepareViewerFixture } from './prepare';

const NOW = new Date('2026-09-30T12:00:00Z');

afterEach(() => vi.useRealTimers());

describe('Viewer fixture expiration', () => {
    it.each([false, true])('keeps expiration historical only when opted in: %s', keepDates => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        const fixture = getFixture('obv3/qualification-expired');
        if (!isCredentialFixture(fixture)) throw new Error('Expected W3C fixture');
        const prepared = prepareViewerFixture(
            fixture,
            { issuerDid: 'did:example:issuer', subjectDid: 'did:example:recipient' },
            keepDates
        );

        expect(new Date(prepared.validUntil!).getTime() < NOW.getTime()).toBe(keepDates);
        expect(prepared.validFrom).toBe(
            keepDates ? fixture.credential.validFrom : NOW.toISOString()
        );
        expect(fixture.credential.validUntil).toBe('2024-01-01T00:00:00Z');
    });
});
