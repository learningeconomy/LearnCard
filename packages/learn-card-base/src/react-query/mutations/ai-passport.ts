import { UnsignedVC } from '@learncard/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useModal, useToast, ToastTypeEnum, UploadTypesEnum } from 'learn-card-base';

export const usePreloadAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ did, summaryCredential }: { did: string; summaryCredential: any }) => {
            const res = await fetch(`https://api.learncloud.ai/assessment?did=${did}`, {
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
            const response = await fetch(`https://api.learncloud.ai/finish-assessment?did=${did}`, {
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
                const response = await fetch(
                    `https://api.learncloud.ai/credentials/parse-file?did=${did}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file, fileType }),
                    }
                );

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
                    version: 2,
                    title: `${fileType} Successfully Parsed`,
                    hasDismissButton: true,
                    toastType: ToastTypeEnum.Success,
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
                    version: 2,
                    title: 'Error',
                    hasDismissButton: true,
                    toastType: ToastTypeEnum.Error,
                    duration: 5000,
                });
            }, 500);
        },
    });
};
