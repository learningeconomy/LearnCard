import React from 'react';

import { m } from '../../../paraglide/messages.js';

import { useStore } from '@nanostores/react';
import { motion } from 'motion/react';

import { IonSkeletonText } from '@ionic/react';
import { Puzzle } from 'learn-card-base/svgs/shapes/Puzzle';
import { BullsEye } from 'learn-card-base/svgs/BullsEye';
import { Compass } from 'learn-card-base/svgs/Compass';

import {
    planStreamActive,
    planSections,
    isLoading,
    learningCommonsDebug,
} from 'learn-card-base/stores/nanoStores/chatStore';

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.18,
        },
    },
} as const;

const sectionVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
    },
} as const;

export const AiSessionPlan: React.FC = () => {
    const loading = useStore(isLoading);
    const isStreaming = useStore(planStreamActive);
    const plan = useStore(planSections);
    const groundingDebug = useStore(learningCommonsDebug);

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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="px-4 pb-6 gap-4 flex flex-col"
        >
            {/* ================= WELCOME ================= */}
            <motion.section variants={sectionVariants}>
                {plan.welcome ? (
                    <h2 className="text-[29px] font-bold text-grayscale-900">{plan.welcome}</h2>
                ) : (
                    <div className="flex flex-col gap-2">
                        <IonSkeletonText animated style={{ width: '85%', height: 28 }} />
                        <IonSkeletonText animated style={{ width: '60%', height: 28 }} />
                    </div>
                )}
            </motion.section>

            {/* ================= SUMMARY ================= */}
            <motion.section variants={sectionVariants}>
                {plan.summary ? (
                    <p className="whitespace-pre-wrap text-[17px] text-grayscale-900">
                        {plan.summary}
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                    </div>
                )}
            </motion.section>

            {import.meta.env.DEV && groundingDebug.status !== 'idle' && (
                <motion.section
                    variants={sectionVariants}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                    data-testid="learning-commons-debug"
                >
                    <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                            Debug
                        </span>
                        <h2 className="text-sm font-semibold text-grayscale-900">
                            Learning Commons grounding
                        </h2>
                    </div>

                    {groundingDebug.status === 'unavailable' ? (
                        <p className="text-sm leading-relaxed text-red-700">
                            No matching standard was used. This plan used the generic prompt.
                        </p>
                    ) : groundingDebug.status === 'grounded' ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-grayscale-700">
                                    Standard used
                                </p>
                                <p className="font-mono text-sm font-semibold text-grayscale-900">
                                    {groundingDebug.grounding.target.statementCode}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-grayscale-700">
                                    {groundingDebug.grounding.target.description}
                                </p>
                            </div>

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div>
                                    <dt className="text-grayscale-500">Subject</dt>
                                    <dd className="font-medium text-grayscale-800">
                                        {groundingDebug.grounding.target.academicSubject}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-grayscale-500">Grade</dt>
                                    <dd className="font-medium text-grayscale-800">
                                        {groundingDebug.grounding.target.gradeLevel.join(', ')}
                                    </dd>
                                </div>
                                {groundingDebug.grounding.source.searchScore !== undefined && (
                                    <div>
                                        <dt className="text-grayscale-500">Search relevance</dt>
                                        <dd className="font-medium text-grayscale-800">
                                            {(
                                                groundingDebug.grounding.source.searchScore * 100
                                            ).toFixed(1)}
                                            %
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-grayscale-500">Jurisdiction</dt>
                                    <dd className="font-medium text-grayscale-800">
                                        {groundingDebug.grounding.target.jurisdiction}
                                    </dd>
                                </div>
                            </dl>

                            {groundingDebug.grounding.prerequisite && (
                                <div>
                                    <p className="text-xs font-medium text-grayscale-700">
                                        Supporting standard
                                    </p>
                                    <p className="font-mono text-xs font-semibold text-grayscale-900">
                                        {groundingDebug.grounding.prerequisite.statementCode}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-grayscale-600">
                                        {groundingDebug.grounding.prerequisite.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <a
                                    href={groundingDebug.grounding.target.caseIdentifierURI}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-grayscale-700 underline hover:text-grayscale-900"
                                >
                                    Open CASE identifier
                                </a>
                                <a
                                    href={groundingDebug.grounding.source.targetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-grayscale-700 underline hover:text-grayscale-900"
                                >
                                    Open API source
                                </a>
                            </div>

                            <p className="text-[11px] leading-relaxed text-grayscale-500">
                                {groundingDebug.grounding.target.attributionStatement}
                            </p>
                        </div>
                    ) : null}
                </motion.section>
            )}

            {/* ================= SKILLS ================= */}
            <motion.section variants={sectionVariants} className="flex flex-col gap-8 mt-4">
                <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                    <Puzzle className="w-[32px] h-[32px] mr-2" />
                    {m['aiSession.plan.skills']()}
                </h2>

                {plan.skills?.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                        {plan.skills.map((skill, i) => (
                            <li
                                key={i}
                                className="text-sm font-semibold bg-grayscale-100 p-2 rounded-[10px] text-grayscale-900"
                            >
                                {skill}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map(i => (
                            <IonSkeletonText
                                key={i}
                                animated
                                style={{
                                    width: `${60 + i * 10}px`,
                                    height: 28,
                                    borderRadius: 10,
                                }}
                            />
                        ))}
                    </div>
                )}
            </motion.section>

            <div className="h-[1px] bg-grayscale-100 my-3" />

            {/* ================= OBJECTIVES ================= */}
            <motion.section variants={sectionVariants} className="flex flex-col gap-6">
                <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                    <BullsEye className="w-[32px] h-[32px] mr-2" />
                    {m['aiSession.plan.objectives']()}
                </h2>

                {plan.objectives?.length > 0 ? (
                    <ul className="list-disc list-inside flex flex-col gap-2 text-grayscale-900">
                        {plan.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col gap-2">
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                        <IonSkeletonText animated />
                    </div>
                )}
            </motion.section>

            <div className="h-[1px] bg-grayscale-100 my-3" />

            {/* ================= ROADMAP ================= */}
            <motion.section variants={sectionVariants} className="flex flex-col gap-6">
                <h2 className="flex items-center text-[21px] font-bold text-grayscale-900">
                    <Compass className="w-[32px] h-[32px] mr-2" />
                    {m['aiSession.plan.roadmap']()}
                </h2>

                {plan.roadmap?.length > 0 ? (
                    <ul className="list-decimal list-inside flex flex-col gap-3 text-grayscale-900">
                        {plan.roadmap.map((module, i) => (
                            <li key={i}>
                                {module.module}
                                {module.learningObjectives?.length > 0 && (
                                    <ul className="list-disc ml-4 mt-1 text-grayscale-900">
                                        {module.learningObjectives.map((obj, j) => (
                                            <li key={j}>{obj}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex flex-col gap-2">
                                <IonSkeletonText animated style={{ width: '60%' }} />
                                <IonSkeletonText animated style={{ width: '80%' }} />
                                <IonSkeletonText animated style={{ width: '70%' }} />
                            </div>
                        ))}
                    </div>
                )}
            </motion.section>

            <div className="h-[1px] bg-grayscale-100 my-3" />

            {/* ================= CTA ================= */}
            <motion.section variants={sectionVariants}>
                {!isStreaming && !loading ? (
                    <h2 className="text-[29px] font-bold text-grayscale-900">
                        {m['aiSession.plan.readyToStart']()}
                    </h2>
                ) : (
                    <IonSkeletonText animated style={{ width: '55%', height: 28 }} />
                )}
            </motion.section>
        </motion.div>
    );
};

export default AiSessionPlan;
