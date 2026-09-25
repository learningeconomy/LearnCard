import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    isMobile: false,
    newModal: vi.fn(),
    replaceModal: vi.fn(),
    closeModal: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    lazyWithRetry: () => () => <div>Share flow</div>,
    ModalTypes: {
        Cancel: 'cancel',
        Center: 'center',
        BottomSheet: 'bottom-sheet',
        FullScreen: 'full-screen',
    },
    useDeviceTypeByWidth: () => ({ isMobile: mocks.isMobile }),
    useModal: () => ({
        newModal: mocks.newModal,
        replaceModal: mocks.replaceModal,
        closeModal: mocks.closeModal,
    }),
}));

vi.mock('@ionic/react', () => ({
    IonIcon: () => null,
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => <div>Loading</div>,
    IonPopover: ({ children, isOpen }: React.PropsWithChildren<{ isOpen: boolean }>) =>
        isOpen ? <div>{children}</div> : null,
}));

vi.mock('../../paraglide/messages.js', () => ({
    'shareLinks.sharing': () => 'Sharing',
    'shareLinks.sharingHint': () => 'Choose what you want to do.',
    'shareLinks.share': () => 'Share credentials',
    'shareLinks.shareActionHint': () => 'Create a private link',
    'shareLinks.viewShared': () => 'View shared credentials',
    'shareLinks.viewSharedHint': () => 'Manage active and past links',
}));

import PassportSharingMenu from './PassportSharingMenu';

describe('PassportSharingMenu', () => {
    beforeEach(() => {
        mocks.isMobile = false;
        vi.clearAllMocks();
    });

    afterEach(cleanup);

    it('opens a desktop menu and launches the share flow', () => {
        render(<PassportSharingMenu onViewShared={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Sharing' }));
        fireEvent.click(screen.getByRole('menuitem', { name: /Share credentials/i }));

        expect(mocks.newModal).toHaveBeenCalledOnce();
        expect(mocks.newModal.mock.calls[0][2]).toEqual({
            desktop: 'full-screen',
            mobile: 'full-screen',
        });
    });

    it('routes to shared credentials from the desktop menu', () => {
        const onViewShared = vi.fn();
        render(<PassportSharingMenu onViewShared={onViewShared} />);

        fireEvent.click(screen.getByRole('button', { name: 'Sharing' }));
        fireEvent.click(screen.getByRole('menuitem', { name: /View shared credentials/i }));

        expect(onViewShared).toHaveBeenCalledOnce();
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('uses a bottom sheet on mobile and replaces it with the share flow', () => {
        mocks.isMobile = true;
        render(<PassportSharingMenu onViewShared={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Sharing' }));

        expect(mocks.newModal).toHaveBeenCalledOnce();
        expect(mocks.newModal.mock.calls[0][2]).toEqual({
            desktop: 'center',
            mobile: 'bottom-sheet',
        });

        const sheet = mocks.newModal.mock.calls[0][0] as React.ReactElement;
        render(sheet);
        fireEvent.click(screen.getByRole('menuitem', { name: /Share credentials/i }));

        expect(mocks.replaceModal).toHaveBeenCalledOnce();
        expect(mocks.replaceModal.mock.calls[0][2]).toEqual({
            desktop: 'full-screen',
            mobile: 'full-screen',
        });
    });
});
