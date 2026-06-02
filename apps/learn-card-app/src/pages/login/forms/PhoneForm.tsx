import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Countdown from 'react-countdown';
import ReactCodeInput from 'react-code-input';
import PhoneInput from 'react-phone-number-input';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { z } from 'zod';

import {
    authStore,
    isPlatformAndroid,
    destroyRecaptcha,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useFirebase } from '../../../hooks/useFirebase';
import { useTheme } from '../../../theme/hooks/useTheme';

import { IonCol, IonInput, IonCheckbox, IonToggle, IonRouterLink } from '@ionic/react';
import AppStoreDownloadButtons from '../appStoreButtons/AppStoreDownloadButtons';

import { PhoneFormStepsEnum } from 'learn-card-base';

import 'react-phone-number-input/style.css';

const PhoneValidator = z.object({
    phone: z.string().nonempty('Phone is required!'),
});

const CodeValidator = z.object({
    code: z.string().min(6, 'Invalid code'),
});

type PhoneFormProps = {
    formTitleOverride?: string;
    formTitleClassNameOverride?: string;
    buttonClassName?: string;
    smallVerificationInput?: boolean;
    phoneInputClassNameOverride?: string;
    verificationCodeInputClassName?: string;
    startOverClassNameOverride?: string;
    resendCodeButtonClassNameOverride?: string;
    setShowSocialLogins: React.Dispatch<React.SetStateAction<boolean>>;
    showSocialLogins: boolean;
};

