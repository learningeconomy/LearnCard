import React, { useState, useEffect } from 'react';
import ReactCodeInput from 'react-code-input';
import PhoneInput from 'react-phone-number-input';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { z } from 'zod';

import { authStore, isPlatformAndroid, destroyRecaptcha } from 'learn-card-base';
import { useFirebase } from '../../../hooks/useFirebase';

import { IonCol, IonInput, IonCheckbox, IonToggle, IonRouterLink, useIonToast } from '@ionic/react';

import { PhoneFormStepsEnum } from 'learn-card-base';

import 'react-phone-number-input/style.css';

const PhoneValidator = z.object({
    phone: z.string().nonempty('Phone is required!'),
});

const CodeValidator = z.object({
    code: z.string().min(6, 'Invalid code'),
});

const PhoneForm: React.FC = () => {
    const {
        sendSmsAuthCode,
        verifySmsAuthCode,
        verifySmsAuthCodeOnNative,
        loginAfterAutoVerifiedSMS,
    } = useFirebase();
    const [presentToast] = useIonToast();

    const [currentStep, setCurrentStep] = useState<PhoneFormStepsEnum>(PhoneFormStepsEnum.phone);
    const [phone, setPhone] = useState<any>('');
    const [code, setCode] = useState<string | number>('');
    const [password, setPassword] = useState<string | null | undefined>('');

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
            } else {
                setIsLoading(false);
                setIsResendCodeLoading(false);
            }
        });

        FirebaseAuthentication.addListener('phoneVerificationCompleted', e => {
            loginAfterAutoVerifiedSMS(
                e?.verificationCode,
                () => {
                    setIsLoading(false);
                },
                (err: string) => {
                    setIsLoading(false);
                    setCodeError(err);
                }
            );
        });

        // FirebaseAuthentication.addListener('authStateChange', e => {
        //     console.log('📞📞📞 authStateChange::res 📞📞📞', e);
        // });
    }, []);

    const resetForm = () => {
        destroyRecaptcha();
        setCurrentStep(PhoneFormStepsEnum.phone);
        setPhone('');
        setCode('');
        setPassword('');
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
        presentToast({
            message: 'A verification code has been sent',
            duration: 6000,
            buttons: [
                {
                    text: 'Dismiss',
                    role: 'cancel',
                },
            ],
            position: 'top',
            cssClass: 'login-link-success-toast',
        });
    };

    const handleOnClick = async (e: React.FormEvent, resendCode = false) => {
        e.preventDefault();
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

    let activeStep: React.ReactNode | null = null;
    let formTitle: React.ReactNode | null = null;
    let buttonTitle: string | null = null;
    const resendCodeButtonText: string = isResendCodeLoading ? 'Sending Code...' : 'Resend Code';

    if (currentStep === PhoneFormStepsEnum.phone) {
        formTitle = (
            <p className="font-medium text-sm text-grayscale-600 uppercase">
                Login With Phone Number
            </p>
        );

        activeStep = (
            <IonCol size="12">
                <PhoneInput
                    placeholder="Phone Number"
                    countryOptionsOrder={['US', 'CA', 'AU', '|', '...']}
                    defaultCountry="US"
                    value={phone}
                    onChange={setPhone}
                    className={`login-phone-input ${
                        errors?.phone || error ? 'login-phone-input-error' : ''
                    }`}
                />
                {errors?.phone && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">
                        {errors?.phone}
                    </p>
                )}
                {error && (
                    <p className="w-full text-center mt-2 text-red-500 font-medium">{error}</p>
                )}
            </IonCol>
        );
        buttonTitle = isLoading ? 'Loading...' : 'Send Code';
    } else if (currentStep === PhoneFormStepsEnum.verification) {
        formTitle = (
            <p className=" text-grayscale-600 font-bold text-center text-lg">
                Enter verification code or{' '}
                <span className="login-start-over-span text-indigo-500" onClick={resetForm}>
                    start over
                </span>
            </p>
        );
        activeStep = (
            <IonCol size="12" className="w-full flex flex-col items-center justify-center">
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
        buttonTitle = buttonTitle = isLoading ? 'Verifying...' : 'Verify';
    } else if (currentStep === PhoneFormStepsEnum.passwordExistingUser) {
        formTitle = <p className="font-medium text-grayscale-600 uppercase">Password</p>;
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
            <IonCol size="12">{formTitle}</IonCol>
            {activeStep}
            <IonCol size="12" className="flex items-center justify-center">
                <button
                    onClick={handleOnClick}
                    className="bg-sp-purple-base text-white ion-padding w-full font-bold rounded-[30px]"
                >
                    {buttonTitle}
                </button>
            </IonCol>
            {currentStep === PhoneFormStepsEnum.verification && (
                <IonCol size="12">
                    <button
                        onClick={e => handleOnClick(e, true)}
                        className="text-gray-700 ion-padding w-full font-bold rounded-[30px] mt-4 border-solid border-gray-300 border-[2px]"
                    >
                        {resendCodeButtonText}
                    </button>
                </IonCol>
            )}
            {currentStep === PhoneFormStepsEnum.passwordNewUser && (
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

export default PhoneForm;
