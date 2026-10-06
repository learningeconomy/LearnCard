import { describe, expect, it } from 'vitest';

import { normalizeClrCredential } from './normalize';

const buildEmbeddedCredential = (
    id: string,
    label: string,
    status: string,
    ordinal: string
): Record<string, unknown> => ({
    id,
    type: ['VerifiableCredential', 'AchievementCredential'],
    issuer: { id: `did:example:issuer:${ordinal}`, name: `${label} Issuer` },
    validFrom: `2026-0${ordinal}-10T00:00:00Z`,
    credentialSubject: {
        id: 'did:example:learner',
        source: { id: `did:example:assessor:${ordinal}`, name: `${label} Assessor` },
        activityStartDate: `2026-0${ordinal}-01T00:00:00Z`,
        achievement: {
            id: 'urn:achievement:shared',
            type: ['Achievement'],
            achievementType: 'Course',
            name: `${label} Assertion`,
            creator: { id: `did:example:creator:${ordinal}`, name: `${label} Creator` },
        },
        result: [
            {
                type: ['Result'],
                resultDescription: 'urn:result-description:status',
                status,
            },
        ],
    },
});

const buildSharedAchievementClr = (): Record<string, unknown> => ({
    id: 'urn:clr:shared-achievement',
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: { id: 'did:example:publisher', name: 'Collection Publisher' },
    credentialSubject: {
        id: 'did:example:learner',
        achievement: [
            {
                id: 'urn:achievement:shared',
                type: ['Achievement'],
                achievementType: 'Course',
                name: 'Catalog Definition',
                resultDescription: [
                    {
                        id: 'urn:result-description:status',
                        type: ['ResultDescription'],
                        resultType: 'Status',
                        allowedValue: ['InProgress', 'Completed'],
                    },
                ],
            },
        ],
        verifiableCredential: [
            buildEmbeddedCredential('urn:credential:first', 'First', 'Completed', '1'),
            buildEmbeddedCredential('urn:credential:second', 'Second', 'InProgress', '2'),
        ],
        association: [
            {
                type: 'Association',
                associationType: 'isRelatedTo',
                sourceId: 'urn:achievement:shared',
                targetId: 'urn:credential:first',
            },
            {
                type: ['Association', 'ExtensionAssociation'],
                associationType: 'precedes',
                sourceId: 'urn:credential:first',
                targetId: 'urn:credential:second',
            },
        ],
    },
});

describe('normalizeClrCredential', () => {
    it('keeps assertions distinct when they share an achievement definition', () => {
        const credential = buildSharedAchievementClr();
        const before = structuredClone(credential);
        const model = normalizeClrCredential(credential);

        expect(credential).toEqual(before);
        expect(model.records).toHaveLength(2);
        expect(model.records.map(record => record.id)).toEqual([
            'urn:credential:first',
            'urn:credential:second',
        ]);
        expect(model.records.map(record => record.name?.value)).toEqual([
            'First Assertion',
            'Second Assertion',
        ]);
        expect(model.records.map(record => record.results[0]?.status?.value)).toEqual([
            'Completed',
            'InProgress',
        ]);
        expect(model.records.every(record => record.results[0]?.resultDescriptionResolved)).toBe(
            true
        );
        expect(model.records.map(record => record.provenance.issuer?.name?.value)).toEqual([
            'First Issuer',
            'Second Issuer',
        ]);
        expect(model.records.map(record => record.provenance.assessor?.name?.value)).toEqual([
            'First Assessor',
            'Second Assessor',
        ]);
        expect(model.records.map(record => record.provenance.creator?.name?.value)).toEqual([
            'First Creator',
            'Second Creator',
        ]);
    });

    it('resolves associations through set-valued aliases without guessing', () => {
        const model = normalizeClrCredential(buildSharedAchievementClr());

        expect(model.associations[0]).toMatchObject({
            sourceResolution: 'ambiguous',
            targetResolution: 'resolved',
            targetRecordId: 'urn:credential:first',
        });
        expect(model.associations[0]?.sourceRecordId).toBeUndefined();
        expect(model.associations[0]?.types.map(type => type.value)).toEqual(['Association']);
        expect(model.associations[1]).toMatchObject({
            sourceResolution: 'resolved',
            targetResolution: 'resolved',
            sourceRecordId: 'urn:credential:first',
            targetRecordId: 'urn:credential:second',
        });
        expect(model.associations[1]?.types.map(type => type.value)).toEqual([
            'Association',
            'ExtensionAssociation',
        ]);
        expect(
            model.warnings.some(warning => warning.code === 'AMBIGUOUS_ASSOCIATION_ENDPOINT')
        ).toBe(true);
    });

    it('uses stable source-path IDs and retains duplicate credential occurrences', () => {
        const model = normalizeClrCredential({
            id: 'urn:clr:missing-ids',
            credentialSubject: {
                verifiableCredential: [
                    {
                        id: 'urn:credential:duplicate',
                        credentialSubject: {
                            achievement: {
                                achievementType: 'MilitaryQualificationExtension',
                                name: 'First occurrence',
                            },
                        },
                    },
                    {
                        id: 'urn:credential:duplicate',
                        credentialSubject: {
                            achievement: {
                                achievementType: 'MilitaryQualificationExtension',
                                name: 'Second occurrence',
                            },
                        },
                    },
                    {
                        credentialSubject: {
                            achievement: { name: 'Missing credential and achievement IDs' },
                        },
                    },
                ],
            },
        });

        expect(model.records.map(record => record.id)).toEqual([
            'urn:credential:duplicate',
            'urn:credential:duplicate#occurrence-1',
            'urn:clr:missing-ids#embedded-2',
        ]);
        expect(model.records.map(record => record.name?.value)).toEqual([
            'First occurrence',
            'Second occurrence',
            'Missing credential and achievement IDs',
        ]);
        expect(model.records.slice(0, 2).map(record => record.presentationHints)).toEqual([
            ['generic'],
            ['generic'],
        ]);
        expect(model.warnings.some(warning => warning.code === 'DUPLICATE_CREDENTIAL_ID')).toBe(
            true
        );
    });
});