const PhoneForm: React.FC<PhoneFormProps> = ({
    formTitleOverride,
    formTitleClassNameOverride,
    buttonClassName,
    smallVerificationInput,
    phoneInputClassNameOverride,
    verificationCodeInputClassName,
    startOverClassNameOverride,
    resendCodeButtonClassNameOverride,
    setShowSocialLogins,
    showSocialLogins,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const loginButtonBgColor = theme.colors.defaults.loginButtonBgColor;
    const loginButtonTextColor = theme.colors.defaults.loginButtonTextColor;

    const {
        sendSmsAuthCode,
        verifySmsAuthCode,
        verifySmsAuthCodeOnNative,
        loginAfterAutoVerifiedSMS,
    } = useFirebase();
    const { presentToast } = useToast();

    const [currentStep, setCurrentStep] = useState<PhoneFormStepsEnum>(PhoneFormStepsEnum.phone);
    const [phone, setPhone] = useState<any>('');
    const [code, setCode] = useState<string>('');
    const [password, setPassword] = useState<string | null | undefined>('');
    const [autoValidateCodeTriggered, setAutoValidateCodeTriggered] = useState(false);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [error, setError] = useState<string>('');
    const [codeError, setCodeError] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isResendCodeLoading, setIsResendCodeLoading] = useState<boolean>(false);

    useEffect(() => {
        FirebaseAuthentication.addListener('phoneCodeSent', e => {
            console.log('📞📞📞 phoneCodeSent::res 📞📞📞', e);

            const verificationId = e?.verificationId;

            if (e?.verificationId) {
                authStore.set.verificationId(verificationId);
                showSuccessToast();
                setCurrentStep(PhoneFormStepsEnum.verification);
                setIsLoading(false);
                setIsResendCodeLoading(false);
                setShowSocialLogins(false);
            } else {
                setIsLoading(false);
                setIsResendCodeLoading(false);
            }
        });

        FirebaseAuthentication.addListener('phoneVerificationCompleted', e => {
            console.log('📞📞📞 phoneVerificationCompleted::res 📞📞📞', e);
            loginAfterAutoVerifiedSMS(
                e?.verificationCode,
                () => {
                    setIsLoading(false);
                },
                (err: string) => {
                    setIsLoading(false);
                    setCodeError(err || '');
                }
            );
        });
    }, []);

    const resetForm = () => {
        destroyRecaptcha();
        setCurrentStep(PhoneFormStepsEnum.phone);
        setPhone('');
        setCode('');
        setPassword('');
        setShowSocialLogins(true);
    };

    const validate = () => {
        const parsedData = PhoneValidator.safeParse({
            phone,
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

    const showSuccessToast = () => {
        presentToast(t('login.phone.smsSent', 'A verification code has been sent'), {
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
        });
    };

    const handleOnClick = async (e?: React.FormEvent, resendCode = false) => {
        e?.preventDefault();
        e?.stopPropagation();

        if (!resendCode) {
            setIsLoading(true);
        } else {
            setIsResendCodeLoading(true);
        }

        if (currentStep === PhoneFormStepsEnum.phone || resendCode) {
            if (validate()) {
                // native sms auth
                if (Capacitor.isNativePlatform()) {
                    FirebaseAuthentication.signInWithPhoneNumber({
                        phoneNumber: phone,
                        skipNativeAuth: isPlatformAndroid() ? true : false,
                    });
                    // .then(({ verificationId }) => {
                    //     authStore.set.verificationId(verificationId);
                    //     showSuccessToast();
                    //     setCurrentStep(PhoneFormStepsEnum.verification);
                    //     setIsLoading(false);
                    //     setIsResendCodeLoading(false);
                    // })
                    // .catch(err => {
                    //     setIsLoading(false);
                    //     setIsResendCodeLoading(false);
                    //     setError(err.errorMessage);
                    // });
                } else {
                    // web sms auth
                    sendSmsAuthCode(
                        phone,
                        () => {
                            setIsLoading(false);
                            setIsResendCodeLoading(false);
                            showSuccessToast();
                            setCurrentStep(PhoneFormStepsEnum.verification);
                            setShowSocialLogins(false);
                        },
                        (err: string) => {
                            setIsLoading(false);
                            setIsResendCodeLoading(false);
                            setError(err);
                        }
                    );
                }
            }
        } else if (currentStep === PhoneFormStepsEnum.verification) {
            if (validateCode()) {
                if (Capacitor.isNativePlatform()) {
                    const verificationId = authStore.get.verificationId();
                    // native sms code  verification
                    await verifySmsAuthCodeOnNative(
                        verificationId,
                        code,
                        () => {
                            setIsLoading(false);
                        },
                        (err: string) => {
                            setIsLoading(false);
                            setCodeError(err);
                        }
                    );
                } else {
                    // web sms code  verification
                    verifySmsAuthCode(
                        code,
                        () => {
                            setIsLoading(false);
                        },
                        (err: string) => {
                            setIsLoading(false);
                            setCodeError(err);
                        }
                    );
                }
            }
        }
        // } else if (currentStep === PhoneFormStepsEnum.passwordExistingUser) {
        //     // todo: trigger login to existing account
        // } else if (currentStep === PhoneFormStepsEnum.passwordNewUser) {
        //     // todo: trigger creating new account
        // }
    };

    // Try to auto validate the code (once)
    useEffect(() => {
        if (code?.length === 6 && !autoValidateCodeTriggered) {
            setAutoValidateCodeTriggered(true);
            handleOnClick();
        }
    }, [code, autoValidateCodeTriggered]);

    let activeStep: React.ReactNode | null = null;
    let formTitle: React.ReactNode | null = null;
    let buttonTitle: string | null = null;
    const resendCodeButtonText: string = isResendCodeLoading ? t('login.phone.resending', 'Sending Code...') : t('login.phone.resend', 'Resend Code');

    let disabled = isLoading;
    if (currentStep === PhoneFormStepsEnum.phone) {
        formTitle = null;

        activeStep = (
            <IonCol size="12" className="ion-no-padding">
                <PhoneInput
                    placeholder={t('login.phone.placeholder', 'Phone Number')}
                    countryOptionsOrder={['US', 'CA', 'AU', '|', '...']}
                    defaultCountry="US"
                    value={phone}
                    onChange={setPhone}
                    className={`login-phone-input ${phoneInputClassNameOverride ?? ''} ${
                        errors?.phone || error ? 'login-phone-input-error' : ''
                    }`}
                />
                {errors?.phone?.[0] && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">
                        {errors?.phone?.[0]}
                    </p>
                )}
                {error && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">{error}</p>
                )}
            </IonCol>
        );
        buttonTitle = isLoading ? t('login.phone.loading', 'Loading...') : t('login.phone.button', 'Sign in with SMS');
        disabled = !phone || isLoading;
    } else if (currentStep === PhoneFormStepsEnum.verification) {
        formTitle = (
            <Trans
                i18nKey="login.phone.verification.title"
                defaults="Enter verification code or <0>start over</0>"
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
        buttonTitle = isLoading ? t('login.phone.verification.verifying', 'Verifying...') : t('login.phone.verification.verify', 'Verify');
    } else if (currentStep === PhoneFormStepsEnum.passwordExistingUser) {
        formTitle = <p className="font-medium text-grayscale-600 normal">Password</p>;
        activeStep = (
            <IonCol size="12">
                <IonInput
                    autocapitalize="on"
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                    placeholder={t('login.phone.password.placeholder', 'Password')}
                    // todo: add view password toggle
                    onIonInput={e => setPassword(e.detail.value)}
                    value={password}
                    type="password"
                />
                <IonCol size="12" className="flex items-center justify-end mt-3">
                    <p className="mr-3 text-gray-700 font-medium text-lg">{t('login.phone.password.staySignedIn', 'Stay Signed In')}</p>{' '}
                    <IonToggle />
                </IonCol>
            </IonCol>
        );
        buttonTitle = t('login.phone.password.login', 'Login');
    } else if (currentStep === PhoneFormStepsEnum.passwordNewUser) {
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
                        <Trans
                            i18nKey="login.phone.password.agreeToTerms"
                            defaults="Agree to <0>Terms</0>"
                            components={[<IonRouterLink key="t" href="#" className="font-semibold login-terms-span" />]}
                        />
                    </p>{' '}
                    <IonCheckbox />
                </IonCol>
            </IonCol>
        );
        buttonTitle = t('login.phone.password.create', 'Create Account');
    }

    return (
        <form onSubmit={e => handleOnClick(e)} className="w-full !margin-0 !padding-0">
            {formTitle && (
                <IonCol size="12">
                    <p className={formTitleClassNameOverride ?? ''}>{formTitle}</p>
                </IonCol>
            )}
            {activeStep}
            <div className="flex items-center justify-center mt-[20px] pb-[20px]">
                <button
                    onClick={handleOnClick}
                    className={`ion-padding w-full font-bold rounded-[15px] disabled:opacity-50 ${!loginButtonBgColor ? 'bg-grayscale-900' : ''} ${!loginButtonTextColor ? 'text-white' : ''} ${buttonClassName}`}
                    style={{
                        ...(loginButtonBgColor ? { backgroundColor: loginButtonBgColor } : {}),
                        ...(loginButtonTextColor ? { color: loginButtonTextColor } : {}),
                    }}
                    disabled={disabled}
                >
                    {buttonTitle}
                </button>
            </div>
            {currentStep === PhoneFormStepsEnum.phone && <AppStoreDownloadButtons />}
            {currentStep === PhoneFormStepsEnum.verification && (
                <div className="flex items-center justify-center w-full">
                    <Countdown
                        date={Date.now() + 30000} // 30 seconds
                        renderer={({ seconds, completed }) =>
                            completed ? (
                                <button
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleOnClick(e, true);
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
                                    {t('login.phone.resendIn', 'Resend in {{seconds}}s', { seconds })}
                                </button>
                            )
                        }
                    />
                </div>
            )}
            {currentStep === PhoneFormStepsEnum.passwordNewUser && (
                <IonCol
                    size="12"
                    className="text-center mt-4 text-gray-700 font-medium text-lg login-existing-account"
                >
                    <p>{t('login.phone.password.existingAccount', 'Already have an account?')}</p>
                    <button
                        onClick={resetForm}
                        className="w-full text-center font-bold text-lg login-reset-btn"
                    >
                        {t('login.phone.password.differentEmail', 'Use a different email address')}
                    </button>
                </IonCol>
            )}
        </form>
    );
};

export default PhoneForm;
