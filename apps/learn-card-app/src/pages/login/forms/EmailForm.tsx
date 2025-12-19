import React, { useState, useEffect } from 'react';
import Countdown from 'react-countdown';
import { useHistory } from 'react-router-dom';
import ReactCodeInput from 'react-code-input';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { z } from 'zod';

import useWallet from 'learn-card-base/hooks/useWallet';
import {
    currentUserStore,
    getRandomBaseColor,
    redirectStore,
    usePathQuery,
    useSQLiteStorage,
    setPlatformPrivateKey,
} from 'learn-card-base';
import { walletStore } from 'learn-card-base/stores/walletStore';

import { IonCheckbox, IonCol, IonInput, IonToggle, IonRouterLink } from '@ionic/react';

import { setAuthToken } from 'learn-card-base/helpers/authHelpers';

import { EMAIL_REGEX, EmailFormStepsEnum } from 'learn-card-base';
import { useFirebase } from '../../../hooks/useFirebase';
import {
    useSendLoginVerificationCode,
    useVerifyLoginVerificationCode,
} from 'learn-card-base/react-query/mutations/firebase';

import { generatePK } from 'apps/learn-card-app/src/helpers/privateKeyHelpers';
import AppStoreDownloadButtons from '../appStoreButtons/AppStoreDownloadButtons';

const StateValidator = z.object({
    email: z.string().regex(EMAIL_REGEX, `Missing or Invalid Email`),
});

const CodeValidator = z.object({
    code: z.string().min(6, 'Invalid code'),
});

type EmailFormProps = {
    formTitleOverride?: string;
    formTitleClassNameOverride?: string;
    buttonTitleOverride?: string;
    buttonClassName?: string;
    suppressRedirect?: boolean;
    customRedirectUrl?: string;
    setShowSocialLogins: React.Dispatch<React.SetStateAction<boolean>>;
    showSocialLogins: boolean;
};

