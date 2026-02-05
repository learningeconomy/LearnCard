import React from 'react';
import { useStore } from '@nanostores/react';

import { IonSkeletonText } from '@ionic/react';
import { Puzzle } from 'learn-card-base/svgs/shapes/Puzzle';
import { BullsEye } from 'learn-card-base/svgs/BullsEye';
import { Compass } from 'learn-card-base/svgs/Compass';

import {
    planStreamActive,
    planSections,
    planMetadata,
    isLoading,
} from 'learn-card-base/stores/nanoStores/chatStore';

export const AiSessionPlan: React.FC = () => {
    const loading = useStore(isLoading);
    const isStreaming = useStore(planStreamActive);
    const plan = useStore(planSections);
    const meta = useStore(planMetadata);

    const hasPlan =
        loading ||
        isStreaming ||
        !!plan?.welcome ||
        !!plan?.summary ||
        plan?.objectives?.length > 0 ||
        plan?.skills?.length > 0 ||
        plan?.roadmap?.length > 0;

    if (!hasPlan) return null;

    return (
        <div className="px-4 pb-6 gap-4 flex flex-col animate-fadeIn">
            {/* ================= WELCOME ================= */}
            <section>
                {plan.welcome ? (
                    <h2 className="text-[29px] font-bold text-grayscale-900">{plan.welcome}</h2>
                ) : (
                    <IonSkeletonText animated style={{ width: '100%' }} />
                )}
            </section>

            {/* ================= SUMMARY ================= */}
            <section>
                {plan.summary ? (
                    <p className="whitespace-pre-wrap text-[17px] font-normal text-grayscale-900">
                        {plan.summary}
                    </p>
                ) : (
                    <IonSkeletonText animated style={{ width: '100%' }} />
                )}
            </section>

            {/* ================= SKILLS ================= */}
            <section className="flex flex-col gap-8 mt-4">
                <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                    <Puzzle className="inline-block w-[32px] h-[32px] mr-2" />
                    Skills You Can Earn
                </h2>

                {plan.skills?.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {plan.skills.map((skill, i) => (
                            <li className="text-sm font-semibold text-grayscale-800 bg-grayscale-100 p-2 rounded-[10px] w-fit">
                                {skill}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <>
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                    </>
                )}
            </section>

            <div className="h-[1px] mt-6 mb-4 bg-grayscale-100" />

            {/* ================= OBJECTIVES ================= */}
            <section className="flex flex-col gap-6">
                <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                    <BullsEye className="inline-block w-[32px] h-[32px] mr-2" />
                    Objectives
                </h2>

                {plan.objectives?.length > 0 ? (
                    <ul className="text-grayscale-600 flex flex-col gap-2 list-disc list-inside">
                        {plan.objectives.map((obj, i) => (
                            <li key={i} className="text-[17px] font-normal text-grayscale-900">
                                {obj}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <>
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                    </>
                )}
            </section>

            <div className="h-[1px] mt-6 mb-4 bg-grayscale-100" />

            {/* ================= ROADMAP ================= */}
            <section className="mb-4 flex flex-col gap-6">
                <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                    <Compass className="inline-block w-[32px] h-[32px] mr-2" />
                    Roadmap
                </h2>

                {plan.roadmap?.length > 0 ? (
                    <ul className="text-grayscale-600 flex flex-col gap-2 list-decimal list-inside">
                        {plan.roadmap.map((obj, i) => (
                            <li key={i} className="text-[17px] font-normal text-grayscale-900">
                                {obj.module}

                                {obj.learningObjectives && obj.learningObjectives.length > 0 && (
                                    <ul className="list-disc list-inside ml-4">
                                        {obj.learningObjectives.map(
                                            (learningObjective: string, j: number) => (
                                                <li
                                                    key={j}
                                                    className="text-[17px] font-normal text-grayscale-800"
                                                >
                                                    {learningObjective}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <>
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                    </>
                )}
            </section>

            <div className="h-[1px] mt-6 mb-4 bg-grayscale-100" />

            {!isStreaming && (
                <h2 className="text-[29px] font-bold text-grayscale-900">Ready to Get Started</h2>
            )}
        </div>
    );
};

export default AiSessionPlan;
