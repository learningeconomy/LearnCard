import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@ionic/react', () => ({
    IonList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonSpinner: () => <span />,
}));

vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => false }));

vi.mock('./AddressBookContactItem', () => ({
    default: ({ detailsMode }: { detailsMode: string }) => (
        <div data-testid="details-mode">{detailsMode}</div>
    ),
}));

import { AddressBookContactList } from './AddressBookContactList';

const contact = {
    profileId: 'janet',
    displayName: 'Janet Yoon',
    shortBio: '',
    bio: '',
    did: 'did:web:example:janet',
} as any;

const requiredProps = {
    contacts: [contact],
    showBlockButton: false,
    showUnblockButton: false,
    search: '',
    setConnectionCount: vi.fn(),
    refetch: vi.fn(),
};

describe('AddressBookContactList detail routing', () => {
    it('uses the legacy action view by default', () => {
        render(<AddressBookContactList {...requiredProps} />);
        expect(screen.getByTestId('details-mode').textContent).toEqual('actions');
    });

    it('passes the relationship view mode for connected contacts', () => {
        render(<AddressBookContactList {...requiredProps} detailsMode="relationship" />);
        expect(screen.getByTestId('details-mode').textContent).toEqual('relationship');
    });
});
