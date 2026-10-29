// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CertificateFrontFace from './CertificateFrontFace';
import CertificateBackFace from './CertificateBackFace';
import MeritBadgeFrontFace from '../MeritBadgeDisplayCard/MeritBadgeFrontFace';
import MeritBadgeBackFace from '../MeritBadgeDisplayCard/MeritBadgeBackFace';
import { I18nProvider } from '../../i18n';
import type { VC } from '@learncard/types';

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', name: 'Example school' },
    validFrom: '2026-10-26T12:00:00Z',
    awardedDate: '2027-10-01T00:00:00Z',
    credentialSubject: {
        id: 'did:example:learner',
        achievement: { name: 'Web Foundations', description: 'Completed the course.' },
    },
} as unknown as VC;

afterEach(cleanup);

describe.each([
    ['certificate front', (value: VC) => <CertificateFrontFace credential={value} />],
    [
        'certificate back',
        (value: VC) => <CertificateBackFace credential={value} verificationItems={[]} />,
    ],
    ['award front', (value: VC) => <MeritBadgeFrontFace credential={value} />],
    ['award back', (value: VC) => <MeritBadgeBackFace credential={value} verificationItems={[]} />],
] as const)('%s award date', (_, renderFace) => {
    it('shows the mapped award day instead of the issuance day', () => {
        render(renderFace(credential));
        expect(screen.getByText(/^Awarded on Oct 01, 2027(?: by)?$/)).toBeTruthy();
        expect(screen.queryByText(/Awarded on Oct 26, 2026/)).toBeNull();
    });
    it('retains the legacy issuance-date fallback', () => {
        render(renderFace({ ...credential, awardedDate: undefined }));
        expect(screen.getByText(/^Awarded on Oct 26, 2026(?: by)?$/)).toBeTruthy();
    });
    it('retains the issuance-date fallback when the award date is invalid', () => {
        render(renderFace({ ...credential, awardedDate: 'not-a-date' }));
        expect(screen.getByText(/^Awarded on Oct 26, 2026(?: by)?$/)).toBeTruthy();
    });
    it('omits the date for an undated draft', () => {
        render(renderFace({ ...credential, awardedDate: undefined, validFrom: undefined }));
        expect(screen.queryByText(/Awarded on/)).toBeNull();
    });
    it('resolves the award label through the host translation adapter', () => {
        render(
            <I18nProvider
                locale="fr"
                resolve={(key, params) =>
                    key.startsWith('credential.awardedOn')
                        ? `Décernée le ${params?.date}`
                        : undefined
                }
            >
                {renderFace(credential)}
            </I18nProvider>
        );
        expect(screen.getByText('Décernée le Oct 01, 2027')).toBeTruthy();
    });
});
