import React from 'react';
import { SearchInput, useOccupationDetailsForKeyword } from 'learn-card-base';
import type { OccupationDetailsResponse } from 'learn-card-base';

import { formatEstimatedSalary } from '../ai-pathways/ai-pathway-careers/ai-pathway-careers.helpers';

type AiInsightsRoleMenuProps = {
    selectedOccupation: OccupationDetailsResponse | null;
    setSelectedOccupation: (occupation: OccupationDetailsResponse) => void;
    suggestedOccupations: OccupationDetailsResponse[];
    salaryType?: 'per_year' | 'per_hour';
    variant?: 'popover' | 'sheet';
    onSelectOccupation?: (occupation: OccupationDetailsResponse) => void;
};

const AiInsightsRoleMenu: React.FC<AiInsightsRoleMenuProps> = ({
    selectedOccupation,
    setSelectedOccupation,
    suggestedOccupations,
    salaryType = 'per_year',
    variant = 'popover',
    onSelectOccupation,
}) => {
    const [search, setSearch] = React.useState('');
    const isSheet = variant === 'sheet';
    const searchTerm = search.trim();
    const isSearchActive = searchTerm.length >= 2;
    const {
        data: searchedOccupations = [],
        isLoading: searchLoading,
        isFetching: searchFetching,
    } = useOccupationDetailsForKeyword(isSearchActive ? searchTerm : '');
    const occupationsToDisplay = isSearchActive ? searchedOccupations : suggestedOccupations;
    const isLoadingSearchResults = isSearchActive && (searchLoading || searchFetching);

    const handleSelectOccupation = (occupation: OccupationDetailsResponse) => {
        if (onSelectOccupation) {
            onSelectOccupation(occupation);
            return;
        }

        setSelectedOccupation(occupation);
    };

    return (
        <div
            className={
                isSheet
                    ? 'flex w-full flex-col gap-[12px]'
                    : 'bg-white rounded-[20px] border border-grayscale-200 shadow-bottom-2-4 p-[12px] flex flex-col gap-[12px] max-h-[420px] overflow-y-auto'
            }
        >
            <SearchInput
                placeholder="Search roles..."
                value={search}
                onChange={setSearch}
                className="w-full text-left"
                autoFocus
            />

            <p className="text-[12px] font-[500] text-grayscale-500 leading-[16px] tracking-[0.72px] uppercase text-left">
                {isSearchActive ? 'Search Results' : 'Suggested Roles'}
            </p>
            <div className={isSheet ? 'flex w-full flex-col' : 'flex flex-col'}>
                {searchTerm.length > 0 && !isSearchActive ? (
                    <p className="px-[10px] py-[10px] text-[14px] leading-[20px] text-grayscale-600">
                        Type at least 2 letters to search.
                    </p>
                ) : isLoadingSearchResults ? (
                    <div className="flex items-center justify-center gap-[10px] px-[10px] py-[10px] text-grayscale-600 min-h-[125px]">
                        <span className="h-[16px] w-[16px] shrink-0 animate-spin rounded-full border-2 border-grayscale-200 border-t-grayscale-900" />
                        <span className="text-[14px] leading-[20px]">Searching roles...</span>
                    </div>
                ) : occupationsToDisplay.length > 0 ? (
                    occupationsToDisplay.map(occupation => (
                        <button
                            type="button"
                            key={occupation.OnetCode}
                            onClick={() => handleSelectOccupation(occupation)}
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
                    ))
                ) : (
                    <p className="px-[10px] py-[10px] text-[14px] leading-[20px] text-grayscale-600">
                        {isSearchActive
                            ? 'No roles found for that search.'
                            : 'No suggested roles available yet.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AiInsightsRoleMenu;
