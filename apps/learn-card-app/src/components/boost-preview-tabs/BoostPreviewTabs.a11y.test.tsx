import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoostPreviewTabs } from './BoostPreviewTabs';
import { BoostPreviewTabsEnum } from './boost-preview-tabs.helpers';

// LC-2071 exposed these tabs as a real tablist. wallet-credentials.spec.ts
// targets the "Details" control by its tab role, so lock that contract down
// here — a silent revert to a plain button would break the E2E suite.
describe('BoostPreviewTabs accessibility contract', () => {
    it('exposes Details as a tab, not a button', () => {
        render(
            <BoostPreviewTabs selectedTab={BoostPreviewTabsEnum.Details} setSelectedTab={vi.fn()} />
        );

        const detailsTab = screen.getByRole('tab', { name: 'Details' });

        expect(detailsTab).toBeInTheDocument();
        expect(detailsTab.closest('[role="tablist"]')).not.toBeNull();
        expect(detailsTab.getAttribute('aria-selected')).toBe('true');
        expect(screen.queryByRole('button', { name: 'Details' })).toBeNull();
    });
});
