import React from 'react';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SkillCompetencyCard, { isSkillCompetencyAlignment } from './SkillCompetencyCard';

describe('SkillCompetencyCard', () => {
    it('renders the name in the pill and the framework as a subtitle', () => {
        render(
            <SkillCompetencyCard
                name="Quadratic equations"
                frameworkName="AP Mathematics"
                code="2"
                description="Solves quadratic equations using multiple methods."
            />
        );

        const card = screen.getByTestId('skill-competency-card');
        const name = within(card).getByText('Quadratic equations');

        expect(name.parentElement?.classList.contains('rounded-full')).toBe(true);
        expect(within(card).getByText(/AP Mathematics/).textContent).toBe('AP Mathematics • 2');
        expect(
            within(card).getByText('Solves quadratic equations using multiple methods.')
        ).toBeTruthy();
    });

    it('omits leveling cleanly when the source does not provide it', () => {
        render(
            <SkillCompetencyCard
                name="Functions"
                frameworkName="AP Mathematics"
                description="Interprets and builds functions."
            />
        );

        expect(screen.queryByText(/^Level:/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'View Scale' })).toBeNull();
    });

    it('renders and expands an articulated scale when provided', () => {
        render(
            <SkillCompetencyCard
                name="Statistical reasoning"
                frameworkName="Data Science Competency Framework"
                levels={[
                    {
                        value: 'Advanced',
                        label: 'Competency Level',
                        scale: ['Developing', 'Proficient', 'Advanced'],
                    },
                ]}
            />
        );

        expect(screen.getByText('Advanced')).toBeTruthy();
        expect(screen.queryByText('Developing')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'View Scale' }));

        expect(screen.getByText('Developing')).toBeTruthy();
        expect(screen.getByText('Proficient')).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Hide Scale' }).getAttribute('aria-expanded')
        ).toBe('true');
    });
});

describe('isSkillCompetencyAlignment', () => {
    it('recognizes explicit competency types and LearnCard skill URLs', () => {
        expect(isSkillCompetencyAlignment({ targetType: 'CFItem' })).toBe(true);
        expect(isSkillCompetencyAlignment({ targetType: ['Alignment', 'ceasn:Competency'] })).toBe(
            true
        );
        expect(
            isSkillCompetencyAlignment({
                targetUrl: 'https://network.learncard.com/frameworks/math/skills/algebra',
            })
        ).toBe(true);
    });

    it('leaves occupations, programs, and unknown alignments on their distinct treatment', () => {
        expect(isSkillCompetencyAlignment({ targetType: 'ceterms:Occupation' })).toBe(false);
        expect(isSkillCompetencyAlignment({ targetType: 'ceterms:LearningProgram' })).toBe(false);
        expect(isSkillCompetencyAlignment({ targetType: 'ceterms:Credential' })).toBe(false);
        expect(isSkillCompetencyAlignment({})).toBe(false);
    });
});
