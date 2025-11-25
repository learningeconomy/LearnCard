import React from 'react';

import CheckListManagerHeader from './CheckListManagerHeader';
import CheckListCerts from '../checklist-steps/CheckListCerts';
import CheckListDiplomas from '../checklist-steps/CheckListDiplomas';
import CheckListTranscripts from '../checklist-steps/CheckListTranscripts';
import CheckListUploadRawVC from '../checklist-steps/CheckListUploadRawVC';
import CheckListUploadResume from '../checklist-steps/CheckListUploadResume';
import CheckListSchoolConnect from '../checklist-steps/CheckListSchoolConnect';
import CheckListLinkedInConnect from '../checklist-steps/CheckListLinkedInConnect';
import CheckListSelfAttestedSkills from '../checklist-steps/CheckListSelfAttestedSkills';

import { ChecklistEnum, ChecklistItem } from 'learn-card-base';

export const CheckListManagerContainer: React.FC<{ checkListItem: ChecklistItem }> = ({
    checkListItem,
}) => {
    let checkListStep = null;

    switch (checkListItem.type) {
        case ChecklistEnum.uploadResume:
            checkListStep = <CheckListUploadResume />;
            break;
        case ChecklistEnum.connectLinkedIn:
            checkListStep = <CheckListLinkedInConnect />;
            break;
        case ChecklistEnum.connectSchool:
            checkListStep = <CheckListSchoolConnect />;
            break;
        case ChecklistEnum.uploadCertificates:
            checkListStep = <CheckListCerts />;
            break;
        case ChecklistEnum.addSkills:
            checkListStep = <CheckListSelfAttestedSkills />;
            break;
        case ChecklistEnum.uploadTranscripts:
            checkListStep = <CheckListTranscripts />;
            break;
        case ChecklistEnum.uploadDiplomas:
            checkListStep = <CheckListDiplomas />;
            break;
        case ChecklistEnum.uploadRawVC:
            checkListStep = <CheckListUploadRawVC />;
            break;
        default:
            checkListStep = null;
            break;
    }

    return (
        <div className="h-full relative bg-grayscale-100">
            <CheckListManagerHeader />
            <section className="h-full bg-grayscale-100 ion-padding overflow-y-scroll pb-[200px]">
                {checkListStep}
            </section>
        </div>
    );
};

export default CheckListManagerContainer;
