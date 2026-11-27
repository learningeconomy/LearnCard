// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CredentialListTabEnum, EarnedAndManagedTabs } from './EarnedAndManagedTabs';

const mocks = vi.hoisted(() => ({
    toggleIsSearchActive: vi.fn(),
    searchStringWithMatch: vi.fn(),
}));

vi.mock('react-router', async () => {
    const { navigateFromHistory } = await import('learn-card-base/test-utils/navigateFromHistory');
    return {
        useNavigate: () => navigateFromHistory({ replace: vi.fn() }),
        useLocation: () => ({ pathname: '/socialbadges' }),
    };
});
vi.mock('learn-card-base/stores/credentialSearchStore', () => ({
    default: {
        useStore: () => ({ searchString: 'badge', isSearchActive: true }),
        set: mocks,
    },
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'achievement' },
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({ getThemedCategoryColors: () => ({ tabActiveColor: 'bg-blue-300' }) }),
}));
vi.mock('../../paraglide/messages.js', () => ({
    'wallet.search': () => 'Search',
    'common.close': () => 'Close',
    'boost.browseEarnedPlaceholder': () => 'Browse earned...',
    'boost.browseManagedPlaceholder': () => 'Browse managed...',
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('EarnedAndManagedTabs search', () => {
    it('focuses the search field and provides one control to close it', () => {
        render(
            <EarnedAndManagedTabs
                activeTab={CredentialListTabEnum.Earned}
                handleActiveTab={vi.fn()}
                showManaged
            />
        );

        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Search' }));
        expect(screen.getAllByRole('button')).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(mocks.toggleIsSearchActive).toHaveBeenCalledOnce();
    });
});
