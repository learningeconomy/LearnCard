import React, { useState } from 'react';
import { TextInput, RadioGroup } from 'learn-card-base';

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
                    inputClassName="!pl-[29px]"
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
                >
                    Back
                </button>
                <button
                    className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 h-[44px]"
                    onClick={handleNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SkillProfileStep3;
