// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

import { setLocale } from '../../../paraglide/runtime.js';
import { CATEGORY_TO_SUBCATEGORY_LIST } from '../boost-options/boostOptions';
import NewBoostSelectMenuBoostPackItem from './NewBoostSelectMenuBoostPackItem';

const { localizeBoostTemplateContent } = vi.hoisted(() => ({
    localizeBoostTemplateContent: { value: false },
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => ({
        localizeBoostTemplateContent: localizeBoostTemplateContent.value,
    }),
}));

vi.mock('react-router-dom', async importOriginal => ({
    ...(await importOriginal<typeof import('react-router-dom')>()),
    useHistory: () => ({ push: vi.fn() }),
}));

vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@learncard/react', () => ({
    BoostSmallCard: ({ customButtonComponent }: { customButtonComponent?: React.ReactNode }) => (
        <div>{customButtonComponent}</div>
    ),
}));

vi.mock('learn-card-base', () => ({
    BoostCMSAppearanceDisplayTypeEnum: { Badge: 'badge' },
    BoostCategoryOptionsEnum: {
        id: 'ID',
        membership: 'Membership',
        meritBadge: 'Merit Badge',
        socialBadge: 'Social Badge',
    },
    BrandingEnum: { scoutPass: 'scoutPass' },
    CredentialBadge: () => null,
    ModalTypes: { FullScreen: 'full-screen' },
    defaultCategoryThumbImages: [],
    getAchievementTypeFromCustomType: (type: string) => type,
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    isCustomBoostType: () => false,
    replaceUnderscoresWithWhiteSpace: (value: string) => value.replaceAll('_', ' '),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
}));

vi.mock('../boostCMS/BoostCMS', () => ({ default: () => null }));

describe('NewBoostSelectMenuBoostPackItem', () => {
    afterEach(() => {
        cleanup();
        localizeBoostTemplateContent.value = false;
        setLocale('en', { reload: false });
    });

    it('shows canonical English preset titles when template localization is disabled', () => {
        setLocale('fr', { reload: false });

        const archery = CATEGORY_TO_SUBCATEGORY_LIST[BoostCategoryOptionsEnum.meritBadge].find(
            option => option.type === AchievementTypes.Archery
        )!;

        render(
            <NewBoostSelectMenuBoostPackItem
                handleCloseModal={vi.fn()}
                stylePack={[]}
                category={BoostCategoryOptionsEnum.meritBadge}
                boostPackItem={archery}
            />
        );

        expect(screen.getByText('Archery')).toBeTruthy();
        expect(screen.queryByText("Tir à l'arc")).toBeNull();
    });
});
