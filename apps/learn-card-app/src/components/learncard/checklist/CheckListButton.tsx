import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import BlocksIcon from 'learn-card-base/svgs/Blocks';
import CustomSpinner from '../../svgs/CustomSpinner';
import SlimCaretRight from '../../svgs/SlimCaretRight';
import CheckListContainer from '../checklist/CheckListContainer';
import useLCNGatedAction from '../../network-prompts/hooks/useLCNGatedAction';

import { useTheme } from '../../../theme/hooks/useTheme';

import {
    useModal,
    ModalTypes,
    useGetCheckListStatus,
    checklistStore,
    checklistItems,
} from 'learn-card-base';

export const CheckListButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    const flags = useFlags();
    const { newModal } = useModal();
    const { completedItems } = useGetCheckListStatus();
    const { gate } = useLCNGatedAction();

    const { theme, colors } = useTheme();
    const { buildMyLCIcon } = theme.defaults;
    const primaryColor = colors?.defaults?.primaryColor;

    const { resume, certificate, transcript, diploma, rawVC } =
        checklistStore.useTracked.isParsing();
    const isParsing = resume || certificate || transcript || diploma || rawVC;

    const handleCheckListButton = async () => {
        const { prompted } = await gate();
        if (prompted) return;
        newModal(
            <CheckListContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    if (!flags?.enableOnboardingChecklist) return null;

    return (
        <div
            role="button"
            onClick={handleCheckListButton}
            className={`w-full flex items-center justify-between max-w-[900px] bg-grayscale-100 rounded-[15px] p-[10px] ${className}`}
        >
            <div className="flex items-center gap-[10px]">
                <div
                    className={`rounded-[10px] p-[5px] ${
                        isParsing ? `bg-${primaryColor}` : 'bg-white '
                    }`}
                >
                    {isParsing ? (
                        <CustomSpinner className="w-[30px] h-[30px] text-white" />
                    ) : (
                        <img src={buildMyLCIcon} className="w-[30px] h-[30px]" alt="blocks" />
                    )}
                </div>
                <div className="flex flex-col">
                    <h5 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[130%]">
                        Build My LearnCard
                    </h5>
                    {isParsing ? (
                        <p className="text-[14px] text-grayscale-900 font-poppins">
                            Processing documents...
                        </p>
                    ) : (
                        <p className="text-[14px] text-grayscale-900 font-poppins">
                            <span className="font-semibold">{completedItems}</span> of{' '}
                            <span className="font-semibold">{checklistItems.length}</span> Steps
                            Completed
                        </p>
                    )}
                </div>
            </div>
            <button className="cursor-pointer">
                <SlimCaretRight className="w-[20px] h-[20px] text-grayscale-400" />
            </button>
        </div>
    );
};

export default CheckListButton;
