import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';

type CreatePinInput = { pin: string; did?: string };

export const useCreatePin = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, CreatePinInput>({
        mutationFn: async ({ pin }: CreatePinInput) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.createPin(pin);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
        onSuccess: data => {
            queryClient.setQueryData(['useGetDidHasPin'], true);
        },
    });
};

export const useVerifyPin = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, CreatePinInput>({
        mutationFn: async ({ pin, did = undefined }: CreatePinInput) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.verifyPin(pin, did);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
    });
};

export const useUpdatePin = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    type UpdatePinInput = { currentPin: string; newPin: string };

    return useMutation<boolean, Error, UpdatePinInput>({
        mutationFn: async ({ currentPin, newPin }: UpdatePinInput) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.updatePin(currentPin, newPin);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
        onSuccess: data => {
            queryClient.setQueryData(['useGetDidHasPin'], true);
        },
    });
};

export const useGeneratePinUpdateToken = () => {
    const { initWallet } = useWallet();

    return useMutation<{ token: string; tokenExpire: Date } | null, Error>({
        mutationFn: async () => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.generatePinUpdateToken();

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
    });
};

export const useValidatePinUpdateToken = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, { token: string }>({
        mutationFn: async ({ token }: { token: string }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.validatePinUpdateToken(token);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
    });
};

export const useUpdatePinWithToken = () => {
    const { initWallet } = useWallet();

    return useMutation<boolean, Error, { token: string; newPin: string }>({
        mutationFn: async ({ token, newPin }: { token: string; newPin: string }) => {
            try {
                const wallet = await initWallet();
                const data = await wallet?.invoke?.updatePinWithToken(token, newPin);

                return data;
            } catch (error) {
                return Promise.reject(new Error(error as string));
            }
        },
    });
};
