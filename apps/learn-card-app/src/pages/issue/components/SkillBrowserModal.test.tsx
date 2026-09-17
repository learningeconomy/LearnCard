import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    search: vi.fn(),
    newModal: vi.fn(),
    closeModal: vi.fn(),
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
    ModalTypes: {
        BottomSheet: 'bottom-sheet',
        Center: 'center',
    },
    useModal: () => ({
        newModal: mocks.newModal,
        closeModal: mocks.closeModal,
    }),
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
    'issueFlow.browseAllFrameworks': () => 'Browse All Frameworks',
    'issueFlow.noMatchingSkills': () => 'No matching skills found',
    'issueFlow.searching': () => 'Searching',
    'issueFlow.skillsSubtitle': () => 'Align this credential to skills',
    'issueFlow.skillsTitle': () => 'Skills',
    'issueFlow.suggested': () => 'Suggested',
    'issueFlow.selectedTapToToggle': ({ count }: { count: number }) => `${count} selected`,
    'skills.search.searchPlaceholder': () => 'Search skills',
}));

import { SkillBrowserModal } from './SkillBrowserModal';
import { SkillsSection } from './SkillsSection';

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

describe('issuer skill browser', () => {
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

        expect(mocks.search).toHaveBeenCalledWith('Creative Thinking', ['framework-1'], {
            limit: 24,
        });
        expect(screen.getByRole('heading', { name: 'framework-1' })).toBeVisible();
        expect(screen.queryByRole('button', { name: /Creative Thinking/ })).not.toBeInTheDocument();

        mocks.search.mockClear();
        mocks.frameworkIds = ['framework-1', 'framework-2'];
        rerender(
            <SkillBrowserModal
                selectedSkills={[]}
                onAddSkill={onAddSkill}
                onRemoveSkill={onRemoveSkill}
                handleCloseModal={handleCloseModal}
            />
        );

        expect(mocks.search).toHaveBeenCalledWith('Creative Thinking', ['framework-1'], {
            limit: 24,
        });
        expect(mocks.search).toHaveBeenCalledWith('Creative Thinking', ['framework-2'], {
            limit: 24,
        });
        expect(mocks.search).not.toHaveBeenCalledWith(
            'Creative Thinking',
            ['framework-1', 'framework-2'],
            { limit: 24 }
        );
        const framework2Section = screen
            .getByRole('heading', { name: 'framework-2' })
            .closest('section');
        expect(framework2Section).not.toBeNull();
        fireEvent.click(
            within(framework2Section!).getByRole('button', { name: /Creative Thinking/ })
        );

        expect(onAddSkill).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'creative-thinking',
                targetName: 'Creative Thinking',
                frameworkId: 'framework-2',
            })
        );

        fireEvent.change(searchInput, { target: { value: 'missing' } });
        act(() => vi.advanceTimersByTime(300));

        expect(screen.getAllByText('No matching skills found')).toHaveLength(2);
    });

    it('opens Browse All Frameworks in a centered desktop modal', () => {
        render(
            <SkillsSection
                selectedSkills={[]}
                resolvedSkills={[]}
                onSelectedSkillsChange={vi.fn()}
                onResolvedSkillsChange={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Browse All Frameworks' }));

        expect(mocks.newModal).toHaveBeenCalledWith(
            expect.anything(),
            {
                sectionClassName:
                    'desktop:!h-[85vh] desktop:!max-h-[85vh] desktop:!overflow-hidden',
            },
            {
                mobile: 'bottom-sheet',
                desktop: 'center',
            }
        );
    });
});
