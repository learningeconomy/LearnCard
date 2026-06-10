import { openAttachmentUrl as openSharedAttachmentUrl } from 'learn-card-base/helpers/openAttachmentUrl';

import type { CourseDisplayModel, EvidenceDisplayModel } from '../../helpers/clrRenderer.helpers';

/** Keeps the evidence picker focused on items that can actually be downloaded. */
export const getDownloadableEvidence = (evidence: EvidenceDisplayModel[]): EvidenceDisplayModel[] =>
    evidence.filter(e => e.id?.value);

/** Builds a filesystem-safe filename while preserving a real extension when one is already present. */
export const toSafeFileName = (name: string | undefined, mimeType: string | undefined): string => {
    const base = (name || 'evidence').trim().replace(/[^\w.\-]/g, '_');
    if (/\.\w{2,5}$/.test(base)) return base;
    const ext =
        mimeType === 'application/pdf'
            ? '.pdf'
            : mimeType?.startsWith('image/')
            ? `.${mimeType.split('/')[1]}`
            : '';
    return `${base}${ext}`;
};

export const openAttachmentUrl = (url: string | undefined, fileName: string): Promise<boolean> =>
    openSharedAttachmentUrl(url, fileName);

/** Downloads inline data URIs or remote evidence links using the best available platform path. */
export const downloadEvidence = (item: EvidenceDisplayModel): Promise<boolean> =>
    openAttachmentUrl(item.id?.value, toSafeFileName(item.name?.value, item.mimeType));

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
            ? new Intl.NumberFormat('en-US', {
                  maximumFractionDigits: 4,
              }).format(value)
            : String(value);
    }

    if (typeof value === 'boolean') return String(value);

    const trimmed = value.trim();
    if (trimmed === '') return trimmed;

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return trimmed;

    return new Intl.NumberFormat('en-US', {
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

/** Maps grade bands to a matching background and border treatment. */
export const gradeColorBackground = (grade: string): string => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'bg-emerald-100 border-emerald-400';
    if (['B+', 'B', 'B-'].includes(grade)) return 'bg-sky-100 border-sky-300';
    if (['C+', 'C', 'C-'].includes(grade)) return 'bg-yellow-200 border-yellow-400';
    if (['D+', 'D', 'D-'].includes(grade)) return 'bg-orange-200 border-orange-400';
    if (grade === 'F') return 'bg-spice-100 border-spice-400';
    return 'bg-emerald-100 border-emerald-400';
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

export type TermGroup = { label: string; courses: CourseDisplayModel[] };

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
