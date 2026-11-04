import { describe, expect, it } from 'bun:test';

import { formatSessionPlanMarkdown } from './sessionPlans';

const plan = {
    welcome: 'Welcome to practical budgeting.',
    summary: 'Build a first-apartment budget you can maintain.',
    objectives: ['Separate fixed and variable costs', 'Create a monthly buffer'],
    skills: ['Budget planning', 'Expense prioritization'],
    roadmap: [
        {
            module: 'Map your costs',
            description: 'List recurring and flexible expenses.',
            learningObjectives: ['Estimate utilities', 'Set spending limits'],
        },
        {
            module: 'Stress-test the plan',
            description: 'Prepare for irregular expenses.',
            learningObjectives: ['Add an emergency buffer'],
        },
    ],
};

describe('formatSessionPlanMarkdown', () => {
    it('renders every structured plan section deterministically', () => {
        expect(formatSessionPlanMarkdown(plan)).toBe(
            [
                '# Welcome to practical budgeting.',
                '',
                'Build a first-apartment budget you can maintain.',
                '',
                '## Objectives',
                '- Separate fixed and variable costs',
                '- Create a monthly buffer',
                '',
                '## Skills You Can Earn',
                '- Budget planning',
                '- Expense prioritization',
                '',
                '## Roadmap',
                '1. **Map your costs** — List recurring and flexible expenses.',
                '   - Estimate utilities',
                '   - Set spending limits',
                '2. **Stress-test the plan** — Prepare for irregular expenses.',
                '   - Add an emergency buffer',
            ].join('\n')
        );
    });

    it('renders empty structured arrays without placeholders', () => {
        expect(
            formatSessionPlanMarkdown({
                welcome: 'Welcome.',
                summary: 'Summary.',
                objectives: [],
                skills: [],
                roadmap: [],
            })
        ).toBe(
            [
                '# Welcome.',
                '',
                'Summary.',
                '',
                '## Objectives',
                '',
                '## Skills You Can Earn',
                '',
                '## Roadmap',
            ].join('\n')
        );
    });
});
