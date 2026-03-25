import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    useGetSkillFrameworkById,
    useSearchFrameworkSkills,
    useSemanticSearchSkills,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useGetProfile,
    useToast,
    ToastTypeEnum,
    conditionalPluralize,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import VerifiedBadgeIcon from 'learn-card-base/svgs/VerifiedBadgeIcon';
import SelfAssignedSkillRow from './SelfAssignedSkillRow';
import SkillTag from './SkillTag';
import { IonInput, IonSpinner } from '@ionic/react';
import { GenericErrorView } from 'learn-card-base/components/generic/GenericErrorBoundary';

import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import { SkillFrameworkNode } from '../../components/boost/boost';
import { SkillLevel } from './SkillProficiencyBar';

export type SelectedSkill = {
    id: string;
    proficiency: SkillLevel;
};

export type SkillSearchSelectorProps = {
    selectedSkills: SelectedSkill[];
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    mode?: 'add' | 'review';
    shouldCollapseOptions?: boolean;
    showSuggestSkill?: boolean;
    className?: string;
};

export const useSkillSearchSelectorData = () => {
    const flags = useFlags();
    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const initialSkillIds = flags?.initialSelfAssignedSkillIds?.skillIds as string[];

    const { data: selfAssignedSkillFramework, isLoading: selfAssignedSkillFrameworkLoading } =
        useGetSkillFrameworkById(frameworkId);

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: skillsLoading } = useGetBoostSkills(sasBoostData?.uri);

    const errorLoadingFramework = !selfAssignedSkillFramework && !selfAssignedSkillFrameworkLoading;

    return {
        frameworkId,
        initialSkillIds,
        selfAssignedSkillFramework,
        selfAssignedSkillFrameworkLoading,
        sasBoostSkills,
        skillsLoading,
        errorLoadingFramework,
    };
};

