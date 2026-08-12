import { UploadTypesEnum, useGetChecklistCredentialCounts } from '../react-query/queries/checklist';

export enum ChecklistEnum {
    uploadResume = 'uploadResume',
    connectLinkedIn = 'connectLinkedIn',
    connectSchool = 'connectSchool',
    uploadCertificates = 'uploadCertificates',
    addSkills = 'addSkills',
    uploadTranscripts = 'uploadTranscripts',
    uploadDiplomas = 'uploadDiplomas',
    uploadRawVC = 'uploadRawVC',
}

export type ChecklistItem = {
    id: number;
    title: string;
    description: string;
    type: ChecklistEnum;
    uploadType?: UploadTypesEnum | string;
    isCompleted?: boolean;
};

export const checklistItems: ChecklistItem[] = [
    {
        id: 1,
        title: 'Add Resume',
        description: 'Best for work history, roles, and dates.',
        type: ChecklistEnum.uploadResume,
        uploadType: UploadTypesEnum.Resume,
    },
    {
        id: 2,
        title: 'Add Certificate',
        description: 'Best for training, courses, and earned credentials.',
        type: ChecklistEnum.uploadCertificates,
        uploadType: UploadTypesEnum.Certificate,
    },
    // {
    //     id: 3,
    //     title: 'Add Skills',
    //     description: 'Best for self-attested skills and interests.',
    //     type: ChecklistEnum.addSkills,
    // },
    {
        id: 4,
        title: 'Add Transcript',
        description: 'Best for verified education history and coursework.',
        type: ChecklistEnum.uploadTranscripts,
        uploadType: UploadTypesEnum.Transcript,
    },
    {
        id: 5,
        title: 'Add Diploma',
        description: 'Best for confirming degree completion and graduation.',
        type: ChecklistEnum.uploadDiplomas,
        uploadType: UploadTypesEnum.Diploma,
    },
    // {
    //     id: 6,
    //     title: 'Connect LinkedIn',
    //     description: 'Best for importing your profile details.',
    //     type: ChecklistEnum.connectLinkedIn,
    // },
    // {
    //     id: 7,
    //     title: 'Connect School',
    //     description: 'Best for connecting a school account.',
    //     type: ChecklistEnum.connectSchool,
    // },
    // {
    //     id: 6,
    //     title: 'Add Verifiable Credentials',
    //     description: 'Best for adding already-issued credentials.',
    //     type: ChecklistEnum.uploadRawVC,
    //     uploadType: 'rawVC',
    // },
];

export const useGetCheckListStatus = () => {
    const { refetch: refetchChecklistCredentialCounts } = useGetChecklistCredentialCounts();

    const refetchCheckListStatus = async (): Promise<void> => {
        await refetchChecklistCredentialCounts();
    };

    return { refetchCheckListStatus };
};

export default useGetCheckListStatus;
