import type { VC } from '@learncard/types';

import {
    normalizeClrTranscriptDisplayModel,
    type ClrTranscriptDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import { inferProgramKind } from './clr.helpers';

export type InferredClrKind = 'transcript' | 'course' | 'degree' | 'unknown';

export type ClrTranscriptIssuerInfo = {
    issuerName?: string;
    logoSrc?: string;
};

/** Lightweight title patterns used only when structured CLR signals are inconclusive. */
const TITLE_HEURISTICS: Array<[InferredClrKind, RegExp[]]> = [
    [
        'transcript',
        [
            /\btranscript\b/i,
            /\bacademic record\b/i,
            /\bacademic history\b/i,
            /\bstudent record\b/i,
            /\bgrade report\b/i,
        ],
    ],
    [
        'course',
        [/\bcourse\b/i, /\bclass\b/i, /\bmodule\b/i, /\bunit\b/i, /\blesson\b/i],
    ],
    [
        'degree',
        [
            /\bdegree\b/i,
            /\bcertificate\b/i,
            /\bdiploma\b/i,
            /\bprogram\b/i,
            /\bbachelor\b/i,
            /\bmaster\b/i,
            /\bassociate\b/i,
            /\bdoctoral\b/i,
            /\bdoctorate\b/i,
            /\bmajor\b/i,
        ],
    ],
];

/** Uses the normalized CLR structure first, since that is the most reliable signal. */
const inferClrKindFromSignals = (model: ClrTranscriptDisplayModel): InferredClrKind => {
    // Multiple courses, GPA, competency counts, or evidence usually indicate a transcript view.
    const hasTranscriptSignals =
        model.summary.courseCount > 1 ||
        !!model.summary.gpa ||
        (model.summary.courseCount > 0 &&
            (model.summary.explicitCompetencyCount > 0 || model.summary.evidenceCount > 0));

    if (hasTranscriptSignals) return 'transcript';

    // A lone course with no programs is generally a course detail card.
    if (model.courses.length === 1 && model.programs.length === 0) return 'course';

    // Prefer explicit program metadata before falling back to title-based guessing.
    const primaryProgram = model?.programs?.[0];
    if (primaryProgram) {
        const kind = inferProgramKind(primaryProgram.achievementType.value).toLowerCase();
        if (kind === 'degree') return 'degree';
    }

    return 'unknown';
};

/** Falls back to the credential title when the structured signals do not settle the type. */
export const inferClrKindFromTitle = (title?: string): InferredClrKind => {
    const normalizedTitle = title?.trim();
    if (!normalizedTitle) return 'unknown';

    // The first matching bucket wins so transcript-specific titles do not get reclassified later.
    for (const [kind, patterns] of TITLE_HEURISTICS) {
        if (patterns.some(pattern => pattern.test(normalizedTitle))) {
            return kind;
        }
    }

    return 'unknown';
};

/** Keeps the structured inference path primary and only uses the title as a last resort. */
export const inferClrKindWithTitleFallback = (
    model: ClrTranscriptDisplayModel,
    title?: string
): InferredClrKind => {
    const inferredKind = inferClrKindFromSignals(model);
    if (inferredKind !== 'unknown') return inferredKind;
    return inferClrKindFromTitle(title);
};

/** Convenience helper used by boost title rendering and other CLR-facing UI surfaces. */
export const getClrTranscriptKind = (credential: VC): InferredClrKind => {
    try {
        const model = normalizeClrTranscriptDisplayModel(
            credential as unknown as Record<string, unknown>
        );
        return inferClrKindWithTitleFallback(model, model.header.title?.value);
    } catch {
        return 'unknown';
    }
};

/** Returns the normalized CLR issuer values used by transcript views and shared badge surfaces. */
export const getClrTranscriptIssuerInfo = (credential: VC): ClrTranscriptIssuerInfo => {
    try {
        const model = normalizeClrTranscriptDisplayModel(
            credential as unknown as Record<string, unknown>
        );

        return {
            issuerName: model.header.issuerName?.value,
            logoSrc: model.header.image?.value,
        };
    } catch {
        return {};
    }
};
