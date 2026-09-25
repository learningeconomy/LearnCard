import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { VP } from '@learncard/types';

import type { SavedCredentialCollection } from '../../pages/privacy-settings/DataSharingCenter.types';
import SavedCollectionPreview from './SavedCollectionPreview';

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('./ShareLinkPreview', () => ({
    ShareLinkPreview: ({
        payload,
        title,
        showExpiry,
    }: {
        payload: { selection: unknown[] };
        title: string;
        showExpiry: boolean;
    }) => (
        <div data-testid="saved-preview">
            {title} · {payload.selection.length} · {String(showExpiry)}
        </div>
    ),
}));

afterEach(cleanup);

describe('SavedCollectionPreview', () => {
    it('renders every received presentation member as a durable saved collection', () => {
        const collection: SavedCredentialCollection = {
            uri: 'lc:network:localhost%3A4000:pres:one',
            receivedAt: '2026-09-24T16:00:00.000Z',
            credentialCount: 2,
            presentation: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                verifiableCredential: [{}, {}],
                proof: { type: 'Ed25519Signature2020' },
            } as unknown as VP,
        };

        render(<SavedCollectionPreview collection={collection} onDismiss={() => undefined} />);

        expect(screen.getByTestId('saved-preview')).toHaveTextContent(
            'Saved credential collection · 2 · false'
        );
    });
});
