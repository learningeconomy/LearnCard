import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

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

type CheckListButtonMode = 'default' | 'inline';

export const CheckListButton: React.FC<{ className?: string; mode?: CheckListButtonMode }> = ({
    className = '',
    mode = 'default',
}) => {
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
    const optimizedPercent =
        checklistItems.length > 0 ? Math.round((completedItems / checklistItems.length) * 100) : 0;

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

    if (mode === 'inline') {
        return (
            <div
                role="button"
                onClick={handleCheckListButton}
                className={`w-full h-[150px] max-h-[150px] bg-grayscale-100 rounded-[28px] p-4 flex flex-col justify-center shadow-[0_8px_20px_rgba(15,23,42,0.12)] overflow-hidden ${className}`}
            >
                <div className="flex justify-center mb-3">
                    <div
                        className={`rounded-[14px] p-[8px] ${
                            isParsing ? `bg-${primaryColor}` : 'bg-white'
                        }`}
                    >
                        {isParsing ? (
                            <CustomSpinner className="w-[34px] h-[34px] text-white" />
                        ) : (
                            <img
                                src={buildMyLCIcon}
                                className="w-[34px] h-[34px]"
                                alt="Build LearnCard"
                            />
                        )}
                    </div>
                </div>

                <h5 className="text-[17px] leading-[130%] font-poppins font-[600] text-grayscale-900 text-center">
                    Build My LearnCard
                </h5>

                {isParsing ? (
                    <p className="mt-2 text-[13px] leading-[130%] text-grayscale-700 font-poppins text-center">
                        Processing documents...
                    </p>
                ) : (
                    <div className="mt-3">
                        <div className="w-full h-[10px] rounded-full bg-grayscale-200 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[#F59E0B]"
                                style={{ width: `${optimizedPercent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-[13px] leading-[130%] text-grayscale-700 font-poppins">
                            {optimizedPercent}% optimized
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            role="button"
            onClick={handleCheckListButton}
            className={`w-full flex items-center justify-between max-w-[900px] bg-grayscale-100 rounded-[15px] p-[10px] shadow-[0_8px_20px_rgba(15,23,42,0.12)] ${className}`}
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
