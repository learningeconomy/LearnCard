import { useState, useEffect } from 'react';

import {
    UploadTypesEnum,
    useGetChecklistCredentialCounts,
    useGetCertCredential,
    useGetDiplomaCredential,
    useGetRawVCsCredential,
    useGetResumeCredential,
    useGetTranscriptCredential,
} from '../react-query/queries/checklist';

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
    const { data: resumeCredential, refetch: refetchResumeCredential } = useGetResumeCredential();
    const { data: certCredential, refetch: refetchCertCredential } = useGetCertCredential();
    const { data: transcriptCredential, refetch: refetchTranscriptCredential } =
        useGetTranscriptCredential();
    const { data: diplomaCredential, refetch: refetchDiplomaCredential } =
        useGetDiplomaCredential();
    const { data: rawVCsCredential, refetch: refetchRawVCsCredential } = useGetRawVCsCredential();
    const { data: checklistItemCounts, refetch: refetchChecklistCredentialCounts } =
        useGetChecklistCredentialCounts();

    const [checklistItemsWithStatus, setChecklistItemsWithStatus] = useState(checklistItems);
    const [completedItems, setCompletedItems] = useState<number>(0);

    useEffect(() => {
        getCheckListStatus();
    }, [
        resumeCredential,
        certCredential,
        transcriptCredential,
        diplomaCredential,
        rawVCsCredential,
    ]);

    const getCheckListStatus = () => {
        const _checklistItemsWithStatus = checklistItems.map(item => {
            switch (item.type) {
                case ChecklistEnum.uploadResume:
                    return {
                        ...item,
                        isCompleted: !!resumeCredential,
                    };
                case ChecklistEnum.connectLinkedIn:
                    return {
                        ...item,
                        isCompleted: false,
                    };
                case ChecklistEnum.connectSchool:
                    return {
                        ...item,
                        isCompleted: true,
                    };
                case ChecklistEnum.uploadCertificates:
                    return {
                        ...item,
                        isCompleted: !!certCredential,
                    };
                case ChecklistEnum.addSkills:
                    return {
                        ...item,
                        isCompleted: true,
                    };
                case ChecklistEnum.uploadTranscripts:
                    return {
                        ...item,
                        isCompleted: !!transcriptCredential,
                    };
                case ChecklistEnum.uploadDiplomas:
                    return {
                        ...item,
                        isCompleted: !!diplomaCredential,
                    };
                case ChecklistEnum.uploadRawVC:
                    return {
                        ...item,
                        isCompleted: !!rawVCsCredential,
                    };
                default:
                    return item;
            }
        });

        setChecklistItemsWithStatus(_checklistItemsWithStatus);

        const _completedItems = _checklistItemsWithStatus.filter(item => item.isCompleted).length;
        setCompletedItems(_completedItems);
    };

    const refetchCheckListStatus = async () => {
        await refetchResumeCredential();
        await refetchCertCredential();
        await refetchTranscriptCredential();
        await refetchDiplomaCredential();
        await refetchRawVCsCredential();
        await refetchChecklistCredentialCounts();
    };

    const numStepsRemaining = checklistItems.length - completedItems;

    return {
        checklistItemsWithStatus,
        completedItems,
        numStepsRemaining,
        checklistItemCounts,
        refetchCheckListStatus,
    };
};

export default useGetCheckListStatus;
