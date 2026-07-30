import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import * as m from '../../../paraglide/messages.js';

import CustomSpinner from '../../svgs/CustomSpinner';
import SlimCaretRight from '../../svgs/SlimCaretRight';
import CheckListContainer from '../checklist/CheckListContainer';
import useLCNGatedAction from '../../network-prompts/hooks/useLCNGatedAction';

import { useTheme } from '../../../theme/hooks/useTheme';

import { useModal, ModalTypes, checklistStore } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

type CheckListButtonMode = 'default' | 'inline' | 'sidemenu';

export const CheckListButton: React.FC<{ className?: string; mode?: CheckListButtonMode }> = ({
    className = '',
    mode = 'default',
}) => {
    const flags = useFlags();
    const { newModal } = useModal();
    const { gate } = useLCNGatedAction();
    const brandingConfig = useBrandingConfig();

    const { theme, colors } = useTheme();
    const { buildMyLCIcon } = theme.defaults;
    const primaryColor = colors?.defaults?.primaryColor;
    const featuredCardBgColor = colors?.defaults?.featuredCardBgColor;
    const featuredCardTextColor = colors?.defaults?.featuredCardTextColor;

    const { resume, certificate, transcript, diploma, rawVC } =
        checklistStore.useTracked.isParsing();
    const isParsing = resume || certificate || transcript || diploma || rawVC;

    const { resume: pendingResume, transcript: pendingTranscript } =
        checklistStore.useTracked.pendingReview();
    const pendingReviewCount =
        (pendingResume?.credentials?.length ?? 0) + (pendingTranscript?.credentials?.length ?? 0);
    const hasPendingReview = pendingReviewCount > 0;

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

    const helperCopy = m['passport.buildMyLearnCard.helper']();

    if (mode === 'sidemenu') {
        // Theme color family (e.g. `indigo` / `blue`) drives the card tint per the LC-1921
        // colorful/neutral Side Nav variants. Strip only the trailing shade so multi-word
        // families survive (e.g. `baltic-blue-500` → `baltic-blue`, not `baltic`).
        const family = primaryColor?.replace(/-\d+$/, '') || 'indigo';

        return (
            <div
                role="button"
                onClick={handleCheckListButton}
                className={`flex items-center gap-[10px] rounded-[15px] border-[3px] border-solid border-white p-[10px] shadow-[0_2px_1.5px_rgba(0,0,0,0.25)] bg-${family}-50 ${className}`}
            >
                <div className="shrink-0 w-[40px] h-[40px] rounded-[10px] overflow-hidden flex items-center justify-center">
                    {isParsing ? (
                        <CustomSpinner className={`w-[30px] h-[30px] text-${primaryColor}`} />
                    ) : (
                        <img
                            src={buildMyLCIcon}
                            className="w-[40px] h-[40px] object-contain"
                            alt="blocks"
                        />
                    )}
                </div>
                <div className="flex flex-col gap-[5px] flex-1 min-w-0">
                    <div className="flex flex-col">
                        <span className="text-[15px] font-poppins text-grayscale-900 leading-[normal] text-left">
                            {m['passport.buildMyLearnCard.title']({ brand: brandingConfig.name })}
                        </span>
                        <span className="text-[11px] font-poppins font-medium text-grayscale-600 leading-[normal]">
                            {isParsing
                                ? m['passport.buildMyLearnCard.processing']()
                                : hasPendingReview
                                ? m['passport.buildMyLearnCard.pendingReview']({
                                      count: pendingReviewCount,
                                  })
                                : helperCopy}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'inline') {
        return (
            <div
                role="button"
                onClick={handleCheckListButton}
                className={`w-full h-[150px] max-h-[150px] rounded-[28px] p-4 flex flex-col justify-center shadow-[0_8px_20px_rgba(15,23,42,0.12)] overflow-hidden ${className}`}
                style={
                    featuredCardBgColor
                        ? { backgroundColor: featuredCardBgColor }
                        : { backgroundColor: 'white' }
                }
            >
                <div className="flex justify-center mb-3">
                    <div
                        className={`rounded-[14px] p-[8px] ${
                            isParsing
                                ? `bg-${primaryColor}`
                                : featuredCardBgColor
                                ? 'bg-transparent'
                                : 'bg-white'
                        }`}
                    >
                        {isParsing ? (
                            <CustomSpinner className="w-[34px] h-[34px] text-white" />
                        ) : (
                            <img
                                src={buildMyLCIcon}
                                className="w-[36px] h-[36px]"
                                alt="Build LearnCard"
                            />
                        )}
                    </div>
                </div>

                <h5
                    className={`text-[17px] leading-[130%] font-poppins font-[600] text-left ${
                        featuredCardTextColor ?? 'text-grayscale-900'
                    }`}
                >
                    {m['passport.buildMyLearnCard.title']({ brand: brandingConfig.name })}
                </h5>

                {isParsing ? (
                    <p
                        className={`mt-2 text-[13px] leading-[130%] font-poppins text-center ${
                            featuredCardTextColor ? 'text-white/70' : 'text-grayscale-700'
                        }`}
                    >
                        {m['passport.buildMyLearnCard.processing']()}
                    </p>
                ) : hasPendingReview ? (
                    <p className="mt-2 text-[13px] leading-[130%] text-amber-600 font-poppins font-semibold text-center">
                        {m['passport.buildMyLearnCard.pendingReview']({
                            count: pendingReviewCount,
                        })}
                    </p>
                ) : (
                    <p
                        className={`mt-2 text-[13px] leading-[130%] font-poppins text-center ${
                            featuredCardTextColor ? 'text-white/70' : 'text-grayscale-700'
                        }`}
                    >
                        {helperCopy}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div
            role="button"
            onClick={handleCheckListButton}
            className={`w-full flex items-center justify-between max-w-[900px] rounded-[15px] p-[10px] shadow-[0_8px_20px_rgba(15,23,42,0.12)] ${className}`}
            style={
                featuredCardBgColor
                    ? { backgroundColor: featuredCardBgColor }
                    : { backgroundColor: 'white' }
            }
        >
            <div className="flex items-center gap-[10px]">
                <div
                    className={`rounded-[10px] p-[5px] ${
                        isParsing
                            ? `bg-${primaryColor}`
                            : featuredCardBgColor
                            ? 'bg-transparent'
                            : 'bg-white'
                    }`}
                >
                    {isParsing ? (
                        <CustomSpinner className="w-[30px] h-[30px] text-white" />
                    ) : (
                        <img src={buildMyLCIcon} className="w-[30px] h-[30px]" alt="blocks" />
                    )}
                </div>
                <div className="flex flex-col">
                    <h5
                        className={`text-[17px] font-poppins font-[600] leading-[130%] text-left ${
                            featuredCardTextColor ?? 'text-grayscale-900'
                        }`}
                    >
                        {m['passport.buildMyLearnCard.title']({ brand: brandingConfig.name })}
                    </h5>
                    {isParsing ? (
                        <p
                            className={`text-[14px] font-poppins ${
                                featuredCardTextColor ?? 'text-grayscale-900'
                            }`}
                        >
                            {m['passport.buildMyLearnCard.processing']()}
                        </p>
                    ) : hasPendingReview ? (
                        <p className="text-[14px] text-amber-600 font-poppins font-semibold">
                            {m['passport.buildMyLearnCard.pendingReview']({
                                count: pendingReviewCount,
                            })}
                        </p>
                    ) : (
                        <p
                            className={`text-[14px] font-poppins ${
                                featuredCardTextColor ?? 'text-grayscale-900'
                            }`}
                        >
                            {helperCopy}
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
