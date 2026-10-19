// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const host = vi.hoisted(() => ({
    card: vi.fn(),
    verify: vi.fn(async () => []),
}));

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonContent: ({ children }: React.PropsWithChildren) => <main>{children}</main>,
    IonFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'ribbon' }));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: async () => ({ invoke: { verifyCredential: host.verify } }) }),
}));
vi.mock('learn-card-base/i18n', () => ({
    useT: () => (key: string) => key.split('.').pop(),
}));
vi.mock('learn-card-base/svgs/ThreeDots', () => ({
    default: () => <svg aria-label="Options" />,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: (props: { isFrontOverride: boolean }) => {
        host.card(props);
        return <div>{props.isFrontOverride ? 'Credential front' : 'Credential details'}</div>;
    },
}));
vi.mock('../../../../hooks/useHighlightedCredentials', () => ({
    useHighlightedCredentials: () => ({ credentials: [] }),
}));
vi.mock('../../../../helpers/troop.helpers', () => ({
    getRoleFromCred: vi.fn(),
    getScoutsNounForRole: vi.fn(),
}));

import NonBoostPreview from './NonBoostPreview';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:recipient' },
    name: 'External credential',
} as VC;

const baseProps = {
    credential,
    categoryType: 'Social Badge' as never,
    verificationItems: [],
    customThumbComponent: undefined,
    customBodyCardComponent: undefined,
    customFooterComponent: undefined,
    customIssueHistoryComponent: undefined,
    handleCloseModal: vi.fn(),
};

describe('standalone credential footer', () => {
    it.each(['Social Badge', 'Merit Badge', 'Achievement', 'ID'])(
        'shows the shared footer for %s and keeps its actions working on both sides',
        async categoryType => {
            const close = vi.fn();
            const share = vi.fn();
            const options = vi.fn();
            const { container } = render(
                <NonBoostPreview
                    {...baseProps}
                    categoryType={categoryType as never}
                    handleCloseModal={close}
                    handleShareBoost={share}
                    onDotsClick={options}
                />
            );
            await waitFor(() => expect(host.verify).toHaveBeenCalled());

            const footer = container.querySelector('footer')!;
            expect(footer.className).toContain('backdrop-blur');
            expect(footer.className).toContain('bg-opacity-60');
            const controls = within(footer);
            fireEvent.click(controls.getByRole('button', { name: 'details' }));
            expect(screen.getByText('Credential details')).toBeTruthy();
            fireEvent.click(controls.getByRole('button', { name: 'share' }));
            fireEvent.click(controls.getByRole('button', { name: 'Options' }));
            fireEvent.click(controls.getByRole('button', { name: 'back' }));
            expect(screen.getByText('Credential front')).toBeTruthy();
            fireEvent.click(controls.getByRole('button', { name: 'X' }));

            expect(share).toHaveBeenCalledOnce();
            expect(options).toHaveBeenCalledOnce();
            expect(close).toHaveBeenCalledOnce();
            expect(host.card).toHaveBeenLastCalledWith(
                expect.objectContaining({ credential, hideNavButtons: true, isFrontOverride: true })
            );
            // Keep the options control in the footer rather than duplicating it inside the card.
            expect(host.card.mock.calls.at(-1)?.[0].onDotsClick).toBeUndefined();
        }
    );

    it('omits unavailable share and menu actions', async () => {
        render(<NonBoostPreview {...baseProps} />);
        await waitFor(() => expect(host.verify).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: 'share' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Options' })).toBeNull();
        expect(screen.getByRole('button', { name: 'details' })).toBeTruthy();
    });

    it('preserves credential presentation overrides and supplied verification results', async () => {
        const overrides = {
            issueeOverride: 'Scout',
            issuerOverride: 'World Scouting',
            titleOverride: 'Bridge Builders Challenge',
            unknownVerifierTitle: 'National Organization',
            verificationItems: [{ status: 'Success', check: 'proof' }] as never,
            customThumbComponent: <span>Badge</span>,
        };
        render(<NonBoostPreview {...baseProps} {...overrides} />);
        await waitFor(() => expect(host.verify).toHaveBeenCalled());
        expect(host.card).toHaveBeenLastCalledWith(expect.objectContaining(overrides));
    });

    it('uses wallet verification when results are omitted and honors hidden verifications', async () => {
        const results = [{ status: 'Success', check: 'proof' }];
        host.verify.mockResolvedValueOnce(results as never);
        const { rerender } = render(
            <NonBoostPreview {...baseProps} verificationItems={undefined} />
        );
        await waitFor(() =>
            expect(host.card).toHaveBeenLastCalledWith(
                expect.objectContaining({ verificationItems: results })
            )
        );

        rerender(
            <NonBoostPreview
                {...baseProps}
                verificationItems={undefined}
                showVerifications={false}
            />
        );
        expect(host.card).toHaveBeenLastCalledWith(
            expect.objectContaining({ verificationItems: [] })
        );
    });
});
