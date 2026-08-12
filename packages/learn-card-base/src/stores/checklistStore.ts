import { createStore } from '@udecode/zustood';
import { UploadTypesEnum } from 'learn-card-base/react-query/queries/checklist';

export type PendingReviewData = {
    credentials: Array<{ vc: any; metadata?: { name?: string; category?: string } }>;
    rawArtifact: any;
    /** For multi-file uploads (transcripts), additional raw artifacts beyond the first */
    additionalRawArtifacts?: any[];
};

export const checklistStore = createStore('checklistStore')<{
    isParsing: {
        resume: boolean;
        certificate: boolean;
        transcript: boolean;
        diploma: boolean;
        rawVC: boolean;
    };
    pendingReview: {
        resume: PendingReviewData | null;
        transcript: PendingReviewData | null;
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
        pendingReview: {
            resume: null,
            transcript: null,
        },
    },
    { persist: { name: 'checklistStore', enabled: false } }
).extendActions(set => ({
    updateIsParsing: (type: UploadTypesEnum, value: boolean) => {
        set.state(state => {
            state.isParsing[type as keyof typeof state.isParsing] = value;
        });
    },
    setPendingReview: (type: 'resume' | 'transcript', data: PendingReviewData | null) => {
        set.state(state => {
            state.pendingReview[type] = data;
        });
    },
}));
