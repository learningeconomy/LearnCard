import React, { useEffect, useMemo, useState } from 'react';

import { Search, X } from 'lucide-react';

import {
    CredentialCategoryEnum,
    ModalTypes,
    useAiInsightCredential,
    useAiPathways,
    useGetBoostSkills,
    useGetSelfAssignedSkillsBoost,
    useModal,
    useVerifiableData,
} from 'learn-card-base';
import { ExperiencesIconWithShape } from 'learn-card-base/svgs/wallet/ExperiencesIcon';
import { useOccupationDetailsForKeyword } from 'learn-card-base/react-query/queries/careerOneStop';
import type { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';

import useTheme from '../../theme/hooks/useTheme';
import EditGoalsModal from './EditGoalsModal';
import SelfAssignSkillsModal from '../skills/SelfAssignSkillsModal';
import PathwaySearchInput from './ai-pathways-what-would-you-like-to-do/PathwaySearchInput';
import AiPathwayCareerItem from './ai-pathway-careers/AiPathwayCareerItem';
import { getFirstAvailableKeywords } from './ai-pathway-careers/ai-pathway-careers.helpers';
import {
    SKILL_PROFILE_GOALS_KEY,
    type SkillProfileGoalsData,
} from './ai-pathways-skill-profile/SkillProfileStep1';

type ExploreRolesProps = {
    initialSearchQuery?: string;
};

const ExploreRoles: React.FC<ExploreRolesProps> = ({ initialSearchQuery = '' }) => {
    const { getThemedCategoryIcons } = useTheme();
    const { newModal, closeModal } = useModal();

    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [submittedSearchQuery, setSubmittedSearchQuery] = useState(initialSearchQuery);
    const [inlineFilter, setInlineFilter] = useState('');
    const [hasAppliedDefaultSearch, setHasAppliedDefaultSearch] = useState(
        Boolean(initialSearchQuery.trim())
    );
    const { data: aiInsightCredential } = useAiInsightCredential();
    const { data: learningPathwaysData } = useAiPathways();

    const strongestAreaInterest = aiInsightCredential?.insights?.strongestArea;
    const strongestAreaKeyword = strongestAreaInterest?.keywords?.occupations?.[0] ?? '';
    const fallbackKeyword = getFirstAvailableKeywords(learningPathwaysData || [])?.[0] ?? '';
    const defaultRoleQuery = initialSearchQuery.trim() || strongestAreaKeyword || fallbackKeyword;

    const { IconWithShape } = getThemedCategoryIcons(CredentialCategoryEnum.workHistory);
    const RolesIcon = IconWithShape ?? ExperiencesIconWithShape;

    useEffect(() => {
        if (
            !hasAppliedDefaultSearch &&
            !initialSearchQuery.trim() &&
            !submittedSearchQuery.trim() &&
            defaultRoleQuery
        ) {
            setSubmittedSearchQuery(defaultRoleQuery);
            setHasAppliedDefaultSearch(true);
        }
    }, [defaultRoleQuery, hasAppliedDefaultSearch, initialSearchQuery, submittedSearchQuery]);

    const { data: occupationsData, isLoading: occupationsLoading } = useOccupationDetailsForKeyword(
        submittedSearchQuery.trim(),
        20,
        12
    );
    const occupations = (occupationsData ?? []) as OccupationDetailsResponse[];

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: skillsLoading } = useGetBoostSkills(sasBoostData?.uri);
    const { data: goalsData, isLoading: goalsLoading } = useVerifiableData<SkillProfileGoalsData>(
        SKILL_PROFILE_GOALS_KEY,
        {
            name: 'Career Goals',
            description: 'Self-reported career goals and aspirations',
        }
    );

    const skillsCount = sasBoostSkills?.length ?? 0;
    const goalsCount = goalsData?.goals?.length ?? 0;

    const filteredOccupations = useMemo(() => {
        if (!inlineFilter.trim()) {
            return occupations;
        }

        const normalizedFilter = inlineFilter.toLowerCase();

        return occupations.filter(occupation =>
            [
                occupation.OnetTitle,
                occupation.OnetDescription,
                occupation.OnetCode,
                occupation.BrightOutlookCategory,
            ]
                .filter(Boolean)
                .some(value => String(value).toLowerCase().includes(normalizedFilter))
        );
    }, [inlineFilter, occupations]);

    const openSelfAssignSkillsModal = () => {
        newModal(<SelfAssignSkillsModal />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const openEditGoalsModal = () => {
        newModal(
            <EditGoalsModal />,
            { sectionClassName: '!bg-transparent' },
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    return (
        <div className="h-full bg-grayscale-100 overflow-hidden text-grayscale-900 flex flex-col">
            <header className="px-4 py-5 bg-white safe-area-top-margin flex flex-col gap-4 z-20 relative shadow-bottom-1-5 rounded-b-[20px]">
                <div className="flex items-start gap-2.5">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <RolesIcon className="w-[50px] h-[50px] shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-grayscale-900 text-[21px] font-poppins font-semibold truncate">
                                Explore Roles
                            </h2>
                            <div className="text-sm text-grayscale-600 font-poppins font-semibold flex items-center gap-1.5 flex-wrap">
                                <span>
                                    {skillsLoading ? '--' : skillsCount}{' '}
                                    {skillsCount === 1 ? 'Skill' : 'Skills'}
                                </span>
                                <button
                                    type="button"
                                    className="text-indigo-500 hover:text-indigo-500 transition-colors font-semibold bg-indigo-50 px-[4px] py-[1px] rounded-[5px]"
                                    onClick={openSelfAssignSkillsModal}
                                >
                                    Edit
                                </button>
                                <span className="text-sm text-grayscale-600 font-semibold">•</span>
                                <span className="text-sm text-grayscale-600 font-semibold">
                                    {goalsLoading ? '--' : goalsCount} Goals
                                </span>
                                <button
                                    type="button"
                                    className="text-indigo-500 hover:text-indigo-500 transition-colors font-semibold bg-indigo-50 px-[4px] py-[1px] rounded-[5px]"
                                    onClick={openEditGoalsModal}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <PathwaySearchInput
                    placeholder="Skill, goal or job..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    onSearchSubmit={query => {
                        setSearchQuery(query);
                        setSubmittedSearchQuery(query);
                    }}
                />
            </header>

            <section className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-6">
                <div className="relative w-full flex items-center mb-3">
                    <Search className="absolute left-3 w-5 h-5 text-grayscale-800 pointer-events-none" />
                    <input
                        type="text"
                        value={inlineFilter}
                        onChange={e => setInlineFilter(e.target.value)}
                        placeholder="Filter results..."
                        className="w-full py-3 px-4 pl-10 border border-grayscale-200 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-600 focus:outline-none focus:border-transparent bg-white"
                    />
                </div>

                <div className="w-full flex flex-col gap-3">
                    {!submittedSearchQuery.trim() && (
                        <div className="w-full rounded-[20px] border border-grayscale-200 bg-white p-4 text-sm text-grayscale-600 font-poppins">
                            Search to explore matching roles.
                        </div>
                    )}

                    {submittedSearchQuery.trim() && occupationsLoading && (
                        <>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-[168px] rounded-[20px] bg-white border border-grayscale-200 animate-pulse"
                                />
                            ))}
                        </>
                    )}

                    {submittedSearchQuery.trim() &&
                        !occupationsLoading &&
                        filteredOccupations.length === 0 && (
                            <div className="w-full rounded-[20px] border border-grayscale-200 bg-white p-4 text-sm text-grayscale-600 font-poppins">
                                No roles matched your search. Try a broader keyword.
                            </div>
                        )}

                    {filteredOccupations.map(occupation => (
                        <AiPathwayCareerItem
                            key={occupation.OnetCode}
                            occupation={occupation}
                            variant="card"
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ExploreRoles;
