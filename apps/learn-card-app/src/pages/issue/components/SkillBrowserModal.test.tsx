import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    search: vi.fn(),
}));

vi.mock('../../../helpers/globalSkillFrameworks.helpers', () => ({
    useGlobalSemanticSearchSkills: (text: string) => mocks.search(text),
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
    frameworkId: 'framework-1',
    score: 0.95,
};

describe('SkillBrowserModal search', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.search.mockImplementation((text: string) => ({
            data: text.trim()
                ? { records: text === 'missing' ? [] : [creativeThinkingRecord] }
                : undefined,
            isLoading: false,
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it.each(['Creative Thinking', 'Creative', 'C', 'c'])(
        'shows API results for the query %s',
        query => {
            render(
                <SkillBrowserModal
                    frameworks={[]}
                    selectedSkills={[]}
                    onAddSkill={vi.fn()}
                    onRemoveSkill={vi.fn()}
                    handleCloseModal={vi.fn()}
                />
            );

            fireEvent.change(screen.getByPlaceholderText('Search skills'), {
                target: { value: query },
            });
            act(() => vi.advanceTimersByTime(300));

            expect(screen.getByRole('button', { name: /Creative Thinking/ })).toBeVisible();
        }
    );

    it('lets the issuer add a matching skill and clearly reports no matches', () => {
        const onAddSkill = vi.fn();
        render(
            <SkillBrowserModal
                frameworks={[]}
                selectedSkills={[]}
                onAddSkill={onAddSkill}
                onRemoveSkill={vi.fn()}
                handleCloseModal={vi.fn()}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search skills');
        fireEvent.change(searchInput, { target: { value: 'Creative Thinking' } });
        act(() => vi.advanceTimersByTime(300));
        fireEvent.click(screen.getByRole('button', { name: /Creative Thinking/ }));

        expect(onAddSkill).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'creative-thinking',
                targetName: 'Creative Thinking',
                frameworkId: 'framework-1',
            })
        );

        fireEvent.change(searchInput, { target: { value: 'missing' } });
        act(() => vi.advanceTimersByTime(300));

        expect(screen.getByText('No matching skills found')).toBeVisible();
    });
});
