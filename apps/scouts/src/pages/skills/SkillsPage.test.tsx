// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SkillsPage from './SkillsPage';
import SkillsAdminPanel from './SkillsAdminPanel';

const mocks = vi.hoisted(() => ({
    ids: {
        data: undefined as undefined | Record<string, boolean>,
        isSuccess: false,
    },
    listFrameworks: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {},
    ModalTypes: {},
    useGetCurrentUserTroopIdsResolved: () => mocks.ids,
    useGetCredentialsForSkills: () => ({ data: [], isLoading: false }),
    useListMySkillFrameworks: () => mocks.listFrameworks(),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => null,
}));
vi.mock('../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../components/main-header/MainHeader', () => ({ default: () => null }));
vi.mock('../../components/main-subheader/MainSubHeader.types', () => ({
    SubheaderTypeEnum: {},
}));
vi.mock('../../components/generic/GenericErrorBoundary', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../../components/boost/boost', () => ({}));
vi.mock('../../components/boost/boostErrors/BoostErrorsDisplay', () => ({ default: () => null }));
vi.mock('./TotalSkillsCount', () => ({ default: () => null }));
vi.mock('./SkillsCategoryList', () => ({ default: () => null }));
vi.mock('./SkillsEmptyPlaceholder', () => ({ default: () => null }));
vi.mock('./skills.helpers', () => ({ mapBoostsToSkills: () => ({}) }));
vi.mock('./SkillsMyHub', () => ({ default: () => <div>My competencies</div> }));
vi.mock('./SkillsAdminPanelFramework', () => ({ default: () => null }));
vi.mock('../SkillFrameworks/BrowseFrameworkPage', () => ({ default: () => null }));
vi.mock('../SkillFrameworks/CreateFrameworkModal', () => ({ default: () => null }));
vi.mock('../SkillFrameworks/SelectFrameworkToManageModal', () => ({ default: () => null }));

describe('ScoutPass competency administration', () => {
    beforeEach(() => {
        mocks.ids.data = undefined;
        mocks.ids.isSuccess = false;
        mocks.listFrameworks.mockReset();
        mocks.listFrameworks.mockReturnValue({ data: [{ id: 'fw', name: 'Test' }] });
    });

    afterEach(cleanup);

    it.each(['isScout', 'isTroopLeader', 'isNationalAdmin'])(
        'does not render an admin tab or fetch managed frameworks for %s',
        role => {
            mocks.ids.data = { [role]: true, isScoutGlobalAdmin: false };
            mocks.ids.isSuccess = true;

            render(<SkillsPage />);

            expect(screen.queryByRole('button', { name: 'Admin Panel' })).toBeNull();
            expect(screen.queryByText('Create Framework')).toBeNull();
            expect(screen.getByText('My competencies')).toBeTruthy();
            expect(mocks.listFrameworks).not.toHaveBeenCalled();
        }
    );

    it.each([undefined, { isScoutGlobalAdmin: true }])(
        'fails closed while the ID query is pending or failed, including cached admin data',
        data => {
            mocks.ids.data = data;

            render(<SkillsPage />);

            expect(screen.queryByRole('button', { name: 'Admin Panel' })).toBeNull();
            expect(mocks.listFrameworks).not.toHaveBeenCalled();
        }
    );

    it('lets a global admin open the panel and manage frameworks', () => {
        mocks.ids.data = { isScoutGlobalAdmin: true };
        mocks.ids.isSuccess = true;

        render(<SkillsPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Admin Panel' }));

        expect(screen.getByRole('button', { name: /Create Framework/ })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Manage Competencies' })).toBeTruthy();
        expect(mocks.listFrameworks).toHaveBeenCalled();
    });

    it('returns to My Hub immediately when global-admin access is lost', () => {
        mocks.ids.data = { isScoutGlobalAdmin: true };
        mocks.ids.isSuccess = true;

        const { rerender } = render(<SkillsPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Admin Panel' }));

        mocks.ids.data = { isScout: true, isScoutGlobalAdmin: false };
        rerender(<SkillsPage />);

        expect(screen.queryByRole('button', { name: 'Admin Panel' })).toBeNull();
        expect(screen.queryByText('Create Framework')).toBeNull();
        expect(screen.getByText('My competencies')).toBeTruthy();
    });

    it('also blocks a directly mounted admin panel before its queries run', () => {
        mocks.ids.data = { isScout: true, isScoutGlobalAdmin: false };
        mocks.ids.isSuccess = true;

        const { container } = render(<SkillsAdminPanel setFrameworkToBrowse={vi.fn()} />);

        expect(container.innerHTML).toBe('');
        expect(mocks.listFrameworks).not.toHaveBeenCalled();
    });

    it('unmounts an already-open editor when its credential query fails', () => {
        mocks.ids.data = { isScoutGlobalAdmin: true };
        mocks.ids.isSuccess = true;
        const { container, rerender } = render(<SkillsAdminPanel setFrameworkToBrowse={vi.fn()} />);
        expect(screen.getByText('Create Framework')).toBeTruthy();

        mocks.ids.isSuccess = false;
        rerender(<SkillsAdminPanel setFrameworkToBrowse={vi.fn()} />);

        expect(container.innerHTML).toBe('');
    });
});
