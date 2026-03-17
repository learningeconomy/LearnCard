import React from 'react';

import { IonReorder } from '@ionic/react';

import TrashBin from '../../svgs/TrashBin';
import VerticalArrowsIcon from '../../svgs/VerticalArrowsIcon';

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
                title="Deselect credential"
                aria-label="Deselect credential"
            >
                <TrashBin className="h-[20px] w-[20px] text-grayscale-700" version="2" />
            </button>
            <IonReorder>
                <VerticalArrowsIcon className="h-[20px] w-[20px] text-grayscale-700" />
            </IonReorder>
        </div>
    );
};

export default ResumePreviewCredentialActionRail;
