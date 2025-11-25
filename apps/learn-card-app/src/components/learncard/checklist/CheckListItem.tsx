import React, { useEffect } from 'react';

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

    const handleCheckListItemClick = () => {
        newModal(
            <CheckListManagerContainer checkListItem={checkListItem} />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    let text = checkListItem?.title;
    let icon = <span />;
    let styles = `bg-emerald-50 border-emerald-700 border-solid border-[1px]`;

    const processingStyles = `bg-${primaryShade} border-${primaryColor} border-solid border-[1px]`;
    const processingIcon = <CustomSpinner className="w-[20px] h-[20px] text-white" />;

    if (checkListItem?.isCompleted) {
        icon = <Checkmark className="text-white h-[20px] w-[20px]" />;
        styles = 'bg-emerald-700';
    } else if (checkListItem?.type === ChecklistEnum.uploadResume && isParsingResume) {
        text = 'Processing Resume...';
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadCertificates && isParsingCertificate) {
        text = 'Processing Certificate...';
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadTranscripts && isParsingTranscript) {
        text = 'Processing Transcript...';
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadDiplomas && isParsingDiploma) {
        text = 'Processing Diploma...';
        styles = processingStyles;
        icon = processingIcon;
    } else if (checkListItem?.type === ChecklistEnum.uploadRawVC && isParsingRawVC) {
        text = 'Processing Raw VC...';
        styles = processingStyles;
        icon = processingIcon;
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
