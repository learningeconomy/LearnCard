import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
    staticField,
    dynamicField,
    systemField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { ResultFieldEditor } from './ResultFieldEditor';
import { readResultState, writeResult } from './resultField';
import {
    jsonToTemplate,
    templateToJson,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

const legacyPercentTemplate = (): OBv3CredentialTemplate => ({
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
        result: [{ id: 'legacy-result', value: staticField('B+') }],
    },
    validFrom: systemField('issue_date'),
    customFields: [],
});

describe('ResultFieldEditor', () => {
    it('keeps a nonnumeric legacy result editable when Percent is selected', () => {
        const onChangeTemplate = vi.fn();
        const Harness = () => {
            const [template, setTemplate] = useState(legacyPercentTemplate);

            return (
                <ResultFieldEditor
                    template={template}
                    onChangeTemplate={next => {
                        onChangeTemplate(next);
                        setTemplate(next);
                    }}
                    canMakeDynamic={false}
                />
            );
        };

        render(<Harness />);
        expect(readResultState(legacyPercentTemplate()).isLegacyUntyped).toBe(true);

        fireEvent.click(screen.getByRole('button', { name: 'Percent' }));

        const resultInput = screen.getByPlaceholderText('e.g. 95');
        expect(resultInput).toHaveValue('B+');
        expect(screen.getByRole('alert')).toHaveTextContent('Enter a numeric result.');

        fireEvent.change(resultInput, { target: { value: '95' } });

        expect(resultInput).toHaveValue('95');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(readResultState(onChangeTemplate.mock.calls.at(-1)?.[0])).toMatchObject({
            resultType: 'Percent',
            value: '95',
            isLegacyUntyped: false,
        });
    });

    it('preserves a dynamic achieved level when removing another rubric level', () => {
        const template = writeResult(legacyPercentTemplate(), {
            resultType: 'RubricCriterionLevel',
            value: '3',
            achievedLevel: dynamicField('achieved_level'),
            rubricCriterionLevel: [
                {
                    id: 'urn:uuid:developing',
                    name: staticField('Developing'),
                    level: staticField('2'),
                    points: staticField('2'),
                },
                {
                    id: 'urn:uuid:proficient',
                    name: staticField('Proficient'),
                    level: staticField('3'),
                    points: staticField('3'),
                },
            ],
        });
        const onChangeTemplate = vi.fn();

        render(
            <ResultFieldEditor
                template={template}
                onChangeTemplate={onChangeTemplate}
                canMakeDynamic={false}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Remove rubric level 1' }));

        expect(readResultState(onChangeTemplate.mock.calls[0][0]).achievedLevelField).toMatchObject(
            {
                isDynamic: true,
                variableName: 'achieved_level',
            }
        );
    });

    it('shows and preserves a dynamic achieved level when personalizing the result value', () => {
        const template = writeResult(legacyPercentTemplate(), {
            resultType: 'RubricCriterionLevel',
            value: '3',
            achievedLevel: dynamicField('achieved_level'),
            rubricCriterionLevel: [
                {
                    id: 'urn:uuid:proficient',
                    name: staticField('Proficient'),
                    level: staticField('3'),
                    points: staticField('3'),
                },
            ],
        });
        const onChangeTemplate = vi.fn();

        render(
            <ResultFieldEditor
                template={template}
                onChangeTemplate={onChangeTemplate}
                canMakeDynamic
            />
        );

        expect(screen.getByText('{{achieved_level}}')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Personalize per recipient' }));

        expect(readResultState(onChangeTemplate.mock.calls[0][0])).toMatchObject({
            valueField: {
                isDynamic: true,
                variableName: 'grade',
            },
            achievedLevelField: {
                isDynamic: true,
                variableName: 'achieved_level',
            },
        });
    });

    it('preserves rubric description identity while replacing its last level', () => {
        const levelId = 'urn:uuid:proficient';
        const template = writeResult(legacyPercentTemplate(), {
            resultType: 'RubricCriterionLevel',
            value: '',
            achievedLevel: levelId,
            rubricCriterionLevel: [
                {
                    id: levelId,
                    name: staticField('Proficient'),
                    level: staticField('3'),
                    points: staticField('3'),
                },
            ],
        });
        const description = template.credentialSubject.achievement.resultDescription?.[0];
        if (!description) throw new Error('Expected a rubric result description');
        description.name = staticField('Imported Rubric');
        const descriptionId = description.id;
        const onChangeTemplate = vi.fn();
        const Harness = () => {
            const [currentTemplate, setCurrentTemplate] = useState(template);

            return (
                <ResultFieldEditor
                    template={currentTemplate}
                    onChangeTemplate={next => {
                        onChangeTemplate(next);
                        setCurrentTemplate(next);
                    }}
                    canMakeDynamic={false}
                />
            );
        };

        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'Remove rubric level 1' }));

        const afterRemoval = onChangeTemplate.mock.calls.at(-1)?.[0] as OBv3CredentialTemplate;
        expect(afterRemoval.credentialSubject.result).toBeUndefined();
        expect(afterRemoval.credentialSubject.achievement.resultDescription?.[0]).toMatchObject({
            id: descriptionId,
            name: { value: 'Imported Rubric' },
            rubricCriterionLevel: [],
        });

        fireEvent.click(screen.getByRole('button', { name: 'Add Level' }));

        const afterAdd = onChangeTemplate.mock.calls.at(-1)?.[0] as OBv3CredentialTemplate;
        expect(afterAdd.credentialSubject.achievement.resultDescription?.[0]).toMatchObject({
            id: descriptionId,
            name: { value: 'Imported Rubric' },
            rubricCriterionLevel: [expect.any(Object)],
        });
    });

    it('edits and round-trips an achieved-level-only rubric result', () => {
        const template = legacyPercentTemplate();
        const descriptionId = 'urn:uuid:rubric-description';
        const developingId = 'urn:uuid:developing';
        const proficientId = 'urn:uuid:proficient';
        template.credentialSubject.achievement.resultDescription = [
            {
                id: descriptionId,
                name: staticField('Rubric'),
                resultType: staticField('RubricCriterionLevel'),
                rubricCriterionLevel: [
                    {
                        id: developingId,
                        name: staticField('Developing'),
                        level: staticField('2'),
                        points: staticField('2'),
                    },
                    {
                        id: proficientId,
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
                achievedLevel: staticField(developingId),
            },
        ];
        const onChangeTemplate = vi.fn();

        render(
            <ResultFieldEditor
                template={template}
                onChangeTemplate={onChangeTemplate}
                canMakeDynamic={false}
            />
        );
        const achievedLevelSelect = screen.getByLabelText('Achieved level');
        expect(achievedLevelSelect).toBeEnabled();

        fireEvent.change(achievedLevelSelect, { target: { value: proficientId } });

        const updated = onChangeTemplate.mock.calls[0][0] as OBv3CredentialTemplate;
        const json = templateToJson(updated) as {
            credentialSubject: { result: Array<Record<string, unknown>> };
        };
        const roundTripped = jsonToTemplate(json);

        expect(json.credentialSubject.result[0]).toMatchObject({
            achievedLevel: proficientId,
        });
        expect(json.credentialSubject.result[0].value).toBeUndefined();
        expect(readResultState(roundTripped)).toMatchObject({
            achievedLevel: proficientId,
            valueField: undefined,
        });
    });
});
