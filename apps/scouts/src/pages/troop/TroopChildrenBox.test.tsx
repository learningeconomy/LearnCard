import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../../paraglide/runtime.js';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import TroopChildrenBox from './TroopChildrenBox';

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({ enableViewScoutAnalytics: true }),
}));

vi.mock('learn-card-base/components/IssueVC/constants', () => ({
    AchievementTypes: { Network: 'Network', Troop: 'Troop' },
}));
vi.mock('learn-card-base/svgs/Analytics', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/ScoutsNetworkTent', () => ({
    OrangeScoutsNetworkTent: () => null,
}));
vi.mock('learn-card-base/svgs/MeritBadgesIcon', () => ({
    PurpleMeritBadgesIcon: () => null,
}));
vi.mock('learn-card-base/svgs/ScoutsPledge2', () => ({ GreenScoutsPledge2: () => null }));
vi.mock('learn-card-base/svgs/BoostOutline2', () => ({ BlueBoostOutline2: () => null }));

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    useCountBoostChildren: () => ({ data: 0 }),
    useCountFamilialBoosts: () => ({ data: 0 }),
    CredentialCategoryEnum: {
        troops: 'troops',
        meritBadge: 'meritBadge',
        socialBadge: 'socialBadge',
    },
    BoostCategoryOptionsEnum: {
        meritBadge: 'meritBadge',
        socialBadge: 'socialBadge',
    },
    ModalTypes: { FullScreen: 'FullScreen' },
    getLogger: () => ({ debug: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../helpers/troop.helpers', () => ({ getScoutsRole: () => undefined }));
vi.mock('../../i18n', async () => {
    const runtime = await import('../../paraglide/runtime.js');
    return { useLocale: runtime.getLocale };
});
vi.mock('packages/plugins/lca-api-plugin/src/types', () => ({
    DASHBOARD_TYPE: { GLOBAL: 'GLOBAL', NSO: 'NSO', TROOP: 'TROOP' },
}));
vi.mock('./TroopsModal', () => ({ default: () => null }));
vi.mock('./NetworkListDisplay', () => ({ default: () => null }));
vi.mock('./TroopAnalyticsEmbed', () => ({ default: () => null }));
vi.mock('./TroopCredentialsModal', () => ({ default: () => null }));

describe('TroopChildrenBox', () => {
    afterEach(() => setLocale('en', { reload: false }));

    it('renders the global-network child menu in the active locale', () => {
        setLocale('fr', { reload: false });

        const html = renderToStaticMarkup(
            <TroopChildrenBox
                credential={{} as never}
                userRole={ScoutsRoleEnum.global}
                boostUri="urn:boost:test"
            />
        );

        expect(html).toContain('Réseaux nationaux');
        expect(html).toContain('Troupes');
        expect(html).toContain('Analyses');
        expect(html).not.toContain('National Networks');
    });
});
