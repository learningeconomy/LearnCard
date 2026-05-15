// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('react-flip-toolkit', () => ({
    Flipped: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../CertificateDisplayCard/VerifierStateBadgeAndText', () => ({
    __esModule: true,
    default: () => <div data-testid="verifier-state-badge" />,
    VERIFIER_STATES: {
        selfVerified: 'selfVerified',
        trustedVerifier: 'trustedVerifier',
        untrustedVerifier: 'untrustedVerifier',
        appIssuer: 'appIssuer',
        unknownVerifier: 'unknownVerifier',
    },
}));

import VC2FrontFaceInfo from '../VC2FrontFaceInfo';

describe('VC2FrontFaceInfo', () => {
    test('uses a 43px issuee silhouette and a 22px issuer silhouette for badge fallback', () => {
        const credential = {
            issuer: '',
            issuanceDate: '2026-05-15T00:00:00.000Z',
            credentialSubject: {
                id: '',
                achievement: {
                    name: 'Badge Title',
                    description: 'Badge description',
                },
            },
            display: {
                displayType: 'badge',
            },
        };

        const { container } = render(
            <VC2FrontFaceInfo
                credential={credential as any}
                issuee=""
                issuer=""
                title="Badge Title"
                createdAt="May 15, 2026"
                knownDIDRegistry={{ source: 'unknown', results: {} }}
            />
        );

        const silhouettes = Array.from(container.querySelectorAll('svg'));
        const issueeSilhouette = silhouettes.find(svg => svg.classList.contains('h-[43px]'));
        const issuerSilhouette = silhouettes.find(svg => svg.classList.contains('h-[22px]'));

        expect(issueeSilhouette).not.toBeUndefined();
        expect(issueeSilhouette?.classList.contains('w-[43px]')).toBe(true);
        expect(issuerSilhouette).not.toBeUndefined();
        expect(issuerSilhouette?.classList.contains('w-[22px]')).toBe(true);
    });
});
