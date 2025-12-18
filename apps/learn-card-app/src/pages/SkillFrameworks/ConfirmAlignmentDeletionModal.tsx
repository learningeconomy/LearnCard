import React from 'react';

import { useModal, useCountSkillsInFramework, conditionalPluralize } from 'learn-card-base';

import TierIcon from './TierIcon';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import CompetencyIcon from './CompetencyIcon';
import FrameworkSkillsCount from './FrameworkSkillsCount';

import { FrameworkNodeRole, SkillFrameworkNode } from '../../components/boost/boost';

type ConfirmAlignmentDeletionModalProps = {
    frameworkId: string;
    node: SkillFrameworkNode;
    countOverride?: number;
    countAdjustment?: number;
    onDelete: (numberOfSkillsDeleted: number) => void;
};

const ConfirmAlignmentDeletionModal: React.FC<ConfirmAlignmentDeletionModalProps> = ({
    frameworkId,
    node,
    countOverride,
    countAdjustment = 0,
    onDelete,
}) => {
    const { closeModal } = useModal();

    const { data } = useCountSkillsInFramework(frameworkId, node.id, {
        onlyCountCompetencies: true,
    });
    const _count = data?.count;

    const count = (countOverride ?? _count ?? 0) + countAdjustment;

    const isTier = node.role === FrameworkNodeRole.tier;

    return (
        <div className="flex flex-col gap-[10px] bg-transparent max-w-[450px] mx-auto">
            <div className="bg-rose-50 rounded-[15px] p-[20px] flex items-center gap-[10px]">
                {isTier ? <TierIcon icon={node.icon} /> : <CompetencyIcon icon={node.icon} />}
                <div className="flex flex-col">
                    <p className="font-poppins text-[17px] text-grayscale-900 leading-[130%f] line-clamp-2">
                        {node.targetName}
                    </p>
                    {isTier && (
                        <FrameworkSkillsCount
                            frameworkId={frameworkId}
                            skillId={node.id}
                            includeSkillWord
                            textClassName="text-[12px] font-[700] text-grayscale-800"
                            iconClassName="w-[20px] h-[20px] text-grayscale-800"
                            countOverride={countOverride}
                            countAdjustment={countAdjustment}
                        />
                    )}
                </div>
            </div>
            <div className="bg-white text-grayscale-900 rounded-[15px] p-[20px] flex flex-col gap-[20px]">
                {isTier ? (
                    <p className="font-poppins text-[22px] text-grayscale-900 text-center">
                        Please confirm deletion of this framework tier and everything inside it
                        including{' '}
                        <span className="font-[600]">{conditionalPluralize(count, 'skill')}.</span>
                    </p>
                ) : (
                    <p className="font-poppins text-[22px] text-grayscale-900 text-center">
                        Please confirm deletion of this skill.
                    </p>
                )}
                <button
                    onClick={() => {
                        closeModal();
                        onDelete(isTier ? count : 1);
                    }}
                    className="bg-rose-600 py-[10px] pl-[20px] pr-[15px] rounded-[30px] flex gap-[10px] items-center justify-center shadow-bottom-3-4 font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white"
                >
                    <TrashBin className="w-[24px] h-[24px]" version="thin" />
                    Delete
                </button>
            </div>
        </div>
    );
};

export default ConfirmAlignmentDeletionModal;
