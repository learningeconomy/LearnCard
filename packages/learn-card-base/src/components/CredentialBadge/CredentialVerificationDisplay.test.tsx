// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({ source: 'unknown' }));
vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: () => ({ data: { source: mocks.source } }),
}));
vi.mock('learn-card-base/i18n', () => ({ useT: () => (key: string) => key }));
vi.mock('./CredentialIssuerPopover', () => ({ default: () => null }));

import CredentialVerificationDisplay from './CredentialVerificationDisplay';

const credential = {
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:learner' },
} as VC;

describe('issuer names do not confer trust', () => {
    it.each([
        ['trusted', 'Trusted Issuer'],
        ['unknown', 'Unknown Issuer'],
        ['untrusted', 'Untrusted Issuer'],
    ])('preserves %s classification when an issuer display name is supplied', (source, state) => {
        mocks.source = source!;
        render(
            <CredentialVerificationDisplay
                credential={credential}
                issuerDisplayName="University"
                showText
            />
        );
        expect(screen.getByRole('button').getAttribute('aria-label')).toBe(
            `Open issuer details for ${state}`
        );
    });

    it.each(['unknown', 'untrusted'])('keeps trusted-only badges hidden for %s issuers', source => {
        mocks.source = source;
        render(
            <CredentialVerificationDisplay
                credential={credential}
                issuerDisplayName="University"
                trustedOnly
                showText
            />
        );
        expect(screen.queryByRole('button')).toBeNull();
    });
});
