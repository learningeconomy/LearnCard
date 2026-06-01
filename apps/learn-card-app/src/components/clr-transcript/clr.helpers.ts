import type { CourseDisplayModel } from '../../helpers/clrRenderer.helpers';

// "BachelorDegree" → "Bachelor Degree", "LearningProgram" → "Learning Program"
export const formatAchievementType = (type: string): string =>
    type.replace(/([a-z])([A-Z])/g, '$1 $2');

// "BachelorDegree" → "Degree", "AssociateDegree" → "Degree", "Certificate" → "Certificate"
export const inferProgramKind = (type: string): string => {
    const words = formatAchievementType(type).split(' ');
    return words[words.length - 1] ?? type;
};

export const achievementTypeLabel = (type: string, count: number): string => {
    const singular = inferProgramKind(type).replace(/s$/i, '');
    return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
};

export const gradeColor = (grade: string): string => {
    if (/^A/.test(grade)) return 'text-emerald-600';
    if (/^B/.test(grade)) return 'text-blue-600';
    if (/^C/.test(grade)) return 'text-amber-600';
    if (/^[DF]/.test(grade)) return 'text-red-600';
    return 'text-grayscale-600';
};

const deriveDisplayTerm = (isoDate: string): string => {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Undated';
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    if (m <= 5) return `Spring ${y}`;
    if (m <= 7) return `Summer ${y}`;
    return `Fall ${y}`;
};

export type TermGroup = { label: string; courses: CourseDisplayModel[] };

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
