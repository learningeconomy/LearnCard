import React from 'react';
import { CapacitorHttp } from '@capacitor/core';

import {
    ScoutSSOLoginResponse,
    ScoutSSOUserInfo,
    ScoutsSSOUserInfoEndpoint,
    setProxy,
} from './scouts-sso.helpers';
import { useWallet } from 'learn-card-base';

// !! Using CapacitorHttp to bypass CORS and leverage native networking capabilities. for (IOS/Android) !!
// !! CapacitorHttp falls back to using fetch for making requests. for (WEB) !!

export const useScoutsSSOLogin = () => {
    const { initWallet } = useWallet();

    const scoutsUserLogin = async (
        username: string,
        password: string
    ): Promise<ScoutSSOLoginResponse | null> => {
        try {
            const wallet = await initWallet('aaa');
            const response = await wallet.invoke.authenticateWithScoutsSSO(username, password);
            return response;
        } catch (error) {
            console.error('Error during login:', error);
            throw new Error(error as string);
        }
    };

    const getScoutsUserInfo = async (
        token: string
    ): Promise<ScoutSSOUserInfo | string | undefined> => {
        try {
            const options = {
                url: setProxy(ScoutsSSOUserInfoEndpoint),
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            // Make the GET request using CapacitorHttp
            const response = await CapacitorHttp.get(options);

            // Parse the response data
            const userInfo = response.data;

            // Handle errors returned by the API
            if (userInfo?.error) {
                throw new Error(userInfo?.error_description);
            }

            return userInfo as ScoutSSOUserInfo;
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw new Error(error as string);
        }
    };

    return {
        scoutsUserLogin,
        getScoutsUserInfo,
    };
};
