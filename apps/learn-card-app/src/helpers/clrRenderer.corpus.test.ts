import { describe, expect, it } from 'vitest';

import { ALL_FIXTURES } from '../../../../packages/credential-library/src/fixtures';
import type { CredentialFixture } from '../../../../packages/credential-library/src/types';

import {
    inferClrLayout,
    createClrRecordMap,
    findClrRecordByCanonicalId,
    normalizeClrTranscriptDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';

const asObjects = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value)
        ? value.filter(
              (entry): entry is Record<string, unknown> =>
                  typeof entry === 'object' && entry !== null && !Array.isArray(entry)
          )
        : typeof value === 'object' && value !== null
          ? [value as Record<string, unknown>]
          : [];

const clrFixtures = ALL_FIXTURES.filter(
    (fixture): fixture is CredentialFixture => fixture.spec === 'clr-v2'
);

describe('CLR canonical normalization corpus', () => {
    it('preserves academic fixture routing while distinguishing military and general records', () => {
        const generalIds = new Set([
            'clr/employment-record',
            'clr/training-provider-record',
            'clr/professional-organization-record',
            'clr/licensing-regulatory-record',
            'clr/mixed-career-record',
        ]);
        for (const fixture of clrFixtures) {
            const model = normalizeClrTranscriptDisplayModel(
                fixture.credential as Record<string, unknown>
            );
            const expected = fixture.id.startsWith('clr/military-')
                ? 'military'
                : generalIds.has(fixture.id)
                  ? 'general'
                  : 'academic';
            expect(inferClrLayout(model.canonical).kind, fixture.id).toBe(expected);
        }
    });
    it.each(clrFixtures)(
        'projects every record and result into display categories: $id',
        fixture => {
            const model = normalizeClrTranscriptDisplayModel(
                fixture.credential as unknown as Record<string, unknown>
            );
            const records = createClrRecordMap(model);
            expect(records.size).toBe(model.records.length);
            const displayed = [
                ...model.courses,
                ...model.programs,
                ...model.competencies,
                ...model.assessments,
                ...model.awards,
                ...model.otherRecords,
            ];
            expect(displayed.map(record => record.sourceCredentialId).sort()).toEqual(
                model.records.map(record => record.id).sort()
            );
            for (const record of model.records) {
                expect(records.get(record.id)).toEqual(
                    findClrRecordByCanonicalId(model, record.id)
                );
                const projected = displayed.find(item => item.sourceCredentialId === record.id)!;
                expect(projected.results).toHaveLength(record.results.length);
                expect(projected.evidence).toHaveLength(record.evidence.length);
                record.results.forEach((result, index) => {
                    expect(projected.results[index].value?.value).toEqual(result.value?.value);
                    expect(projected.results[index].status?.value).toEqual(result.status?.value);
                    expect(projected.results[index].achievedLevelId?.value).toEqual(
                        result.achievedLevelId?.value
                    );
                    expect(projected.results[index].resultDescriptionResolved).toBe(
                        result.resultDescriptionResolved
                    );
                });
            }
        }
    );

    it('preserves every assertion and definition across the registered fixture corpus', () => {
        let embeddedCount = 0;
        let definitionOnlyCount = 0;
        let resultCount = 0;
        let associationCount = 0;

        expect(clrFixtures).toHaveLength(18);

        for (const fixture of clrFixtures) {
            const credential = fixture.credential as unknown as Record<string, unknown>;
            const before = structuredClone(credential);
            const model = normalizeClrTranscriptDisplayModel(credential);
            const collectionSubject = asObjects(credential.credentialSubject)[0] ?? {};
            const embeddedCredentials = asObjects(collectionSubject.verifiableCredential);

            expect(credential).toEqual(before);
            expect(model.records).toBe(model.canonical.records);
            expect(
                embeddedCredentials.every(
                    source =>
                        model.records.filter(record => record.sourceCredential === source)
                            .length === 1
                )
            ).toBe(true);

            embeddedCount += model.records.filter(record => record.sourceCredential).length;
            definitionOnlyCount += model.records.filter(record => !record.sourceCredential).length;
            resultCount += model.records.reduce((sum, record) => sum + record.results.length, 0);
            associationCount += model.canonical.associations.length;
        }

        expect(embeddedCount).toBe(214);
        expect(definitionOnlyCount).toBe(6);
        expect(resultCount).toBe(281);
        expect(associationCount).toBe(183);
    });

    it('retains status-only, rubric-level-only, and unresolved result references', () => {
        const models = clrFixtures.map(fixture =>
            normalizeClrTranscriptDisplayModel(
                fixture.credential as unknown as Record<string, unknown>
            )
        );
        const results = models.flatMap(model => model.records.flatMap(record => record.results));
        const warnings = models.flatMap(model => model.canonical.warnings);

        expect(results.filter(result => result.status && !result.value)).toHaveLength(19);
        expect(results.filter(result => result.achievedLevelId && !result.value)).toHaveLength(4);
        expect(
            warnings.filter(warning => warning.code === 'UNRESOLVED_RESULT_DESCRIPTION')
        ).toHaveLength(6);
    });

    it('exposes military records as display hints without filtering nonacademic children', () => {
        const fixture = clrFixtures.find(item => item.id === 'clr/military-training-record');
        expect(fixture).toBeDefined();

        const model = normalizeClrTranscriptDisplayModel(
            fixture!.credential as unknown as Record<string, unknown>
        );

        expect(model.records.map(record => record.name?.value)).toEqual([
            'Logistics Coordination Fundamentals',
            'Supervised Logistics Exercise',
            'Training Team Contribution Award',
        ]);
        expect(model.records.map(record => record.presentationHints)).toEqual([
            ['course', 'activity'],
            ['activity'],
            ['award', 'activity'],
        ]);
        expect(model.records.every(record => record.provenance.issuer)).toBe(true);
        expect(model.records.every(record => record.provenance.assessor)).toBe(true);
        expect(model.records.every(record => record.provenance.creator)).toBe(true);
        expect(model.records.every(record => record.dates.awarded && record.dates.validFrom)).toBe(
            true
        );
    });
});
