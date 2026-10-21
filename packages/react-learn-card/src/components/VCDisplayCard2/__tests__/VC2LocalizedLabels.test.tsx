// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VerificationStatusEnum } from '@learncard/types';

import { I18nProvider } from '../../../i18n';
import VerifierStateBadgeAndText, {
    VERIFIER_STATES,
} from '../../CertificateDisplayCard/VerifierStateBadgeAndText';
import VC2BackFace from '../VC2BackFace';
import VCDisplayCard2 from '../VCDisplayCard2';

vi.mock('react-flip-toolkit', () => ({
    Flipper: ({ children }: React.PropsWithChildren) => <>{children}</>,
    Flipped: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const translations: Record<string, string> = {
    'credential.about': 'Acerca de',
    'credential.criteria': 'Criterios',
    'credential.alignments': 'Alineaciones',
    'credential.alignmentInfo': 'Las alineaciones vinculan este logro con marcos establecidos.',
    'credential.verifiedSource': 'Fuente verificada',
    'credential.verifiedLabel': 'Verificada',
    'credential.openAlignmentSource': 'Abrir la fuente de la alineación',
    'credential.occupationsPrograms': 'Ocupaciones y programas',
    'credential.more': 'Más',
    'credential.close': 'Cerrar',
    'credential.by': 'Por',
    'credential.verified': 'Credencial verificada',
    'verification.selfIssued': 'Autoemitido',
    'verification.status.success': 'Éxito',
};

const renderLocalized = (node: React.ReactNode) =>
    render(
        <I18nProvider resolve={key => translations[key]} locale="es">
            {node}
        </I18nProvider>
    );

const credential = {
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-14T00:00:00.000Z',
    credentialSubject: {
        id: 'did:example:subject',
        achievement: {
            name: 'Critical Thinking',
            description:
                'A long description that deliberately exceeds the truncation threshold so the translated expansion control is rendered for this regression test.',
            criteria: { narrative: 'Complete the critical-thinking requirements.' },
            alignment: [
                {
                    targetUrl: 'https://example.com/framework/critical-thinking',
                    targetName: 'Critical Thinking',
                    targetFramework: 'Example Framework',
                    targetType: 'ceterms:Credential',
                },
            ],
        },
    },
    display: { displayType: 'badge' },
};

describe('VCDisplayCard2 localized labels', () => {
    it('localizes back-face headings, alignment copy, and truncation controls', () => {
        const { container } = renderLocalized(
            <VC2BackFace
                credential={credential as never}
                verificationItems={[]}
                showFrontFace={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: 'Acerca de' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Criterios' })).toBeTruthy();

        const alignmentHeading = screen.getByRole('heading', { name: 'Alineaciones' });
        expect(alignmentHeading.className).toContain('text-[20px]');
        expect(alignmentHeading.className).not.toContain('text-[22px]');

        fireEvent.click(screen.getByRole('button', { name: 'Más' }));
        expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();

        const alignmentBox = alignmentHeading.closest('div.bg-white');
        expect(alignmentBox).not.toBeNull();
        fireEvent.click(within(alignmentBox as HTMLElement).getByRole('button'));

        expect(
            screen.getByText('Las alineaciones vinculan este logro con marcos establecidos.')
        ).toBeTruthy();
        expect(screen.getByText('Fuente verificada')).toBeTruthy();
        expect(screen.getByText('Verificada')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Abrir la fuente de la alineación' })).toBeTruthy();
        expect(container.textContent).not.toContain('Alignments');
    });

    it('localizes the verifier badge used on the credential front face', () => {
        renderLocalized(<VerifierStateBadgeAndText verifierState={VERIFIER_STATES.selfVerified} />);

        expect(screen.getByText('Autoemitido')).toBeTruthy();
        expect(screen.queryByText('Self Issued')).toBeNull();
    });

    it('localizes the verified-credential footer and verification status', () => {
        renderLocalized(
            <VCDisplayCard2
                credential={credential as never}
                verificationItems={[{ status: VerificationStatusEnum.Success } as never]}
                hideNavButtons
            />
        );

        expect(screen.getByText('Credencial verificada')).toBeTruthy();
        expect(screen.getByText('Éxito')).toBeTruthy();
        expect(screen.getByText('Por')).toBeTruthy();
        expect(screen.queryByText('Verified Credential')).toBeNull();
    });
});
