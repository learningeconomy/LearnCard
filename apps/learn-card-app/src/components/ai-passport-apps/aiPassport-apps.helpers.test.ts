import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    getLearnCardAiPassportContractUri: () => 'lc:contract:learncard-ai',
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
    getAiPassportAppByContractUri,
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

describe('aiPassportApps catalog', () => {
    it('lists LearnCard AI and Gemini only', () => {
        expect(aiPassportApps.map(app => app.type)).toEqual([
            AiPassportAppsEnum.learncardapp,
            AiPassportAppsEnum.gemini,
        ]);
    });

    it('no longer resolves the retired ChatGPT and Claude contracts', () => {
        expect(
            getAiPassportAppByContractUri(
                'lc:network:network.learncard.com/trpc:contract:469524d4-264c-4fc3-99e4-0c9f06c805e8'
            )
        ).toBeUndefined();
        expect(
            getAiPassportAppByContractUri(
                'lc:network:network.learncard.com/trpc:contract:5d5447fc-9197-45ac-859a-5f068ff12938'
            )
        ).toBeUndefined();
    });

    it('keeps the LearnCard AI contract URI default', () => {
        expect(getAiPassportAppByContractUri('lc:contract:learncard-ai')?.type).toBe(
            AiPassportAppsEnum.learncardapp
        );
    });
});
