import React from 'react';
import { SearchInput } from 'learn-card-base';
import type { OccupationDetailsResponse } from 'learn-card-base';

import { formatEstimatedSalary } from '../ai-pathways/ai-pathway-careers/ai-pathway-careers.helpers';

type AiInsightsRoleMenuProps = {
    selectedOccupation: OccupationDetailsResponse | null;
    setSelectedOccupation: (occupation: OccupationDetailsResponse) => void;
    suggestedOccupations: OccupationDetailsResponse[];
    salaryType?: 'per_year' | 'per_hour';
};

const AiInsightsRoleMenu: React.FC<AiInsightsRoleMenuProps> = ({
    selectedOccupation,
    setSelectedOccupation,
    suggestedOccupations,
    salaryType = 'per_year',
}) => {
    const [search, setSearch] = React.useState('');

    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 shadow-bottom-2-4 p-[12px] flex flex-col gap-[12px] max-h-[420px] overflow-y-auto">
            <SearchInput
                placeholder="Search roles..."
                value={search}
                onChange={setSearch}
                className="w-full text-left"
            />

            <p className="text-[12px] font-[500] text-grayscale-500 leading-[16px] tracking-[0.72px] uppercase text-left">
                Suggested Roles
            </p>
            <div className="flex flex-col">
                {suggestedOccupations.map(occupation => (
                    <button
                        type="button"
                        key={occupation.OnetCode}
                        onClick={() => setSelectedOccupation(occupation)}
                        className={`flex items-center justify-between gap-[10px] w-full p-[10px] rounded-[12px] text-left hover:bg-grayscale-50 transition-colors cursor-pointer ${
                            selectedOccupation?.OnetCode === occupation.OnetCode
                                ? 'bg-grayscale-100'
                                : ''
                        }`}
                    >
                        <p className="text-[15px] font-medium text-grayscale-900 leading-[22px] tracking-[0.25px] truncate">
                            {occupation.OnetTitle}
                        </p>
                        <p className="shrink-0 text-[15px] font-medium text-grayscale-600 leading-[22px] tracking-[0.25px]">
                            {formatEstimatedSalary(
                                occupation.Wages?.NationalWagesList,
                                salaryType
                            ) || `~ $0${salaryType === 'per_hour' ? '/hr' : '/yr'}`}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AiInsightsRoleMenu;
