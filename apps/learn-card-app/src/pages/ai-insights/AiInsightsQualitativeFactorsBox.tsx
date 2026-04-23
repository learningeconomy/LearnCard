import React, { useMemo } from 'react';

import { type OccupationDetailsResponse, useVerifiableData } from 'learn-card-base';

import AiPathwayCareerGauge from '../ai-pathways/ai-pathway-careers/AiPathwayCareerGauge';
import {
    SKILL_PROFILE_JOB_SATISFACTION_KEY,
    type SkillProfileJobSatisfactionData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep4';

type AiInsightsQualitativeFactorsBoxProps = {
    professionalTitle: string;
    occupation?: OccupationDetailsResponse;
    isLoading?: boolean;
};

type GaugeComparisonCopy = {
    leadingText: string;
    highlightText: string;
    trailingText: string;
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
    value?: SkillProfileJobSatisfactionData['workLifeBalance']
): number | undefined => {
    if (!value) {
        return undefined;
    }

    return WORK_LIFE_BALANCE_SCORE_MAP[normalizeValue(value)];
};

const getJobStabilityUserScore = (
    value?: SkillProfileJobSatisfactionData['jobStability']
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
            leadingText: 'Your current work life balance is ',
            highlightText: 'ready to compare',
            trailingText: ' once you finish your profile.',
            highlightClassName: 'text-grayscale-900',
        };
    }

    const delta = benchmarkScore - userScore;

    if (delta >= 33) {
        return {
            leadingText: 'Your current work life balance ',
            highlightText: 'is very low',
            trailingText: ' compared to others.',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta >= 15) {
        return {
            leadingText: 'Your current work life balance ',
            highlightText: 'is low',
            trailingText: ' compared to others.',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta <= -33) {
        return {
            leadingText: 'Your current work life balance ',
            highlightText: 'is very strong',
            trailingText: ' compared to others.',
            highlightClassName: 'text-emerald-601',
        };
    }

    if (delta <= -15) {
        return {
            leadingText: 'Your current work life balance ',
            highlightText: 'is strong',
            trailingText: ' compared to others.',
            highlightClassName: 'text-emerald-601',
        };
    }

    return {
        leadingText: 'Your current work life balance is ',
        highlightText: 'about in line with others',
        trailingText: '.',
        highlightClassName: 'text-grayscale-900',
    };
};

const getJobStabilityCopy = (
    userScore: number | undefined,
    benchmarkScore: number
): GaugeComparisonCopy => {
    if (userScore === undefined) {
        return {
            leadingText: 'Others felt their jobs are ',
            highlightText: 'ready to compare',
            trailingText: ' once you finish your profile.',
            highlightClassName: 'text-grayscale-900',
        };
    }

    const delta = benchmarkScore - userScore;

    if (delta >= 33) {
        return {
            leadingText: 'Your current job stability ',
            highlightText: 'is very low',
            trailingText: ' compared to others.',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta >= 15) {
        return {
            leadingText: 'Your current job stability ',
            highlightText: 'is low',
            trailingText: ' compared to others.',
            highlightClassName: 'text-rose-600',
        };
    }

    if (delta <= -33) {
        return {
            leadingText: 'Your current job stability ',
            highlightText: 'is very strong',
            trailingText: ' compared to others.',
            highlightClassName: 'text-emerald-601',
        };
    }

    if (delta <= -15) {
        return {
            leadingText: 'Your current job stability ',
            highlightText: 'is strong',
            trailingText: ' compared to others.',
            highlightClassName: 'text-emerald-601',
        };
    }

    return {
        leadingText: 'Your current job stability is ',
        highlightText: 'about in line',
        trailingText: ' with others.',
        highlightClassName: 'text-grayscale-900',
    };
};

const GaugeDescription: React.FC<{ copy: GaugeComparisonCopy }> = ({ copy }) => {
    return (
        <p className="text-sm font-poppins text-grayscale-600 text-center max-w-[250px] mx-auto">
            {copy.leadingText}
            <span className={`font-bold ${copy.highlightClassName}`}>{copy.highlightText}</span>
            {copy.trailingText}
        </p>
    );
};

const AiInsightsQualitativeFactorsBox: React.FC<AiInsightsQualitativeFactorsBoxProps> = ({
    professionalTitle,
    occupation,
    isLoading = false,
}) => {
    const { data: jobSatisfactionData, isLoading: jobSatisfactionLoading } =
        useVerifiableData<SkillProfileJobSatisfactionData>(SKILL_PROFILE_JOB_SATISFACTION_KEY, {
            name: 'Job Satisfaction',
            description: 'Work-life balance and job stability preferences',
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
        () => getWorkLifeBalanceUserScore(jobSatisfactionData?.workLifeBalance),
        [jobSatisfactionData?.workLifeBalance]
    );
    const jobStabilityUserScore = useMemo(
        () => getJobStabilityUserScore(jobSatisfactionData?.jobStability),
        [jobSatisfactionData?.jobStability]
    );

    const isBusy = isLoading || jobSatisfactionLoading;

    const workLifeBalanceCopy = useMemo(() => {
        return getWorkLifeBalanceCopy(workLifeBalanceUserScore, workLifeBalanceBenchmarkScore);
    }, [workLifeBalanceUserScore, workLifeBalanceBenchmarkScore]);
    const jobStabilityCopy = useMemo(() => {
        return getJobStabilityCopy(jobStabilityUserScore, jobStabilityBenchmarkScore);
    }, [jobStabilityUserScore, jobStabilityBenchmarkScore]);

    return (
        <div className="flex flex-col gap-5 w-full">
            <h2 className="text-[17px] font-bold text-grayscale-900 font-poppins text-left leading-[24px]">
                Qualitative Factors
            </h2>

            {isBusy ? (
                <p className="text-sm text-grayscale-600">Finding qualitative data...</p>
            ) : occupation ? (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <AiPathwayCareerGauge
                            title="Work Life Balance"
                            score={workLifeBalanceBenchmarkScore}
                            userScore={workLifeBalanceUserScore}
                        />
                        <GaugeDescription copy={workLifeBalanceCopy} />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <AiPathwayCareerGauge
                            title="Job Stability"
                            score={jobStabilityBenchmarkScore}
                            userScore={jobStabilityUserScore}
                        />
                        <GaugeDescription copy={jobStabilityCopy} />
                    </div>
                </div>
            ) : (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    Add a professional title to see qualitative factors here.
                </p>
            )}

            <p className="text-xs text-grayscale-500 leading-relaxed text-left">
                Based on your answers and occupation data.
            </p>
        </div>
    );
};

export default AiInsightsQualitativeFactorsBox;
