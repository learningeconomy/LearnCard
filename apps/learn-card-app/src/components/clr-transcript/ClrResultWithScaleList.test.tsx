import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { clrAchievementIdAssociations } from '../../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

import type { ResultDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import ClrResultWithScaleList from './ClrResultWithScaleList';

const model = normalizeClrTranscriptDisplayModel(
    clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
);

const resultFor = (recordName: string) => {
    const records = [...model.courses, ...model.programs, ...model.assessments];
    const record = records.find(candidate => candidate.name?.value === recordName);
    if (!record) throw new Error(`Missing fixture record: ${recordName}`);
    return record.results;
};

describe('ClrResultWithScaleList', () => {
    it('renders rubric-only and status-only results without inventing numeric values', () => {
        const normalized = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            credentialSubject: {
                verifiableCredential: [
                    {
                        id: 'assessment',
                        credentialSubject: {
                            achievement: {
                                achievementType: 'Assessment',
                                resultDescription: [
                                    {
                                        id: 'rubric',
                                        name: 'Practice',
                                        rubricCriterionLevel: [
                                            { id: 'advanced', name: 'Advanced' },
                                        ],
                                    },
                                ],
                            },
                            result: [
                                { resultDescription: 'rubric', achievedLevel: 'advanced' },
                                { status: 'Completed' },
                            ],
                        },
                    },
                ],
            },
        });
        const results = normalized.assessments[0].results;
        expect(results.every(result => result.value === undefined)).toBe(true);
        render(<ClrResultWithScaleList results={results} />);
        expect(screen.getByRole('list', { name: 'Rubric scale' })).toHaveTextContent('Advanced');
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    it('positions ordinal and numeric values with passing markers', () => {
        const { rerender } = render(
            <ClrResultWithScaleList results={resultFor('Foundations of Systems Thinking')} />
        );

        expect(
            screen.getByRole('img', {
                name: /Scale: Beginning, Developing, Proficient, Advanced; achieved Advanced; passing Proficient/,
            })
        ).toBeInTheDocument();
        expect(screen.getByText('passing')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Aligns to Systems Thinking/ })).toHaveAttribute(
            'href',
            'https://example.edu/framework/systems-thinking'
        );

        rerender(<ClrResultWithScaleList results={resultFor('Applied Systems Design')} />);

        expect(
            screen.getByRole('img', {
                name: 'Numeric scale from 0 to 100; achieved 86; passing 70',
            })
        ).toBeInTheDocument();
        expect(screen.getByText('passing 70')).toBeInTheDocument();
    });

    it('shows every rubric rung, expands the achieved description, and marks passing', () => {
        render(<ClrResultWithScaleList results={resultFor('Systems Design Assessment')} />);

        expect(screen.getByRole('list', { name: 'Rubric scale' })).toBeInTheDocument();
        expect(screen.getByText('Developing')).toBeInTheDocument();
        expect(screen.getByText('Proficient')).toBeInTheDocument();
        expect(screen.getAllByText('Advanced')).toHaveLength(2);
        expect(
            screen.getByText('Adapts the design process to complex constraints.')
        ).toBeInTheDocument();
        expect(screen.getByText('passing')).toBeInTheDocument();
    });

    it('renders status results as a chip without a scale', () => {
        render(<ClrResultWithScaleList results={resultFor('Systems Design Certificate')} />);

        expect(screen.getByText('Program Status')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('preserves a declared one-sided numeric bound', () => {
        const maxOnly: ResultDisplayModel = {
            value: {
                value: 8,
                sourcePath: 'credentialSubject.result[0].value',
                specField: 'result.value',
                directlyMapped: true,
            },
            valueMax: {
                value: '10',
                sourcePath: 'achievement.resultDescription[0].valueMax',
                specField: 'resultDescription.valueMax',
                directlyMapped: true,
            },
            alignments: [],
            resultDescriptionResolved: true,
        };

        render(<ClrResultWithScaleList results={[maxOnly]} />);

        expect(screen.getByText('Scale: maximum 10')).toBeInTheDocument();
    });

    it('falls back to readable bounds when a numeric scale cannot be plotted', () => {
        const invalidScale: ResultDisplayModel = {
            value: {
                value: 'not scored',
                sourcePath: 'credentialSubject.result[0].value',
                specField: 'result.value',
                directlyMapped: true,
            },
            valueMin: {
                value: '10',
                sourcePath: 'achievement.resultDescription[0].valueMin',
                specField: 'resultDescription.valueMin',
                directlyMapped: true,
            },
            valueMax: {
                value: '5',
                sourcePath: 'achievement.resultDescription[0].valueMax',
                specField: 'resultDescription.valueMax',
                directlyMapped: true,
            },
            alignments: [],
            resultDescriptionResolved: true,
        };

        render(<ClrResultWithScaleList results={[invalidScale]} />);

        expect(screen.getByText('not scored')).toBeInTheDocument();
        expect(screen.getByText('Scale: 10–5')).toBeInTheDocument();
    });
});
