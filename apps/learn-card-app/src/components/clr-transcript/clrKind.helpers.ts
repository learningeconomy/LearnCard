import type { VC } from '@learncard/types';

import {
    normalizeClrTranscriptDisplayModel,
    type ClrTranscriptDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import { inferProgramKind } from './clr.helpers';

export type InferredClrKind = 'transcript' | 'course' | 'degree' | 'unknown';

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

const inferClrKindFromSignals = (model: ClrTranscriptDisplayModel): InferredClrKind => {
    const hasTranscriptSignals =
        model.summary.courseCount > 1 ||
        !!model.summary.gpa ||
        (model.summary.courseCount > 0 &&
            (model.summary.explicitCompetencyCount > 0 || model.summary.evidenceCount > 0));

    if (hasTranscriptSignals) return 'transcript';

    if (model.courses.length === 1 && model.programs.length === 0) return 'course';

    const primaryProgram = model?.programs?.[0];
    if (primaryProgram) {
        const kind = inferProgramKind(primaryProgram.achievementType.value).toLowerCase();
        if (kind === 'degree') return 'degree';
    }

    return 'unknown';
};

export const inferClrKindFromTitle = (title?: string): InferredClrKind => {
    const normalizedTitle = title?.trim();
    if (!normalizedTitle) return 'unknown';

    for (const [kind, patterns] of TITLE_HEURISTICS) {
        if (patterns.some(pattern => pattern.test(normalizedTitle))) {
            return kind;
        }
    }

    return 'unknown';
};

export const inferClrKindWithTitleFallback = (
    model: ClrTranscriptDisplayModel,
    title?: string
): InferredClrKind => {
    const inferredKind = inferClrKindFromSignals(model);
    if (inferredKind !== 'unknown') return inferredKind;
    return inferClrKindFromTitle(title);
};

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
