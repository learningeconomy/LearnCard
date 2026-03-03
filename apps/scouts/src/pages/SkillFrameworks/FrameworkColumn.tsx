import React, { useRef, useState, useEffect } from 'react';
import { ModalTypes, useDeviceTypeByWidth, useGetSkillChildren, useModal } from 'learn-card-base';

import X from '../../components/svgs/X';
import Plus from '../../components/svgs/Plus';
import Pencil from '../../components/svgs/Pencil';
import TierRow from './TierRow';
import InfoIcon from 'learn-card-base/svgs/InfoIcon';
import CodeIcon from 'learn-card-base/svgs/CodeIcon';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import CompetencyRow from './CompetencyRow';
import FrameworkImage from './FrameworkImage';
import ViewAlignmentInfo from './ViewAlignmentInfo';
import EditAlignmentModal from './EditAlignmentModal';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import FrameworkSkillsCount from './FrameworkSkillsCount';
import FrameworkOptionsModal from './FrameworkOptionsModal';
import FrameworkSearchResults from './FrameworkSearchResults';
import { IonFooter, IonInput, IonSpinner } from '@ionic/react';

import {
    FrameworkNodeRole,
    SkillFrameworkNode,
    SkillFrameworkNodeWithSearchInfo,
} from '../../components/boost/boost';
import {
    ApiFrameworkInfo,
    countCompetenciesInNode,
    countCompetenciesInNodes,
    convertApiSkillNodesToSkillFrameworkNodes,
} from '../../helpers/skillFramework.helpers';
import { SetState } from 'packages/shared-types/dist';

type FrameworkColumnProps = {
    nodes: SkillFrameworkNode[];
    setSelectedNode: (node: SkillFrameworkNode) => void;
    frameworkInfo: ApiFrameworkInfo;
    isTopLevel?: boolean;
    columnNode?: SkillFrameworkNode;
    isNodeInSelectedPath?: (node: SkillFrameworkNode) => boolean;
    isEdit?: boolean;
    selectedPath?: SkillFrameworkNode[];
    handleAdd?: (
        parentNodeId: string,
        node: SkillFrameworkNode,
        parentPath: SkillFrameworkNode[]
    ) => void;
    handleEdit?: (node: SkillFrameworkNode) => void;
    handleDelete?: (
        node: SkillFrameworkNode,
        numberOfSkillsDeleted: number,
        parentPathIds: string[]
    ) => void;
    addedNodes?: Record<string, SkillFrameworkNode[]>;
    editedNodes?: Record<string, SkillFrameworkNode>;
    deletedNodes?: SkillFrameworkNode[];
    maxColumns?: number;
    isFullSkillFramework?: boolean;
    showBackInFooter?: boolean;
    handleBack?: () => void;
    isApproveFlow?: boolean;
    handleApprove?: () => void;
    search: string;
    setSearch: SetState<string>;
    setSelectedPath: SetState<SkillFrameworkNode[]>;
    setIsEdit: SetState<boolean>;
    handleDisableEdit: () => void;
    openManageJsonModal: () => void;
    changesExist?: boolean;
    searchResults: (SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo)[];
    searchLoading: boolean;
    onSearchResultItemClick: (
        node: SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo,
        path: SkillFrameworkNode[]
    ) => void;
    countAdjustments: Record<string, number>;
    isSelectSkillsFlow?: boolean;
    selectedSkills?: SkillFrameworkNode[];
    handleToggleSkill?: (node: SkillFrameworkNode) => void;
    handleClose?: () => void;
    handleSaveSkills?: () => void;
    disableSave?: boolean;
};

