import React from 'react';
import { VC } from '@learncard/types';

import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';

import PaperClip from '../svgs/PaperClip';
import { FlatIcon } from './ClrStatCard';
import {
    normalizeClrTranscriptDisplayModel,
    type ClrTranscriptDisplayModel,
    type CourseDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import { formatClrGpa } from './clr.helpers';
import {
    inferClrKindWithTitleFallback,
    type InferredClrKind,
} from './clrKind.helpers';

const getClrGrade = (course?: CourseDisplayModel): string | undefined => {
    if (!course) return undefined;

    const gradeLikeResult = course.results.find(result => {
        const label = result.label?.value?.toString().toLowerCase() ?? '';
        const type = result.resultType?.value?.toString().toLowerCase() ?? '';

        return label.includes('grade') || type.includes('grade');
    });

    const resolvedResult =
        gradeLikeResult ??
        course?.results?.find(result => result.resultType?.value !== 'GradePointAverage') ??
        course?.results?.[0];

    if (!resolvedResult?.value?.value && resolvedResult?.value?.value !== 0) return undefined;

    return String(resolvedResult.value.value);
};

const ClrMetricChip: React.FC<{
    icon: React.ReactNode;
    value: string | number;
}> = ({ icon, value }) => (
    <div className="inline-flex items-center gap-1.5 text-grayscale-600">
        <span className="shrink-0 text-grayscale-500">{icon}</span>
        <span className="text-[12px] font-semibold text-grayscale-700">{value}</span>
    </div>
);

const ClrTranscriptTitleDisplay: React.FC<{ credential: VC; fallbackTitle: string }> = ({
    credential,
    fallbackTitle,
}) => {
    let model: ClrTranscriptDisplayModel | undefined;

    try {
        model = normalizeClrTranscriptDisplayModel(
            credential as unknown as Record<string, unknown>
        );
    } catch {
        model = undefined;
    }

    if (!model) {
        return (
            <div className="flex w-full min-w-0 flex-col items-center justify-start mt-[0px]">
                <span className="w-full px-[8px] text-center text-grayscale-900 text-[16px] font-notoSans font-semibold leading-[125%] line-clamp-2 break-words">
                    {fallbackTitle}
                </span>
            </div>
        );
    }

    const inferredKind = inferClrKindWithTitleFallback(
        model,
        fallbackTitle || model.header.title?.value
    );

    if (inferredKind === 'unknown') {
        return (
            <div className="flex w-full min-w-0 flex-col items-center justify-start mt-[0px]">
                <span className="w-full px-[8px] text-center text-grayscale-900 text-[16px] font-notoSans font-semibold leading-[125%] line-clamp-2 break-words">
                    {model.header.title?.value || fallbackTitle}
                </span>
            </div>
        );
    }

    if (inferredKind === 'transcript') {
        return (
            <div className="flex w-full min-w-0 flex-col items-center justify-start mt-[0px] px-2">
                {model.summary.gpa && (
                    <p className="mt-2 text-[14px] font-semibold text-grayscale-900 text-center">
                        GPA: {formatClrGpa(model.summary.gpa.value)}
                    </p>
                )}
                <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
                    {model.summary.courseCount > 0 && (
                        <ClrMetricChip
                            icon={
                                <FlatIcon>
                                    <StudiesIcon className="h-4 w-4" />
                                </FlatIcon>
                            }
                            value={model.summary.courseCount}
                        />
                    )}
                    {model.summary.explicitCompetencyCount > 0 && (
                        <ClrMetricChip
                            icon={
                                <FlatIcon>
                                    <SkillsIcon className="h-4 w-4" />
                                </FlatIcon>
                            }
                            value={model.summary.explicitCompetencyCount}
                        />
                    )}
                    {model.summary.evidenceCount > 0 && (
                        <ClrMetricChip
                            icon={<PaperClip className="h-4 w-4" />}
                            value={model.summary.evidenceCount}
                        />
                    )}
                </div>
            </div>
        );
    }

    if (inferredKind === 'course') {
        const course = model?.courses?.[0];
        const courseName = course?.name?.value || model.header.title?.value || fallbackTitle;
        const grade = getClrGrade(course);

        return (
            <div className="flex w-full min-w-0 flex-col items-center justify-start mt-[0px] px-2">
                <p className="mt-2 w-full max-w-full break-words text-center text-grayscale-900 text-[16px] font-notoSans font-semibold leading-[125%] line-clamp-2">
                    {courseName}
                </p>
                {grade && (
                    <p className="mt-1 text-grayscale-900 text-[14px] font-semibold text-center">
                        Grade: {grade}
                    </p>
                )}
            </div>
        );
    }

    const degree = model?.programs?.[0];
    const degreeName = degree?.name?.value || model.header.title?.value || fallbackTitle;

    return (
        <div className="flex w-full min-w-0 flex-col items-center justify-start mt-[0px] px-2">
            <p className="mt-2 w-full max-w-full break-words text-center text-grayscale-900 text-[16px] font-notoSans font-semibold leading-[125%] line-clamp-2">
                {degreeName}
            </p>
            {model.summary.explicitCompetencyCount > 0 && (
                <div className="mt-2 inline-flex items-center justify-center gap-1.5 text-grayscale-600">
                    <FlatIcon>
                        <SkillsIcon className="h-4 w-4" />
                    </FlatIcon>
                    <span className="text-[12px] font-semibold text-grayscale-700">
                        {model.summary.explicitCompetencyCount}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ClrTranscriptTitleDisplay;
export { getClrTranscriptKind } from './clrKind.helpers';
