import { describe, expect, it } from 'vitest';
import { mediaToEvidenceTemplates, evidenceToMediaAttachments } from './mediaEvidence';
import { mapSpreadsheetColumn, materializePreview } from '../spreadsheet/columnMapping';
import { mergeSpreadsheet } from '../spreadsheet/roster';
import { parseSpreadsheet, readSpreadsheetText } from '../spreadsheet/parseSpreadsheet';
import { makeRun } from '../spreadsheet/fixtures.test-support';
import { templateToJson } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { applyVariableValues } from './variableSubstitution';

describe('shared media with recipient Evidence mappings', () => {
    it('preserves mapped Portfolio URLs when shared links are added and removed', () => {
        const run = makeRun(0);
        const draft = mergeSpreadsheet(
            run.draft,
            parseSpreadsheet(
                readSpreadsheetText('Email,Portfolio\na@test.com,https://proof.test/ada')
            ),
            []
        ).draft;
        const mapped = mapSpreadsheetColumn(
            run.template,
            draft,
            draft.source!.columns[1],
            'evidence',
            { dateFormat: 'iso', numericFormat: 'dot' }
        );
        const subject = mapped.template.credentialSubject;
        const shared = [
            {
                id: 'shared',
                type: 'link' as const,
                url: 'https://proof.test/shared',
                title: 'Course',
            },
        ];
        expect(evidenceToMediaAttachments(subject.evidence!)).toEqual([]);
        subject.evidence = mediaToEvidenceTemplates(shared, subject.evidence);
        expect(evidenceToMediaAttachments(subject.evidence)).toEqual(shared);
        const json = () =>
            materializePreview(
                applyVariableValues(
                    templateToJson(mapped.template),
                    mapped.draft.values[mapped.draft.recipients[0].rowId!]
                )
            );
        expect(json().evidence).toEqual([
            expect.objectContaining({ id: 'https://proof.test/ada' }),
            expect.objectContaining({ id: 'https://proof.test/shared' }),
        ]);
        subject.evidence = mediaToEvidenceTemplates([], subject.evidence);
        expect(json().evidence).toEqual([
            expect.objectContaining({ id: 'https://proof.test/ada' }),
        ]);
        expect(subject.evidence[0].evidenceUrl!.variableName).toBe(mapped.variable);
    });
});
