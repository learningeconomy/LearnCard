import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCR } from 'learn-card-base/types/credential-records';
import { credentialSelectionStore } from '../../stores/credentialSelectionStore';

const mocks = vi.hoisted(() => ({ flags: {} as Record<string, boolean> }));

vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => mocks.flags }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));

import { SelectableCredential } from './SelectableCredential';

const record = {
    id: 'record:achievement',
    uri: 'credential:achievement',
    category: 'Achievement',
    title: 'Achievement',
} as LCR;

describe('SelectableCredential', () => {
    beforeEach(() => {
        mocks.flags = {};
        credentialSelectionStore.set.exit();
    });

    it('does not add a wrapper when bulk actions are disabled', () => {
        const { container } = render(
            <SelectableCredential record={record} listId="Achievement" visibleRecords={[record]}>
                <div data-testid="credential-column" />
            </SelectableCredential>
        );

        expect(container.firstElementChild).toBe(screen.getByTestId('credential-column'));
        expect(screen.queryByRole('checkbox')).toBeNull();
    });
});
