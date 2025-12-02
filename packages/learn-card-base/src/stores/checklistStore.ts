import { createStore } from '@udecode/zustood';
import { UploadTypesEnum } from 'learn-card-base/react-query/queries/checklist';

export const checklistStore = createStore('checklistStore')<{
    isParsing: {
        resume: boolean;
        certificate: boolean;
        transcript: boolean;
        diploma: boolean;
        rawVC: boolean;
    };
}>(
    {
        isParsing: {
            resume: false,
            certificate: false,
            transcript: false,
            diploma: false,
            rawVC: false,
        },
    },
    { persist: { name: 'checklistStore', enabled: false } }
).extendActions(set => ({
    updateIsParsing: (type: UploadTypesEnum, value: boolean) => {
        set.state(state => {
            state.isParsing[type as keyof typeof state.isParsing] = value;
        });
    },
}));
