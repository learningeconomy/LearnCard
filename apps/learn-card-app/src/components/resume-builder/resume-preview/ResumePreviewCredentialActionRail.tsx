import React from 'react';

import { AppReorder } from 'learn-card-base/ui/reorder';
import TrashBin from '../../svgs/TrashBin';
import VerticalArrowsIcon from '../../svgs/VerticalArrowsIcon';

import * as m from '../../../paraglide/messages.js';

type ResumePreviewCredentialActionRailProps = {
    onDelete: () => void;
};

const ResumePreviewCredentialActionRail: React.FC<ResumePreviewCredentialActionRailProps> = ({
    onDelete,
}) => {
    return (
        <div className="shrink-0 rounded-[10px] bg-grayscale-100 px-1 py-2 flex flex-col items-center gap-2">
            <button
                onClick={onDelete}
                className="leading-none"
                title={m['passport.resumeBuilder.deselectCredential']()}
                aria-label={m['passport.resumeBuilder.deselectCredential']()}
            >
                <TrashBin className="h-[20px] w-[20px] text-grayscale-700" version="2" />
            </button>
            <AppReorder>
                <VerticalArrowsIcon className="h-[20px] w-[20px] text-grayscale-700" />
            </AppReorder>
        </div>
    );
};

export default ResumePreviewCredentialActionRail;
