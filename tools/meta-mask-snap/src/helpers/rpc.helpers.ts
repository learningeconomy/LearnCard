import { snapId } from '@constants/snapConstants';

export const sendRequest = async (params: Record<string, any>) =>
    ethereum.request({
        method: 'wallet_invokeSnap',
        params: [snapId, params],
    });
