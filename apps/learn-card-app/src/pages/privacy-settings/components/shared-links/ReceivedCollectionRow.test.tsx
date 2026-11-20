import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SavedCredentialCollection } from '../../DataSharingCenter.types';
import ReceivedCollectionRow from './ReceivedCollectionRow';

const profiles = vi.hoisted(
    () => new Map<string, { profileId: string; displayName: string; image?: string }>()
);
vi.mock('learn-card-base', () => ({
    useGetProfile: (id: string) => ({ data: profiles.get(id) }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
afterEach(() => {
    cleanup();
    profiles.clear();
});

const collection = {
    uri: 'lc:network:collection',
    title: 'Alice’s degree',
    sharer: { profileId: 'alice', displayName: 'Alice Sender' },
    credentialCount: 1,
} as SavedCredentialCollection;
const row = (value = collection) => (
    <ul>
        <ReceivedCollectionRow collection={value} onOpen={() => undefined} />
    </ul>
);

describe('saved collection sender avatar', () => {
    it('shows the current sender profile image and falls back when it cannot load', () => {
        profiles.set('alice', {
            profileId: 'alice',
            displayName: 'Alice Sender',
            image: 'https://images.example/alice.png',
        });
        render(row());
        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain('alice.png');
        fireEvent.load(image);
        expect(image).toBeVisible();
        fireEvent.error(image);
        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('A', { exact: true })).toBeVisible();
    });
    it('retains sender initials if the profile is unavailable', () => {
        render(row());
        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('AS', { exact: true })).toBeVisible();
    });
    it('does not use another sender’s image when the collection changes', () => {
        profiles.set('alice', {
            profileId: 'alice',
            displayName: 'Alice Sender',
            image: 'https://images.example/alice.png',
        });
        profiles.set('bob', { profileId: 'bob', displayName: 'Bob Sender' });
        const view = render(row());
        expect(screen.getByRole('img').getAttribute('src')).toContain('alice.png');
        view.rerender(
            row({ ...collection, sharer: { profileId: 'bob', displayName: 'Bob Sender' } })
        );
        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('BS', { exact: true })).toBeVisible();
    });
});
