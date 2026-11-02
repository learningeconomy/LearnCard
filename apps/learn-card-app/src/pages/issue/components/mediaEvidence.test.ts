import { describe, expect, it } from 'vitest';
import {
    mediaToEvidenceTemplates,
    evidenceToMediaAttachments,
    getSharedEvidenceForReview,
} from './mediaEvidence';
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
        expect(getSharedEvidenceForReview(mapped.template)).toEqual(shared);
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

describe('shared evidence review for imported credential JSON', () => {
    it('shows a single standard evidence object without changing the source', () => {
        const template = makeRun(0).template;
        template.schemaType = 'custom';
        template.rawJson = { evidence: { id: 'https://proof.test/course', name: 'Course rubric' } };
        expect(getSharedEvidenceForReview(template)).toEqual([
            {
                id: 'shared-0',
                type: 'link',
                url: 'https://proof.test/course',
                title: 'Course rubric',
            },
        ]);
        expect(template.rawJson.evidence).toEqual({
            id: 'https://proof.test/course',
            name: 'Course rubric',
        });
    });

    it('keeps shared files and links separate from per-person placeholders', () => {
        const template = makeRun(0).template;
        template.schemaType = 'custom';
        template.rawJson = {
            evidence: [
                { id: 'https://proof.test/course.pdf', name: 'Course outline', genre: 'document' },
                'https://proof.test/criteria',
                { id: '{{portfolio}}', name: 'Personal portfolio' },
                { type: 'Evidence' },
                null,
            ],
        };
        expect(getSharedEvidenceForReview(template)).toEqual([
            {
                id: 'shared-0',
                type: 'document',
                url: 'https://proof.test/course.pdf',
                title: 'Course outline',
            },
            {
                id: 'shared-1',
                type: 'link',
                url: 'https://proof.test/criteria',
                title: 'https://proof.test/criteria',
            },
        ]);
        expect(getSharedEvidenceForReview(null)).toEqual([]);
    });
});
