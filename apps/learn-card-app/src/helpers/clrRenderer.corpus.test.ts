import { describe, expect, it } from 'vitest';

import { ALL_FIXTURES } from '../../../../packages/credential-library/src/fixtures';

import { normalizeClrTranscriptDisplayModel } from './clrRenderer.helpers';

const asObjects = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value)
        ? value.filter(
              (entry): entry is Record<string, unknown> =>
                  typeof entry === 'object' && entry !== null && !Array.isArray(entry)
          )
        : typeof value === 'object' && value !== null
          ? [value as Record<string, unknown>]
          : [];

const clrFixtures = ALL_FIXTURES.filter(fixture => fixture.spec === 'clr-v2');

describe('CLR canonical normalization corpus', () => {
    it('preserves every assertion and definition across the registered fixture corpus', () => {
        let embeddedCount = 0;
        let definitionOnlyCount = 0;
        let resultCount = 0;
        let associationCount = 0;

        expect(clrFixtures).toHaveLength(17);

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

        expect(embeddedCount).toBe(208);
        expect(definitionOnlyCount).toBe(6);
        expect(resultCount).toBe(277);
        expect(associationCount).toBe(181);
    });

    it('retains status-only, rubric-level-only, and unresolved result references', () => {
        const models = clrFixtures.map(fixture =>
            normalizeClrTranscriptDisplayModel(
                fixture.credential as unknown as Record<string, unknown>
            )
        );
        const results = models.flatMap(model => model.records.flatMap(record => record.results));
        const warnings = models.flatMap(model => model.canonical.warnings);

        expect(results.filter(result => result.status && !result.value)).toHaveLength(17);
        expect(results.filter(result => result.achievedLevelId && !result.value)).toHaveLength(3);
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
