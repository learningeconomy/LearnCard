// @vitest-environment happy-dom

import React, { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

import {
    BoostCMSCategorySkillEnum,
    BoostCMSSKillsCategoryEnum,
    CATEGORY_TO_SKILLS,
    SKILLS,
} from '../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';
import {
    BoostUserTypeEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
    boostCategoryOptions,
    boostVCTypeOptions,
} from '../components/boost/boost-options/boostOptions';
import BoostCMSSkillOptions from '../components/boost/boostCMS/boostCMSForms/boostCMSSkills/BoostCMSSkillOptions';
import { BoostCMSMediaTypeSelector } from '../components/boost/boostCMS/boostCMSForms/boostCMSMedia/BoostCMSMediaTypeSelector';
import { useLocalizedBoostFilter } from '../components/boost/boost-select-menu/useLocalizedBoostFilter';
import { LocaleProvider, useChangeLocale } from './index';
import { setLocale } from '../paraglide/runtime.js';

vi.mock('@ionic/react', () => {
    const MockIonicComponent = ({ children }: { children?: React.ReactNode }) =>
        createElement('div', null, children);

    return {
        IonCol: MockIonicComponent,
        IonContent: MockIonicComponent,
        IonGrid: MockIonicComponent,
        IonHeader: MockIonicComponent,
        IonPage: MockIonicComponent,
        IonRow: MockIonicComponent,
        IonToolbar: MockIonicComponent,
    };
});

vi.mock(
    '../components/boost/boostCMS/boostCMSForms/boostCMSSkills/BoostCMSSkillCategorySwiper',
    () => ({ default: () => null })
);
vi.mock(
    '../components/boost/boostCMS/boostCMSForms/boostCMSSkills/BoostCMSPrimarySkillButton',
    () => ({
        default: ({ skill }: { skill: { title: string } }) => (
            <output data-testid="primary-skill">{skill.title}</output>
        ),
    })
);
vi.mock('../components/boost/boostCMS/boostCMSForms/boostCMSSkills/BoostCMSSubSkillButton', () => ({
    default: () => null,
}));

const localStorageValues = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
        clear: () => localStorageValues.clear(),
        getItem: (key: string) => localStorageValues.get(key) ?? null,
        key: (index: number) => [...localStorageValues.keys()][index] ?? null,
        get length() {
            return localStorageValues.size;
        },
        removeItem: (key: string) => localStorageValues.delete(key),
        setItem: (key: string, value: string) => localStorageValues.set(key, value),
    } satisfies Storage,
});

const LocaleSwitch: React.FC = () => {
    const changeLocale = useChangeLocale();

    return (
        <button type="button" onClick={() => changeLocale('ar')}>
            Switch to Arabic
        </button>
    );
};

const LocalizedBoostFilterHarness: React.FC = () => {
    const options = CATEGORY_TO_SUBCATEGORY_LIST[BoostCategoryOptionsEnum.meritBadge];
    const filteredOptions = useLocalizedBoostFilter(options, 'Archery');

    return (
        <output data-testid="filtered-boosts">{filteredOptions.map(option => option.title)}</output>
    );
};

describe('localized credential content', () => {
    beforeEach(() => {
        window.localStorage.clear();
        setLocale('en', { reload: false });
    });
    afterEach(() => {
        cleanup();
        window.localStorage.clear();
        setLocale('en', { reload: false });
    });

    it('resolves existing skill and badge records in the active locale', () => {
        const adaptability = SKILLS.find(
            skill => skill.type === BoostCMSCategorySkillEnum.Adaptability
        )!;
        const archery = CATEGORY_TO_SUBCATEGORY_LIST[BoostCategoryOptionsEnum.meritBadge].find(
            option => option.type === AchievementTypes.Archery
        )!;

        expect(adaptability.title).toBe('Adaptability');
        expect(archery.presetTitle).toBe('Archery');

        setLocale('es', { reload: false });

        expect(adaptability.title).toBe('Adaptabilidad');
        expect(adaptability.description).toContain('adaptarse');
        expect(archery.presetTitle).toBe('Tiro con arco');
        expect(boostCategoryOptions[BoostCategoryOptionsEnum.achievement].title).toBe('Logros');
    });

    it('keeps category identity stable while its label changes', () => {
        const socialBoost = boostVCTypeOptions[BoostUserTypeEnum.someone].find(
            option => option.type === BoostCategoryOptionsEnum.socialBadge
        )!;

        expect(socialBoost.title).toBe('Boost');

        setLocale('ar', { reload: false });

        expect(socialBoost.type).toBe(BoostCategoryOptionsEnum.socialBadge);
        expect(socialBoost.title).toBe('تعزيز');
    });

    it('keeps the Leader achievement type stable while its label changes', () => {
        const membershipOptions = CATEGORY_TO_SUBCATEGORY_LIST[BoostCategoryOptionsEnum.membership];
        const leader = membershipOptions.find(option => option.type === AchievementTypes.Leader)!;

        expect(leader.type).toBe(AchievementTypes.Leader);
        expect(leader.title).toBe('Leader');

        setLocale('ar', { reload: false });

        expect(leader.type).toBe(AchievementTypes.Leader);
        expect(leader.title).toBe('قائد');
    });

    it('rerenders and resorts mounted skill options without mutating shared data', () => {
        const originalOrder = CATEGORY_TO_SKILLS[BoostCMSSKillsCategoryEnum.Durable].map(
            skill => skill.type
        );
        const state = { skills: [] } as React.ComponentProps<typeof BoostCMSSkillOptions>['state'];
        const callback = vi.fn();

        render(
            <LocaleProvider>
                <LocaleSwitch />
                <BoostCMSSkillOptions
                    state={state}
                    setState={callback}
                    handleAddSkill={callback}
                    handleRemoveSkill={callback}
                    handleAddSubSkill={callback}
                    handleRemoveSubSkill={callback}
                    handleCloseModal={callback}
                    handleSaveSkills={callback}
                />
            </LocaleProvider>
        );

        expect(screen.getAllByTestId('primary-skill')[0].textContent).toBe('Adaptability');

        fireEvent.click(screen.getByRole('button', { name: 'Switch to Arabic' }));

        expect(screen.getAllByTestId('primary-skill')[0].textContent).toBe('التحمل البدني');
        expect(
            CATEGORY_TO_SKILLS[BoostCMSSKillsCategoryEnum.Durable].map(skill => skill.type)
        ).toEqual(originalOrder);
    });

    it('recomputes localized Boost filters when the locale changes', () => {
        render(
            <LocaleProvider>
                <LocaleSwitch />
                <LocalizedBoostFilterHarness />
            </LocaleProvider>
        );

        expect(screen.getByTestId('filtered-boosts').textContent).toContain('Archery');

        fireEvent.click(screen.getByRole('button', { name: 'Switch to Arabic' }));

        expect(screen.getByTestId('filtered-boosts').textContent).toBe('');
    });

    it('renders localized media attachment type labels', () => {
        render(
            <LocaleProvider>
                <LocaleSwitch />
                <BoostCMSMediaTypeSelector
                    setActiveMediaType={vi.fn()}
                    handleImageSelect={vi.fn()}
                    handleDocumentSelect={vi.fn()}
                />
            </LocaleProvider>
        );

        expect(screen.getByText('Photo')).not.toBeNull();
        expect(screen.getByText('Document')).not.toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Switch to Arabic' }));

        expect(screen.getByText('صورة')).not.toBeNull();
        expect(screen.getByText('مستند')).not.toBeNull();
        expect(screen.queryByText('Photo')).toBeNull();
        expect(screen.queryByText('Document')).toBeNull();
    });
});
