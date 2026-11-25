import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../../../paraglide/runtime.js';
import * as m from '../../../paraglide/messages.js';
import { ColumnMappingsEditor } from './ColumnMappings';
import { mapSpreadsheetColumn, materializePreview } from './columnMapping';
import { mergeSpreadsheet } from './roster';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { makeRun } from './fixtures.test-support';
import type { MappingTarget } from './types';
import { templateToJson } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { validateCredentialJsonLd } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import { applyVariableValues } from '../components/variableSubstitution';

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModalWithToken: vi.fn(), forceCloseModalByToken: vi.fn() }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));

const createState = (csv: string) => {
    const run = makeRun(0);
    const source = parseSpreadsheet(readSpreadsheetText(csv));
    return { template: run.template, draft: mergeSpreadsheet(run.draft, source, []).draft };
};

const Editor = ({ csv }: { csv: string }) => {
    const [state, setState] = useState(() => createState(csv));
    return (
        <>
            <ColumnMappingsEditor
                onClose={vi.fn()}
                source={state.draft.source!}
                template={state.template}
                mappings={state.draft.mappings ?? []}
                disabled={false}
                onAdd={(id, target, options) =>
                    setState(previous =>
                        mapSpreadsheetColumn(
                            previous.template,
                            previous.draft,
                            previous.draft.source!.columns.find(column => column.id === id)!,
                            target,
                            options
                        )
                    )
                }
                onRemove={vi.fn()}
            />
            <output>
                {JSON.stringify({ json: templateToJson(state.template), draft: state.draft })}
            </output>
        </>
    );
};

afterEach(() => setLocale('en', { reload: false }));

