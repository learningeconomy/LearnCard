import { createStore } from '@udecode/zustood';
import { UploadTypesEnum } from 'learn-card-base/react-query/queries/checklist';
import type { ParsedFileCredential, RawArtifactCredential } from '../types/file-extraction';

export type PendingReviewData = {
    credentials: ParsedFileCredential[];
    rawArtifact: RawArtifactCredential;
    /** Original sources for a multi-file review. */
    additionalRawArtifacts?: RawArtifactCredential[];
    /** Confirmed originals, retained so reopening review cannot replace a newer resume. */
    storedArtifacts?: { id: string; uri: string }[];
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
        certificate: PendingReviewData | null;
        diploma: PendingReviewData | null;
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
            certificate: null,
            diploma: null,
        },
    },
    { persist: { name: 'checklistStore', enabled: false } }
).extendActions(set => ({
    updateIsParsing: (type: UploadTypesEnum, value: boolean) => {
        set.state(state => {
            state.isParsing[type as keyof typeof state.isParsing] = value;
        });
    },
    setPendingReview: (
        type: 'resume' | 'transcript' | 'certificate' | 'diploma',
        data: PendingReviewData | null
    ) => {
        set.state(state => {
            state.pendingReview[type] = data;
        });
    },
}));
