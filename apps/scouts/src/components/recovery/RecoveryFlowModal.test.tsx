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
    const { Overlay } =
        await import('../../../../../packages/learn-card-base/src/auth-coordinator/components/Overlay');

    return {
        Overlay,
        QrLoginRequester: () => null,
        getSSSConfig: () => ({ serverUrl: 'https://example.com' }),
    };
});

import { RecoveryFlowModal } from './RecoveryFlowModal';

const renderModal = (onCancel: () => void): void => {
    render(
        <RecoveryFlowModal
            availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
            onRecoverWithPasskey={vi.fn().mockResolvedValue(undefined)}
            onRecoverWithPhrase={vi.fn().mockResolvedValue(undefined)}
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
