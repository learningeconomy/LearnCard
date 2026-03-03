import { UploadTypesEnum } from 'learn-card-base';

export enum ChecklistEnum {
    uploadResume = 'uploadResume',
    connectLinkedIn = 'connectLinkedIn',
    connectSchool = 'connectSchool',
    uploadCertificates = 'uploadCertificates',
    addSkills = 'addSkills',
    uploadTranscripts = 'uploadTranscripts',
    uploadDiplomas = 'uploadDiplomas',
}

export type ChecklistItem = {
    id: number;
    title: string;
    type: ChecklistEnum;
    uploadType?: UploadTypesEnum;
    isCompleted?: boolean;
};

export const checklistItems: ChecklistItem[] = [
    {
        id: 1,
        title: 'Add Resume',
        type: ChecklistEnum.uploadResume,
        uploadType: UploadTypesEnum.Resume,
    },
    {
        id: 2,
        title: 'Add Certificates',
        type: ChecklistEnum.uploadCertificates,
        uploadType: UploadTypesEnum.Certificate,
    },
    {
        id: 3,
        title: 'Add Skills',
        type: ChecklistEnum.addSkills,
    },
    {
        id: 4,
        title: 'Add Transcript',
        type: ChecklistEnum.uploadTranscripts,
        uploadType: UploadTypesEnum.Transcript,
    },
    {
        id: 5,
        title: 'Add Diploma',
        type: ChecklistEnum.uploadDiplomas,
        uploadType: UploadTypesEnum.Diploma,
    },
    {
        id: 6,
        title: 'Connect LinkedIn',
        type: ChecklistEnum.connectLinkedIn,
    },
    {
        id: 7,
        title: 'Connect School',
        type: ChecklistEnum.connectSchool,
    },
];
