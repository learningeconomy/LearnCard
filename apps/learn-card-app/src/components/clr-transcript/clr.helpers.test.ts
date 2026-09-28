import { describe, expect, it } from 'vitest';

import { summarizeAssessment } from './clr.helpers';

import type {
    AssessmentDisplayModel,
    ResultDisplayModel,
    RubricLevelDisplayModel,
} from '../../helpers/clrRenderer.helpers';

const mapped = <T>(value: T) => ({
    value,
    sourcePath: 'test',
    specField: 'test',
    directlyMapped: true as const,
});

const LEVELS: RubricLevelDisplayModel[] = [
    { id: 'l1', name: 'Exploring', points: '1' },
    { id: 'l2', name: 'Analyzing', points: '2' },
    { id: 'l3', name: 'Integrating', points: '3' },
    { id: 'l4', name: 'Extending', points: '4' },
];

const rubricResult = (achieved: string): ResultDisplayModel => ({
    value: mapped(achieved),
    rubricLevels: LEVELS,
    achievedLevel: LEVELS.find(level => level.name === achieved),
});

const scoreResult = (label: string, value: number, max = '36'): ResultDisplayModel => ({
    value: mapped(value),
    label: mapped(label),
    valueMin: mapped('1'),
    valueMax: mapped(max),
});

const assessment = (results: ResultDisplayModel[], isRubric: boolean): AssessmentDisplayModel => ({
    achievementType: mapped('Assessment'),
    sourceCredentialId: 'urn:uuid:test',
    results,
    alignments: [],
    evidence: [],
    isRubric,
});

describe('summarizeAssessment', () => {
    it('summarises a rubric assessment by its most common achieved level', () => {
        const summary = summarizeAssessment(
            assessment(
                [
                    rubricResult('Integrating'),
                    rubricResult('Integrating'),
                    rubricResult('Exploring'),
                ],
                true
            )
        );

        expect(summary.headline).toBe('Integrating');
        expect(summary.detail).toBe('3 criteria');
        expect(summary.progress?.levels).toEqual(LEVELS);
        expect(summary.progress?.achieved?.name).toBe('Integrating');
    });

    it('breaks ties toward the higher level on the scale', () => {
        const summary = summarizeAssessment(
            assessment([rubricResult('Analyzing'), rubricResult('Extending')], true)
        );

        expect(summary.headline).toBe('Extending');
    });

    it('prefers a composite/total score for plain score assessments', () => {
        const summary = summarizeAssessment(
            assessment(
                [
                    scoreResult('ACT English Score', 20),
                    scoreResult('ACT Composite Score', 22),
                    scoreResult('ACT Math Score', 23),
                ],
                false
            )
        );

        expect(summary.headline).toBe('22 of 36');
        expect(summary.detail).toBe('3 scores');
        expect(summary.progress).toBeUndefined();
    });

    it('falls back to the first score and singular labels', () => {
        const summary = summarizeAssessment(assessment([scoreResult('Reading', 24)], false));

        expect(summary.headline).toBe('24 of 36');
        expect(summary.detail).toBe('1 score');
    });

    it('reports criteria count when no level was achieved', () => {
        const summary = summarizeAssessment(
            assessment([{ value: mapped('n/a'), rubricLevels: LEVELS }], true)
        );

        expect(summary.headline).toBe('1 criteria');
        expect(summary.detail).toBe('1 criterion');
    });
});