const FrameworkColumn: React.FC<FrameworkColumnProps> = ({
    nodes: _nodes,
    setSelectedNode,
    frameworkInfo,
    isTopLevel,
    columnNode,
    isNodeInSelectedPath,
    isEdit = false,
    selectedPath = [],
    handleAdd,
    handleEdit,
    handleDelete,
    addedNodes = {},
    editedNodes = {},
    deletedNodes = [],
    maxColumns = 3,
    isFullSkillFramework = false,
    showBackInFooter = false,
    handleBack,
    isApproveFlow = false,
    handleApprove,
    search,
    setSearch,
    setSelectedPath,
    handleDisableEdit,
    setIsEdit,
    openManageJsonModal,
    changesExist,
    searchResults,
    searchLoading,
    onSearchResultItemClick,
    countAdjustments,
    isSelectSkillsFlow,
    selectedSkills,
    handleToggleSkill,
    handleClose,
    handleSaveSkills,
    disableSave,
}) => {
    const { newModal, closeModal } = useModal();
    const { isDesktop, isMobile } = useDeviceTypeByWidth();
    const inputRef = useRef<HTMLIonInputElement>(null);

    const isSingleColumnView = maxColumns === 1;

    const { data } = useGetSkillChildren(frameworkInfo?.id, columnNode?.id);
    const apiNodes = data?.records;

    let nodes =
        apiNodes && !isFullSkillFramework
            ? convertApiSkillNodesToSkillFrameworkNodes(apiNodes)
            : _nodes;

    nodes = nodes
        .filter(node => {
            const isDeleted = deletedNodes.some(deletedNode => deletedNode.id === node.id);
            return !isDeleted;
        })
        .map(node => {
            if (editedNodes[node.id!]) {
                return editedNodes[node.id!];
            }
            return node;
        });

    nodes = nodes.concat(addedNodes[columnNode?.id ?? 'root'] || []);

    // sort nodes by role: tiers first, then skills
    nodes.sort((a, b) => {
        if (a.role === FrameworkNodeRole.competency && b.role === FrameworkNodeRole.tier) return 1;
        if (a.role === FrameworkNodeRole.tier && b.role === FrameworkNodeRole.competency) return -1;
        return 0;
    });

    const handleViewCompetency = (node: SkillFrameworkNode) => {
        newModal(
            <ViewAlignmentInfo
                alignment={node}
                framework={frameworkInfo}
                selectedPath={selectedPath}
            />,
            undefined,
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    };

    const openAddModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        newModal(
            <EditAlignmentModal
                framework={frameworkInfo}
                selectedPath={selectedPath}
                isCreate
                handleAdd={handleAdd}
            />,
            undefined,
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [availableWidth, setAvailableWidth] = useState(0);

    // Measure container width on mount and window resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                // Account for padding and other elements in the container
                const container = containerRef.current.parentElement?.parentElement;
                if (container) {
                    const style = window.getComputedStyle(container);
                    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                    setAvailableWidth(container.clientWidth - padding - 80); // 80px for icons and other elements
                }
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const breadcrumbText = React.useMemo(() => {
        const length = selectedPath.length;
        if (length === 0) return '';

        const lastItem = selectedPath[length - 1].targetName;
        if (length === 1) return lastItem;

        const secondLast = selectedPath[length - 2].targetName;

        // Function to estimate text width
        const getTextWidth = (text: string) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return text.length * 8; // Fallback: ~8px per character
            context.font = '600 14px Poppins';
            return context.measureText(text).width;
        };

        // Start with full text and reduce until it fits
        let truncatedSecondLast = secondLast;
        const lastItemWidth = getTextWidth(lastItem);
        const ellipsisWidth = getTextWidth('... > ');
        let maxSecondLastWidth = availableWidth - lastItemWidth - ellipsisWidth - 20; // 20px buffer

        if (getTextWidth(secondLast) > maxSecondLastWidth) {
            // Binary search for optimal truncation
            let low = 4; // Minimum 4 characters
            let high = secondLast.length;
            let bestLength = 4;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const truncated = secondLast.substring(0, mid) + '...';
                const width = getTextWidth(truncated);

                if (width <= maxSecondLastWidth) {
                    bestLength = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            truncatedSecondLast =
                bestLength < secondLast.length
                    ? secondLast.substring(0, bestLength) + '...'
                    : secondLast;
        }

        const result =
            length > 2
                ? `... > ${truncatedSecondLast} > ${lastItem}`
                : `${truncatedSecondLast} > ${lastItem}`;

        return result;
    }, [selectedPath, availableWidth]);

    const navPathTitle = selectedPath.map(n => n.targetName).join(' > ');
    let countOverride = undefined;
    let countAdjustment = countAdjustments?.[columnNode?.id ?? 'root'] || 0;
    if (isFullSkillFramework) {
        if (columnNode) {
            countOverride = countCompetenciesInNode(columnNode);
        } else {
            countOverride = countCompetenciesInNodes(nodes);
        }
    }

    return (
        <section
            className="h-full flex flex-col z-0 border-[1px] border-grayscale-200 border-solid relative safe-area-inset-top overflow-hidden"
            style={{ width: `${100 / maxColumns}%` }}
        >
            {isSelectSkillsFlow && isSingleColumnView && (
                <div className="flex items-center gap-[10px] px-[20px] pt-[20px] pb-[10px] border-b-[1px] border-grayscale-200 border-solid">
                    <PuzzlePiece
                        version="filled"
                        className="w-[40px] h-[40px] shrink-0 text-grayscale-800"
                    />
                    <span className="text-[22px] font-poppins font-[600] leading-[24px] text-grayscale-900">
                        Add Competencies
                    </span>
                    <span className="ml-auto text-[22px] font-poppins font-[600] leading-[24px] text-grayscale-700">
                        {selectedSkills?.length || 0}
                    </span>
                </div>
            )}

            <div
                className={`px-[15px] flex flex-col gap-[10px] border-b-[1px] border-grayscale-200 border-solid ${
                    isSingleColumnView ? 'py-[10px]' : 'h-[125px] py-[30px]'
                }`}
                role={columnNode ? 'button' : undefined}
                onClick={columnNode ? () => handleViewCompetency(columnNode) : undefined}
            >
                <div className="flex items-center gap-[10px]">
                    {isTopLevel ? (
                        <FrameworkImage
                            image={frameworkInfo?.image}
                            sizeClassName="w-[60px] h-[60px]"
                            iconSizeClassName="w-[28px] h-[28px]"
                        />
                    ) : (
                        <div className="rounded-full bg-grayscale-900 w-[60px] h-[60px] flex items-center justify-center p-[12px] shrink-0">
                            <span className="text-[28px] h-[36px] w-[36px] leading-[36px] font-fluentEmoji cursor-none pointer-events-none select-none">
                                {columnNode?.icon}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col items-start justify-center">
                        <h5 className="text-[17px] text-grayscale-900 font-poppins line-clamp-2 leading-[130%]">
                            {isTopLevel ? frameworkInfo?.name : columnNode?.targetName}
                        </h5>
                        <span className="text-grayscale-800 font-poppins font-[700] text-[12px] flex items-center gap-[2px]">
                            {isTopLevel && 'Framework • '}
                            <FrameworkSkillsCount
                                frameworkId={frameworkInfo?.id}
                                skillId={columnNode?.id}
                                includeSkillWord
                                className="!text-grayscale-800"
                                countOverride={countOverride}
                                countAdjustment={countAdjustment}
                            />
                        </span>
                    </div>

                    {columnNode && (
                        <InfoIcon className="ml-auto w-[24px] h-[24px] text-grayscale-600" />
                    )}

                    {isTopLevel && !isApproveFlow && !isEdit && (
                        <button
                            onClick={() =>
                                newModal(
                                    <FrameworkOptionsModal frameworkInfo={frameworkInfo} />,
                                    undefined,
                                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                                )
                            }
                            className="ml-auto"
                        >
                            <ThreeDots className="w-[24px] h-[24px] text-grayscale-500" />
                        </button>
                    )}
                </div>

                {isSingleColumnView && selectedPath.length > 0 && (
                    <div
                        ref={containerRef}
                        className="py-[5px] flex gap-[5px] items-center w-full overflow-hidden"
                    >
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setSelectedPath([]);
                            }}
                        >
                            <SkillsFrameworkIcon
                                className="!flex-shrink-0 w-[25px] h-[25px] text-grayscale-600"
                                color="currentColor"
                                version="outlined"
                            />
                        </button>
                        <div className="flex items-center gap-[5px] text-grayscale-600 font-poppins font-[600] text-[14px] truncate">
                            {breadcrumbText.split('>').map((part, index, parts) => {
                                const partText = part.trim();
                                if (!partText) return null;

                                const isCurrent = index === parts.length - 1;
                                const isEllipsis = partText === '...';
                                const pathIndex = selectedPath.length - (parts.length - index);

                                // Calculate the navigation target
                                const onClick = () => {
                                    if (isEllipsis) {
                                        // Go back 2 steps, but not beyond the start of the array
                                        const newLength = Math.max(0, selectedPath.length - 2);
                                        setSelectedPath(selectedPath.slice(0, newLength));
                                    } else if (!isCurrent) {
                                        setSelectedPath(selectedPath.slice(0, pathIndex + 1));
                                    }
                                };

                                return (
                                    <div key={index} className="flex items-center">
                                        {index > 0 && <span className="mx-[3px]">›</span>}
                                        {isCurrent ? (
                                            <span
                                                className="font-poppins text-[14px] font-[600]"
                                                title={navPathTitle}
                                            >
                                                {partText}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    onClick();
                                                }}
                                                className="hover:underline font-poppins text-[14px] font-[600]"
                                                title={navPathTitle}
                                            >
                                                {partText}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="h-full flex flex-col gap-[10px] overflow-y-auto p-[15px] pb-[150px] bg-grayscale-10">
                    {isSingleColumnView && (
                        <div className="relative">
                            <IonInput
                                ref={inputRef}
                                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-poppins text-[14px] w-full"
                                placeholder="Search framework..."
                                value={search}
                                onIonInput={e => setSearch(e.detail.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        inputRef.current?.setFocus();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}

                    {search && searchLoading && !isApproveFlow && (
                        <div className="flex items-center justify-center mt-[100px]">
                            <IonSpinner
                                color="dark"
                                name="crescent"
                                className="h-[40px] w-[40px]"
                            />
                        </div>
                    )}
                    {search && (!searchLoading || isApproveFlow) && (
                        <FrameworkSearchResults
                            searchResults={searchResults}
                            frameworkInfo={frameworkInfo}
                            resultTextClassName="!text-[12px]"
                            onClick={onSearchResultItemClick}
                            isSelectSkillsFlow={isSelectSkillsFlow}
                            selectedSkills={selectedSkills}
                            handleToggleSkill={handleToggleSkill}
                        />
                    )}

                    {!search && (
                        <>
                            {nodes.map((node, i) => {
                                return node.role === FrameworkNodeRole.tier ? (
                                    <TierRow
                                        key={i}
                                        node={node}
                                        onClick={() => setSelectedNode(node)}
                                        isNodeInSelectedPath={isNodeInSelectedPath}
                                        isEdit={isEdit}
                                        framework={frameworkInfo}
                                        selectedPath={selectedPath}
                                        handleEdit={handleEdit}
                                        handleDelete={handleDelete}
                                        isFullSkillFramework={isFullSkillFramework}
                                        countAdjustment={countAdjustments?.[node.id ?? '']}
                                    />
                                ) : (
                                    <CompetencyRow
                                        key={i}
                                        node={node}
                                        isEdit={isEdit}
                                        framework={frameworkInfo}
                                        selectedPath={selectedPath}
                                        handleEdit={handleEdit}
                                        handleDelete={handleDelete}
                                        onClick={node => handleViewCompetency(node)}
                                        isSelectSkillsFlow={isSelectSkillsFlow}
                                        selectedSkills={selectedSkills}
                                        handleToggleSkill={handleToggleSkill}
                                        isFullSkillFramework={isFullSkillFramework}
                                        editedNodes={editedNodes}
                                        deletedNodes={deletedNodes}
                                        addedNodes={addedNodes}
                                        onTierClick={tierNode => setSelectedNode(tierNode)}
                                        isNodeInSelectedPath={isNodeInSelectedPath}
                                        countAdjustments={countAdjustments}
                                    />
                                );
                            })}

                            {isEdit && isMobile && (
                                <button
                                    onClick={openAddModal}
                                    className="p-[20px] bg-white rounded-[10px] flex gap-[10px] items-center border-[1px] border-grayscale-200 border-solid"
                                >
                                    <Plus className="w-[25px] h-[25px] text-grayscale-900" />
                                    <span className="text-[17px] text-grayscale-900 font-poppins">
                                        Add tier or competency
                                    </span>
                                </button>
                            )}
                        </>
                    )}
                </div>
                {isEdit && isDesktop && !search && (
                    <div className="sticky bottom-0 left-0 right-0 h-0">
                        <button
                            onClick={openAddModal}
                            className="absolute bottom-[15px] left-0 px-[20px] py-[10px] bg-white rounded-r-[10px] shadow-bottom-3-8 flex gap-[5px] items-center z-10"
                        >
                            <Plus className="w-[25px] h-[25px] text-grayscale-900" />
                            <span className="text-[17px] text-grayscale-700 font-poppins font-[600]">
                                Add tier or competency
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {isSingleColumnView && (
                <IonFooter
                    mode="ios"
                    className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
                >
                    <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                        {showBackInFooter && (
                            <button
                                onClick={handleBack}
                                className="bg-white rounded-full text-grayscale-900 shadow-button-bottom flex items-center justify-center h-[44px] w-[44px] shrink-0"
                            >
                                <SlimCaretLeft className="w-[20px] h-[20px]" />
                            </button>
                        )}
                        {isEdit && (
                            <>
                                {!isApproveFlow && (
                                    <button
                                        onClick={handleDisableEdit}
                                        className="bg-white flex items-center justify-center gap-[5px] rounded-[30px] px-[20px] py-[7px] border-[1px] border-grayscale-200 border-solid shadow-bottom-3-4 font-poppins text-[17px] line-clamp-1 flex-1"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleApprove}
                                    className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-200"
                                    disabled={!changesExist && !isApproveFlow}
                                >
                                    {isApproveFlow ? 'Approve' : 'Save'}
                                </button>
                            </>
                        )}

                        {isSelectSkillsFlow && (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="bg-white flex items-center justify-center gap-[5px] rounded-[30px] px-[20px] py-[7px] border-[1px] border-grayscale-200 border-solid shadow-bottom-3-4 font-poppins text-[17px] line-clamp-1 flex-1"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleSaveSkills}
                                    className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-200"
                                    disabled={disableSave}
                                >
                                    Save
                                </button>
                            </>
                        )}

                        {!isEdit && !isSelectSkillsFlow && (
                            <>
                                <button
                                    onClick={() => setIsEdit?.(true)}
                                    className="py-[7px] px-[25px] flex gap-[5px] items-center justify-center bg-white rounded-[30px] text-grayscale-800 shadow-button-bottom flex-1 font-poppins text-[17px] border-[2px] border-grayscale-200 border-solid"
                                >
                                    <Pencil version={3} className="w-[25px] h-[25px] shrink-0" />
                                    Edit
                                </button>
                                <button
                                    onClick={openManageJsonModal}
                                    className="py-[7px] px-[25px] flex gap-[5px] items-center justify-center bg-white rounded-[30px] text-grayscale-800 shadow-button-bottom flex-1 font-poppins text-[17px] border-[2px] border-grayscale-200 border-solid"
                                >
                                    <CodeIcon
                                        version="with-slash"
                                        className="w-[25px] h-[25px] shrink-0"
                                    />
                                    JSON
                                </button>
                            </>
                        )}

                        {!isSelectSkillsFlow && (
                            <button
                                onClick={handleClose}
                                className="bg-white rounded-full shadow-button-bottom flex items-center justify-center h-[44px] w-[44px] shrink-0"
                            >
                                <X className="w-[20px] h-[20px] text-grayscale-700" />
                            </button>
                        )}
                    </div>
                </IonFooter>
            )}
        </section>
    );
};

export default FrameworkColumn;
