import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../../../paraglide/runtime.js';
import { TroopsCMSEditorModeEnum, TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import TroopsCMSHeader from './TroopsCMSHeader';

vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: {
        membership: 'membership',
        globalAdminId: 'globalAdminId',
        nationalNetworkAdminId: 'nationalNetworkAdminId',
        troopLeaderId: 'troopLeaderId',
        scoutId: 'scoutId',
    },
    BoostCMSAppearanceDisplayTypeEnum: { ID: 'ID' },
}));

vi.mock('learn-card-base/components/IssueVC/constants', () => ({
    AchievementTypes: {},
}));
vi.mock('learn-card-base/svgs/ScoutsPledge2', () => ({ GreenScoutsPledge2: () => null }));
vi.mock('learn-card-base/svgs/ScoutsNetworkTent', () => ({ ScoutsNetworkTent: () => null }));

vi.mock('../TroopsNetworkToggle/TroopsNetworkToggle', () => ({
    default: () => null,
}));

describe('TroopsCMSHeader', () => {
    afterEach(() => setLocale('en', { reload: false }));

    it('renders the create-global-network heading in the active locale', () => {
        setLocale('es', { reload: false });

        const html = renderToStaticMarkup(
            <TroopsCMSHeader
                state={{} as TroopsCMSState}
                setState={vi.fn()}
                viewMode={TroopsCMSViewModeEnum.global}
                editorMode={TroopsCMSEditorModeEnum.create}
            />
        );

        expect(html).toContain('Nueva');
        expect(html).toContain('Red Global');
        expect(html).not.toContain('New');
    });
});
