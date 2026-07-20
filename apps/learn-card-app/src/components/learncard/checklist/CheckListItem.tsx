import React from 'react';

import * as m from '../../../paraglide/messages.js';

import { ChecklistEnum, ChecklistItem } from 'learn-card-base';
import SlimCaretRight from '../../svgs/SlimCaretRight';

const CHECKLIST_COPY: Partial<
    Record<ChecklistEnum, { title: () => string; description: () => string }>
> = {
    [ChecklistEnum.uploadResume]: {
        title: m['passport.buildMyLearnCard.steps.addResume'],
        description: m['passport.buildMyLearnCard.steps.resumeDescription'],
    },
    [ChecklistEnum.uploadCertificates]: {
        title: m['passport.buildMyLearnCard.steps.addCertificates'],
        description: m['passport.buildMyLearnCard.steps.certificateDescription'],
    },
    [ChecklistEnum.uploadTranscripts]: {
        title: m['passport.buildMyLearnCard.steps.addTranscript'],
        description: m['passport.buildMyLearnCard.steps.transcriptDescription'],
    },
    [ChecklistEnum.uploadDiplomas]: {
        title: m['passport.buildMyLearnCard.steps.addDiploma'],
        description: m['passport.buildMyLearnCard.steps.diplomaDescription'],
    },
};

type CheckListItemProps = {
    checkListItem: ChecklistItem;
    count?: number;
    onOpen: () => void;
};

export const CheckListItem: React.FC<CheckListItemProps> = ({ checkListItem, count, onOpen }) => {
    const translatedCopy = CHECKLIST_COPY[checkListItem.type];
    const title = translatedCopy?.title() ?? checkListItem.title;
    const description = translatedCopy?.description() ?? checkListItem.description;

    return (
        <li className="w-full">
            <button
                type="button"
                onClick={onOpen}
                aria-label={`${title}. ${description}`}
                className="w-full py-4 text-left transition-opacity hover:opacity-80"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-grayscale-900 leading-relaxed">
                            {title}
                        </p>
                        <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                            {description}
                        </p>
                    </div>
                    <div className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                        {count ? (
                            <>
                                <span>{count}</span>{' '}
                            </>
                        ) : null}
                        <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
                    </div>
                </div>
            </button>
        </li>
    );
};

export default CheckListItem;