const EmailForm: React.FC<EmailFormProps> = ({
    formTitleOverride,
    formTitleClassNameOverride,
    buttonTitleOverride,
    buttonClassName = '',
    suppressRedirect = false,
    customRedirectUrl = '',
    setShowSocialLogins,
    showSocialLogins,
}) => {
    const flags = useFlags();
    const query = usePathQuery();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();
    const { sendSignInLink, signInWithCustomFirebaseToken } = useFirebase();

    const enableMagicLinkLogin = flags?.enableMagicLinkLogin ?? false;

    const verificationEmail = redirectStore.get.email();
    const shouldVerifyCode = Boolean(query.get('verifyCode') || verificationEmail);

    const [email, setEmail] = useState<string | null | undefined>('');
    const [code, setCode] = useState<string>('');
    const [password, setPassword] = useState<string | null | undefined>('');
    const [currentStep, setCurrentStep] = useState<EmailFormStepsEnum>(EmailFormStepsEnum.email);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [codeError, setCodeError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const { mutateAsync: sendLoginVerificationCode } = useSendLoginVerificationCode();
    const { mutateAsync: verifyLoginVerificationCode } = useVerifyLoginVerificationCode();

    const [isResendCodeLoading, setIsResendCodeLoading] = useState<boolean>(false);

    useEffect(() => {
        if (shouldVerifyCode && currentStep !== EmailFormStepsEnum.verification) {
            setCurrentStep(EmailFormStepsEnum.verification);
            setShowSocialLogins(false);
        }
    }, [shouldVerifyCode]);

    let activeStep: React.ReactNode | null = null;
    let formTitle: string | React.ReactNode | null = null;
    let buttonTitle: string | null = null;

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            email: email,
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

    const validateCode = () => {
        const parsedData = CodeValidator.safeParse({
            code,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData?.error) {
            setIsLoading(false);
            setErrors(parsedData?.error.flatten().fieldErrors);
        }

        return false;
    };

    const handleDemoLogin = async () => {
        setIsLoading(true);
        try {
            const dummyString = email + 'password123';
            const pk = await generatePK(dummyString);

            const dummyUser = {
                uid: 'demo',
                email,
                name: 'Demo',
                profileImage: '',
                aggregateVerifier: '',
                verifier: '',
                verifierId: '',
                typeOfLogin: '',
                dappShare: '',
                phoneNumber: '',
                privateKey: pk,
                baseColor: getRandomBaseColor(),
            };

            await setCurrentUser(dummyUser);
            currentUserStore.set.currentUser(dummyUser);

            await setPlatformPrivateKey(pk);

            const wallet = await initWallet(pk);
            if (wallet) {
                walletStore.set.wallet(wallet);
            } else {
                throw new Error('Error: Could not initialize wallet');
            }

            const currentUser = currentUserStore.get.currentUser();

            if (currentUser) {
                // ! set for demo login only
                setAuthToken('dummy');
            }

            if (!suppressRedirect) {
                const redirectTo =
                    redirectStore.get.authRedirect() || query.get('redirectTo') || '/wallet';
                history.push(redirectTo);
                // ! hotFix: hard refresh on login, otherwise sidememu does not display
                // window.location.href = '/wallet';
            }
        } catch (e) {
            console.log('///login error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnClick = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (currentStep === EmailFormStepsEnum.email) {
            // const existingUser = false;
            // // todo: check response
            // // if email exists in system redirect user to logging in
            // // if email does not exist in system redirect user to creating a new account
            // if (existingUser) {
            //     setCurrentStep(EmailFormStepsEnum.passwordExistingUser);
            // } else {
            //     setCurrentStep(EmailFormStepsEnum.passwordNewUser);
            // }
            if (validate()) {
                if (email?.toLowerCase() === 'demo@learningeconomy.io') {
                    handleDemoLogin();
                    return;
                } else {
                    // if magic link login is enabled, send sign in link
                    // # leaving as a fallback for now
                    if (enableMagicLinkLogin) {
                        try {
                            setIsLoading(true);
                            await sendSignInLink(email as string, customRedirectUrl);
                            setIsLoading(false);
                        } catch (e) {
                            setIsLoading(false);
                            console.log('///sendSignInLink error', e);
                        }
                    } else {
                        try {
                            setIsLoading(true);
                            await sendLoginVerificationCode({ email: email as string });
                            redirectStore.set.email(email as string);
                            setCurrentStep(EmailFormStepsEnum.verification);
                            setIsLoading(false);
                        } catch (e) {
                            setIsLoading(false);
                            console.log('///sendLoginVerificationCode error', e);
                        }
                    }

                    setEmail('');
                }
            }
        } else if (currentStep === EmailFormStepsEnum.verification) {
            if (validateCode()) {
                try {
                    setCodeError('');
                    setIsLoading(true);

                    const response = await verifyLoginVerificationCode({
                        email: verificationEmail as string,
                        code: code as string,
                    });
                    if (response?.token) {
                        redirectStore.set.email(null);
                        await signInWithCustomFirebaseToken(response?.token);
                    }
                    setIsLoading(false);
                } catch (e) {
                    setIsLoading(false);
                    setCodeError('Unable to verify code. Please try again.');
                }
            }
        } else if (currentStep === EmailFormStepsEnum.passwordExistingUser) {
            // todo: trigger login to existing account
        } else if (currentStep === EmailFormStepsEnum.passwordNewUser) {
            // todo: trigger creating new account
        }
    };

    const handleResendCode = async () => {
        setIsResendCodeLoading(true);
        try {
            await sendLoginVerificationCode({ email: verificationEmail as string });
            setIsResendCodeLoading(false);
        } catch (e) {
            setIsResendCodeLoading(false);
            console.log('///sendLoginVerificationCode error', e);
        }
    };

    const resetForm = () => {
        setCurrentStep(EmailFormStepsEnum.email);
        history.replace('/login');
        redirectStore.set.email(null);
        setEmail('');
        setPassword('');
    };

    const resendCodeButtonText: string = isResendCodeLoading ? 'Sending Code...' : 'Resend Code';

    let disabled = isLoading;
    if (currentStep === EmailFormStepsEnum.email) {
        formTitle = null;
        activeStep = (
            <div className="w-full flex items-center justify-center mb-[20px]">
                <input
                    aria-label="Email"
                    className={`bg-emerald-600 text-white placeholder:text-white rounded-[15px] w-full ion-padding font-medium tracking-widest text-base focus:outline-none focus:ring-0 focus:border-transparent ${
                        errors.email ? 'login-input-email-error' : ''
                    } white-placeholder`}
                    placeholder="Email address"
                    onChange={e => setEmail(e.target.value)}
                    value={email}
                    type="text"
                />
                {errors.email && <p className="login-input-error-msg">{errors.email}</p>}
            </div>
        );
        // buttonTitle = 'Continue';
        buttonTitle = buttonTitleOverride ?? 'Sign in with Email';
        if (isLoading) buttonTitle = 'Sending Code...';
        disabled = !email || isLoading;
    } else if (currentStep === EmailFormStepsEnum.verification) {
        formTitle = (
            <p
                className={`w-full ${
                    formTitleClassNameOverride ?? 'text-white text-lg'
                } text-center`}
            >
                Enter verification code or{' '}
                <span className="text-white underline font-bold" onClick={resetForm}>
                    start over
                </span>
            </p>
        );
        activeStep = (
            <IonCol
                size="12"
                className="w-full flex flex-col items-center justify-center ion-no-padding ion-no-margin mb-[20px]"
            >
                <ReactCodeInput
                    name="phoneVerification"
                    inputMode="numeric"
                    fields={6}
                    type="text"
                    onChange={e => setCode(e)}
                    className={`react-code-input ${
                        errors.code || codeError ? 'react-code-input-error' : ''
                    }`}
                />
                {errors?.code && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">
                        {errors?.code}
                    </p>
                )}
                {codeError && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">{codeError}</p>
                )}
            </IonCol>
        );
        buttonTitle = isLoading ? 'Verifying...' : 'Verify';
        disabled = code?.length < 6 || isLoading;
    } else if (currentStep === EmailFormStepsEnum.passwordExistingUser) {
        formTitle = 'Password';
        activeStep = (
            <IonCol size="12">
                <IonInput
                    autocapitalize="on"
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                    placeholder="Password"
                    // todo: add view password toggle
                    onIonInput={e => setPassword(e.detail.value)}
                    value={password}
                    type="password"
                />
                <IonCol size="12" className="flex items-center justify-end mt-3">
                    <p className="mr-3 text-gray-700 font-medium text-lg">Stay Signed In</p>{' '}
                    <IonToggle />
                </IonCol>
            </IonCol>
        );
        buttonTitle = 'Login';
    } else if (currentStep === EmailFormStepsEnum.passwordNewUser) {
        formTitle = 'Password';
        activeStep = (
            <IonCol size="12">
                <IonInput
                    autocapitalize="on"
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                    placeholder="Password"
                    // todo: add view password toggle
                    onIonInput={e => setPassword(e.detail.value)}
                    value={password}
                    type="password"
                />
                <IonCol size="12" className="flex items-center justify-end mt-3">
                    <p className="mr-3 text-gray-700 font-medium text-lg">
                        Agree to{' '}
                        <IonRouterLink href="#" className="font-semibold login-terms-span">
                            Terms
                        </IonRouterLink>
                    </p>{' '}
                    <IonCheckbox />
                </IonCol>
            </IonCol>
        );
        buttonTitle = 'Create Account';
    }

    return (
        <form onSubmit={handleOnClick} className="w-full">
            {formTitle && (
                <IonCol size="12">
                    <p
                        className={
                            formTitleClassNameOverride ?? 'w-full font-medium text-white normal'
                        }
                    >
                        {formTitle}
                    </p>
                </IonCol>
            )}

            {activeStep}
            <div className="flex items-center justify-center pb-[20px]">
                <button
                    className={`bg-emerald-900 text-white ion-padding w-full font-bold rounded-[15px] disabled:opacity-50 ${buttonClassName}`}
                    onClick={handleOnClick}
                    disabled={disabled}
                >
                    {buttonTitle}
                </button>
            </div>
            {currentStep === EmailFormStepsEnum.email && <AppStoreDownloadButtons />}
            {currentStep === EmailFormStepsEnum.verification && verificationEmail && (
                <div className="flex items-center justify-center w-full">
                    <Countdown
                        date={Date.now() + 30000} // 30 seconds
                        renderer={({ seconds, completed }) =>
                            completed ? (
                                <button
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResendCode();
                                    }}
                                    className="text-white font-bold mt-4 border-b-white border-solid border-b-[1px]"
                                >
                                    {resendCodeButtonText}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="text-white font-bold mt-4 border-b-white border-solid border-b-[1px]"
                                >
                                    Resend in {seconds}s
                                </button>
                            )
                        }
                    />
                </div>
            )}
            {currentStep === EmailFormStepsEnum.passwordNewUser && (
                <IonCol
                    size="12"
                    className="text-center mt-4 text-gray-700 font-medium text-lg login-existing-account"
                >
                    <p>Already have an account?</p>
                    <button
                        onClick={resetForm}
                        className="w-full text-center font-bold text-lg login-reset-btn"
                    >
                        Use a different email address
                    </button>
                </IonCol>
            )}
        </form>
    );
};

export default EmailForm;
