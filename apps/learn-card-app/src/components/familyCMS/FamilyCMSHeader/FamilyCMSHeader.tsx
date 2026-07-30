import React from 'react';

import { IonHeader, IonRow, IonToolbar } from '@ionic/react';
import { FamilyCMSEditorModeEnum } from '../familyCMSState';

import FamilyIcon from 'learn-card-base/svgs/FamilyIcon';
import { m } from '../../../paraglide/messages.js';

export const FamilyCMSHeader: React.FC<{ editorMode?: FamilyCMSEditorModeEnum }> = ({
    editorMode,
}) => {
    return (
        <IonHeader className="bg-white">
            <IonRow className="w-full flex items-center justify-center">
                <div className="w-full flex flex-col items-start justify-center max-w-[600px] ion-padding">
                    <h2 className="flex items-center justify-center font-normal text-[22px] font-poppins text-grayscale-900">
                        <FamilyIcon className="max-w-[40px] max-h-[40px] h-[40px] w-[40px] shrink-1 mr-2 text-grayscale-900" />
                        <span className="font-semibold text-grayscale-900 m-0 p-0 ml-1 mt-[2px]">
                            {editorMode === FamilyCMSEditorModeEnum.create
                                ? m['family.editor.headingNew']()
                                : m['family.editor.headingEdit']()}
                        </span>
                    </h2>
                </div>
            </IonRow>
        </IonHeader>
    );
};

export default FamilyCMSHeader;
