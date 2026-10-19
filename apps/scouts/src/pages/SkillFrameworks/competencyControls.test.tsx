// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BrowseFrameworkMultiColumnHeader from './BrowseFrameworkMultiColumnHeader';
import FrameworkColumn from './FrameworkColumn';
import SelectFrameworkToManageModal from './SelectFrameworkToManageModal';

const mocks = vi.hoisted(() => ({
    canManage: false,
    newModal: vi.fn(),
    frameworks: vi.fn(),
}));

vi.mock('../../hooks/useCanManageCompetencies', () => ({
    useCanManageCompetencies: () => mocks.canManage,
}));
vi.mock('learn-card-base', () => ({
    ModalTypes: {},
    useDeviceTypeByWidth: () => ({ isMobile: true, isDesktop: false }),
    useGetSkillChildren: () => ({}),
    useModal: () => ({ newModal: mocks.newModal, closeModal: vi.fn() }),
    useListMySkillFrameworks: () => mocks.frameworks(),
}));
vi.mock('@ionic/react', () => ({
    IonFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonInput: () => <input placeholder="Search" />,
    IonSpinner: () => null,
}));
vi.mock('../../components/boost/boost', () => ({
    FrameworkNodeRole: { tier: 'tier', competency: 'competency' },
}));
vi.mock('../../helpers/skillFramework.helpers', () => ({}));
vi.mock('./FrameworkImage', () => ({ default: () => null }));
vi.mock('./FrameworkSkillsCount', () => ({ default: () => null }));
vi.mock('./FrameworkSearchResults', () => ({ default: () => null }));
vi.mock('./TierRow', () => ({ default: () => null }));
vi.mock('./CompetencyRow', () => ({ default: () => null }));
vi.mock('./ViewAlignmentInfo', () => ({ default: () => null }));
vi.mock('./EditAlignmentModal', () => ({ default: () => null }));
vi.mock('./FrameworkOptionsModal', () => ({ default: () => null }));
vi.mock('./CreateFrameworkModal', () => ({ default: () => null }));
vi.mock('./ManageSkills', () => ({ default: () => null }));
vi.mock('../skills/SkillsAdminPanelFramework', () => ({
    default: ({ onClick }: { onClick: () => void }) => (
        <button onClick={onClick}>Test framework</button>
    ),
}));
vi.mock('learn-card-base/svgs/ThreeDots', () => ({
    default: () => <span data-testid="framework-options" />,
}));

const commonProps = {
    frameworkInfo: {
        id: 'fw',
        name: 'Test framework',
        image: '',
        description: '',
        status: 'active',
    },
    handleBack: vi.fn(),
    handleApprove: vi.fn(),
    handleClose: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    searchResults: [],
    searchLoading: false,
    isEdit: false,
    setIsEdit: vi.fn(),
    openManageJsonModal: vi.fn(),
    handleDisableEdit: vi.fn(),
    onSearchResultItemClick: vi.fn(),
    setIsFullScreenSearch: vi.fn(),
};

const columnProps = {
    ...commonProps,
    nodes: [],
    isTopLevel: true,
    setSelectedNode: vi.fn(),
    setSelectedPath: vi.fn(),
    countAdjustments: {},
    maxColumns: 1,
};

describe('framework browsing controls', () => {
    beforeEach(() => {
        mocks.canManage = false;
        mocks.newModal.mockClear();
        mocks.frameworks.mockReset();
        mocks.frameworks.mockReturnValue({ data: [{ id: 'fw', name: 'Test framework' }] });
    });
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it.each([false, true])('hides desktop management controls even with isEdit=%s', isEdit => {
        render(<BrowseFrameworkMultiColumnHeader {...commonProps} isEdit={isEdit} />);

        expect(screen.queryByText('Edit Framework')).toBeNull();
        expect(screen.queryByText('Manage JSON')).toBeNull();
        expect(screen.queryByText('Save Framework')).toBeNull();
    });

    it.each([false, true])('hides mobile management and options even with isEdit=%s', isEdit => {
        render(<FrameworkColumn {...columnProps} isEdit={isEdit} />);

        expect(screen.queryByText('Edit')).toBeNull();
        expect(screen.queryByText('JSON')).toBeNull();
        expect(screen.queryByText('Save')).toBeNull();
        expect(screen.queryByTestId('framework-options')).toBeNull();
    });

    it('preserves management controls for global admins on desktop and mobile', () => {
        mocks.canManage = true;
        render(<BrowseFrameworkMultiColumnHeader {...commonProps} />);
        render(<FrameworkColumn {...columnProps} />);

        expect(screen.getByText('Edit Framework')).toBeTruthy();
        expect(screen.getByText('Manage JSON')).toBeTruthy();
        expect(screen.getByText('Edit')).toBeTruthy();
        expect(screen.getByText('JSON')).toBeTruthy();
        expect(screen.getByTestId('framework-options')).toBeTruthy();
    });

    it('keeps competency selection available without framework editing', () => {
        const saveSelection = vi.fn();
        render(
            <FrameworkColumn {...columnProps} isSelectSkillsFlow handleSaveSkills={saveSelection} />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(saveSelection).toHaveBeenCalledOnce();
        expect(screen.queryByText('Edit')).toBeNull();
        expect(screen.queryByText('JSON')).toBeNull();
    });

    it('blocks a directly opened management selector before querying frameworks', () => {
        const { container } = render(<SelectFrameworkToManageModal />);

        expect(container.innerHTML).toBe('');
        expect(mocks.frameworks).not.toHaveBeenCalled();
    });

    it('lets badge authors choose a framework but never create one', () => {
        vi.useFakeTimers();
        const selectFramework = vi.fn();
        render(<SelectFrameworkToManageModal onFrameworkSelectOverride={selectFramework} />);

        expect(screen.queryByText('Create Framework')).toBeNull();
        fireEvent.click(screen.getByText('Test framework'));
        vi.runAllTimers();

        expect(selectFramework).toHaveBeenCalledWith({ id: 'fw', name: 'Test framework' });
        expect(mocks.newModal).not.toHaveBeenCalled();
    });
});
