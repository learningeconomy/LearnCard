import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useTranslation, Trans } from 'react-i18next';

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
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

type CheckListButtonMode = 'default' | 'inline';

export const CheckListButton: React.FC<{ className?: string; mode?: CheckListButtonMode }> = ({
    className = '',
    mode = 'default',
}) => {
    const { t } = useTranslation();
    const flags = useFlags();
    const { newModal } = useModal();
    const { completedItems } = useGetCheckListStatus();
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
    const optimizedPercent =
        checklistItems.length > 0 ? Math.round((completedItems / checklistItems.length) * 100) : 0;

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

    const progressBarFill = primaryColor ? `bg-${primaryColor}` : 'bg-emerald-600';

    if (mode === 'inline') {
        return (
            <div
                role="button"
                onClick={handleCheckListButton}
                className={`w-full h-[150px] max-h-[150px] rounded-[28px] p-4 flex flex-col justify-center shadow-[0_8px_20px_rgba(15,23,42,0.12)] overflow-hidden ${className}`}
                style={featuredCardBgColor ? { backgroundColor: featuredCardBgColor } : { backgroundColor: 'white' }}
            >
                <div className="flex justify-center mb-3">
                    <div
                        className={`rounded-[14px] p-[8px] ${
                            isParsing ? `bg-${primaryColor}` : featuredCardBgColor ? 'bg-transparent' : 'bg-white'
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

                <h5 className={`text-[17px] leading-[130%] font-poppins font-[600] text-center ${featuredCardTextColor ?? 'text-grayscale-900'}`}>
                    {t('passport.buildMyLearnCard.title', 'Build My {{brand}}', { brand: brandingConfig.name })}
                </h5>

                {isParsing ? (
                    <p className={`mt-2 text-[13px] leading-[130%] font-poppins text-center ${featuredCardTextColor ? 'text-white/70' : 'text-grayscale-700'}`}>
                        {t('passport.buildMyLearnCard.processing', 'Processing documents…')}
                    </p>
                ) : hasPendingReview ? (
                    <p className="mt-2 text-[13px] leading-[130%] text-amber-600 font-poppins font-semibold text-center">
                        {t('passport.buildMyLearnCard.pendingReview', '{{count}} credential(s) ready for review', { count: pendingReviewCount })}
                    </p>
                ) : (
                    <div className="mt-3">
                        <div className={`w-full h-[10px] rounded-full overflow-hidden ${featuredCardTextColor ? 'bg-white/20' : 'bg-grayscale-200'}`}>
                            <div
                                className={`h-full rounded-full ${progressBarFill}`}
                                style={{ width: `${Math.max(optimizedPercent, 2)}%` }}
                            />
                        </div>
                        <p className={`mt-2 text-xs leading-[130%] font-poppins text-center ${featuredCardTextColor ? 'text-white/70' : 'text-grayscale-600'}`}>
                            {t('passport.buildMyLearnCard.progress', '{{percent}}% optimized', { percent: optimizedPercent })}
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
            className={`w-full flex items-center justify-between max-w-[900px] rounded-[15px] p-[10px] shadow-[0_8px_20px_rgba(15,23,42,0.12)] ${className}`}
            style={featuredCardBgColor ? { backgroundColor: featuredCardBgColor } : { backgroundColor: 'white' }}
        >
            <div className="flex items-center gap-[10px]">
                <div
                    className={`rounded-[10px] p-[5px] ${
                        isParsing ? `bg-${primaryColor}` : featuredCardBgColor ? 'bg-transparent' : 'bg-white'
                    }`}
                >
                    {isParsing ? (
                        <CustomSpinner className="w-[30px] h-[30px] text-white" />
                    ) : (
                        <img src={buildMyLCIcon} className="w-[30px] h-[30px]" alt="blocks" />
                    )}
                </div>
                <div className="flex flex-col">
                    <h5 className={`text-[17px] font-poppins font-[600] leading-[130%] ${featuredCardTextColor ?? 'text-grayscale-900'}`}>
                        {t('passport.buildMyLearnCard.title', 'Build My {{brand}}', { brand: brandingConfig.name })}
                    </h5>
                    {isParsing ? (
                        <p className={`text-[14px] font-poppins ${featuredCardTextColor ?? 'text-grayscale-900'}`}>
                            {t('passport.buildMyLearnCard.processing', 'Processing documents…')}
                        </p>
                    ) : hasPendingReview ? (
                        <p className="text-[14px] text-amber-600 font-poppins font-semibold">
                            {t('passport.buildMyLearnCard.pendingReview', '{{count}} credential(s) ready for review', { count: pendingReviewCount })}
                        </p>
                    ) : (
                        <p className={`text-[14px] font-poppins ${featuredCardTextColor ?? 'text-grayscale-900'}`}>
                            <Trans
                                i18nKey="passport.buildMyLearnCard.stepsCompleted"
                                values={{ completed: completedItems, total: checklistItems.length }}
                                defaults="<0>{{completed}}</0> of <1>{{total}}</1> Steps Completed"
                                components={[<span className="font-semibold" key="completed" />, <span className="font-semibold" key="total" />]}
                            />
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
