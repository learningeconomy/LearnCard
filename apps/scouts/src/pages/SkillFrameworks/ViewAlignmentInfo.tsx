import React from 'react';
import {
    useModal,
    useGetSkillPath,
    useDeviceTypeByWidth,
    useGetSkillFrameworkById,
    useGetSkill,
} from 'learn-card-base';

import X from '../../components/svgs/X';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import FrameworkImage from './FrameworkImage';
import SkillBreadcrumbText from './SkillBreadcrumbText';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import { IonFooter } from '@ionic/react';

import {
    FrameworkNodeRole,
    SkillFramework,
    SkillFrameworkNode,
} from '../../components/boost/boost';
import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';

type ViewAlignmentInfoProps = {
    alignment?: SkillFrameworkNode;
    framework?: SkillFramework;
    selectedPath?: SkillFrameworkNode[];
    frameworkId?: string;
    skillId?: string;
};

const ViewAlignmentInfo: React.FC<ViewAlignmentInfoProps> = ({
    alignment: _alignment,
    framework,
    selectedPath,
    frameworkId: _frameworkId,
    skillId: _skillId,
}) => {
    const { isDesktop, isMobile } = useDeviceTypeByWidth();
    const { closeModal } = useModal();

    const {
        data: alignmentData,
        isLoading: alignmentLoading,
        isError: alignmentError,
    } = useGetSkill(_frameworkId ?? '', _skillId ?? '');

    const alignment = React.useMemo(() => {
        const fetched = alignmentData
            ? convertApiSkillNodeToSkillTreeNode(alignmentData as ApiSkillNode)
            : undefined;

        const merged = { ...(_alignment ?? {}), ...(fetched ?? {}) } as SkillFrameworkNode;

        // Fallbacks for display
        if (!merged.targetName) {
            merged.targetName = (alignmentData as any)?.statement || _alignment?.targetName || '';
        }
        if (!merged.targetDescription) {
            merged.targetDescription =
                (alignmentData as any)?.description || _alignment?.targetDescription || '';
        }
        if (!merged.icon) {
            merged.icon = (alignmentData as any)?.icon || _alignment?.icon || '';
        }

        return merged;
    }, [_alignment, alignmentData]);

    const frameworkId = _frameworkId ?? alignment?.targetFramework ?? '';
    const skillId = _skillId ?? alignment?.id ?? '';

    const { data: frameworkData } = useGetSkillFrameworkById(frameworkId);
    const {
        data: pathData,
        isLoading: pathLoading,
        isError: pathError,
    } = useGetSkillPath(frameworkId, skillId);

    let _path = selectedPath;
    if (!_path && pathData?.path) {
        _path = (pathData.path as any[]).map(node =>
            node.targetName ? node : convertApiSkillNodeToSkillTreeNode(node)
        );
        _path = [..._path].reverse();
    }

    const frameworkName = framework?.name ?? frameworkData?.framework?.name;
    const frameworkImage = framework?.image ?? frameworkData?.framework?.image;

    const isTier = alignment?.role === FrameworkNodeRole.tier;

    if (alignmentLoading && !alignment.targetName && !alignmentError) {
        return (
            <div className="h-full w-full flex items-center justify-center p-[40px] bg-white rounded-[24px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sp-purple-base"></div>
            </div>
        );
    }

    const content = (
        <div
            onClick={e => e.stopPropagation()}
            className={`flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] ${
                isMobile ? 'h-full' : 'max-w-[450px]'
            }`}
        >
            <div
                className={`h-full relative overflow-hidden ${
                    isMobile ? 'bg-grayscale-200' : 'bg-transparent'
                }`}
            >
                <div
                    className={`h-full overflow-y-auto ${
                        isMobile
                            ? 'pb-[150px] pt-[60px] px-[20px] flex items-center justify-center'
                            : ''
                    }`}
                >
                    <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[450px] mx-auto min-w-[300px]">
                        <div className="flex flex-col gap-[5px] px-[20px] py-[10px] border-b-[1px] border-grayscale-200 border-solid">
                            <div className="flex items-center gap-[10px]">
                                <FrameworkImage
                                    image={frameworkImage}
                                    sizeClassName="w-[40px] h-[40px]"
                                    iconSizeClassName="w-[24px] h-[24px]"
                                />
                                <h5 className="text-[14px] text-grayscale-900 font-poppins font-[600] line-clamp-2">
                                    {frameworkName || 'Loading framework...'}
                                </h5>
                            </div>

                            <SkillBreadcrumbText
                                frameworkId={frameworkId}
                                skillId={skillId}
                                path={_path}
                            />
                        </div>

                        <div className="bg-grayscale-50 flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                            <div
                                className={`${
                                    isTier
                                        ? 'p-[5px] rounded-[10px] bg-grayscale-900 text-grayscale-100'
                                        : ''
                                }`}
                            >
                                <span className="text-[60px] h-[80px] w-[80px] leading-[80px] font-fluentEmoji cursor-none pointer-events-none select-none flex items-center justify-center">
                                    {alignment?.icon || (isTier ? '📂' : '🧩')}
                                </span>
                            </div>

                            <h2 className="text-[20px] text-grayscale-900 font-poppins text-center">
                                {alignment?.targetName || 'Untitled Skill'}
                            </h2>

                            <div
                                className={`px-[10px] py-[2px] flex gap-[3px] items-center rounded-[5px] overflow-hidden ${
                                    isTier ? '' : 'bg-violet-100'
                                }`}
                            >
                                {isTier ? (
                                    <>
                                        <SkillsFrameworkIcon
                                            className="w-[20px] h-[20px] text-grayscale-800"
                                            color="currentColor"
                                            version="outlined"
                                        />
                                        <p className="text-[12px] text-grayscale-800 font-poppins font-[600] uppercase">
                                            Framework Tier
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <PuzzlePiece
                                            className="w-[20px] h-[20px] text-grayscale-800"
                                            version="filled"
                                        />
                                        <p className="text-[12px] text-grayscale-800 font-poppins font-[600] uppercase">
                                            Skill
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {(alignment?.targetDescription || (!isTier && alignment?.targetCode)) && (
                            <div className="flex flex-col gap-[15px] p-[20px]">
                                {!isTier && alignment?.targetCode && (
                                    <div className="flex flex-col gap-[5px] w-full">
                                        <span className="text-grayscale-600 font-poppins text-[12px] font-[600]">
                                            Code
                                        </span>
                                        <p className="text-grayscale-900 font-poppins text-[16px] font-[600] tracking-[-0.25px]">
                                            {alignment?.targetCode}
                                        </p>
                                    </div>
                                )}

                                {alignment?.targetDescription && (
                                    <div className="flex flex-col gap-[5px] w-full">
                                        <span className="text-grayscale-600 font-poppins text-[12px] font-[600]">
                                            Description
                                        </span>
                                        <p className="text-grayscale-700 font-poppins text-[16px] tracking-[-0.25px]">
                                            {alignment?.targetDescription}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
                {isMobile && (
                    <IonFooter
                        mode="ios"
                        className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
                    >
                        <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                            <button
                                onClick={closeModal}
                                className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                            >
                                Close
                            </button>
                        </div>
                    </IonFooter>
                )}
            </div>
        </div>
    );

    return isDesktop ? (
        <div
            role="button"
            onClick={closeModal}
            className="h-full w-full flex items-center justify-center relative"
        >
            <button
                className="absolute top-[20px] right-[20px] bg-white rounded-full p-[12px] shadow-bottom-4-4"
                onClick={closeModal}
            >
                <X className="h-[20px] w-[20px] text-grayscale-800" />
            </button>

            {content}
        </div>
    ) : (
        content
    );
};

export default ViewAlignmentInfo;
