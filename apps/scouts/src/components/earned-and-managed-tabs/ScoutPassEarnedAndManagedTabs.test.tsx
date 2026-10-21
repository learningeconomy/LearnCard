import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../../paraglide/runtime.js';
import ScoutPassEarnedAndManagedTabs from './ScoutPassEarnedAndManagedTabs';

vi.mock('learn-card-base', () => ({
    EarnedAndManagedTabs: ({ earnedLabel, managedLabel }: Record<string, string>) => (
        <div>
            <span>{earnedLabel}</span>
            <span>{managedLabel}</span>
        </div>
    ),
}));

describe('ScoutPassEarnedAndManagedTabs', () => {
    afterEach(() => setLocale('en', { reload: false }));

    it('supplies labels from the active locale', () => {
        setLocale('fr', { reload: false });

        const html = renderToStaticMarkup(
            <ScoutPassEarnedAndManagedTabs
                activeTab="earned"
                handleActiveTab={vi.fn()}
                showManaged
            />
        );

        expect(html).toContain('Obtenus');
        expect(html).toContain('Gérés');
    });
});
