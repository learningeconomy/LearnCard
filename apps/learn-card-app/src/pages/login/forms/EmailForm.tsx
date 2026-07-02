import React, { useState, useEffect } from 'react';
import * as m from '../../../paraglide/messages.js';
import { TransP } from '../../../i18n/TransP';
import { useLocale } from '../../../i18n';
import Countdown from 'react-countdown';
import { useHistory } from 'react-router-dom';
import ReactCodeInput from 'react-code-input';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { z } from 'zod';
import { getLogger } from 'learn-card-base';
const log = getLogger('email-form');

import useWallet from 'learn-card-base/hooks/useWallet';
import { useTheme } from '../../../theme/hooks/useTheme';
import {
    currentUserStore,
    getRandomBaseColor,
    redirectStore,
    usePathQuery,
    useSQLiteStorage,
    setPlatformPrivateKey,
} from 'learn-card-base';
import { walletStore } from 'learn-card-base/stores/walletStore';

import { IonCol } from '@ionic/react';

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
    resetRedirectPath?: string | null;
    smallVerificationInput?: boolean;
    emailInputClassName?: string;
    emailInputVariant?: 'default' | 'appStore';
    emailErrorPlacement?: 'inline' | 'below';
    startOverClassNameOverride?: string;
    resendCodeButtonClassNameOverride?: string;
    verificationCodeInputClassName?: string;
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
    resetRedirectPath = '/login',
    smallVerificationInput = false,
    emailInputClassName,
    emailInputVariant = 'default',
    emailErrorPlacement = 'inline',
    startOverClassNameOverride,
    resendCodeButtonClassNameOverride,
    verificationCodeInputClassName,
    setShowSocialLogins,
    showSocialLogins,
}) => {
    const { theme } = useTheme();
    const loginButtonBgColor = theme.colors.defaults.loginButtonBgColor;
    const loginButtonTextColor = theme.colors.defaults.loginButtonTextColor;

    const flags = useFlags();
    const query = usePathQuery();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();
    const { sendSignInLink, signInWithCustomFirebaseToken } = useFirebase();

    const enableMagicLinkLogin = flags?.enableMagicLinkLogin ?? false;

    const verificationEmail = redirectStore.get.email();
    const shouldVerifyCode = Boolean(query.get('verifyCode') || verificationEmail);

    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [currentStep, setCurrentStep] = useState<EmailFormStepsEnum>(EmailFormStepsEnum.email);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [codeError, setCodeError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const { mutateAsync: sendLoginVerificationCode } = useSendLoginVerificationCode();
    const { mutateAsync: verifyLoginVerificationCode } = useVerifyLoginVerificationCode();
    // Active UI locale — sent so the (pre-auth) login-code email matches the
    // language the user is currently viewing the app in.
    const locale = useLocale();

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

    const handleVerifyCode = async () => {
        if (validateCode()) {
            try {
                setCodeError('');
                setIsLoading(true);
                const response = await verifyLoginVerificationCode({
                    email: verificationEmail as string,
                    code: code,
                });
                if (response?.token) {
                    redirectStore.set.email(null);
                    await signInWithCustomFirebaseToken(response?.token);
                }
                setIsLoading(false);
            } catch (e) {
                setIsLoading(false);
                setCodeError(m['login.email.verification.error']());
            }
        }
    };

    useEffect(() => {
        if (currentStep === EmailFormStepsEnum.verification && code.length === 6 && !isLoading) {
            // auto verify code when 6 digits are entered
            handleVerifyCode();
        }
    }, [code, currentStep]);

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
            log.info('///login error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnClick = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (currentStep === EmailFormStepsEnum.email) {
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
                            await sendSignInLink(email, customRedirectUrl);
                            setIsLoading(false);
                        } catch (e) {
                            setIsLoading(false);
                            log.info('///sendSignInLink error', e);
                        }
                    } else {
                        try {
                            setIsLoading(true);
                            await sendLoginVerificationCode({ email, locale });
                            redirectStore.set.email(email);
                            setCurrentStep(EmailFormStepsEnum.verification);
                            setIsLoading(false);
                        } catch (e) {
                            setIsLoading(false);
                            log.info('///sendLoginVerificationCode error', e);
                        }
                    }

                    setEmail('');
                }
            }
        } else if (currentStep === EmailFormStepsEnum.verification) {
            await handleVerifyCode();
        }
    };

    const handleResendCode = async () => {
        setIsResendCodeLoading(true);
        try {
            await sendLoginVerificationCode({ email: verificationEmail as string, locale });
            setIsResendCodeLoading(false);
        } catch (e) {
            setIsResendCodeLoading(false);
            log.info('///sendLoginVerificationCode error', e);
        }
    };

    const resetForm = () => {
        setCurrentStep(EmailFormStepsEnum.email);
        if (resetRedirectPath !== null) {
            history.replace(resetRedirectPath);
        }
        redirectStore.set.email(null);
        setEmail('');
    };

    const resendCodeButtonText: string = isResendCodeLoading
        ? m['common.sendingCode']()
        : m['common.resendCode']();

    let disabled = isLoading;
    if (currentStep === EmailFormStepsEnum.email) {
        formTitle = null;

        const defaultEmailInputClassName =
            'bg-white/20 text-white placeholder:text-white white-placeholder';
        const resolvedEmailInputClassName = emailInputClassName ?? defaultEmailInputClassName;

        const emailError = errors.email?.[0];

        const emailInputBaseClassName =
            emailInputVariant === 'appStore'
                ? 'w-full px-4 py-3 bg-grayscale-100 border rounded-[15px] font-medium text-base text-grayscale-900 placeholder:text-grayscale-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                : 'rounded-[15px] w-full ion-padding font-medium tracking-widest text-base focus:outline-none focus:ring-0 focus:border-transparent';

        const emailInputErrorClassName =
            emailInputVariant === 'appStore'
                ? emailError
                    ? 'border-red-300'
                    : 'border-grayscale-200'
                : emailError
                ? 'login-input-email-error'
                : '';

        activeStep = (
            <div
                className={`w-full ${
                    emailErrorPlacement === 'below' ? 'flex flex-col' : 'flex items-center'
                } justify-center`}
            >
                <input
                    aria-label="Email"
                    className={`${emailInputBaseClassName} ${resolvedEmailInputClassName} ${emailInputErrorClassName}`}
                    placeholder={m['login.email.placeholder']()}
                    onChange={e => setEmail(e.target.value)}
                    value={email}
                    type="text"
                />
                {emailError &&
                    (emailErrorPlacement === 'below' ? (
                        <p className="w-full mt-2 text-red-500 font-medium">{emailError}</p>
                    ) : (
                        <p className="login-input-error-msg">{emailError}</p>
                    ))}
            </div>
        );
        // buttonTitle = 'Continue';
        buttonTitle = buttonTitleOverride ?? m['login.email.button']();
        if (isLoading) buttonTitle = m['common.sendingCode']();
        disabled = !email || isLoading;
    } else if (currentStep === EmailFormStepsEnum.verification) {
        formTitle = (
            <TransP
                m={m['common.enterVerificationCode']}
                components={[
                    <span
                        key="0"
                        className={startOverClassNameOverride ?? 'text-white underline font-bold'}
                        onClick={resetForm}
                    />,
                ]}
            />
        );
        activeStep = (
            <IonCol size="12" className="w-full ion-no-padding ion-no-margin mb-[20px]">
                <ReactCodeInput
                    name="phoneVerification"
                    inputMode="numeric"
                    fields={6}
                    type="text"
                    onChange={e => setCode(e)}
                    className={`react-code-input ${smallVerificationInput ? 'small' : ''} ${
                        verificationCodeInputClassName ?? ''
                    } ${errors.code || codeError ? 'react-code-input-error' : ''}`}
                />
                {errors?.code?.[0] && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">
                        {errors?.code?.[0]}
                    </p>
                )}
                {codeError && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">{codeError}</p>
                )}
            </IonCol>
        );
        buttonTitle = isLoading ? m['common.verifying']() : m['common.verify']();
        disabled = code?.length < 6 || isLoading;
    }

    return (
        <form onSubmit={handleOnClick} className="w-full">
            {formTitle && (
                <IonCol size="12">
                    <div
                        className={
                            formTitleClassNameOverride ?? 'w-full font-medium text-white normal'
                        }
                    >
                        {formTitle}
                    </div>
                </IonCol>
            )}

            {activeStep}
            <div className="flex items-center justify-center py-[20px] w-full mx-auto">
                <button
                    className={`ion-padding w-full font-bold rounded-[15px] disabled:opacity-50 ${
                        !loginButtonBgColor ? 'bg-grayscale-900' : ''
                    } ${!loginButtonTextColor ? 'text-white' : ''} ${buttonClassName}`}
                    style={{
                        ...(loginButtonBgColor ? { backgroundColor: loginButtonBgColor } : {}),
                        ...(loginButtonTextColor ? { color: loginButtonTextColor } : {}),
                    }}
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
                                    className={
                                        resendCodeButtonClassNameOverride ??
                                        'text-white font-bold mt-4 border-b-white border-solid border-b-[1px]'
                                    }
                                >
                                    {resendCodeButtonText}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className={
                                        resendCodeButtonClassNameOverride ??
                                        'text-white font-bold mt-4 border-b-white border-solid border-b-[1px]'
                                    }
                                >
                                    {m['common.resendIn']({ seconds })}
                                </button>
                            )
                        }
                    />
                </div>
            )}
        </form>
    );
};

export default EmailForm;
