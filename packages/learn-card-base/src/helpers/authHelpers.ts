import jwt_decode from 'jwt-decode';
import axios from 'axios';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import authStore from 'learn-card-base/stores/authStore';

export const setAuthToken = authStore.set.jwt;

export const unsetAuthToken = () => {
    authStore.set.jwt(null);
    currentUserStore.set.currentUser(null);
    currentUserStore.set.currentUserPK(null);
};

export const getAuthToken = authStore.get.jwt;

export const isAuthTokenValid = () => {
    const token = authStore.get.jwt();

    if (token === 'dummy') return true;

    if (!token) return false;

    const decodedJWT = jwt_decode<{ exp: number;[key: string]: any }>(token);

    if (Date.now() >= decodedJWT?.exp * 1000) {
        unsetAuthToken();
        return false;
    }

    return true;
};

// Discord

export const setDiscordAuthToken = (token: string) => authStore.set.discord(token);

export const unsetDiscordAuthToken = () => {
    authStore.set.discord(null);
};

export const getDiscordAuthToken = authStore.get.discord;

export const revokeDiscordToken = async () => {
    const discordAuthToken = getDiscordAuthToken();
    if (!discordAuthToken) return;
    //hardcoded for now
    // currently this will be invoked whenever you logout
    // but only should be invoked if you are specifically logged in from discord....
    const DISCORD_CLIENT_ID = '1012087352207872000';
    const DISCORD_CLIENT_SECRET = 'EHFPJ9uK7tEY5OxzdsFPP3ui6-xorc0M';
    const formData = new FormData();
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    formData.append('client_id', DISCORD_CLIENT_ID);
    formData.append('client_secret', DISCORD_CLIENT_SECRET);
    formData.append('token', discordAuthToken);

    try {
        await axios.post('https://discord.com/api/oauth2/token/revoke', formData, {
            headers: {
                ...headers,
                Authorization: `Basic ${Buffer.from(
                    `${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`,
                    'binary'
                ).toString('base64')}`,
            },
        });
    } catch (e) {
        throw new Error('Error revoking discord token');
    }
};

export const clearAuthServiceProvider = () => {
    // clears auth provider local storage
    localStorage.removeItem('ROCP_tokenExpire');
    localStorage.removeItem('ROCP_refreshTokenExpire');
    localStorage.removeItem('ROCP_token');
    localStorage.removeItem('ROCP_refreshToken');
    localStorage.removeItem('ROCP_idToken');
    localStorage.removeItem('ROCP_loginInProgress');
    localStorage.removeItem('PKCE_code_verifier');
};

// export const signOutOfSession = await () => {
//         const { tokenData, token, logOut }: IAuthContext = useContext<IAuthContext>(AuthContext);

//     try {
//         await axios.post('https://discord.com/api/oauth2/token/revoke', formData, {
//             headers: {
//                 ...headers,
//                 Authorization: ``
//             },
//         });
//     } catch (e) {
//         throw new Error('Error revoking discord token');
//     }
// }
