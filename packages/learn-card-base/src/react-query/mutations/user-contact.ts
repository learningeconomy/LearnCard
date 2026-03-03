import { useWallet } from 'learn-card-base';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ContactMethodType } from '@learncard/types';

export const useAddContactMethod = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<
        { message: string; contactMethodId: string; verificationRequired: boolean },
        Error,
        { type: 'email' | 'phone'; value: string }
    >({
        mutationFn: async ({ type, value }) => {
            const wallet = await initWallet();
            return await wallet?.invoke?.addContactMethod({ type, value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-methods:get'] });
        },
    });
};

export const useVerifyContactMethod = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<
        { message: string; contactMethod: ContactMethodType },
        Error,
        { token: string }
    >({
        mutationFn: async ({ token }) => {
            const wallet = await initWallet();
            await wallet?.invoke?.getProfile(); // Ensure init is done
            return await wallet?.invoke?.verifyContactMethod(token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-methods:get'] });
        },
    });
};

export const useSetPrimaryContactMethod = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<{ message: string }, Error, { contactMethodId: string }>({
        mutationFn: async ({ contactMethodId }) => {
            const wallet = await initWallet();
            return await wallet?.invoke?.setPrimaryContactMethod(contactMethodId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-methods:get'] });
        },
    });
};

export const useRemoveContactMethod = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<{ message: string }, Error, { id: string }>({
        mutationFn: async ({ id }) => {
            const wallet = await initWallet();
            return await wallet?.invoke?.removeContactMethod(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-methods:get'] });
        },
    });
};
