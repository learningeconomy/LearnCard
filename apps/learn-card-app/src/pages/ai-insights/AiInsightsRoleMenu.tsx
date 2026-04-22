import React from 'react';
import {
    SearchInput,
    fetchOccupationDetailsForKeyword,
    useOccupationDetailsForKeyword,
} from 'learn-card-base';
import type { OccupationDetailsResponse } from 'learn-card-base';
import { useQueries } from '@tanstack/react-query';

import { formatEstimatedSalary } from '../ai-pathways/ai-pathway-careers/ai-pathway-careers.helpers';

type AiInsightsRoleMenuProps = {
    selectedOccupation: OccupationDetailsResponse | null;
    setSelectedOccupation: (occupation: OccupationDetailsResponse) => void;
    suggestedOccupations: OccupationDetailsResponse[];
    salaryType?: 'per_year' | 'per_hour';
    variant?: 'popover' | 'sheet';
    onSelectOccupation?: (occupation: OccupationDetailsResponse) => void;
};

const MORE_ROLE_KEYWORDS = [
    'accountant',
    'analyst',
    'architect',
    'assistant',
    'business',
    'chef',
    'construction',
    'designer',
    'developer',
    'driver',
    'educator',
    'engineer',
    'health',
    'law',
    'mechanic',
    'nurse',
    'office',
    'sales',
    'security',
    'teacher',
    'technician',
    'writer',
];

const MORE_ROLE_RESULTS_LIMIT = 12;

const sortOccupationsAlphabetically = (
    occupations: OccupationDetailsResponse[]
): OccupationDetailsResponse[] => {
    return [...occupations].sort((left, right) =>
        (left.OnetTitle || '').localeCompare(right.OnetTitle || '', undefined, {
            sensitivity: 'base',
        })
    );
};

const dedupeOccupations = (
    occupations: OccupationDetailsResponse[]
): OccupationDetailsResponse[] => {
    const byCode = new Map<string, OccupationDetailsResponse>();

    occupations.forEach(occupation => {
        if (!occupation?.OnetCode || byCode.has(occupation.OnetCode)) {
            return;
        }

        byCode.set(occupation.OnetCode, occupation);
    });

    return Array.from(byCode.values());
};

const useBrowseableRoles = (enabled: boolean) => {
    const queries = useQueries({
        queries: MORE_ROLE_KEYWORDS.map(keyword => ({
            queryKey: ['occupation-browse', keyword, MORE_ROLE_RESULTS_LIMIT],
            queryFn: async () => {
                return fetchOccupationDetailsForKeyword({
                    keyword,
                    limit: MORE_ROLE_RESULTS_LIMIT,
                });
            },
            enabled,
            staleTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
        })),
    });

    const occupations = React.useMemo(() => {
        const merged = queries.flatMap(query => (query.data ?? []) as OccupationDetailsResponse[]);

        return sortOccupationsAlphabetically(dedupeOccupations(merged));
    }, [queries]);

    const isLoading = enabled && queries.some(query => query.isLoading || query.isFetching);

    return {
        occupations,
        isLoading,
    };
};

type RoleSectionProps = {
    title: string;
    occupations: OccupationDetailsResponse[];
    selectedOccupation: OccupationDetailsResponse | null;
    salaryType: 'per_year' | 'per_hour';
    onSelectOccupation: (occupation: OccupationDetailsResponse) => void;
    emptyMessage: string;
    loadingMessage?: string;
    isLoading?: boolean;
};

