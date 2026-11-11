import { describe, expect, it } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from './display';
import { getClrCreditQuantities, summarizeClrCredits } from './credits';

const course = (
    id: string,
    subject: Record<string, unknown>,
    achievement: Record<string, unknown> = {}
) => ({
    id,
    credentialSubject: {
        ...subject,
        achievement: { name: id, achievementType: 'Course', ...achievement },
    },
});
const modelFor = (children: Record<string, unknown>[], fields: Record<string, unknown> = {}) =>
    normalizeClrTranscriptDisplayModel({
        type: ['ClrCredential'],
        ...fields,
        credentialSubject: { verifiableCredential: children },
    });

describe('credit and collection-date semantics', () => {
    it('does not combine three earned with four merely available credits', () => {
        const model = modelFor([
            course('Design', { creditsEarned: 3 }),
            course('Writing', {}, { creditsAvailable: 4 }),
        ]);
        expect(model.summary.totalCreditsEarned).toBe(3);
        expect(model.summary.totalCreditsAvailable).toBe(4);
        expect(model.summary.creditTotals.map(total => [total.kind, total.amount])).toEqual([
            ['earned', 3],
            ['available', 4],
        ]);
        expect(model.courses[1].creditsEarned).toBeUndefined();
    });

    it('preserves zero, missing quantities, and marked description-derived quantities', () => {
        const model = modelFor([
            course('Zero', { creditsEarned: 0 }),
            course('Unknown', {}),
            course('Inferred', {}, { description: 'Elective course, 2 credits.' }),
        ]);
        expect(model.summary.totalCreditsEarned).toBe(0);
        expect(model.summary.totalCreditsAvailable).toBeUndefined();
        expect(model.summary.totalCreditsInferred).toBe(2);
        expect(getClrCreditQuantities(model.courses[0])[0].amount).toBe(0);
        expect(getClrCreditQuantities(model.courses[1])).toEqual([]);
        expect(getClrCreditQuantities(model.courses[2])[0].source.directlyMapped).toBe(false);
    });

    it('does not add incompatible or unspecified units to one scalar', () => {
        const model = modelFor([
            course('Semester', { creditsEarned: 3, creditUnit: 'semester' }),
            course('Quarter', { creditsEarned: 4, creditUnit: 'quarter' }),
            course('Unspecified', { creditsEarned: 2 }),
            course(
                'Different scopes',
                { creditsEarned: 1, creditUnit: 'semester' },
                { creditsAvailable: 5, creditUnit: 'ECTS' }
            ),
        ]);
        expect(model.summary.totalCreditsEarned).toBeUndefined();
        expect(
            summarizeClrCredits(model.courses).map(total => [total.kind, total.unit, total.amount])
        ).toEqual([
            ['earned', 'semester', 4],
            ['earned', 'quarter', 4],
            ['earned', undefined, 2],
            ['available', 'ECTS', 5],
        ]);
        expect(model.records[0].creditsEarnedUnit?.sourcePath).toBe(
            'credentialSubject.verifiableCredential[0].credentialSubject.creditUnit'
        );
        expect(model.courses[3].creditsAvailableUnit?.sourcePath).toContain(
            'achievement.creditUnit'
        );
    });

    it('keeps validity-only collection dates out of issuance', () => {
        const model = modelFor([], { validFrom: '2026-06-01' });
        expect(model.header.issuedAt).toBeUndefined();
        expect(model.header.validFrom?.value).toBe('2026-06-01');
    });

    it('maps supplied issuance, award, and validity dates independently without modifying the credential', () => {
        const raw = {
            type: ['ClrCredential'],
            issuanceDate: '2026-05-01',
            awardedDate: '2026-05-15',
            validFrom: '2026-06-01',
            credentialSubject: {},
        };
        const before = structuredClone(raw);
        const model = normalizeClrTranscriptDisplayModel(raw);
        expect(model.header.issuedAt?.sourcePath).toBe('issuanceDate');
        expect(model.header.issuedAt?.value).toBe('2026-05-01');
        expect(model.header.awardedDate?.value).toBe('2026-05-15');
        expect(model.header.validFrom?.value).toBe('2026-06-01');
        expect(raw).toEqual(before);
    });
});
