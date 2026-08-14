import { describe, expect, it } from 'bun:test';

import {
    getScoutPassAllowedBoostTypes,
    isScoutPassCustomizationAdmin,
} from '../src/helpers/scoutCustomization.helpers';

describe('isScoutPassCustomizationAdmin', () => {
    it('allows global and network administrators', () => {
        expect(
            isScoutPassCustomizationAdmin([
                {
                    credentialSubject: {
                        achievement: { achievementType: 'ext:GlobalID' },
                    },
                },
            ])
        ).toBe(true);
        expect(
            isScoutPassCustomizationAdmin([
                {
                    credentialSubject: {
                        achievement: { achievementType: 'ext:NetworkID' },
                    },
                },
            ])
        ).toBe(true);
    });

    it('does not grant customization access to normal scouts or malformed credentials', () => {
        expect(
            isScoutPassCustomizationAdmin([
                {
                    credentialSubject: {
                        achievement: { achievementType: 'ext:ScoutID' },
                    },
                },
            ])
        ).toBe(false);
        expect(isScoutPassCustomizationAdmin([{ credentialSubject: [] }, {}])).toBe(false);
    });
});

describe('getScoutPassAllowedBoostTypes', () => {
    const boostTypes = ['Merit Badge', 'Boost'];

    it('limits normal scouts to the agreed credential type', () => {
        expect(getScoutPassAllowedBoostTypes(boostTypes, false)).toEqual(['Merit Badge']);
    });

    it('allows administrators to use every credential type', () => {
        expect(getScoutPassAllowedBoostTypes(boostTypes, true)).toEqual(boostTypes);
    });
});
