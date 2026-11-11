import type {
    ClrCreditKind,
    ClrCreditQuantity,
    ClrCreditTotal,
    CourseDisplayModel,
} from './display.types';

/** Keeps earned, available, and inferred quantities independent, including explicit zero. */
export const getClrCreditQuantities = (course: CourseDisplayModel): ClrCreditQuantity[] => {
    const fields = [
        {
            kind: 'earned' as const,
            source: course.creditsEarned,
            unit: course.creditsEarnedUnit?.value,
        },
        {
            kind: 'available' as const,
            source: course.creditsAvailable,
            unit: course.creditsAvailableUnit?.value,
        },
        { kind: 'inferred' as const, source: course.creditsFromDescription, unit: undefined },
    ];
    return fields.flatMap(({ kind, source, unit }) =>
        source && Number.isFinite(source.value)
            ? [{ kind, amount: source.value, unit, source }]
            : []
    );
};

/** Totals only matching quantity kinds and explicitly matching units; never converts credit units. */
export const summarizeClrCredits = (courses: CourseDisplayModel[]): ClrCreditTotal[] => {
    const totals = new Map<string, ClrCreditTotal>();
    for (const course of courses) {
        for (const { kind, amount, unit } of getClrCreditQuantities(course)) {
            const key = JSON.stringify([kind, unit ?? null]);
            const current = totals.get(key);
            totals.set(key, {
                kind,
                unit,
                amount: (current?.amount ?? 0) + amount,
                recordCount: (current?.recordCount ?? 0) + 1,
            });
        }
    }
    return [...totals.values()];
};

/** Compatibility scalar is absent when the category contains incompatible units. */
export const getClrCreditTotal = (
    totals: ClrCreditTotal[],
    kind: ClrCreditKind
): number | undefined => {
    const matching = totals.filter(total => total.kind === kind);
    return matching.length === 1 ? matching[0].amount : undefined;
};

/** Formats a supplied quantity without relabeling available or inferred credits as earned. */
export const formatClrCreditTotal = (total: ClrCreditTotal): string =>
    `${total.amount} ${total.unit ? `${total.unit} ` : ''}credits ${total.kind === 'inferred' ? 'from description' : total.kind}`;
