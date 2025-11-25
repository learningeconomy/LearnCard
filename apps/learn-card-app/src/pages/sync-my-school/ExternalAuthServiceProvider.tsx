import { useHistory } from 'react-router';
import { AuthProvider, TAuthConfig } from 'react-oauth2-code-pkce';
import { createStore } from '@udecode/zustood';

export type PostLoginReducerArgs =
    | { action: 'redirect'; data: { path: string; params?: string } }
    | { action: 'none' };

export const oauth2ReducerArgStore = createStore('oauth2-reducer')<{ args: PostLoginReducerArgs }>(
    { args: { action: 'none' } },
    { persist: { name: 'oauth2-reducer', enabled: true } }
);

const authConfig: TAuthConfig = {
    clientId: 'metaversity',
    authorizationEndpoint:
        'https://auth.le-int-svcs.com/realms/Motlow/protocol/openid-connect/auth',
    tokenEndpoint: 'https://auth.le-int-svcs.com/realms/Motlow/protocol/openid-connect/token',
    redirectUri: IS_PRODUCTION
        ? 'https://learncard.app/sync-my-school/success'
        : 'http://localhost:3000/sync-my-school/success',
    scope: 'openid profile',
    autoLogin: false,
};

const ExternalAuthServiceProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const history = useHistory();
    const reducerArgs = oauth2ReducerArgStore.use.args();

    return (
        <AuthProvider
            authConfig={{
                ...authConfig,
                postLogin: () => {
                    if (reducerArgs.action === 'redirect') {
                        history.replace({
                            pathname: reducerArgs.data.path,
                            search: reducerArgs.data.params,
                        });
                        oauth2ReducerArgStore.set.args({ action: 'none' });
                    }
                },
            }}
        >
            {children}
        </AuthProvider>
    );
};

export default ExternalAuthServiceProvider;
