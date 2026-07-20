import React, { useEffect } from 'react';

import * as m from '../../../paraglide/messages.js';

import CustomSpinner from '../../svgs/CustomSpinner';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import SlimCaretRight from '../../svgs/SlimCaretRight';
import CheckListManagerContainer from './CheckListManager/CheckListManagerContainer';

import {
    ModalTypes,
    useModal,
    checklistStore,
    ChecklistItem,
    ChecklistEnum,
} from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

// Translation keys for checklist item titles. The titles originate as static
// English in learn-card-base (`checklistItems`), which has no Paraglide access,
// so we translate at the app render layer keyed by the item's ChecklistEnum
// type. Types without a key (e.g. addSkills, connectSchool) fall back to the
// base title.
const CHECKLIST_TITLE_KEYS: Partial<Record<ChecklistEnum, string>> = {
    [ChecklistEnum.uploadResume]: 'passport.buildMyLearnCard.steps.addResume',
    [ChecklistEnum.uploadCertificates]: 'passport.buildMyLearnCard.steps.addCertificates',
    [ChecklistEnum.uploadTranscripts]: 'passport.buildMyLearnCard.steps.addTranscript',
    [ChecklistEnum.uploadDiplomas]: 'passport.buildMyLearnCard.steps.addDiploma',
};

export const CheckListItem: React.FC<{
    checkListItem: ChecklistItem;
    activeChecklistStep?: ChecklistEnum;
}> = ({ checkListItem, activeChecklistStep }) => {
    const { newModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const primaryShade = colors?.defaults?.primaryColorShade;

    useEffect(() => {
        if (
            checkListItem?.type === ChecklistEnum.uploadRawVC &&
            activeChecklistStep === ChecklistEnum.uploadRawVC
        ) {
            handleCheckListItemClick();
        }
    }, []);

    const {
        resume: isParsingResume,
        certificate: isParsingCertificate,
        transcript: isParsingTranscript,
        diploma: isParsingDiploma,
        rawVC: isParsingRawVC,
    } = checklistStore.useTracked.isParsing();

    const { resume: pendingResumeReview, transcript: pendingTranscriptReview } =
        checklistStore.useTracked.pendingReview();

    const handleCheckListItemClick = () => {
        newModal(
            <CheckListManagerContainer checkListItem={checkListItem} />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const titleKey = checkListItem?.type ? CHECKLIST_TITLE_KEYS[checkListItem.type] : undefined;
    const titleMessage = titleKey ? (m as Record<string, unknown>)[titleKey] : undefined;
    let text =
        typeof titleMessage === 'function'
            ? (titleMessage as () => string)()
            : checkListItem?.title;
    let icon = <span />;
    let styles = `bg-emerald-50 border-emerald-700 border-solid border-[1px]`;

    const processingStyles = `bg-${primaryShade} border-${primaryColor} border-solid border-[1px]`;
    const processingIcon = <CustomSpinner className="w-[20px] h-[20px] text-white" />;

    if (checkListItem?.isCompleted) {
        icon = <Checkmark className="text-white h-[20px] w-[20px]" />;
        styles = 'bg-emerald-700';
    } else if (checkListItem?.type === ChecklistEnum.uploadResume && isParsingResume) {
        text = m['passport.buildMyLearnCard.steps.processingResume']();
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadCertificates && isParsingCertificate) {
        text = m['passport.buildMyLearnCard.steps.processingCertificate']();
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadTranscripts && isParsingTranscript) {
        text = m['passport.buildMyLearnCard.steps.processingTranscript']();
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadDiplomas && isParsingDiploma) {
        text = m['passport.buildMyLearnCard.steps.processingDiploma']();
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadRawVC && isParsingRawVC) {
        text = m['passport.buildMyLearnCard.steps.processingRawVC']();
        styles = processingStyles;
        icon = processingIcon;
    } else if (
        checkListItem?.type === ChecklistEnum.uploadResume &&
        pendingResumeReview &&
        pendingResumeReview.credentials.length > 0
    ) {
        text = m['passport.buildMyLearnCard.steps.reviewResume']();
        styles = 'bg-amber-500';
        icon = (
            <span className="text-white text-[11px] font-bold">
                {pendingResumeReview.credentials.length}
            </span>
        );
    } else if (
        checkListItem?.type === ChecklistEnum.uploadTranscripts &&
        pendingTranscriptReview &&
        pendingTranscriptReview.credentials.length > 0
    ) {
        text = m['passport.buildMyLearnCard.steps.reviewTranscripts']();
        styles = 'bg-amber-500';
        icon = (
            <span className="text-white text-[11px] font-bold">
                {pendingTranscriptReview.credentials.length}
            </span>
        );
    }

    return (
        <li
            role="button"
            onClick={handleCheckListItemClick}
            className="w-full flex items-center justify-between py-[15px]"
        >
            <div className="flex items-center gap-[10px]">
                <div
                    className={`${styles} rounded-full h-[30px] w-[30px] min-h-[30px] min-w-[30px] flex items-center justify-center`}
                >
                    {icon}
                </div>

                <p
                    className={`${
                        checkListItem?.isCompleted ? 'text-grayscale-500' : 'text-grayscale-900'
                    } text-[17px] font-notoSans font-[600] leading-[24px] tracking-[0.25px] pr-2`}
                >
                    {text}
                </p>
            </div>

            <div>
                <SlimCaretRight className="w-[25px] h-[26px] text-grayscale-500" />
            </div>
        </li>
    );
};

export default CheckListItem;
