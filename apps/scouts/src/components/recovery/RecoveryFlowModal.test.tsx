// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@learncard/sss-key-manager', () => ({
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', async () => {
    // Keep the real overlay behavior without loading the package barrel's browser-only dependencies.
    const { Overlay } = await import('learn-card-base/auth-coordinator/components/Overlay');

    return {
        Overlay,
        QrLoginRequester: () => null,
        getSSSConfig: () => ({ serverUrl: 'https://example.com' }),
    };
});

import { RecoveryFlowModal } from './RecoveryFlowModal';

const renderModal = (
    onCancel: () => void,
    onRecoverWithPhrase = vi.fn().mockResolvedValue(undefined)
): void => {
    render(
        <RecoveryFlowModal
            availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
            onRecoverWithPasskey={vi.fn().mockResolvedValue(undefined)}
            onRecoverWithPhrase={onRecoverWithPhrase}
            onRecoverWithBackup={vi.fn().mockResolvedValue(undefined)}
            onCancel={onCancel}
        />
    );
};

describe('RecoveryFlowModal keyboard behavior', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 1)
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps Back and Escape unavailable while recovery is pending', () => {
        const onCancel = vi.fn();
        const recover = vi.fn(() => new Promise<void>(() => {}));
        renderModal(onCancel, recover);
        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: Array(25).fill('word').join(' ') },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Recover Account' }));
        expect(recover).toHaveBeenCalledOnce();
        const back = screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement;
        expect(back.disabled).toBe(true);
        fireEvent.click(back);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('returns to the method picker before cancelling recovery on Escape', () => {
        const onCancel = vi.fn();
        renderModal(onCancel);

        fireEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));

        expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
        expect(onCancel).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledOnce();
    });
});
