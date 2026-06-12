import React, { useMemo } from 'react';

import { m } from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

import { type OccupationDetailsResponse, useVerifiableData } from 'learn-card-base';

import AiPathwayCareerGauge from '../ai-pathways/ai-pathway-careers/AiPathwayCareerGauge';
import {
    SKILL_PROFILE_WORK_LIFE_BALANCE_KEY,
    type SkillProfileWorkLifeBalanceData,
    SKILL_PROFILE_JOB_STABILITY_KEY,
    type SkillProfileJobStabilityData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep4';

type AiInsightsQualitativeFactorsBoxProps = {
    professionalTitle: string;
    occupation?: OccupationDetailsResponse;
    isLoading?: boolean;
};

type GaugeComparisonCopy = {
    messageKey: string;
    highlightClassName: string;
};

const WORK_LIFE_BALANCE_SCORE_MAP: Record<string, number> = {
    terrible: 10,
    not_adequate: 25,
    average: 45,
    good_enough: 65,
    satisfied: 82,
    paradise: 95,
};

const JOB_STABILITY_SCORE_MAP: Record<string, number> = {
    very_uncertain: 10,
    poor: 25,
    average: 45,
    okay: 60,
    great: 80,
    confident: 95,
};

const normalizeValue = (value?: string | null): string => {
    return value?.trim().toLowerCase() ?? '';
};

const getWorkLifeBalanceBenchmark = (occupation?: OccupationDetailsResponse): number => {
    const workValue = normalizeValue(occupation?.WorkValuesOccupationDetails?.WorkValue);
    const characteristics =
        occupation?.WorkValuesOccupationDetails?.Characteristics?.map(normalizeValue) ?? [];

    const hasCharacteristic = (needle: string): boolean =>
        characteristics.some(characteristic => characteristic.includes(needle));

    if (workValue.includes('working conditions') || hasCharacteristic('working conditions')) {
        return 86;
    }

    if (workValue.includes('support') || hasCharacteristic('support')) {
        return 80;
    }

    if (workValue.includes('relationships') || hasCharacteristic('relationships')) {
        return 76;
    }

    if (workValue.includes('independence') || hasCharacteristic('independence')) {
        return 68;
    }

    if (workValue.includes('recognition') || hasCharacteristic('recognition')) {
        return 58;
    }

    if (workValue.includes('achievement') || hasCharacteristic('achievement')) {
        return 52;
    }

    return occupation?.Green === 'Yes' ? 72 : 64;
};

const getJobStabilityBenchmark = (occupation?: OccupationDetailsResponse): number => {
    const outlook = normalizeValue(occupation?.BrightOutlook);

    if (outlook.includes('bright')) {
        return 88;
    }

    if (outlook.includes('average')) {
        return 66;
    }

    if (outlook.includes('below')) {
        return 42;
    }

    const projectedChange = Number(occupation?.Projections?.Projections?.[0]?.PerCentChange);

    if (Number.isFinite(projectedChange)) {
        if (projectedChange >= 20) {
            return 84;
        }

        if (projectedChange >= 10) {
            return 76;
        }

        if (projectedChange >= 0) {
            return 64;
        }

        if (projectedChange >= -10) {
            return 50;
        }

        return 36;
    }

    return 64;
};

const getWorkLifeBalanceUserScore = (
    value?: SkillProfileWorkLifeBalanceData['workLifeBalance']
): number | undefined => {
    if (!value) {
        return undefined;
    }

    return WORK_LIFE_BALANCE_SCORE_MAP[normalizeValue(value)];
};

const getJobStabilityUserScore = (
    value?: SkillProfileJobStabilityData['jobStability']
): number | undefined => {
    if (!value) {
        return undefined;
    }

    return JOB_STABILITY_SCORE_MAP[normalizeValue(value)];
};

const getWorkLifeBalanceCopy = (
    userScore: number | undefined,
    benchmarkScore: number
): GaugeComparisonCopy => {
    if (userScore === undefined) {
        return {
            messageKey: 'aiInsights.workLife.ready',
            highlightClassName: 'text-grayscale-900',
        };
    }

    const delta = benchmarkScore - userScore;

    if (delta >= 33) {
        return {
            messageKey: 'aiInsights.workLife.veryLow',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta >= 15) {
        return {
            messageKey: 'aiInsights.workLife.low',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta <= -33) {
        return {
            messageKey: 'aiInsights.workLife.veryStrong',
            highlightClassName: 'text-emerald-601',
        };
    }

    if (delta <= -15) {
        return {
            messageKey: 'aiInsights.workLife.strong',
            highlightClassName: 'text-emerald-601',
        };
    }

    return {
        messageKey: 'aiInsights.workLife.aboutInLine',
        highlightClassName: 'text-grayscale-900',
    };
};

const getJobStabilityCopy = (
    userScore: number | undefined,
    benchmarkScore: number
): GaugeComparisonCopy => {
    if (userScore === undefined) {
        return {
            messageKey: 'aiInsights.jobStability.ready',
            highlightClassName: 'text-grayscale-900',
        };
    }

    const delta = benchmarkScore - userScore;

    if (delta >= 33) {
        return {
            messageKey: 'aiInsights.jobStability.veryLow',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta >= 15) {
        return {
            messageKey: 'aiInsights.jobStability.low',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta <= -33) {
        return {
            messageKey: 'aiInsights.jobStability.veryStrong',
            highlightClassName: 'text-emerald-601',
        };
    }

    if (delta <= -15) {
        return {
            messageKey: 'aiInsights.jobStability.strong',
            highlightClassName: 'text-emerald-601',
        };
    }

    return {
        messageKey: 'aiInsights.jobStability.aboutInLine',
        highlightClassName: 'text-grayscale-900',
    };
};

const GaugeDescription: React.FC<{ copy: GaugeComparisonCopy }> = ({ copy }) => {
    return (
        <p className="text-sm font-poppins text-grayscale-600 text-center max-w-[250px] mx-auto">
            <TransP
                m={m[copy.messageKey]()}
                components={[<span className={`font-bold ${copy.highlightClassName}`} />]}
            />
        </p>
    );
};

const AiInsightsQualitativeFactorsBox: React.FC<AiInsightsQualitativeFactorsBoxProps> = ({
    occupation,
    isLoading = false,
}) => {
    const { data: workLifeBalanceData, isLoading: workLifeBalanceLoading } =
        useVerifiableData<SkillProfileWorkLifeBalanceData>(SKILL_PROFILE_WORK_LIFE_BALANCE_KEY, {
            name: 'Work Life Balance',
            description: 'Your preferred work-life balance',
        });
    const { data: jobStabilityData, isLoading: jobStabilityLoading } =
        useVerifiableData<SkillProfileJobStabilityData>(SKILL_PROFILE_JOB_STABILITY_KEY, {
            name: 'Job Stability',
            description: 'How stable you want your work to feel',
        });

    const workLifeBalanceBenchmarkScore = useMemo(
        () => getWorkLifeBalanceBenchmark(occupation),
        [occupation]
    );
    const jobStabilityBenchmarkScore = useMemo(
        () => getJobStabilityBenchmark(occupation),
        [occupation]
    );
    const workLifeBalanceUserScore = useMemo(
        () => getWorkLifeBalanceUserScore(workLifeBalanceData?.workLifeBalance),
        [workLifeBalanceData?.workLifeBalance]
    );
    const jobStabilityUserScore = useMemo(
        () => getJobStabilityUserScore(jobStabilityData?.jobStability),
        [jobStabilityData?.jobStability]
    );

    const isBusy = isLoading || workLifeBalanceLoading || jobStabilityLoading;

    const workLifeBalanceCopy = useMemo(() => {
        return getWorkLifeBalanceCopy(workLifeBalanceUserScore, workLifeBalanceBenchmarkScore);
    }, [workLifeBalanceUserScore, workLifeBalanceBenchmarkScore]);
    const jobStabilityCopy = useMemo(() => {
        return getJobStabilityCopy(jobStabilityUserScore, jobStabilityBenchmarkScore);
    }, [jobStabilityUserScore, jobStabilityBenchmarkScore]);

    return (
        <div className="flex flex-col gap-5 w-full">
            <h2 className="text-[17px] font-bold text-grayscale-900 font-poppins text-left leading-[24px]">
                {m['aiInsights.qualitativeFactors']()}
            </h2>

            {isBusy ? (
                <p className="text-sm text-grayscale-600">
                    {m['aiInsights.findingQualitativeData']()}
                </p>
            ) : occupation ? (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <AiPathwayCareerGauge
                            title={m['aiInsights.workLifeBalance']()}
                            score={workLifeBalanceBenchmarkScore}
                            userScore={workLifeBalanceUserScore}
                        />
                        <GaugeDescription copy={workLifeBalanceCopy} />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <AiPathwayCareerGauge
                            title={m['aiInsights.jobStability']()}
                            score={jobStabilityBenchmarkScore}
                            userScore={jobStabilityUserScore}
                        />
                        <GaugeDescription copy={jobStabilityCopy} />
                    </div>
                </div>
            ) : (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['aiInsights.addTitleForQualitativeFactors']()}
                </p>
            )}

            <p className="text-xs text-grayscale-500 leading-relaxed text-left">
                {m['aiInsights.basedOnAnswersAndData']()}
            </p>
        </div>
    );
};

export default AiInsightsQualitativeFactorsBox;
