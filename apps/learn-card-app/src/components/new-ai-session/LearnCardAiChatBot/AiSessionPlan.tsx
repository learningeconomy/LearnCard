import React from 'react';
import { useStore } from '@nanostores/react';
import { IonSkeletonText } from '@ionic/react';

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
        <div className="px-4 pb-6 animate-fadeIn">
            {/* ================= WELCOME ================= */}
            <section className="mb-4">
                <h2 className="text-lg font-semibold text-grayscale-800">🚀 Welcome</h2>

                {plan.welcome ? (
                    <p className="mt-1 whitespace-pre-wrap text-grayscale-600">{plan.welcome}</p>
                ) : (
                    <IonSkeletonText animated style={{ width: '100%' }} />
                )}
            </section>

            {/* ================= SUMMARY ================= */}
            <section className="mb-4">
                <h2 className="text-lg font-semibold text-grayscale-800">🧠 Summary</h2>

                {plan.summary ? (
                    <p className="mt-1 whitespace-pre-wrap text-grayscale-600">{plan.summary}</p>
                ) : (
                    <IonSkeletonText animated style={{ width: '100%' }} />
                )}
            </section>

            {/* ================= OBJECTIVES ================= */}
            <section className="mb-4">
                <h2 className="text-lg font-semibold text-grayscale-800">🎯 Objectives</h2>

                {plan.objectives?.length > 0 ? (
                    <ul className="list-disc ml-5 text-grayscale-600">
                        {plan.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
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

            {/* ================= SKILLS ================= */}
            <section className="mb-4">
                <h2 className="text-lg font-semibold text-grayscale-800">🛠 Skills You Can Earn</h2>

                {plan.skills?.length > 0 ? (
                    <ul className="list-disc ml-5 text-grayscale-600">
                        {plan.skills.map((skill, i) => (
                            <li key={i}>{skill}</li>
                        ))}
                    </ul>
                ) : (
                    <>
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                    </>
                )}
            </section>

            {/* ================= ROADMAP ================= */}
            <section className="mb-4">
                <h2 className="text-lg font-semibold text-grayscale-800">🗺 Roadmap</h2>

                {plan.roadmap?.length > 0 ? (
                    <div className="space-y-3">
                        {plan.roadmap.map((module: any, i) => (
                            <div key={i} className="p-3 border rounded-lg">
                                <div className="font-medium">{module.title}</div>
                                <div className="text-sm opacity-80 text-grayscale-600">
                                    {module.description}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="p-3 border rounded-lg">
                                <IonSkeletonText animated style={{ width: '60%' }} />
                                <IonSkeletonText animated style={{ width: '90%' }} />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AiSessionPlan;
