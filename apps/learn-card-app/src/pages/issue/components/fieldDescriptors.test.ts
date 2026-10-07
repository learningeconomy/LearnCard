import { describe, it, expect } from 'vitest';

import {
    templateToJson,
    jsonToTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    staticField,
    dynamicField,
    systemField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { FIELD_DESCRIPTORS } from './fieldDescriptors';
import type { ActivityField } from './credentialTypeCatalog';
import {
    getResultValidationError,
    readResultState,
    writeResult,
    type ResultType,
} from './resultField';

const baseTemplate = (): OBv3CredentialTemplate => ({
    schemaType: 'obv3',
    contexts: [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    types: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: staticField('Test'),
    issuer: { id: systemField('issuer_did'), name: staticField('Issuer') },
    credentialSubject: {
        id: systemField('recipient_did'),
        achievement: {
            name: staticField('Test Achievement'),
            description: staticField('A test'),
            achievementType: staticField('Course'),
        },
    },
    validFrom: systemField('issue_date'),
    customFields: [],
});

interface ResultCredentialJson extends Record<string, unknown> {
    credentialSubject: {
        achievement: {
            resultDescription: Record<string, unknown>[];
        };
        result: Record<string, unknown>[];
    };
}

const resultJson = (template: OBv3CredentialTemplate): ResultCredentialJson =>
    templateToJson(template) as unknown as ResultCredentialJson;

const DESCRIPTOR_KEYS = Object.keys(FIELD_DESCRIPTORS) as ActivityField[];

describe('FieldDescriptor get/set symmetry', () => {
    const sample: Record<string, string> = {
        completionDate: '2025-06-05',
        startDate: '2025-01-10',
        creditsEarned: '3',
        creditHours: '10 hours',
        term: 'Fall 2025',
        licenseNumber: 'RN-1234567',
        role: 'Gold Member',
        humanCode: 'CS101',
        fieldOfStudy: 'Computer Science',
        specialization: 'Machine Learning',
        version: '2.1',
        expiryDate: '2030-12-31',
        memberId: 'M-00482',
    };

    DESCRIPTOR_KEYS.forEach(key => {
        it(`round-trips ${key} (set then get)`, () => {
            const descriptor = FIELD_DESCRIPTORS[key];
            const value = sample[key];
            const next = descriptor.set(baseTemplate(), value);
            expect(descriptor.get(next)).toBe(value);
        });
    });

    it('exposes a specRef for every descriptor', () => {
        DESCRIPTOR_KEYS.forEach(key => {
            expect(FIELD_DESCRIPTORS[key].specRef).toBeTruthy();
        });
    });
});

describe('OBv3 Result / ResultDescription', () => {
    it('emits a standards-pure linked pair for a letter grade', () => {
        const t = writeResult(baseTemplate(), { resultType: 'LetterGrade', value: 'A-' });
        const json = resultJson(t);

        const descriptions = json.credentialSubject.achievement.resultDescription;
        const results = json.credentialSubject.result;

        expect(descriptions).toHaveLength(1);
        expect(descriptions[0].id).toMatch(/^urn:uuid:/);
        expect(descriptions[0].name).toBe('Final Grade');
        expect(descriptions[0].resultType).toBe('LetterGrade');

        expect(results).toHaveLength(1);
        expect(results[0].value).toBe('A-');
        expect(results[0].resultDescription).toBe(descriptions[0].id);
    });

    it('uses status (not value) for Status result type', () => {
        const t = writeResult(baseTemplate(), { resultType: 'Status', value: 'Completed' });
        const json = resultJson(t);

        expect(json.credentialSubject.result[0].status).toBe('Completed');
        expect(json.credentialSubject.result[0].value).toBeUndefined();
    });

    it('keeps the ResultDescription id stable across edits', () => {
        const first = writeResult(baseTemplate(), { resultType: 'LetterGrade', value: 'A-' });
        const firstId = resultJson(first).credentialSubject.achievement.resultDescription[0].id;

        const second = writeResult(first, { resultType: 'Percent', value: '95' });
        const secondId = resultJson(second).credentialSubject.achievement.resultDescription[0].id;

        expect(secondId).toBe(firstId);
    });
    it('preserves a linked ResultDescription with a non-default name', () => {
        const template = baseTemplate();
        const descriptionId = 'urn:uuid:data-analysis-rubric';
        template.credentialSubject.achievement.resultDescription = [
            {
                id: descriptionId,
                name: staticField('Data Analysis Rubric'),
                resultType: staticField('RawScore'),
                valueMin: staticField('1'),
                valueMax: staticField('5'),
            },
        ];
        template.credentialSubject.result = [
            {
                id: 'result_0',
                resultDescription: staticField(descriptionId),
                value: staticField('4'),
            },
        ];

        const updated = writeResult(template, { resultType: 'RawScore', value: '5' });
        const descriptions = resultJson(updated).credentialSubject.achievement.resultDescription;

        expect(descriptions).toHaveLength(1);
        expect(descriptions[0].id).toBe(descriptionId);
        expect(descriptions[0].name).toBe('Data Analysis Rubric');
    });

    it('round-trips through JSON back into typed state', () => {
        const t = writeResult(baseTemplate(), { resultType: 'GradePointAverage', value: '3.8' });
        const json = templateToJson(t);
        const parsed = jsonToTemplate(json);
        const state = readResultState(parsed);

        expect(state.resultType).toBe<ResultType>('GradePointAverage');
        expect(state.value).toBe('3.8');
        expect(state.isLegacyUntyped).toBe(false);
    });

    it('forces Percent results to the Open Skill Alignment range', () => {
        const t = writeResult(baseTemplate(), { resultType: 'Percent', value: '95' });
        const json = resultJson(t);
        const description = json.credentialSubject.achievement.resultDescription[0];

        expect(description.valueMin).toBe('0');
        expect(description.valueMax).toBe('100');
        expect(getResultValidationError(t)).toBeNull();
    });
    it('preserves custom Percent bounds in the shared JSON serializer', () => {
        const template = baseTemplate();
        template.credentialSubject.achievement.resultDescription = [
            {
                id: 'urn:uuid:custom-percent',
                name: staticField('Custom Percent Scale'),
                resultType: staticField('Percent'),
                valueMin: staticField('1'),
                valueMax: staticField('10'),
            },
        ];

        const description = resultJson(template).credentialSubject.achievement.resultDescription[0];

        expect(description.valueMin).toBe('1');
        expect(description.valueMax).toBe('10');
    });

    it('reuses a lone ResultDescription when adding its first achieved result', () => {
        const template = baseTemplate();
        const descriptionId = 'urn:uuid:description-only';
        template.credentialSubject.achievement.resultDescription = [
            {
                id: descriptionId,
                name: staticField('Available Result'),
                resultType: staticField('Percent'),
                valueMin: staticField('0'),
                valueMax: staticField('100'),
            },
        ];

        expect(getResultValidationError(template)).toBeNull();

        const updated = writeResult(template, { resultType: 'Percent', value: '95' });
        const json = resultJson(updated);

        expect(json.credentialSubject.achievement.resultDescription).toHaveLength(1);
        expect(json.credentialSubject.achievement.resultDescription[0]).toMatchObject({
            id: descriptionId,
            name: 'Available Result',
        });
        expect(json.credentialSubject.result[0].resultDescription).toBe(descriptionId);
    });

    it('round-trips raw-score bounds and result-description alignments', () => {
        const t = writeResult(baseTemplate(), {
            resultType: 'RawScore',
            value: '720',
            valueMin: '400',
            valueMax: '800',
            alignment: [
                {
                    id: 'alignment_0',
                    targetName: staticField('Data analysis'),
                    targetUrl: staticField('https://credentialengineregistry.org/resources/ce-123'),
                    targetFramework: staticField('Credential Engine Registry'),
                    targetType: staticField('CTDL'),
                },
            ],
        });
        const parsed = jsonToTemplate(templateToJson(t));
        const state = readResultState(parsed);

        expect(state.valueMin).toBe('400');
        expect(state.valueMax).toBe('800');
        expect(state.alignment?.[0].targetUrl.value).toBe(
            'https://credentialengineregistry.org/resources/ce-123'
        );
        expect(getResultValidationError(parsed)).toBeNull();
    });

    it('validates dynamic rubric and alignment fields with supplied values', () => {
        const template = writeResult(baseTemplate(), {
            resultType: 'RubricCriterionLevel',
            value: '3',
            achievedLevel: 'urn:uuid:proficient',
            rubricCriterionLevel: [
                {
                    id: 'urn:uuid:proficient',
                    name: staticField('Proficient'),
                    level: staticField('3'),
                    points: dynamicField('rubric_points'),
                },
            ],
            alignment: [
                {
                    id: 'alignment_0',
                    targetName: dynamicField('skill_name'),
                    targetUrl: dynamicField('skill_url'),
                    targetFramework: staticField('Credential Engine Registry'),
                    targetType: staticField('CTDL'),
                },
            ],
        });

        expect(getResultValidationError(template)).toBeNull();
        expect(
            getResultValidationError(template, {
                rubric_points: '3',
                skill_name: 'Data analysis',
                skill_url: 'https://example.com/skills/data-analysis',
            })
        ).toBeNull();
        expect(
            getResultValidationError(template, {
                rubric_points: '3',
                skill_name: 'Data analysis',
                skill_url: 'not-a-url',
            })
        ).toBe('Enter a valid URL for each result alignment.');
        expect(
            getResultValidationError(template, {
                rubric_points: 'three',
                skill_name: 'Data analysis',
                skill_url: 'https://example.com/skills/data-analysis',
            })
        ).toBe('Enter numeric points for each rubric level.');
    });

    it('round-trips rubric levels and constrains the achieved level', () => {
        const t = writeResult(baseTemplate(), {
            resultType: 'RubricCriterionLevel',
            value: '3',
            achievedLevel: 'urn:uuid:level-proficient',
            rubricCriterionLevel: [
                {
                    id: 'urn:uuid:level-proficient',
                    name: staticField('Proficient'),
                    level: staticField('3'),
                    points: staticField('3'),
                },
            ],
        });
        const json = resultJson(t);
        const parsed = jsonToTemplate(json);
        const state = readResultState(parsed);

        expect(json.credentialSubject.result[0].achievedLevel).toBe('urn:uuid:level-proficient');
        expect(
            json.credentialSubject.achievement.resultDescription[0].rubricCriterionLevel
        ).toEqual([
            {
                id: 'urn:uuid:level-proficient',
                type: ['RubricCriterionLevel'],
                name: 'Proficient',
                level: '3',
                points: '3',
            },
        ]);
        expect(state.achievedLevel).toBe('urn:uuid:level-proficient');
        expect(state.rubricCriterionLevel?.[0].name.value).toBe('Proficient');
        expect(getResultValidationError(parsed)).toBeNull();

        const invalid = writeResult(parsed, {
            resultType: 'RubricCriterionLevel',
            value: '3',
            achievedLevel: 'urn:uuid:missing',
            rubricCriterionLevel: state.rubricCriterionLevel,
        });
        expect(getResultValidationError(invalid)).toBe('Choose one of the declared rubric levels.');
    });

    it('accepts an achieved rubric level without a numeric value', () => {
        const template = baseTemplate();
        const descriptionId = 'urn:uuid:rubric-description';
        const levelId = 'urn:uuid:proficient';
        template.credentialSubject.achievement.resultDescription = [
            {
                id: descriptionId,
                name: staticField('Rubric'),
                resultType: staticField('RubricCriterionLevel'),
                rubricCriterionLevel: [
                    {
                        id: levelId,
                        name: staticField('Proficient'),
                        level: staticField('3'),
                        points: staticField('3'),
                    },
                ],
            },
        ];
        template.credentialSubject.result = [
            {
                id: 'result_0',
                resultDescription: staticField(descriptionId),
                achievedLevel: staticField(levelId),
            },
        ];

        expect(getResultValidationError(template)).toBeNull();
    });

    it('rejects non-numeric and out-of-range profile results', () => {
        const nonNumeric = writeResult(baseTemplate(), {
            resultType: 'RawScore',
            value: 'high',
            valueMin: '0',
            valueMax: '10',
        });
        const outOfRange = writeResult(baseTemplate(), {
            resultType: 'RawScore',
            value: '11',
            valueMin: '0',
            valueMax: '10',
        });

        expect(getResultValidationError(nonNumeric)).toBe('Enter a numeric result.');
        expect(getResultValidationError(outOfRange)).toBe('Enter a result from 0 to 10.');
    });

    it('flags a bare imported result as legacy untyped', () => {
        const t = baseTemplate();
        t.credentialSubject.result = [{ id: 'r', value: staticField('B+') }];
        const state = readResultState(t);

        expect(state.isLegacyUntyped).toBe(true);
        expect(state.value).toBe('B+');
        expect(getResultValidationError(t)).toBeNull();
    });

    it('clears the pair when value is emptied', () => {
        const filled = writeResult(baseTemplate(), { resultType: 'LetterGrade', value: 'A-' });
        const cleared = writeResult(filled, { resultType: 'LetterGrade', value: '' });

        expect(cleared.credentialSubject.result).toBeUndefined();
        expect(cleared.credentialSubject.achievement.resultDescription).toBeUndefined();
    });

    it('removes a synthesized Percent description when its result is cleared', () => {
        const filled = writeResult(baseTemplate(), { resultType: 'Percent', value: '95' });
        const state = readResultState(filled);
        const cleared = writeResult(filled, {
            resultType: 'Percent',
            value: '',
            valueMin: state.valueMin,
            valueMax: state.valueMax,
        });

        expect(cleared.credentialSubject.result).toBeUndefined();
        expect(cleared.credentialSubject.achievement.resultDescription).toBeUndefined();
    });
});
