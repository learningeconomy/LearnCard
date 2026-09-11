import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { CredentialListTabEnum, EarnedAndManagedTabs } from './EarnedAndManagedTabs';

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ replace: vi.fn() }),
    useLocation: () => ({ pathname: '/wallet' }),
}));

vi.mock('@ionic/react', () => ({
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSegment: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSegmentButton: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
    IonLabel: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

vi.mock('learn-card-base/stores/credentialSearchStore', () => ({
    default: {
        useStore: () => ({ searchString: '', isSearchActive: false }),
        set: { toggleIsSearchActive: vi.fn(), searchStringWithMatch: vi.fn() },
    },
}));

vi.mock('learn-card-base/svgs/ListItemsIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/GridIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/Search', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/X', () => ({ default: () => null }));

describe('EarnedAndManagedTabs', () => {
    it('renders caller-provided labels', () => {
        const html = renderToStaticMarkup(
            <EarnedAndManagedTabs
                activeTab={CredentialListTabEnum.Earned}
                handleActiveTab={vi.fn()}
                showManaged
                earnedLabel="Obtenus"
                managedLabel="Gérés"
            />
        );

        expect(html).toContain('Obtenus');
        expect(html).toContain('Gérés');
        expect(html).not.toContain('>Earned<');
    });
});
