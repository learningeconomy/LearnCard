import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    LEARNCARD_AI_PASSPORT_CONTRACT_URI: 'lc:contract:learncard-ai',
}));
vi.mock('learn-card-base/helpers/networkHelpers', () => ({
    isProductionNetwork: () => false,
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: { get: { aiServiceUrl: () => 'http://localhost:3001' } },
}));

import {
    AiPassportAppsEnum,
    aiPassportApps,
    getSelectableAiPassportApps,
} from './aiPassport-apps.helpers';

describe('getSelectableAiPassportApps', () => {
    it('keeps LearnCard AI selectable on a local network', () => {
        expect(getSelectableAiPassportApps(false).map(app => app.type)).toEqual([
            AiPassportAppsEnum.learncardapp,
        ]);
    });

    it('returns every configured app on the production network', () => {
        expect(getSelectableAiPassportApps(true)).toBe(aiPassportApps);
    });
});
