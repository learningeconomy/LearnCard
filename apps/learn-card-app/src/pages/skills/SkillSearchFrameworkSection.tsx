import React, { useEffect, useMemo } from 'react';
import { IonSpinner } from '@ionic/react';

import {
    ModalTypes,
    conditionalPluralize,
    useModal,
    useSearchFrameworkSkills,
} from 'learn-card-base';

import Plus from '../../components/svgs/Plus';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import AddSkillModal from './AddSkillModal';
import { SkillLevel } from './skillTypes';
import type { SelectedSkill } from './skillTypes';
import { SkillFrameworkNode } from '../../components/boost/boost';
import {
    GlobalSkillFrameworkConfig,
    SemanticSearchSkillRecord,
    useGlobalSemanticSearchSkills,
} from '../../helpers/globalSkillFrameworks.helpers';
import {
    convertApiSkillNodeToSkillTreeNode,
    ApiSkillNode,
} from '../../helpers/skillFramework.helpers';

type SkillSearchFrameworkSectionProps = {
    framework: GlobalSkillFrameworkConfig;
    selectedSkills: SelectedSkill[];
    searchInput: string;
    isSavingSkills?: boolean;
    boostSkills?: Array<{ id: string; frameworkId: string; proficiencyLevel: number }>;
    onAddSkill: (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => void;
    onEditSkill: (frameworkId: string, skillId: string, proficiencyLevel: SkillLevel) => void;
    onRemoveSkill: (frameworkId: string, skillId: string) => void;
};

const SkillSearchFrameworkSection: React.FC<SkillSearchFrameworkSectionProps> = ({
    framework,
    selectedSkills,
    searchInput,
    isSavingSkills = false,
    boostSkills = [],
    onAddSkill,
    onEditSkill,
    onRemoveSkill,
}) => {
    const { newModal } = useModal();

    const trimmedSearchInput = searchInput.trim();
    const hasSearchQuery = Boolean(trimmedSearchInput);
    const defaultSkillIds = framework.defaultSkillIds ?? [];
    const boostSkillIds = useMemo(
        () =>
            boostSkills
                .filter(skill => skill.frameworkId === framework.frameworkId)
                .filter(skill => !defaultSkillIds.includes(skill.id))
                .map(skill => skill.id),
        [boostSkills, defaultSkillIds, framework.frameworkId]
    );

    const { data: defaultSkillsData, isLoading: defaultSkillsLoading } = useSearchFrameworkSkills(
        framework.frameworkId,
        { id: { $in: defaultSkillIds } },
        { enabled: defaultSkillIds.length > 0 }
    );

    const { data: boostSkillsData, isLoading: boostSkillsLoading } = useSearchFrameworkSkills(
        framework.frameworkId,
        { id: { $in: boostSkillIds } },
        { enabled: boostSkillIds.length > 0 }
    );

    const { data: semanticResultsApiData, isLoading: semanticLoading } =
        useGlobalSemanticSearchSkills(trimmedSearchInput, [framework.frameworkId], {
            limit: 25,
        });

    const frameworkSkills = useMemo(() => {
        const records =
            (defaultSkillsData as { records?: ApiSkillNode[] } | undefined)?.records ?? [];

        return records.map(record => convertApiSkillNodeToSkillTreeNode(record));
    }, [defaultSkillsData]);

    const stableExtraSkillNodes = useMemo<SkillFrameworkNode[]>(() => {
        const records =
            (boostSkillsData as { records?: ApiSkillNode[] } | undefined)?.records ?? [];

        if (!records.length) {
            return [];
        }

        return records.map(record => convertApiSkillNodeToSkillTreeNode(record));
    }, [boostSkillsData]);

    const semanticSkills: SkillFrameworkNode[] =
        semanticResultsApiData?.records?.map((record: SemanticSearchSkillRecord) =>
            convertApiSkillNodeToSkillTreeNode(record as ApiSkillNode)
        ) ?? [];

    const frameworkSkillIdsToLog = useMemo(() => {
        const skillIds = [
            ...defaultSkillIds,
            ...boostSkillIds,
            ...frameworkSkills.map(skill => skill.id),
            ...stableExtraSkillNodes.map(skill => skill.id),
            ...semanticSkills.map(skill => skill.id),
        ];

        return [...new Set(skillIds)].slice(0, 10);
    }, [boostSkillIds, defaultSkillIds, frameworkSkills, semanticSkills, stableExtraSkillNodes]);

    useEffect(() => {
        if (frameworkSkillIdsToLog.length === 0) return;

        // console.log(
        //     `[SkillSearchFrameworkSection] ${framework.name} skill ids:`,
        //     frameworkSkillIdsToLog
        // );
    }, [framework.name, frameworkSkillIdsToLog]);

    const suggestedSkills = hasSearchQuery
        ? semanticSkills
        : [...stableExtraSkillNodes, ...frameworkSkills];
    const suggestedSkillsToShow = suggestedSkills.filter(
        skill =>
            !selectedSkills.some(
                selected =>
                    selected.id === skill.id && selected.frameworkId === framework.frameworkId
            )
    );

    const isLoading = hasSearchQuery ? semanticLoading : defaultSkillsLoading || boostSkillsLoading;
    const noResults = hasSearchQuery && suggestedSkillsToShow.length === 0 && !isLoading;

    const openAddSkillModal = (skill: SkillFrameworkNode) => {
        const modalFrameworkId = skill.targetFramework ?? framework.frameworkId;

        const normalizeSkillForFramework = (
            skillToNormalize: SkillFrameworkNode,
            explicitFrameworkId?: string
        ): SkillFrameworkNode => ({
            ...skillToNormalize,
            frameworkId: explicitFrameworkId ?? modalFrameworkId,
            targetFramework:
                skillToNormalize.targetFramework ?? explicitFrameworkId ?? modalFrameworkId,
        });

        newModal(
            <AddSkillModal
                frameworkId={modalFrameworkId}
                skill={skill}
                handleAdd={(nextSkill, proficiencyLevel, relatedFrameworkId) =>
                    onAddSkill(
                        normalizeSkillForFramework(nextSkill, relatedFrameworkId),
                        proficiencyLevel
                    )
                }
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={(nextSkill, proficiencyLevel, relatedFrameworkId) =>
                    onAddSkill(
                        normalizeSkillForFramework(nextSkill, relatedFrameworkId),
                        proficiencyLevel
                    )
                }
                handleEditRelatedSkill={(skillId, proficiencyLevel) =>
                    onEditSkill(modalFrameworkId, skillId, proficiencyLevel)
                }
                handleRemoveRelatedSkill={skillId => onRemoveSkill(modalFrameworkId, skillId)}
            />,
            undefined,
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="relative py-[10px] border-t-[1px] border-solid border-grayscale-200 flex flex-col gap-[10px]">
            {isSavingSkills && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-[10px]">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )}

            <h4 className="text-grayscale-900 font-poppins text-[14px] font-bold">
                {hasSearchQuery ? (
                    <>
                        {conditionalPluralize(suggestedSkillsToShow.length, 'skill')} for{' '}
                        <em>{trimmedSearchInput}</em> from {framework.name}
                    </>
                ) : (
                    `Add Skills from ${framework.name}`
                )}
            </h4>

            {isLoading && (
                <div className="flex-1 flex justify-center pt-[30px]">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )}

            {!isLoading &&
                suggestedSkillsToShow.map(skill => (
                    <button
                        key={`${skill.frameworkId ?? framework.frameworkId}-${skill.id}`}
                        onClick={() => openAddSkillModal(skill)}
                        disabled={isSavingSkills}
                        className="p-[10px] flex gap-[10px] items-center background-grayscale-50 rounded-[15px] shadow-bottom-2-4 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <CompetencyIcon icon={skill.icon} />
                        <span className="text-grayscale-900 font-poppins text-[17px] line-clamp-2 text-left">
                            {skill?.targetName}
                        </span>
                        <Plus
                            className="h-[25px] w-[25px] text-grayscale-700 ml-auto"
                            strokeWidth="2"
                        />
                    </button>
                ))}

            {noResults && (
                <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                    No results or suggestions
                </p>
            )}
        </div>
    );
};

export default SkillSearchFrameworkSection;
