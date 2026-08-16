import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../../paraglide/runtime.js';
import SkillsTabs, { SkillsTab } from './SkillsTabs';

describe('SkillsTabs', () => {
    afterEach(() => setLocale('en', { reload: false }));

    it('renders the available tabs in the active locale', () => {
        setLocale('es', { reload: false });

        const html = renderToStaticMarkup(
            <SkillsTabs selectedTab={SkillsTab.MyHub} onSelect={vi.fn()} showAdminPanel />
        );

        expect(html).toContain('Mi espacio');
        expect(html).toContain('Panel de administración');
        expect(html).not.toContain('My Hub');
    });
});
