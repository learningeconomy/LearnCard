import { useMutation } from '@tanstack/react-query';
import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { useIonAlert } from '@ionic/react';

export const useSendLoginVerificationCode = () => {
    const { initWallet } = useWallet();

    const { presentToast } = useToast();
    const [presentAlert] = useIonAlert();

    return useMutation<{ success: boolean; message?: string }, Error, { email: string }>({
        mutationFn: async ({ email }: { email: string }) => {
            try {
                const wallet = await initWallet('aaa');
                const data = await wallet?.invoke?.sendLoginVerificationCode(email);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
        onSuccess: data => {
            if (!data?.success) {
                presentAlert({
                    header: 'Error',
                    message: data?.message || 'Failed to send login verification code',
                    buttons: [
                        {
                            text: 'Dismiss',
                            role: 'cancel',
                        },
                    ],
                });
                return;
            }

            presentToast('A login verification code has been sent to your email.', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        },
    });
};

export const useVerifyContactMethodWithProofOfLogin = () => {
    const { initWallet } = useWallet();
    const [presentAlert] = useIonAlert();
    const { mutateAsync: getProofOfLoginVp } = useGetProofOfLoginVp();

    return useMutation<
        { success: boolean; error?: string; contactMethod?: any },
        Error,
        { token: string }
    >({
        mutationFn: async ({ token }: { token: string }) => {
            try {
                const proofRes = await getProofOfLoginVp({ token });

                if (!proofRes?.success || !proofRes?.vp) {
                    return {
                        success: false,
                        error: proofRes?.error || 'Failed to get Proof of Login VP',
                    };
                }

                const wallet = await initWallet();
                const result = await wallet?.invoke?.verifyContactMethodWithCredential(proofRes.vp);

                return {
                    success: true,
                    contactMethod: result.contactMethod,
                    message: result.message,
                };
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
        onSuccess: data => {
            if (!data?.success) {
                console.warn(
                    'useVerifyContactMethodWithProofOfLogin: Failed to verify contact method with Proof of Login',
                    data?.error
                );
            }
        },
    });
};

export const useGetProofOfLoginVp = (opts?: { showAlert?: boolean }) => {
    const { initWallet } = useWallet();
    const [presentAlert] = useIonAlert();
    const showAlert = opts?.showAlert ?? false;

    return useMutation<{ success: boolean; vp?: string; error?: string }, Error, { token: string }>(
        {
            mutationFn: async ({ token }: { token: string }) => {
                try {
                    const wallet = await initWallet('aaa');
                    const data = await wallet?.invoke?.getProofOfLoginVp(token);

                    return data;
                } catch (error) {
                    return Promise.reject(new Error(error as string));
                }
            },
            onSuccess: data => {
                if (!data?.success) {
                    if (showAlert) {
                        presentAlert({
                            header: 'Error',
                            message: data?.error || 'Failed to get Proof of Login VP',
                            buttons: [
                                {
                                    text: 'Dismiss',
                                    role: 'cancel',
                                },
                            ],
                        });
                    } else {
                        console.warn(
                            'useGetProofOfLoginVp: Failed to get Proof of Login VP',
                            data?.error
                        );
                    }
                    return;
                }
            },
        }
    );
};

export const useVerifyLoginVerificationCode = () => {
    const { initWallet } = useWallet();
    const [presentAlert] = useIonAlert();

    return useMutation<
        { success: boolean; token?: string; message?: string },
        Error,
        { email: string; code: string }
    >({
        mutationFn: async ({ email, code }: { email: string; code: string }) => {
            try {
                const wallet = await initWallet('aaa');
                const data = await wallet?.invoke?.verifyLoginCode(email, code);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
        onSuccess: data => {
            if (!data?.success) {
                presentAlert({
                    header: 'Error',
                    message: data?.message || 'Failed to verify login verification code',
                    buttons: [
                        {
                            text: 'Dismiss',
                            role: 'cancel',
                        },
                    ],
                });
                return;
            }
        },
    });
};

export const useVerifyNetworkHandoffToken = () => {
    const { initWallet } = useWallet();
    const [presentAlert] = useIonAlert();

    return useMutation<
        {
            success: boolean;
            token?: string;
            message?: string;
            validatedNetworkHandoffToken?: string;
        },
        Error,
        { token: string }
    >({
        mutationFn: async ({ token }: { token: string }) => {
            try {
                const wallet = await initWallet('aaa');
                const data = await wallet?.invoke?.verifyNetworkHandoffToken(token);

                const result = await wallet?.invoke?.verifyPresentation(token, {
                    proofFormat: 'jwt',
                });
                let validatedNetworkHandoffToken: string | undefined = undefined;

                if (
                    result.warnings.length === 0 &&
                    result.errors.length === 0 &&
                    result.checks.includes('JWS')
                ) {
                    validatedNetworkHandoffToken = token;
                }

                return {
                    ...data,
                    validatedNetworkHandoffToken,
                };
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
        onSuccess: data => {
            if (!data?.success) {
                presentAlert({
                    header: 'Error',
                    message: data?.message || 'Failed to verify network handoff token',
                    buttons: [
                        {
                            text: 'Dismiss',
                            role: 'cancel',
                        },
                    ],
                });
                return;
            }
        },
    });
};
