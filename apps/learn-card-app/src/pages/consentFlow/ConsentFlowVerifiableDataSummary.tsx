import React from 'react';

import {
    useGetBoostSkills,
    useGetSelfAssignedSkillsBoost,
    useVerifiableData,
} from 'learn-card-base';

import {
    SKILL_PROFILE_GOALS_KEY,
    type SkillProfileGoalsData,
    SKILL_PROFILE_PROFESSIONAL_TITLE_KEY,
    type SkillProfileProfessionalTitleData,
    SKILL_PROFILE_ROLE_EXPERIENCE_KEY,
    type SkillProfileRoleExperienceData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep1';
import {
    SKILL_PROFILE_WORK_HISTORY_KEY,
    type SkillProfileWorkHistoryData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep2';
import {
    SKILL_PROFILE_SALARY_KEY,
    type SkillProfileSalaryData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep3';
import {
    SKILL_PROFILE_JOB_STABILITY_KEY,
    type SkillProfileJobStabilityData,
    SKILL_PROFILE_WORK_LIFE_BALANCE_KEY,
    type SkillProfileWorkLifeBalanceData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep4';

export const VERIFIABLE_DATA_KEY_BY_CATEGORY: Partial<Record<string, string>> = {
    Goals: SKILL_PROFILE_GOALS_KEY,
    'Professional Title': SKILL_PROFILE_PROFESSIONAL_TITLE_KEY,
    'Role Experience': SKILL_PROFILE_ROLE_EXPERIENCE_KEY,
    'Work Experience': SKILL_PROFILE_WORK_HISTORY_KEY,
    'Pay Rate': SKILL_PROFILE_SALARY_KEY,
    'Work Life Balance': SKILL_PROFILE_WORK_LIFE_BALANCE_KEY,
    'Job Stability': SKILL_PROFILE_JOB_STABILITY_KEY,
};

const WORK_LIFE_BALANCE_LABELS: Record<string, string> = {
    terrible: 'Terrible, Unfair',
    not_adequate: 'Not Adequate',
    average: 'Average',
    good_enough: 'Good Enough',
    satisfied: 'Satisfied & Happy',
    paradise: "It's Paradise",
};

const JOB_STABILITY_LABELS: Record<string, string> = {
    very_uncertain: 'Very Uncertain',
    poor: 'Poor',
    average: 'Average',
    okay: "It's Okay",
    great: 'Great',
    confident: 'Confident',
};

const normalizeText = (value: unknown): string => {
    return typeof value === 'string' ? value.trim() : '';
};

const formatCurrency = (salary: string): string => {
    const trimmedSalary = salary.trim();

    if (!trimmedSalary) {
        return '';
    }

    const numericSalary = Number(trimmedSalary.replace(/,/g, ''));

    if (Number.isFinite(numericSalary)) {
        return `$${new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
        }).format(numericSalary)}`;
    }

    return trimmedSalary.startsWith('$') ? trimmedSalary : `$${trimmedSalary}`;
};

const formatGoalsSummary = (data?: SkillProfileGoalsData): string => {
    const goals = data?.goals?.map(goal => goal.trim()).filter(Boolean) ?? [];

    if (goals.length === 0) {
        return 'No goals saved yet.';
    }

    if (goals.length === 1) {
        return goals[0];
    }

    if (goals.length === 2) {
        return goals.join(' · ');
    }

    return `${goals.slice(0, 2).join(' · ')} (+${goals.length - 2} more)`;
};

const formatRoleExperienceSummary = (data?: SkillProfileRoleExperienceData): string => {
    const years = data?.lifetimeExperience?.years;
    const months = data?.lifetimeExperience?.months;

    const parts: string[] = [];

    if (typeof years === 'number' && years > 0) {
        parts.push(`${years} year${years === 1 ? '' : 's'}`);
    }

    if (typeof months === 'number' && months > 0) {
        parts.push(`${months} month${months === 1 ? '' : 's'}`);
    }

    return parts.length > 0 ? parts.join(' ') : 'No role experience saved yet.';
};

const formatWorkHistorySummary = (data?: SkillProfileWorkHistoryData): string => {
    const count = data?.selectedCredentialUris?.length ?? 0;

    return count > 0
        ? `${count} work experience credential${count === 1 ? '' : 's'} selected`
        : 'No work experience selected yet.';
};

const formatSalarySummary = (data?: SkillProfileSalaryData): string => {
    const salary = data?.salary?.trim();

    if (!salary) {
        return 'No pay rate saved yet.';
    }

    const salaryTypeLabel = data?.salaryType === 'per_hour' ? '/hr' : '/yr';

    return `${formatCurrency(salary)} ${salaryTypeLabel}`;
};

const formatChoiceSummary = (
    value: string | null | undefined,
    labels: Record<string, string>,
    emptyMessage: string
): string => {
    const normalizedValue = normalizeText(value).toLowerCase();

    if (!normalizedValue) {
        return emptyMessage;
    }

    return labels[normalizedValue] ?? value ?? emptyMessage;
};

const formatWorkLifeBalanceSummary = (data?: SkillProfileWorkLifeBalanceData): string => {
    return formatChoiceSummary(
        data?.workLifeBalance,
        WORK_LIFE_BALANCE_LABELS,
        'No work-life balance selected yet.'
    );
};

const formatJobStabilitySummary = (data?: SkillProfileJobStabilityData): string => {
    return formatChoiceSummary(
        data?.jobStability,
        JOB_STABILITY_LABELS,
        'No job stability selected yet.'
    );
};

const formatGenericSummary = (data: unknown): string => {
    if (data === undefined || data === null) {
        return 'No data saved yet.';
    }

    if (typeof data === 'string') {
        return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
    }

    if (Array.isArray(data)) {
        return `${data.length} item${data.length === 1 ? '' : 's'} saved`;
    }

    if (typeof data === 'object') {
        const entries = Object.entries(data as Record<string, unknown>);

        if (entries.length === 0) {
            return 'No data saved yet.';
        }

        return entries
            .slice(0, 2)
            .map(([key, value]) => `${key}: ${formatGenericSummary(value)}`)
            .join(' · ');
    }

    return 'Saved data is available.';
};

const formatSummaryForCategory = (category: string, data: unknown): string => {
    switch (category) {
        case 'Goals':
            return formatGoalsSummary(data as SkillProfileGoalsData | undefined);
        case 'Professional Title':
            return (
                normalizeText(
                    (data as SkillProfileProfessionalTitleData | undefined)?.professionalTitle
                ) || 'No professional title saved yet.'
            );
        case 'Role Experience':
            return formatRoleExperienceSummary(data as SkillProfileRoleExperienceData | undefined);
        case 'Work Experience':
            return formatWorkHistorySummary(data as SkillProfileWorkHistoryData | undefined);
        case 'Pay Rate':
            return formatSalarySummary(data as SkillProfileSalaryData | undefined);
        case 'Work Life Balance':
            return formatWorkLifeBalanceSummary(
                data as SkillProfileWorkLifeBalanceData | undefined
            );
        case 'Job Stability':
            return formatJobStabilitySummary(data as SkillProfileJobStabilityData | undefined);
        default:
            return formatGenericSummary(data);
    }
};

export const VerifiableDataSummary: React.FC<{ category: string; dataKey: string }> = ({
    category,
    dataKey,
}) => {
    const { data, isLoading } = useVerifiableData<unknown>(dataKey);

    return (
        <p className="text-[13px] leading-[18px] text-grayscale-600 text-left self-start">
            {isLoading ? 'Loading shared data…' : formatSummaryForCategory(category, data)}
        </p>
    );
};

export const SelfAssignedSkillsSummary: React.FC = () => {
    const { data: boostData, isLoading: boostLoading } = useGetSelfAssignedSkillsBoost();
    const { data: boostSkills, isLoading: skillsLoading } = useGetBoostSkills(boostData?.uri);

    const skillNames = (boostSkills ?? [])
        .map(skill => {
            if (!skill || typeof skill !== 'object') {
                return '';
            }

            const skillRecord = skill as Record<string, unknown>;

            return normalizeText(
                skillRecord.targetName ?? skillRecord.name ?? skillRecord.title ?? skillRecord.id
            );
        })
        .filter(Boolean);

    const summary =
        skillNames.length > 0
            ? skillNames.length === 1
                ? skillNames[0]
                : `${skillNames.slice(0, 2).join(' · ')} (+${skillNames.length - 2} more)`
            : boostSkills?.length
            ? `${boostSkills.length} skill${boostSkills.length === 1 ? '' : 's'} selected`
            : 'No skills selected yet.';

    return (
        <p className="text-[13px] leading-[18px] text-grayscale-600 text-left self-start">
            {boostLoading || skillsLoading ? 'Loading shared data…' : summary}
        </p>
    );
};
