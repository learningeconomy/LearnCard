import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    search: vi.fn(),
    frameworkIds: ['framework-1'],
}));

vi.mock('../../../helpers/globalSkillFrameworks.helpers', () => ({
    useGlobalSkillFrameworks: () =>
        mocks.frameworkIds.map(frameworkId => ({
            frameworkId,
            name: frameworkId,
            defaultSkillIds: [],
        })),
    useGlobalSemanticSearchSkills: (
        text: string,
        frameworkIds: string[],
        options: { limit: number }
    ) => mocks.search(text, frameworkIds, options),
}));

vi.mock('learn-card-base', () => ({
    useSearchFrameworkSkills: () => ({ data: undefined }),
}));

vi.mock('../../SkillFrameworks/CompetencyIcon', () => ({
    default: () => <span aria-hidden="true" />,
}));

vi.mock('../../../components/boost/boost', () => ({
    FrameworkNodeRole: {
        tier: 'tier',
        competency: 'competency',
    },
}));

vi.mock('../../../paraglide/messages.js', () => ({
    'common.close': () => 'Close',
    'common.done': () => 'Done',
    'issueFlow.addSkills': () => 'Add Skills',
    'issueFlow.addSkillsSubtitle': () => 'Choose skills',
    'issueFlow.clearSearch': () => 'Clear search',
    'issueFlow.noMatchingSkills': () => 'No matching skills found',
    'issueFlow.searching': () => 'Searching',
    'issueFlow.selectedTapToToggle': ({ count }: { count: number }) => `${count} selected`,
    'skills.search.searchPlaceholder': () => 'Search skills',
}));

import { SkillBrowserModal } from './SkillBrowserModal';

const creativeThinkingRecord = {
    id: 'creative-thinking',
    statement: 'Creative Thinking',
    description: 'Generate useful new ideas.',
    code: 'CT',
    icon: 'lightbulb',
    type: 'competency',
    status: 'active',
    frameworkId: 'framework-2',
    score: 0.95,
};

describe('SkillBrowserModal search', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.frameworkIds = ['framework-1'];
        mocks.search.mockImplementation((text: string, frameworkIds: string[]) => ({
            data: text.trim()
                ? {
                      records:
                          text !== 'missing' && frameworkIds.includes('framework-2')
                              ? [creativeThinkingRecord]
                              : [],
                  }
                : undefined,
            isLoading: false,
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('updates an open browser when all global frameworks finish loading', () => {
        const onAddSkill = vi.fn();
        const onRemoveSkill = vi.fn();
        const handleCloseModal = vi.fn();
        const { rerender } = render(
            <SkillBrowserModal
                selectedSkills={[]}
                onAddSkill={onAddSkill}
                onRemoveSkill={onRemoveSkill}
                handleCloseModal={handleCloseModal}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search skills');
        fireEvent.change(searchInput, { target: { value: 'Creative Thinking' } });
        act(() => vi.advanceTimersByTime(300));

        expect(mocks.search).toHaveBeenLastCalledWith('Creative Thinking', ['framework-1'], {
            limit: 24,
        });
        expect(screen.queryByRole('button', { name: /Creative Thinking/ })).not.toBeInTheDocument();

        mocks.frameworkIds = ['framework-1', 'framework-2'];
        rerender(
            <SkillBrowserModal
                selectedSkills={[]}
                onAddSkill={onAddSkill}
                onRemoveSkill={onRemoveSkill}
                handleCloseModal={handleCloseModal}
            />
        );

        expect(mocks.search).toHaveBeenLastCalledWith(
            'Creative Thinking',
            ['framework-1', 'framework-2'],
            { limit: 24 }
        );
        fireEvent.click(screen.getByRole('button', { name: /Creative Thinking/ }));

        expect(onAddSkill).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'creative-thinking',
                targetName: 'Creative Thinking',
                frameworkId: 'framework-2',
            })
        );

        fireEvent.change(searchInput, { target: { value: 'missing' } });
        act(() => vi.advanceTimersByTime(300));

        expect(screen.getByText('No matching skills found')).toBeVisible();
    });
});
