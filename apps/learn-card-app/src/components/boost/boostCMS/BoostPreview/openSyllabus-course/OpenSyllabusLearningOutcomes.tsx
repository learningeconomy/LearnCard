import React from 'react';
import { capitalize } from 'lodash-es';

import Star from 'learn-card-base/svgs/Star';
import { useGetVCInfo } from 'learn-card-base';

import { VC } from '@learncard/types';

const OpenSyllabusLearningOutcomes: React.FC<{ credential: VC }> = ({ credential }) => {
    const { alignment } = useGetVCInfo(credential);

    const learningOutcomes = alignment?.filter(
        alignmentItem => alignmentItem.targetType === 'LearningOutcome'
    );
    const learningOutcomesCount = learningOutcomes?.length ?? 0;

    if (learningOutcomesCount === 0) return null;

    return (
        <div className="p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4">
            <h3 className="text-[17px] font-poppins text-grayscale-900">
                {learningOutcomesCount}{' '}
                {learningOutcomesCount > 1 ? 'Learning Outcomes' : 'Learning Outcome'}
            </h3>
            <div className="flex flex-col gap-[10px]">
                {learningOutcomes?.length > 0 &&
                    learningOutcomes?.map((learningOutcome, index) => {
                        const learningOutcomeDescription = learningOutcome.targetName;
                        return (
                            <div key={index} className="flex items-start gap-[10px]">
                                <Star className="w-[20px] h-[20px] min-w-[20px] min-h-[20px] text-grayscale-800" />
                                <p className="text-sm font-poppins text-grayscale-800 font-semibold">
                                    {capitalize(learningOutcomeDescription)}
                                </p>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default OpenSyllabusLearningOutcomes;
