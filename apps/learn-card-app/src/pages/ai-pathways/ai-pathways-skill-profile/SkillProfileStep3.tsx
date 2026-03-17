import React, { useState, useEffect } from 'react';
import { TextInput, RadioGroup, useVerifiableData } from 'learn-card-base';

export type SkillProfileSalaryData = {
    salary: string;
    salaryType: 'per_year' | 'per_hour';
};

export const SKILL_PROFILE_SALARY_KEY = 'skill-profile-salary';

type SkillProfileStep3Props = {
    handleNext: () => void;
    handleBack: () => void;
};

const SALARY_TYPE_OPTIONS = [
    { value: 'per_year', label: 'Per Year' },
    { value: 'per_hour', label: 'Per Hour' },
];

const SkillProfileStep3: React.FC<SkillProfileStep3Props> = ({ handleNext, handleBack }) => {
    const [salary, setSalary] = useState('');
    const [salaryType, setSalaryType] = useState<string>('per_year');

    const { data, isLoading, saveIfChanged, isSaving } =
        useVerifiableData<SkillProfileSalaryData>(SKILL_PROFILE_SALARY_KEY);

    // Pre-populate form from existing verifiable data
    useEffect(() => {
        if (data) {
            setSalary(data.salary ?? '');
            setSalaryType(data.salaryType ?? 'per_year');
        }
    }, [data]);

    const handleSaveAndNext = async () => {
        await saveIfChanged({
            salary,
            salaryType: salaryType as 'per_year' | 'per_hour',
        });
        handleNext();
    };

    return (
        <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    How much money do you make?
                </h3>
                <p className="text-[16px] text-grayscale-700 font-poppins leading-[130%]">
                    This helps us to show you where you stand compared to other people with the same
                    role and experience.
                </p>
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    {salaryType === 'per_hour' ? 'Per Hour' : 'Annual Salary'}
                </span>
                <TextInput
                    value={salary}
                    onChange={value => setSalary(value ?? '')}
                    placeholder="USD"
                    type="number"
                    startIcon={<span className="text-grayscale-600 text-[14px] pb-[1px]">$</span>}
                    inputClassName="!pl-[30px]"
                />
            </div>

            <RadioGroup
                value={salaryType}
                onChange={setSalaryType}
                options={SALARY_TYPE_OPTIONS}
                name="salary_type"
                columns={2}
            />

            <div className="flex gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 text-grayscale-800 rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 border-[1px] border-solid border-grayscale-200 h-[44px]"
                    onClick={handleBack}
                    disabled={isSaving}
                >
                    Back
                </button>
                <button
                    className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 h-[44px] disabled:opacity-50"
                    onClick={handleSaveAndNext}
                    disabled={isSaving || isLoading}
                >
                    {isSaving ? 'Saving...' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default SkillProfileStep3;
