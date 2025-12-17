import { useState, useEffect } from 'react';

import {
    UploadTypesEnum,
    useGetCertCredential,
    useGetDiplomaCredential,
    useGetRawVCsCredential,
    useGetResumeCredential,
    useGetTranscriptCredential,
} from 'learn-card-base';

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
    type: ChecklistEnum;
    uploadType?: UploadTypesEnum | string;
    isCompleted?: boolean;
};

export const checklistItems: ChecklistItem[] = [
    {
        id: 1,
        title: 'Add Resume',
        type: ChecklistEnum.uploadResume,
        uploadType: 'resume',
    },
    {
        id: 2,
        title: 'Add Certificates',
        type: ChecklistEnum.uploadCertificates,
        uploadType: 'certificate',
    },
    // {
    //     id: 3,
    //     title: 'Add Skills',
    //     type: ChecklistEnum.addSkills,
    // },
    {
        id: 4,
        title: 'Add Transcript',
        type: ChecklistEnum.uploadTranscripts,
        uploadType: 'transcript',
    },
    {
        id: 5,
        title: 'Add Diploma',
        type: ChecklistEnum.uploadDiplomas,
        uploadType: 'diploma',
    },
    // {
    //     id: 6,
    //     title: 'Connect LinkedIn',
    //     type: ChecklistEnum.connectLinkedIn,
    // },
    // {
    //     id: 7,
    //     title: 'Connect School',
    //     type: ChecklistEnum.connectSchool,
    // },
    // {
    //     id: 6,
    //     title: 'Add Verifiable Credentials',
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
    };

    const numStepsRemaining = checklistItems.length - completedItems;

    return {
        checklistItemsWithStatus,
        completedItems,
        numStepsRemaining,
        refetchCheckListStatus,
    };
};

export default useGetCheckListStatus;
