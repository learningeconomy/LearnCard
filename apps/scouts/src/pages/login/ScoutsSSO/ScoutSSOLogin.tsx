import React, { useState } from 'react';
import { z } from 'zod';

import * as m from '../../../paraglide/messages.js';
import { TransP } from '../../../i18n/TransP';
import { useScoutsSSOLogin } from './useScoutsSSOLogin';
import useFirebase from '../../../hooks/useFirebase';
import { AppInput } from 'learn-card-base/ui/controls/AppInput';
import { AppInputPasswordToggle } from 'learn-card-base/ui/controls/AppInputPasswordToggle';
import { AppCol } from 'learn-card-base/ui/layout';

const StateValidator = z.object({
    username: z.string().nonempty('Username is Required'),
    password: z.string().nonempty('Password is Required'),
});

export const ScoutsSSOLogin: React.FC = () => {
    const { signInWithCustomOAuthProvider } = useFirebase();

    const { scoutsUserLogin, getScoutsUserInfo } = useScoutsSSOLogin();

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordVisible, setPasswordVisible] = useState(false);
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

        if (validate()) {
            try {
                setLoading(true);
                const response = await scoutsUserLogin(username, password);
                const token = response?.access_token;

                await signInWithCustomOAuthProvider(token);

                // AuthCoordinator auto-handles key derivation when firebaseUser changes
                setUsername('');
                setPassword('');
            } catch (error) {
                setLoginError(error?.message);
                setLoading(false);
            }

            return;
        }
    };

    return (
        <form onSubmit={handleLogin} className="w-full">
            <AppCol size="12">
                <p className="font-medium text-sm text-grayscale-600 uppercase">
                    <TransP
                        m={m['login.worldScoutsAccount']}
                        components={[<span className="text-sp-purple-light" key="brand" />]}
                    />
                </p>
            </AppCol>
            {loginError && (
                <AppCol size="12">
                    <p className="login-input-error-msg">{loginError}</p>
                </AppCol>
            )}
            <AppCol size="12">
                <AppInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] px-4! py-2! font-medium font-notoSans tracking-wide text-base ${
                        errors.username ? 'login-input-email-error' : ''
                    }`}
                    placeholder={m['login.usernamePlaceholder']()}
                    onValueInput={value => setUsername(value)}
                    value={username}
                    type="text"
                />
                {errors.email && <p className="login-input-error-msg">{errors.email}</p>}
            </AppCol>
            <AppCol size="12">
                <AppInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] px-4! py-2! font-medium font-notoSans tracking-wide text-base ${
                        errors.password ? 'login-input-email-error' : ''
                    }`}
                    placeholder={m['common.password']()}
                    onValueInput={value => setPassword(value)}
                    value={password}
                    type={passwordVisible ? 'text' : 'password'}
                    end={
                        <AppInputPasswordToggle
                            visible={passwordVisible}
                            onVisibleChange={setPasswordVisible}
                            className="ion-no-padding p-0 m-0"
                        />
                    }
                />
                {errors.password && <p className="login-input-error-msg">{errors.password}</p>}
            </AppCol>
            <AppCol size="12" className="flex items-center justify-center">
                <button
                    disabled={loading}
                    type="submit"
                    className="bg-sp-purple-base text-white ion-padding w-full font-bold rounded-[30px]"
                >
                    {loading ? m['common.loading']() : m['common.login']()}
                </button>
            </AppCol>
        </form>
    );
};

export default ScoutsSSOLogin;
