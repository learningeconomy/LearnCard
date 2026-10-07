import { describe, expect, it } from 'vitest';
import type { AuthGateState } from 'learn-card-base/auth-status/authStatus';

import {
    buildInboxClaimRedirect,
    canParticipateInExchange,
    deriveInboxClaimProfileState,
} from './inboxClaimGate';

describe('deriveInboxClaimProfileState', () => {
    it('treats every unresolved auth state as pending, never as a missing profile', () => {
        const unresolved: AuthGateState[] = [
            { tag: 'unauthenticated' },
            { tag: 'resolving' },
            { tag: 'recovering' },
            { tag: 'needs_setup' },
            { tag: 'ready', profile: { tag: 'loading' } },
            { tag: 'ready', profile: { tag: 'error' } },
            { tag: 'ready', profile: { tag: 'unconfirmed' } },
        ];

        for (const status of unresolved) {
            expect(deriveInboxClaimProfileState(status)).toBe('pending');
        }
    });

    it('reports a confirmed absence only for ready + absent', () => {
        expect(deriveInboxClaimProfileState({ tag: 'ready', profile: { tag: 'absent' } })).toBe(
            'absent'
        );
    });

    it('reports present only for ready + present', () => {
        expect(deriveInboxClaimProfileState({ tag: 'ready', profile: { tag: 'present' } })).toBe(
            'present'
        );
    });
});

describe('canParticipateInExchange', () => {
    it('requires a logged-in wallet', () => {
        expect(
            canParticipateInExchange({
                isLoggedIn: false,
                isInboxClaim: false,
                profileState: 'present',
            })
        ).toBe(false);
    });

    it('never gates generic VC flows on an LCN profile', () => {
        expect(
            canParticipateInExchange({
                isLoggedIn: true,
                isInboxClaim: false,
                profileState: 'absent',
            })
        ).toBe(true);
        expect(
            canParticipateInExchange({
                isLoggedIn: true,
                isInboxClaim: false,
                profileState: 'pending',
            })
        ).toBe(true);
    });

    it('requires a confirmed profile before a Universal Inbox exchange', () => {
        expect(
            canParticipateInExchange({
                isLoggedIn: true,
                isInboxClaim: true,
                profileState: 'present',
            })
        ).toBe(true);
        expect(
            canParticipateInExchange({
                isLoggedIn: true,
                isInboxClaim: true,
                profileState: 'absent',
            })
        ).toBe(false);
        expect(
            canParticipateInExchange({
                isLoggedIn: true,
                isInboxClaim: true,
                profileState: 'pending',
            })
        ).toBe(false);
    });
});

describe('buildInboxClaimRedirect', () => {
    it('rebuilds the exact /request claim link, encoding the exchange URL', () => {
        const exchangeUrl = 'https://network.learncard.com/api/workflows/inbox-claim/exchanges/a b';

        expect(buildInboxClaimRedirect(exchangeUrl)).toBe(
            `/request?vc_request_url=${encodeURIComponent(exchangeUrl)}`
        );
    });

    it('accepts the parsed query array form and returns null when missing', () => {
        expect(buildInboxClaimRedirect(['https://example.com/exchange', 'ignored'])).toBe(
            `/request?vc_request_url=${encodeURIComponent('https://example.com/exchange')}`
        );
        expect(buildInboxClaimRedirect(null)).toBeNull();
        expect(buildInboxClaimRedirect(undefined)).toBeNull();
        expect(buildInboxClaimRedirect('')).toBeNull();
        expect(buildInboxClaimRedirect([])).toBeNull();
    });
});
