import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import ClrAwardsSection from './ClrAwardsSection';
import ClrCourseTable from './ClrCourseTable';

vi.mock('learn-card-base', () => ({
    SkillCompetencyCard: () => null,
    isSkillCompetencyAlignment: () => false,
}));

vi.mock('./ClrTranscriptEvidenceList', () => ({
    default: ({ evidence }: { evidence: { name?: { value: string } }[] }) => (
        <div>
            {evidence.map((item, index) => (
                <p key={index}>{item.name?.value}</p>
            ))}
        </div>
    ),
}));

const normalized = (achievementType: string) =>
    normalizeClrTranscriptDisplayModel({
        type: ['ClrCredential'],
        credentialSubject: {
            verifiableCredential: [
                {
                    id: 'review-record',
                    credentialSubject: {
                        achievement: {
                            name: 'Community Leadership',
                            achievementType,
                            resultDescription: [
                                { id: 'status', name: 'Completion', resultType: 'Status' },
                                { id: 'grade', name: 'Final grade', resultType: 'LetterGrade' },
                                {
                                    id: 'rubric',
                                    name: 'Leadership practice',
                                    resultType: 'RubricCriterionLevel',
                                    requiredLevel: 'developing',
                                    rubricCriterionLevel: [
                                        { id: 'developing', name: 'Developing' },
                                        { id: 'proficient', name: 'Proficient' },
                                    ],
                                },
                            ],
                        },
                        result: [
                            { resultDescription: 'status', status: 'Completed' },
                            { resultDescription: 'grade', value: 'A' },
                            { resultDescription: 'rubric', achievedLevel: 'proficient' },
                        ],
                    },
                    evidence: [
                        { name: 'Leadership project evidence', id: 'https://example.edu/evidence' },
                    ],
                },
            ],
        },
    });

describe('CLR presentation review', () => {
    it('shows qualification results, achieved and required levels, and evidence in its section', () => {
        const model = normalized('CertificateOfCompletion');
        render(<ClrAwardsSection awards={model.awards} records={model.records} />);
        expect(screen.getByText('Leadership practice')).toBeInTheDocument();
        const rubric = within(screen.getByRole('list', { name: 'Rubric scale' }));
        expect(rubric.getByText('Developing').parentElement).toHaveTextContent('passing');
        expect(rubric.getByText('Proficient').closest('[role="listitem"]')).toHaveClass(
            'bg-grayscale-900'
        );
        expect(screen.getByText('Leadership project evidence')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('keeps each course result paired with its own label, even when status precedes a grade', () => {
        const model = normalized('Course');
        render(<ClrCourseTable courses={model.courses} />);
        expect(screen.getByText('Results')).toBeInTheDocument();
        const row = within(screen.getByRole('button', { name: /Community Leadership/ }));
        expect(row.getByText('Completion').parentElement).toHaveTextContent('Completed');
        expect(row.getByText('Final grade').parentElement).toHaveTextContent('A');
        expect(row.getByText('Leadership practice').parentElement).toHaveTextContent('Proficient');
        expect(row.getByText('Completed')).toHaveClass('text-grayscale-900');
        expect(row.getByText('A')).toHaveClass('text-emerald-700');
    });

    it('uses a neutral label for untyped values and does not manufacture missing results', () => {
        const model = normalized('Course');
        const course = model.courses[0];
        const untyped = { ...course.results[1], label: undefined, resultType: undefined };
        const { rerender } = render(
            <ClrCourseTable courses={[{ ...course, results: [untyped] }]} />
        );
        expect(screen.getByText('Result')).toBeInTheDocument();
        expect(screen.queryByText('Grade')).not.toBeInTheDocument();
        rerender(
            <ClrAwardsSection awards={[{ ...normalized('License').awards[0], results: [] }]} />
        );
        expect(screen.queryByText('Leadership practice')).not.toBeInTheDocument();
        expect(screen.queryByText('Proficient')).not.toBeInTheDocument();
    });
});