describe('LC-2249 mapping acceptance', () => {
    it.each([
        ['Quiz Score', '95%', '85%', 'Percent', '95', '85'],
        ['Exam Score', '720', '680', 'RawScore', '720', '680'],
        ['Final Grade', 'A-', 'B+', 'LetterGrade', 'A-', 'B+'],
        ['GPA', '3.8', '3.2', 'GradePointAverage', '3.8', '3.2'],
        ['Credits', '1.5', '0', 'credits', '1.5', '0'],
        [
            'Completed',
            '2026-10-01',
            '2026-10-02',
            'awardedDate',
            '2026-10-01T00:00:00.000Z',
            '2026-10-02T00:00:00.000Z',
        ],
        [
            'Portfolio',
            'https://proof.test/a',
            'https://proof.test/b',
            'evidence',
            'https://proof.test/a',
            'https://proof.test/b',
        ],
        ['Student Code', '0012', '0009', 'description', '0012', '0009'],
        ['Hours', '12', '8', 'description', '12', '8'],
    ] as const)(
        'includes %s in the standard location and validates both recipients',
        async (label, first, second, target, firstValue, secondValue) => {
            render(
                <Editor
                    csv={`Email,Name,${label}\na@test.com,Ada,${first}\nb@test.com,Bao,${second}`}
                />
            );
            expect(screen.getByRole('combobox', { name: `Use ${label} as` })).toHaveValue(target);
            fireEvent.click(screen.getByRole('button', { name: `Include ${label}` }));
            expect(screen.queryByRole('button', { name: `Include ${label}` })).toBeNull();
            const { json: template, draft } = JSON.parse(screen.getByRole('status').textContent!);
            expect(draft.mappings).toHaveLength(1);
            const variable: string = draft.mappings[0].variable;
            for (const [index, expected] of [firstValue, secondValue].entries()) {
                const row = draft.recipients[index];
                const json = materializePreview(
                    applyVariableValues(template, draft.values[row.rowId])
                );
                expect(await validateCredentialJsonLd(json)).toEqual({ valid: true, errors: [] });
                if (['Percent', 'RawScore', 'LetterGrade', 'GradePointAverage'].includes(target)) {
                    expect(json).toMatchObject({
                        credentialSubject: {
                            result: [{ value: expected }],
                            achievement: {
                                resultDescription: [{ name: label, resultType: target }],
                            },
                        },
                    });
                    const subject = json.credentialSubject as {
                        result: { resultDescription: string }[];
                        achievement: { resultDescription: { id: string }[] };
                    };
                    expect(subject.result[0].resultDescription).toBe(
                        subject.achievement.resultDescription[0].id
                    );
                } else if (target === 'credits') {
                    expect(json).toMatchObject({
                        credentialSubject: { creditsEarned: Number(expected) },
                    });
                } else if (target === 'evidence') {
                    expect(json).toMatchObject({
                        evidence: [{ id: expected, type: ['Evidence'], name: label }],
                    });
                } else if (target === 'awardedDate') {
                    expect(json.awardedDate).toBe(expected);
                } else {
                    expect(json).toMatchObject({
                        credentialSubject: {
                            achievement: {
                                description: `Description\n${label}: ${expected}`,
                            },
                        },
                    });
                }
                expect(draft.values[row.rowId][variable]).toBe(expected);
                expect(JSON.stringify(json['@context'])).not.toContain('ctx.learncard');
            }
        }
    );

    it('requires a credit unit before explicitly including hours as credits', async () => {
        render(<Editor csv={'Email,Hours\na@test.com,12\nb@test.com,8'} />);
        fireEvent.change(screen.getByRole('combobox', { name: 'Use Hours as' }), {
            target: { value: 'credits' },
        });
        expect(screen.getByRole('button', { name: 'Include Hours' })).toBeDisabled();
        fireEvent.change(screen.getByPlaceholderText('For example, semester credit hours'), {
            target: { value: 'contact hours' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Include Hours' }));
        const { json: template, draft } = JSON.parse(screen.getByRole('status').textContent!);
        for (const [index, expected] of [12, 8].entries()) {
            const json = materializePreview(
                applyVariableValues(template, draft.values[draft.recipients[index].rowId])
            );
            expect(json).toMatchObject({
                credentialSubject: {
                    creditsEarned: expected,
                    achievement: {
                        description: `Description\nHours (contact hours): ${expected}`,
                    },
                },
            });
            expect(await validateCredentialJsonLd(json)).toEqual({ valid: true, errors: [] });
        }
    });

    it.each(['es', 'fr', 'ar'] as const)(
        'updates mapping controls after switching to %s',
        locale => {
            const state = createState('Email,Evidence,Score\na@test.com,https://proof.test/a,95');
            const props = {
                source: state.draft.source!,
                template: state.template,
                mappings: [],
                disabled: true,
                onAdd: vi.fn(),
                onRemove: vi.fn(),
                onClose: vi.fn(),
            };
            const { rerender } = render(<ColumnMappingsEditor {...props} />);
            expect(screen.getByRole('heading', { name: 'Map columns' })).toBeVisible();
            setLocale(locale, { reload: false });
            rerender(<ColumnMappingsEditor {...props} />);
            expect(screen.queryByRole('heading', { name: 'Map columns' })).toBeNull();
            expect(
                screen.getByRole('heading', { name: m['issueFlow.sheet.design.mapColumns']() })
            ).toBeVisible();
            expect(screen.getByText(m['issueFlow.sheet.design.columnsReadOnly']())).toBeVisible();
            expect(
                screen.getByRole('button', {
                    name: m['issueFlow.sheet.design.includeColumn']({ name: 'Evidence' }),
                })
            ).toBeDisabled();
            const targets = [
                'description',
                'Percent',
                'RawScore',
                'LetterGrade',
                'GradePointAverage',
                'credits',
                'evidence',
                'awardedDate',
            ] satisfies MappingTarget[];
            for (const target of targets)
                expect(
                    screen.getAllByRole('option', { name: m[`issueFlow.sheet.target.${target}`]() })
                ).toHaveLength(2);
            // User-authored headers are data, not interface translations.
            expect(screen.getByRole('heading', { name: 'Evidence' })).toBeVisible();
        }
    );
});
