import { useWallet } from 'learn-card-base';
import { useQuery } from '@tanstack/react-query';

import { ContactMethodType } from '@learncard/types';

export const useGetMyContactMethods = () => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['contact-methods:get'],
        queryFn: async () => {
            const wallet = await initWallet();
            const data: ContactMethodType[] = await wallet?.invoke?.getMyContactMethods();

            return data;
        },
    });
};
