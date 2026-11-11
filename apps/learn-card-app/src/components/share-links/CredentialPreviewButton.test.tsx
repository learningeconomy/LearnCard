import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
    boostPreview: vi.fn(),
    isBoost: true,
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    ModalTypes: { FullScreen: 'fullscreen' },
    BoostCategoryOptionsEnum: { achievement: 'Achievement' },
    useGetVCInfo: () => ({ title: 'Shared badge' }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    isBoostCredential: () => mocks.isBoost,
}));
vi.mock('../boost/boostCMS/BoostPreview/BoostPreview', () => ({
    default: (props: { sharedOriginal?: boolean }) => {
        mocks.boostPreview(props);
        return null;
    },
}));
vi.mock('../boost/boostCMS/BoostPreview/NonBoostPreview', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadgeNew', () => ({
    default: () => null,
}));

import { CredentialPreviewButton } from './CredentialPreviewButton';

const wrappedCredential = {
    type: ['VerifiableCredential', 'CertifiedBoostCredential'],
    boostId: 'lc:boost:issuer-edited',
    boostCredential: { name: 'Signed snapshot' },
} as unknown as VC;

type ModalElement = React.ReactElement<{ onClose: () => void }>;
type ModalOptions = { onClose?: () => void };

const lastModal = () => {
    const [element, options] = mocks.newModal.mock.calls.at(-1) as [ModalElement, ModalOptions];
    return { element, options };
};

const eyeButton = () => screen.getByRole('button');

beforeEach(() => {
    mocks.newModal.mockReset();
    mocks.closeModal.mockReset();
    mocks.boostPreview.mockReset();
    mocks.isBoost = true;
});
afterEach(cleanup);

describe('CredentialPreviewButton', () => {
    it('opens only one preview for rapid repeated clicks', () => {
        render(<CredentialPreviewButton credential={wrappedCredential} />);
        fireEvent.click(eyeButton());
        fireEvent.click(eyeButton());
        fireEvent.click(eyeButton());
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('allows reopening after the preview closes itself', () => {
        render(<CredentialPreviewButton credential={wrappedCredential} />);
        fireEvent.click(eyeButton());
        lastModal().element.props.onClose();
        expect(mocks.closeModal).toHaveBeenCalledTimes(1);
        fireEvent.click(eyeButton());
        expect(mocks.newModal).toHaveBeenCalledTimes(2);
    });

    it('allows reopening after a native dismiss', () => {
        render(<CredentialPreviewButton credential={wrappedCredential} />);
        fireEvent.click(eyeButton());
        lastModal().options.onClose?.();
        fireEvent.click(eyeButton());
        expect(mocks.newModal).toHaveBeenCalledTimes(2);
    });

    it('keeps a wrapped boost on its signed snapshot when sharedOriginal is set', () => {
        render(<CredentialPreviewButton credential={wrappedCredential} sharedOriginal />);
        fireEvent.click(eyeButton());
        render(lastModal().element);
        expect(mocks.boostPreview).toHaveBeenCalledWith(
            expect.objectContaining({ credential: wrappedCredential, sharedOriginal: true })
        );
    });

    it('does not force shared-original mode on ordinary wallet previews', () => {
        render(<CredentialPreviewButton credential={wrappedCredential} />);
        fireEvent.click(eyeButton());
        render(lastModal().element);
        expect(mocks.boostPreview).toHaveBeenCalledWith(
            expect.objectContaining({ sharedOriginal: false })
        );
    });
});
