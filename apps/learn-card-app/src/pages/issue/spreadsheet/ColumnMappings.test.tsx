import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ColumnMappings } from './ColumnMappings';
import {
    mapSpreadsheetColumn,
    removeSpreadsheetMapping,
    materializePreview,
} from './columnMapping';
import { mergeSpreadsheet, exportRosterCsv } from './roster';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { makeRun } from './fixtures.test-support';
import {
    templateToJson,
    extractVariablesByType,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { validateCredentialJsonLd } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import { applyVariableValues } from '../components/variableSubstitution';

const createState = () => {
    const run = makeRun(0);
    const source = parseSpreadsheet(
        readSpreadsheetText(
            'Email,Name,Evidence,Portfolio,Score\nada@test.com,Ada,https://proof.test/evidence,https://proof.test/portfolio,95'
        )
    );
    return { template: run.template, draft: mergeSpreadsheet(run.draft, source, []).draft };
};
const options = { dateFormat: 'iso', numericFormat: 'dot' } as const;
const Editor = () => {
    const [state, setState] = useState(createState);
    return (
        <>
            <ColumnMappings
                source={state.draft.source!}
                template={state.template}
                mappings={state.draft.mappings ?? []}
                disabled={false}
                onAdd={(id, target, config) =>
                    setState(previous =>
                        mapSpreadsheetColumn(
                            previous.template,
                            previous.draft,
                            previous.draft.source!.columns.find(column => column.id === id)!,
                            target,
                            config
                        )
                    )
                }
                onRemove={variable =>
                    setState(previous =>
                        removeSpreadsheetMapping(previous.template, previous.draft, variable)
                    )
                }
            />
            <output>{JSON.stringify(templateToJson(state.template))}</output>
        </>
    );
};

describe('spreadsheet mapping chips', () => {
    it('offers both evidence columns independently and removes one without removing the other', () => {
        render(<Editor />);
        const evidence = screen.getByRole('button', { name: 'Evidence' });
        const portfolio = screen.getByRole('button', { name: 'Portfolio' });
        expect(JSON.parse(screen.getByRole('status').textContent!).evidence).toBeUndefined();
        expect(screen.getByRole('combobox', { name: 'Use Evidence as' })).toHaveValue('evidence');
        fireEvent.click(evidence);
        fireEvent.click(portfolio);
        expect(evidence).toHaveAttribute('aria-pressed', 'true');
        expect(portfolio).toHaveAttribute('aria-pressed', 'true');
        expect(JSON.parse(screen.getByRole('status').textContent!).evidence).toHaveLength(2);
        fireEvent.click(evidence);
        const json = JSON.parse(screen.getByRole('status').textContent!);
        expect(json.evidence).toHaveLength(1);
        expect(json.evidence[0].name).toBe('Portfolio');
        expect(evidence).toHaveAttribute('aria-pressed', 'false');
    });
    it.each(['clr2', 'custom'] as const)(
        'does not offer %s mapping or dispatch a mapping action',
        schemaType => {
            const state = createState();
            const onAdd = vi.fn();
            render(
                <ColumnMappings
                    source={state.draft.source!}
                    template={{ ...state.template, schemaType }}
                    mappings={[]}
                    disabled={false}
                    onAdd={onAdd}
                    onRemove={vi.fn()}
                />
            );
            const evidence = screen.getByRole('button', { name: 'Evidence' });
            expect(evidence).toBeDisabled();
            fireEvent.click(evidence);
            expect(onAdd).not.toHaveBeenCalled();
        }
    );
    it('round-trips mapped evidence and the table evidence cell without duplicate CSV headers', async () => {
        let state = createState();
        expect(state.draft.evidence).toEqual({});
        for (const column of state.draft.source!.columns.filter(item =>
            ['Evidence', 'Portfolio'].includes(item.label)
        ))
            state = mapSpreadsheetColumn(state.template, state.draft, column, 'evidence', options);
        const rowId = state.draft.recipients[0].rowId!;
        state.draft.evidence[rowId] = 'https://proof.test/extra';
        const variables = extractVariablesByType(state.template).dynamic;
        const scopes = Object.fromEntries(variables.map(name => [name, 'perRecipient' as const]));
        const csv = exportRosterCsv(state.draft, variables, scopes, {});
        expect(csv).toContain('Evidence [2]');
        const restored = mergeSpreadsheet(
            state.draft,
            parseSpreadsheet(readSpreadsheetText(csv)),
            variables
        ).draft;
        expect(restored.values).toEqual(state.draft.values);
        expect(restored.evidence).toEqual(state.draft.evidence);
        const json = materializePreview(
            applyVariableValues(templateToJson(state.template), restored.values[rowId])
        );
        expect(json.evidence).toEqual([
            expect.objectContaining({ id: 'https://proof.test/evidence', type: ['Evidence'] }),
            expect.objectContaining({ id: 'https://proof.test/portfolio', type: ['Evidence'] }),
        ]);
        expect(await validateCredentialJsonLd(json)).toEqual({ valid: true, errors: [] });
        const onAdd = vi.fn();
        render(
            <ColumnMappings
                source={restored.source!}
                template={state.template}
                mappings={restored.mappings!}
                disabled={false}
                onAdd={onAdd}
                onRemove={vi.fn()}
            />
        );
        expect(screen.queryByRole('button', { name: /^Evidence/ })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Portfolio' })).toBeNull();
    });
});
