import { PushTokens } from '.';

export const getTokensForDid = async (did: string): Promise<string[] | false> => {
    try {
        const pushTokens = await PushTokens.find({ did, enabled: true }).toArray();
        return pushTokens.map(pt => pt.token);
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const isTokenValidForDid = async (did: string, token: string): Promise<boolean> => {
    try {
        return !!(await PushTokens.findOne({ did, token }));
    } catch (e) {
        console.error(e);
        return false;
    }
};
