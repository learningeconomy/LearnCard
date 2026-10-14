// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminToolsOptionsList from './AdminToolsOptionsList';
import AdminToolsOptionsContainer from './AdminToolsOptionsContainer';
import { AdminToolOptionsEnum, getAdminToolOptions } from './admin-tools.helpers';

const mocks = vi.hoisted(() => ({ canManage: false, renderFrameworks: vi.fn() }));

vi.mock('../../../hooks/useCanManageCompetencies', () => ({
    useCanManageCompetencies: () => mocks.canManage,
}));
vi.mock('./AdminToolsOptionsListItem', () => ({
    default: ({ option }: { option: { label: string } }) => <li>{option.label}</li>,
}));
vi.mock('./AdminToolsOptionsContainerHeader', () => ({ default: () => null }));
vi.mock('./AdminToolsModalFooter', () => ({ default: () => null }));
vi.mock('../bulk-import/AdminToolsBulkBoostImportOption', () => ({
    default: () => <div>Import credentials</div>,
}));
vi.mock('../../SkillFrameworks/SkillFrameworks', () => ({
    default: () => {
        mocks.renderFrameworks();
        return <div>Framework editor</div>;
    },
}));
vi.mock('../../SkillFrameworks/ManageSkills', () => ({
    default: () => <div>Competency editor</div>,
}));
vi.mock('../../SkillFrameworks/ViewSkillFramework', () => ({ default: () => null }));

describe('competency tools in Admin Tools', () => {
    beforeEach(() => {
        mocks.canManage = false;
        mocks.renderFrameworks.mockClear();
    });
    afterEach(cleanup);

    it('hides the framework option while retaining unrelated tools', () => {
        render(<AdminToolsOptionsList />);

        const options = getAdminToolOptions();
        const frameworkOption = options.find(
            o => o.type === AdminToolOptionsEnum.SKILL_FRAMEWORKS
        )!;
        const importOption = options.find(o => o.type === AdminToolOptionsEnum.BULK_UPLOAD)!;

        expect(screen.queryByText(frameworkOption.label)).toBeNull();
        expect(screen.getByText(importOption.label)).toBeTruthy();
    });

    it.each([AdminToolOptionsEnum.SKILL_FRAMEWORKS, AdminToolOptionsEnum.IMPORT_SKILL_FRAMEWORKS])(
        'blocks direct or shortcut access to %s',
        type => {
            const { container } = render(
                <AdminToolsOptionsContainer option={{ ...getAdminToolOptions()[0], type }} />
            );

            expect(container.innerHTML).toBe('');
            expect(mocks.renderFrameworks).not.toHaveBeenCalled();
        }
    );

    it('preserves framework tools for global admins', () => {
        mocks.canManage = true;
        const option = getAdminToolOptions().find(
            o => o.type === AdminToolOptionsEnum.SKILL_FRAMEWORKS
        )!;
        render(<AdminToolsOptionsList />);
        render(<AdminToolsOptionsContainer option={option} />);

        expect(screen.getByText(option.label)).toBeTruthy();
        expect(screen.getByText('Framework editor')).toBeTruthy();
    });
});