const SkillSearchSelector: React.FC<SkillSearchSelectorProps> = ({
    selectedSkills,
    onSelectedSkillsChange,
    mode = 'add',
    shouldCollapseOptions = false,
    showSuggestSkill = true,
    className = '',
}) => {
    const flags = useFlags();
    const { presentToast } = useToast();
    const { data: lcNetworkProfile } = useGetProfile();

    const [isSubmittingSkillSuggestion, setIsSubmittingSkillSuggestion] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [selectedSkillNodesCache, setSelectedSkillNodesCache] = useState<
        Map<string, SkillFrameworkNode>
    >(new Map());

    const initialSkillIds = flags?.initialSelfAssignedSkillIds?.skillIds as string[];
    const frameworkId = flags?.selfAssignedSkillsFrameworkId;

    const { data: selfAssignedSkillFramework, isLoading: selfAssignedSkillFrameworkLoading } =
        useGetSkillFrameworkById(frameworkId);

    const { data: initialSkillsData, isLoading: initialSkillsLoading } = useSearchFrameworkSkills(
        frameworkId,
        { id: { $in: initialSkillIds ?? [] } },
        { enabled: !!initialSkillIds?.length }
    );

    const { data: semanticResultsApiData, isLoading: semanticLoading } = useSemanticSearchSkills(
        searchInput,
        frameworkId,
        { limit: 25 }
    );

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const hasSearchQuery = Boolean(searchInput?.trim());
    const searchLoading = hasSearchQuery ? semanticLoading : initialSkillsLoading;

    const initialSkills: SkillFrameworkNode[] =
        (initialSkillsData as any)?.records?.map((record: ApiSkillNode) =>
            convertApiSkillNodeToSkillTreeNode(record)
        ) ?? [];

    const [stableExtraSkillNodes, setStableExtraSkillNodes] = useState<SkillFrameworkNode[]>([]);

    useEffect(() => {
        if (stableExtraSkillNodes.length === 0 && sasBoostSkills) {
            const extraNodes: SkillFrameworkNode[] = sasBoostSkills
                .filter((sk: { id: string }) => !initialSkillIds?.includes(sk.id))
                .map((sk: any) => convertApiSkillNodeToSkillTreeNode(sk as any));
            if (extraNodes.length > 0) {
                setStableExtraSkillNodes(extraNodes);
            }
        }
    }, [sasBoostSkills, initialSkillIds, stableExtraSkillNodes.length]);

    const defaultSkillsToShow: SkillFrameworkNode[] = [...stableExtraSkillNodes, ...initialSkills];

    const semanticSkills: SkillFrameworkNode[] =
        semanticResultsApiData?.records?.map((record: ApiSkillNode) =>
            convertApiSkillNodeToSkillTreeNode(record)
        ) ?? [];

    const suggestedSkills = hasSearchQuery ? semanticSkills : defaultSkillsToShow;

    const handleToggleSelect = (skillId: string, skillNode?: SkillFrameworkNode) => {
        const isAlreadySelected = selectedSkills.some(s => s.id === skillId);
        if (isAlreadySelected) {
            onSelectedSkillsChange(selectedSkills.filter(s => s.id !== skillId));
        } else {
            onSelectedSkillsChange([
                ...selectedSkills,
                { id: skillId, proficiency: SkillLevel.Hidden },
            ]);
            if (skillNode) {
                setSelectedSkillNodesCache(prev => new Map(prev).set(skillId, skillNode));
            }
        }
    };

    const handleSubmitSkillSuggestion = async () => {
        if (isSubmittingSkillSuggestion) return;

        setIsSubmittingSkillSuggestion(true);
        const webhookUrl =
            'https://script.google.com/macros/s/AKfycbxLWcLBp1u7CfIzjPJT0ZTf4TkdgCMsVxNz3YifmUjmHlLTr7xvsoXGJXJKMxjofg3k1A/exec';
        try {
            if (!webhookUrl) {
                console.warn('REACT_APP_SKILL_SUGGESTION_WEBHOOK not configured');
                presentToast('Thank you for your suggestion!', {
                    type: ToastTypeEnum.Success,
                });
                return;
            }

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggestion: searchInput,
                    timestamp: new Date().toISOString(),
                    role: lcNetworkProfile?.role,
                }),
                mode: 'no-cors',
            });
            presentToast('Thank you for your suggestion!', {
                type: ToastTypeEnum.Success,
            });
        } catch (error) {
            console.error('Failed to submit skill suggestion:', error);
            presentToast('Thank you for your suggestion!', {
                type: ToastTypeEnum.Success,
            });
        } finally {
            setIsSubmittingSkillSuggestion(false);
        }
    };

    const isAdd = mode === 'add';
    const isReview = mode === 'review';
    const noResults = !!searchInput && suggestedSkills.length === 0 && !searchLoading;
    const errorLoadingFramework = !selfAssignedSkillFramework && !selfAssignedSkillFrameworkLoading;

    return (
        <div className={`flex flex-col gap-[20px] ${className}`}>
            {errorLoadingFramework && <GenericErrorView errorMessage="Error loading framework" />}

            {!errorLoadingFramework && (
                <>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                            <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                        </div>
                        <IonInput
                            type="text"
                            value={searchInput}
                            placeholder={
                                isAdd ? 'Search by skill, goal, or job...' : 'Search skills...'
                            }
                            onIonInput={e => setSearchInput(e.detail.value)}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[14px] !pl-[44px] !text-left !pr-[36px]"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput('');
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {selectedSkills.length > 0 && (
                        <div className="py-[10px] border-t-[1px] border-solid border-grayscale-200 flex flex-col gap-[10px]">
                            <h4 className="flex gap-[5px] items-center text-grayscale-900 font-poppins text-[14px] font-bold">
                                <VerifiedBadgeIcon />
                                {conditionalPluralize(selectedSkills.length, 'Self Assigned Skill')}

                                {selectedSkills.length > 4 && (
                                    <button className="ml-auto text-grayscale-600 text-[14px] font-bold">
                                        View All
                                    </button>
                                )}
                            </h4>

                            {selectedSkills.map((skill, index) => (
                                <SkillTag
                                    key={skill.id}
                                    skillId={skill.id}
                                    frameworkId={frameworkId}
                                    proficiencyLevel={skill.proficiency}
                                    handleRemoveSkill={() => handleToggleSelect(skill.id)}
                                />
                            ))}
                        </div>
                    )}

                    {!noResults && isAdd && hasSearchQuery && (
                        <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                            Suggested Skills
                        </p>
                    )}
                    {noResults && (
                        <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                            No results or suggestions
                        </p>
                    )}

                    {searchLoading ? (
                        <div className="flex-1 flex justify-center pt-[30px]">
                            <IonSpinner color="dark" name="crescent" />
                        </div>
                    ) : isReview ? (
                        <>
                            {selectedSkills.map(selected => {
                                const savedSkill = sasBoostSkills?.find(
                                    (s: { id: string }) => s.id === selected.id
                                );
                                const cachedSkill = selectedSkillNodesCache.get(selected.id);
                                const suggestedSkill = suggestedSkills.find(
                                    (s: SkillFrameworkNode) => s.id === selected.id
                                );

                                const skill = savedSkill
                                    ? convertApiSkillNodeToSkillTreeNode(savedSkill as any)
                                    : cachedSkill ?? suggestedSkill;

                                if (!skill) return null;

                                return (
                                    <SelfAssignedSkillRow
                                        key={selected.id}
                                        skill={skill}
                                        framework={selfAssignedSkillFramework}
                                        handleToggleSelect={() => handleToggleSelect(selected.id)}
                                        isNodeSelected={true}
                                        shouldCollapseOptions={shouldCollapseOptions}
                                        proficiencyLevel={selected.proficiency}
                                        onChangeProficiency={level =>
                                            onSelectedSkillsChange(
                                                selectedSkills.map(s =>
                                                    s.id === selected.id
                                                        ? { ...s, proficiency: level }
                                                        : s
                                                )
                                            )
                                        }
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {suggestedSkills.map(skill => {
                                const selected = selectedSkills.find(s => s.id === skill.id);

                                return (
                                    <SelfAssignedSkillRow
                                        key={skill.id}
                                        skill={skill}
                                        framework={selfAssignedSkillFramework}
                                        handleToggleSelect={() =>
                                            handleToggleSelect(skill.id!, skill)
                                        }
                                        isNodeSelected={!!selected}
                                        shouldCollapseOptions={shouldCollapseOptions}
                                        proficiencyLevel={
                                            selected?.proficiency ?? SkillLevel.Hidden
                                        }
                                        onChangeProficiency={level =>
                                            onSelectedSkillsChange(
                                                selectedSkills.map(s =>
                                                    s.id === skill.id
                                                        ? { ...s, proficiency: level }
                                                        : s
                                                )
                                            )
                                        }
                                    />
                                );
                            })}
                        </>
                    )}

                    {showSuggestSkill && searchInput && !searchLoading && (
                        <div className="flex flex-col gap-[20px] w-full pt-[20px] border-t-[1px] border-grayscale-200 border-solid">
                            <div className="flex flex-col items-start gap-[10px] pb-[10px]">
                                <p className="text-grayscale-900 text-[17px] font-[600] font-poppins">
                                    Didn't find what you're looking for?
                                </p>
                                <p className="font-poppins text-[17px] text-grayscale-700">
                                    We are always adding new skills and your suggestions help!
                                </p>
                            </div>

                            <p className="text-grayscale-900 font-poppins text-[17px] font-[600] italic text-center">
                                {searchInput}
                            </p>

                            <button
                                className="px-[20px] py-[7px] rounded-[30px] bg-indigo-500 text-white text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] disabled:bg-grayscale-200"
                                onClick={handleSubmitSkillSuggestion}
                                disabled={isSubmittingSkillSuggestion}
                            >
                                Suggest Skill
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SkillSearchSelector;