const RoleSection: React.FC<RoleSectionProps> = ({
    title,
    occupations,
    selectedOccupation,
    salaryType,
    onSelectOccupation,
    emptyMessage,
    loadingMessage,
    isLoading = false,
}) => {
    return (
        <section className="flex flex-col gap-[8px]">
            <p className="text-[12px] font-[500] text-grayscale-500 leading-[16px] tracking-[0.72px] uppercase text-left">
                {title}
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center gap-[10px] px-[10px] py-[10px] text-grayscale-600 min-h-[92px]">
                    <span className="h-[16px] w-[16px] shrink-0 animate-spin rounded-full border-2 border-grayscale-200 border-t-grayscale-900" />
                    <span className="text-[14px] leading-[20px]">
                        {loadingMessage || 'Loading roles...'}
                    </span>
                </div>
            ) : occupations.length > 0 ? (
                <div className="flex flex-col gap-[4px]">
                    {occupations.map(occupation => (
                        <button
                            type="button"
                            key={occupation.OnetCode}
                            onClick={() => onSelectOccupation(occupation)}
                            className={`flex items-center justify-between gap-[10px] w-full p-[10px] rounded-[12px] text-left hover:bg-grayscale-50 transition-colors cursor-pointer ${
                                selectedOccupation?.OnetCode === occupation.OnetCode
                                    ? 'bg-grayscale-100'
                                    : ''
                            }`}
                        >
                            <p className="min-w-0 text-[15px] font-medium text-grayscale-900 leading-[22px] tracking-[0.25px] truncate">
                                {occupation.OnetTitle}
                            </p>
                            <p className="shrink-0 text-[15px] font-medium text-grayscale-600 leading-[22px] tracking-[0.25px]">
                                {formatEstimatedSalary(
                                    occupation.Wages?.NationalWagesList,
                                    salaryType
                                ) || 'Salary not available'}
                            </p>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="px-[10px] py-[10px] text-[14px] leading-[20px] text-grayscale-600">
                    {emptyMessage}
                </p>
            )}
        </section>
    );
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
    const { occupations: moreRoles, isLoading: moreRolesLoading } = useBrowseableRoles(
        !isSearchActive
    );

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
                    ? 'flex w-full flex-col overflow-hidden rounded-[20px] bg-white max-h-[min(72vh,640px)]'
                    : 'flex flex-col overflow-hidden rounded-[20px] border border-grayscale-200 bg-white shadow-bottom-2-4 max-h-[420px]'
            }
        >
            <div className="min-h-0 overflow-y-auto hide-scrollbar">
                <div className="sticky top-0 z-10 border-b border-grayscale-100 bg-white/95 px-[12px] py-[12px] backdrop-blur">
                    <SearchInput
                        placeholder="Search roles..."
                        value={search}
                        onChange={setSearch}
                        className="w-full text-left"
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-[12px] px-[12px] py-[12px]">
                    {searchTerm.length > 0 && !isSearchActive ? (
                        <p className="px-[10px] py-[10px] text-[14px] leading-[20px] text-grayscale-600">
                            Type at least 2 letters to search.
                        </p>
                    ) : isLoadingSearchResults ? (
                        <div className="flex items-center justify-center gap-[10px] px-[10px] py-[10px] text-grayscale-600 min-h-[125px]">
                            <span className="h-[16px] w-[16px] shrink-0 animate-spin rounded-full border-2 border-grayscale-200 border-t-grayscale-900" />
                            <span className="text-[14px] leading-[20px]">Searching roles...</span>
                        </div>
                    ) : isSearchActive ? (
                        <RoleSection
                            title="Search Results"
                            occupations={occupationsToDisplay}
                            selectedOccupation={selectedOccupation}
                            salaryType={salaryType}
                            onSelectOccupation={handleSelectOccupation}
                            emptyMessage="No roles found for that search."
                        />
                    ) : (
                        <>
                            <RoleSection
                                title="Suggested Roles"
                                occupations={suggestedOccupations}
                                selectedOccupation={selectedOccupation}
                                salaryType={salaryType}
                                onSelectOccupation={handleSelectOccupation}
                                emptyMessage="No suggested roles available yet."
                            />

                            <RoleSection
                                title="More Roles"
                                occupations={moreRoles}
                                selectedOccupation={selectedOccupation}
                                salaryType={salaryType}
                                onSelectOccupation={handleSelectOccupation}
                                emptyMessage="No additional roles are available yet."
                                loadingMessage="Loading more roles..."
                                isLoading={moreRolesLoading}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiInsightsRoleMenu;
