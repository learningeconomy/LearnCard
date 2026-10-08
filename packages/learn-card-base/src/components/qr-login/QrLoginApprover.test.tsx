// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QrLoginApprover } from './QrLoginApprover';

const mocks = vi.hoisted(() => ({
    lookupSession: vi.fn(),
    approve: vi.fn(),
    reset: vi.fn(),
}));

vi.mock('../../hooks/useQrLogin', () => ({
    useQrLoginApprover: () => ({
        status: 'idle',
        sessionInfo: null,
        error: null,
        lookupSession: mocks.lookupSession,
        approve: mocks.approve,
        reset: mocks.reset,
    }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('QrLoginApprover', () => {
    it('focuses the code input after the user chooses code entry', () => {
        render(
            <QrLoginApprover
                serverUrl="https://example.com"
                deviceShare="device-share"
                approverDid="did:example:approver"
                onDone={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /enter code/i }));

        expect(document.activeElement).toBe(
            screen.getByRole('textbox', { name: 'Device link code' })
        );
    });
});
