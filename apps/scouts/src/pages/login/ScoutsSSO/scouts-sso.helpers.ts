export const ScoutsSSOUserLoginEndpoint =
    'https://sso.scout.org/auth/realms/wsb/protocol/openid-connect/token';
export const ScoutsSSOUserInfoEndpoint =
    'https://sso.scout.org/auth/realms/wsb/protocol/openid-connect/userinfo';

export const scoutsSSOClientId: string = 'scoutpass';

export type ScoutSSOUserInfo = {
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    locale: string;
    name: string;
    preferred_username: string;
    sub: string; // userId
    error?: string;
    error_description?: string;
};

export type ScoutSSOLoginResponse = {
    access_token: string;
    expires_in: number;
    'not-before-policy': number;
    refresh_expires_in: number;
    refresh_token: string;
    scope: string;
    sesstion_state: string;
    token_type: string;
    error?: string;
    error_description?: string;
};

export const setProxy = (endpoint: string) => {
    const proxy = `https://cors-anywhere.herokuapp.com/`;

    if (IS_PRODUCTION) return endpoint;
    return `${proxy}${endpoint}`;
};
