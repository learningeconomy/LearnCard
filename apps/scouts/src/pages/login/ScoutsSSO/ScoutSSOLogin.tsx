import React, { useState } from 'react';
import { z } from 'zod';

import { IonCol, IonInput, IonInputPasswordToggle } from '@ionic/react';

import {
    authStore,
    BrandingEnum,
    useWeb3AuthSFA,
    EMAIL_REGEX,
    SocialLoginTypes,
    firebaseAuthStore,
    useWallet,
} from 'learn-card-base';
import { useScoutsSSOLogin } from './useScoutsSSOLogin';
import useFirebase from '../../../hooks/useFirebase';
import { userInfo } from 'os';

const StateValidator = z.object({
    username: z.string().nonempty('Username is Required'),
    password: z.string().nonempty('Password is Required'),
});

export const ScoutsSSOLogin: React.FC = () => {
    const { initWallet } = useWallet();
    const { web3AuthSFAInit } = useWeb3AuthSFA();
    const { signInWithCustomFirebaseToken, signInWithCustomOAuthProvider } = useFirebase();
    const setInitLoading = authStore.set.initLoading;

    const { scoutsUserLogin, getScoutsUserInfo } = useScoutsSSOLogin();

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [loginError, setLoginError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            username: username,
            password: password,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const handleLogin = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        const wallet = await initWallet('aaa');

        // const web3Auth = await web3AuthSFAInit(BrandingEnum.scoutPass);

        if (validate()) {
            try {
                setLoading(true);
                const response = await scoutsUserLogin(username, password);
                const token = response?.access_token;

                // # server side account merge
                // const { firebaseToken } = await wallet.invoke.authenticateWithKeycloak(token);

                // if (firebaseToken) {
                //     const userInfo = await getScoutsUserInfo(token);
                //     await signInWithCustomFirebaseToken(firebaseToken);
                // }

                // # client side account merge
                // !! clientId: set to 'account' on firebase OIDC config, based on token aud: mismatch
                // !! if this becomes a problem in the future, fallback to the server handling the merge
                await signInWithCustomOAuthProvider(token);

                // # direct keycloak -> web3Auth login
                // if (token) {
                //     const userInfo = await getScoutsUserInfo(token);

                //     authStore.set.typeOfLogin(SocialLoginTypes.scoutsSSO);
                //     // map scouts user info into the auth store
                //     firebaseAuthStore.set.currentUser({
                //         uid: userInfo?.sub,
                //         email: userInfo?.email,
                //         displayName: userInfo?.name,
                //         phoneNumber: null,
                //         photoUrl: null,
                //     });

                //     if (userInfo?.sub) {
                //         setInitLoading(true);

                //         await web3Auth.connect({
                //             verifier: 'scoutpass-world-scouts-sso',
                //             verifierId: userInfo?.sub,
                //             idToken: token,
                //         });
                //     }
                // }
                setUsername('');
                setPassword('');
            } catch (error) {
                setLoginError(error?.message);
                setLoading(false);
                setInitLoading(false);
            }

            return;
        }
    };

    return (
        <form onSubmit={handleLogin} className="w-full">
            <IonCol size="12">
                <p className="font-medium text-sm text-grayscale-600 uppercase">
                    Login with your{' '}
                    <span className="text-sp-purple-light">World Scouts Account</span>
                </p>
            </IonCol>
            {loginError && (
                <IonCol size="12">
                    <p className="login-input-error-msg">{loginError}</p>
                </IonCol>
            )}
            <IonCol size="12">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] !px-4 !py-2 font-medium font-notoSans tracking-wide text-base ${
                        errors.username ? 'login-input-email-error' : ''
                    }`}
                    placeholder="Username"
                    onIonInput={e => setUsername(e.detail.value)}
                    value={username}
                    type="text"
                />
                {errors.email && <p className="login-input-error-msg">{errors.email}</p>}
            </IonCol>
            <IonCol size="12">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] !px-4 !py-2 font-medium font-notoSans tracking-wide text-base ${
                        errors.password ? 'login-input-email-error' : ''
                    }`}
                    placeholder="Password"
                    onIonInput={e => setPassword(e.detail.value)}
                    value={password}
                    type="password"
                >
                    <IonInputPasswordToggle
                        color="grayscale-600"
                        className="ion-no-padding p-0 m-0"
                        slot="end"
                    />
                </IonInput>
                {errors.password && <p className="login-input-error-msg">{errors.password}</p>}
            </IonCol>
            <IonCol size="12" className="flex items-center justify-center">
                <button
                    disabled={loading}
                    type="submit"
                    className="bg-sp-purple-base text-white ion-padding w-full font-bold rounded-[30px]"
                >
                    {loading ? 'Loading...' : 'Login'}
                </button>
            </IonCol>
        </form>
    );
};

export default ScoutsSSOLogin;
