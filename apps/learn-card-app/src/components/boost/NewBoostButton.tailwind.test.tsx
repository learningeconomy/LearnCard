import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonRow: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
}));
vi.mock('learn-card-base', () => ({ CredentialCategoryEnum: { socialBadge: 'Social Badge' } }));
vi.mock('../EarnedAndManagedTabs/EarnedAndManagedTabs', () => ({
    BoostPageViewMode: { Card: 'card', List: 'list' },
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({
        getThemedCategoryColors: () => ({
            backgroundPrimaryColor: 'bg-blue-400!',
            headerTextColor: 'text-white',
        }),
    }),
}));
vi.mock('./newBoostButtonI18n', () => ({ NEW_LABEL_KEYS: {} }));
vi.mock('../../paraglide/messages.js', () => ({ 'boost.newBoost.generic': () => 'New badge' }));

import NewBoostButton from './NewBoostButton';
import { CredentialCategoryEnum } from 'learn-card-base';
import { BoostPageViewMode } from '../EarnedAndManagedTabs/EarnedAndManagedTabs';

afterEach(cleanup);

describe('New Boost theme tint', () => {
    it.each([BoostPageViewMode.Card, BoostPageViewMode.List])(
        'keeps the important theme background from overriding the tint in %s view',
        viewMode => {
            const { getByRole } = render(
                <NewBoostButton
                    credentialType={CredentialCategoryEnum.socialBadge}
                    viewMode={viewMode}
                    onClick={() => undefined}
                />
            );
            const button = getByRole('button');
            expect(button.className).not.toContain('bg-blue-400');
            expect(button.getAttribute('style')).toContain('var(--color-blue-400)');
            expect(button.getAttribute('style')).toContain('30%');
        }
    );
});
