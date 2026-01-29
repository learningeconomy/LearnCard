import { UnsignedVC } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useModal, useToast, ToastTypeEnum, UploadTypesEnum } from 'learn-card-base';
import { LEARNCARD_AI_URL } from '../../constants/Networks';

export const BACKEND_URL = LEARNCARD_AI_URL;

export const usePreloadAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ did, summaryCredential }: { did: string; summaryCredential: any }) => {
            const res = await fetch(`${BACKEND_URL}/assessment?did=${did}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summaryCredential }),
            });

            if (!res.ok) throw new Error('Failed to preload assessment');
            const assessment = await res.json();

            return { assessment, boostId: summaryCredential?.boostId };
        },
        onSuccess: ({ assessment, boostId }) => {
            queryClient.setQueryData(['assessment', boostId], assessment);
        },
        onError: error => {
            console.error('Failed to preload assessment:', error);
        },
    });
};

type FinishAssessmentPayload = {
    did: string;
    assessmentQA: any;
    session: any;
    sessionUri: string;
};

export const useFinishAssessmentMutation = () => {
    return useMutation({
        mutationFn: async ({ did, assessmentQA, session, sessionUri }: FinishAssessmentPayload) => {
            const response = await fetch(`${BACKEND_URL}/finish-assessment?did=${did}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assessmentQA, session, sessionUri }),
            });

            if (!response.ok) {
                throw new Error('Failed to finish assessment');
            }

            return response.json();
        },
    });
};

export const useUploadFileMutation = (fileType: UploadTypesEnum) => {
    const { closeModal } = useModal();
    const { presentToast } = useToast();

    return useMutation({
        mutationFn: async ({
            did,
            file,
            fileType,
        }: {
            did: string;
            file: string;
            fileType: UploadTypesEnum;
        }) => {
            try {
                const response = await fetch(`${BACKEND_URL}/credentials/parse-file?did=${did}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file, fileType }),
                });

                const responseJson: {
                    vcs: { vc: UnsignedVC; metadata: { name: string; category: string } }[];
                } = await response.json();

                if (!response.ok) {
                    throw new Error(responseJson?.error || 'Unknown server error');
                }

                return responseJson;
            } catch (error) {
                console.error('Failed to upload resume:', error);
                throw new Error(error as string);
            }
        },
        onSuccess: async () => {
            closeModal();
            setTimeout(() => {
                presentToast(`Your journey is now reflected in portable, trusted credentials.`, {
                    title: `${fileType} Successfully Parsed`,
                    hasDismissButton: true,
                    type: ToastTypeEnum.Success,
                    hasCheckmark: true,
                    duration: 5000,
                });
            }, 500);
        },
        onError: async error => {
            let message = `Something went wrong uploading your ${fileType}.`;

            if (typeof error === 'object' && error !== null && 'message' in error) {
                message = (error as any).message ?? message;
            }

            setTimeout(() => {
                presentToast(message, {
                    title: 'Error',
                    hasDismissButton: true,
                    type: ToastTypeEnum.Error,
                    hasX: true,
                    duration: 5000,
                });
            }, 500);
        },
    });
};
