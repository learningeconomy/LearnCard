import { useVerifiableData } from 'learn-card-base';
import React from 'react';
import {
    SKILL_PROFILE_PROFILE_KEY,
    SkillProfileProfileData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep1';
import {
    SKILL_PROFILE_SALARY_KEY,
    SkillProfileSalaryData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep3';
import Pencil from 'src/components/svgs/Pencil';

type AiInsightsWidgetsProps = {};

const AiInsightsWidgets: React.FC<AiInsightsWidgetsProps> = ({}) => {
    const { data: profileData } = useVerifiableData<SkillProfileProfileData>(
        SKILL_PROFILE_PROFILE_KEY,
        {
            name: 'Professional Profile',
            description: 'Professional title and experience level',
        }
    );
    const { data: salaryData } = useVerifiableData<SkillProfileSalaryData>(
        SKILL_PROFILE_SALARY_KEY,
        {
            name: 'Salary Information',
            description: 'Current salary and compensation type',
        }
    );

    const professionalTitle = profileData?.professionalTitle || '';
    const salaryValue = salaryData?.salary?.trim() || '';
    const salaryTypeLabel = salaryData?.salaryType === 'per_hour' ? '/hr' : '/yr';

    const formattedSalary = (() => {
        if (!salaryValue) {
            return '$XX,XXX';
        }

        const parsedSalary = Number(salaryValue.replace(/,/g, ''));

        if (Number.isFinite(parsedSalary)) {
            return `$${new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 2,
            }).format(parsedSalary)}`;
        }

        return salaryValue.startsWith('$') ? salaryValue : `$${salaryValue}`;
    })();

    if (!professionalTitle) {
        return null;
    }

    return (
        <div className="flex flex-col gap-[30px] bg-white rounded-[15px] py-[25px] px-[15px] w-full max-w-[600px] shadow-bottom-4-4">
            <div className="flex flex-col gap-[10px]">
                <div className="flex items-center gap-[10px] text-grayscale-900 text-[18px] font-bold leading-[24px] tracking-[0.32px]">
                    {professionalTitle}
                    <button className="ml-auto w-[25px] h-[25px] text-grayscale-500">
                        <Pencil />
                    </button>
                </div>

                <p className="flex items-end gap-[3px]">
                    <span className="text-[21px] font-bold leading-[18px] bg-[linear-gradient(90deg,#6366F1_0%,#818CF8_98.7%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                        {formattedSalary}
                    </span>
                    <span className="text-grayscale-600 text-[12px] leading-[16px] tracking-[0.72px]">
                        {salaryTypeLabel}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default AiInsightsWidgets;
