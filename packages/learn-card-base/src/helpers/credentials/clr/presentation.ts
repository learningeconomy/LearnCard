import type { TermGroup, AssessmentSummary } from './display.types';
export type { TermGroup, AssessmentSummary } from './display.types';
import type {
    AssessmentDisplayModel,
    CourseDisplayModel,
    ResultDisplayModel,
    RubricLevelDisplayModel,
} from './display.types';
import { getActiveLocale } from '../../../i18n';

// "BachelorDegree" → "Bachelor Degree", "LearningProgram" → "Learning Program"
/** Inserts spaces between camelCase segments so achievement types read naturally in the UI. */
export const formatAchievementType = (type: string): string =>
    type.replace(/([a-z])([A-Z])/g, '$1 $2');

// "BachelorDegree" → "Degree", "AssociateDegree" → "Degree", "Certificate" → "Certificate"
/** Returns the last semantic word from an achievement type for compact labels. */
export const inferProgramKind = (type: string): string => {
    const words = formatAchievementType(type).split(' ');
    return words[words.length - 1] ?? type;
};

/** Turns a program type plus count into a readable summary label. */
export const achievementTypeLabel = (type: string, count: number): string => {
    const singular = inferProgramKind(type).replace(/s$/i, '');
    return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
};

/** Normalizes GPA-like values without changing non-numeric text. */
export const formatClrGpa = (value: string | number | boolean | undefined): string => {
    if (value === undefined) return '';

    if (typeof value === 'number') {
        return Number.isFinite(value)
            ? new Intl.NumberFormat(getActiveLocale(), {
                  maximumFractionDigits: 4,
              }).format(value)
            : String(value);
    }

    if (typeof value === 'boolean') return String(value);

    const trimmed = value.trim();
    if (trimmed === '') return trimmed;

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return trimmed;

    return new Intl.NumberFormat(getActiveLocale(), {
        maximumFractionDigits: 4,
    }).format(parsed);
};

/** Maps grade bands to the existing semantic text colors used across the app. */
export const gradeColor = (grade: string): string => {
    if (/^A/.test(grade)) return 'text-emerald-700';
    if (/^B/.test(grade)) return 'text-sky-700';
    if (/^C/.test(grade)) return 'text-yellow-700';
    if (/^D/.test(grade)) return 'text-orange-600';
    if (/^F/.test(grade)) return 'text-spice-700';
    return 'text-grayscale-600';
};

/** Converts an ISO date into a coarse academic term label for grouping. */
const deriveDisplayTerm = (isoDate: string): string => {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Undated';
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    if (m <= 5) return `Spring ${y}`;
    if (m <= 7) return `Summer ${y}`;
    return `Fall ${y}`;
};

/** Groups courses by explicit term, then falls back to a derived academic term. */
export const groupByTerm = (courses: CourseDisplayModel[]): TermGroup[] => {
    const map = new Map<string, CourseDisplayModel[]>();
    for (const course of courses) {
        const label = course.term?.value
            ? course.term.value
            : course.earnedAt?.value
              ? deriveDisplayTerm(course.earnedAt.value)
              : 'Undated';
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(course);
    }
    return Array.from(map.entries()).map(([label, c]) => ({ label, courses: c }));
};

const pickPrimaryScore = (results: ResultDisplayModel[]): ResultDisplayModel | undefined =>
    results.find(r => /composite|total|overall/i.test(r.label?.value ?? '')) ?? results[0];

/**
 * Rubric assessments summarise to the level the learner reached most often; when several
 * levels tie, the highest one on the scale wins.
 */
const modalRubricLevel = (
    results: ResultDisplayModel[]
): { levels: RubricLevelDisplayModel[]; achieved?: RubricLevelDisplayModel } | undefined => {
    const withRubric = results.filter(r => r.rubricLevels && r.rubricLevels.length > 0);
    if (withRubric.length === 0) return undefined;

    const levels = withRubric[0].rubricLevels!;
    const counts = new Map<string, number>();
    withRubric.forEach(r => {
        const name = r.achievedLevel?.name;
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    });

    let achieved: RubricLevelDisplayModel | undefined;
    let best = 0;
    levels.forEach(level => {
        const count = counts.get(level.name) ?? 0;
        if (count >= best && count > 0) {
            best = count;
            achieved = level;
        }
    });

    return { levels, achieved };
};

export const summarizeAssessment = (assessment: AssessmentDisplayModel): AssessmentSummary => {
    const { results } = assessment;

    if (assessment.isRubric) {
        const progress = modalRubricLevel(results);
        const criteria = results.length;

        return {
            headline: progress?.achieved?.name ?? `${criteria} criteria`,
            detail: `${criteria} criteri${criteria === 1 ? 'on' : 'a'}`,
            progress,
        };
    }

    const primary = pickPrimaryScore(results);
    const headline = primary ? String(getResultDisplayValue(primary)) : '—';
    const scale = primary?.valueMax?.value !== undefined ? ` of ${primary.valueMax.value}` : '';

    return {
        headline: `${headline}${scale}`,
        detail: `${results.length} score${results.length !== 1 ? 's' : ''}`,
    };
};

/** Selects display text without inventing a Result.value claim. */
export const getResultDisplayValue = (result: ResultDisplayModel): string | number | boolean =>
    result.value?.value ??
    result.achievedLevel?.name ??
    result.status?.value ??
    result.achievedLevelId?.value ??
    '—';

/** Labels a result from its own description/type; never guesses a grade from its value. */
export const getClrResultLabel = (result: ResultDisplayModel): string =>
    result.label?.value ??
    (result.resultType?.value ? formatAchievementType(result.resultType.value) : undefined) ??
    (result.status ? 'Status' : result.achievedLevelId ? 'Proficiency' : 'Result');

/** Formats a source date using the host application's active locale. */
export const formatClrDate = (value: string, locale = getActiveLocale()): string => {
    if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};
