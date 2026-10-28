import React, { useState, useEffect, useRef } from 'react';
import * as m from '../../../paraglide/messages.js';
import { TransP } from '../../../i18n/TransP';
import Countdown from 'react-countdown';
import PhoneInput from 'react-phone-number-input';
import { Capacitor } from '@capacitor/core';
import { z } from 'zod';
import { getLogger } from 'learn-card-base';
const log = getLogger('phone-form');

import { useSignInAdapter, useToast, ToastTypeEnum } from 'learn-card-base';
import { useFirebase } from '../../../hooks/useFirebase';
import { useTheme } from '../../../theme/hooks/useTheme';

import { IonCol } from '@ionic/react';
import AppStoreDownloadButtons from '../appStoreButtons/AppStoreDownloadButtons';
import AccessibleCodeInput from './AccessibleCodeInput';
import LoginErrorMessage from './LoginErrorMessage';
import {
    MAX_PHONE_CODE_ATTEMPTS,
    RESEND_CODE_COOLDOWN_MS,
    classifyPhoneAuthError,
    getPhoneAuthErrorMessage,
    type PhoneAuthErrorKind,
} from './phoneAuthErrors';

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
    const { theme } = useTheme();
    const adapter = useSignInAdapter();
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
    const [phone, setPhone] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [autoValidateCodeTriggered, setAutoValidateCodeTriggered] = useState(false);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [error, setError] = useState<PhoneAuthErrorKind | null>(null);
    const [codeError, setCodeError] = useState<PhoneAuthErrorKind | null>(null);
    const [isVerifyLocked, setIsVerifyLocked] = useState<boolean>(false);
    const [countdownEndTime, setCountdownEndTime] = useState<number | null>(null);
    const [codeInputKey, setCodeInputKey] = useState<number>(0);
    const failedAttemptsRef = useRef<number>(0);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isResendCodeLoading, setIsResendCodeLoading] = useState<boolean>(false);

    // Called whenever a fresh code is sent (first send or resend): new session, new limits.
    const startVerificationSession = () => {
        failedAttemptsRef.current = 0;
        setIsVerifyLocked(false);
        setCodeError(null);
        setError(null);
        setCode('');
        setCodeInputKey(k => k + 1);
        setAutoValidateCodeTriggered(false);
        setCountdownEndTime(Date.now() + RESEND_CODE_COOLDOWN_MS);
        setCurrentStep(PhoneFormStepsEnum.verification);
        setShowSocialLogins(false);
    };

    const handleSendError = (err: unknown, resendCode: boolean) => {
        setIsLoading(false);
        setIsResendCodeLoading(false);
        const kind = classifyPhoneAuthError(err);
        if (kind === 'cancelled') return;
        if (resendCode) setCodeError(kind);
        else setError(kind);
    };

    const handleVerifyError = (err: unknown) => {
        setIsLoading(false);
        const kind = classifyPhoneAuthError(err);
        if (kind === 'invalidCode') failedAttemptsRef.current += 1;
        if (kind === 'tooManyRequests') {
            setIsVerifyLocked(true);
        }
        setCodeError(kind);
    };

    // The adapter subscriptions below are set up once per adapter; keep the latest
    // hook function reachable so the auto-verify callback never runs a stale closure.
    const loginAfterAutoVerifiedSMSRef = useRef(loginAfterAutoVerifiedSMS);
    loginAfterAutoVerifiedSMSRef.current = loginAfterAutoVerifiedSMS;

    useEffect(() => {
        const unsubscribeSent = adapter.onPhoneCodeSent(() => {
            if (Capacitor.isNativePlatform()) {
                showSuccessToast();
                setIsLoading(false);
                setIsResendCodeLoading(false);
                startVerificationSession();
            }
        });

        const unsubscribeCompleted = adapter.onPhoneVerificationCompleted(code => {
            loginAfterAutoVerifiedSMSRef.current(
                code ?? '',
                () => {
                    setIsLoading(false);
                },
                handleVerifyError
            );
        });
        const unsubscribeFailed = adapter.onPhoneVerificationFailed(error => {
            setIsLoading(false);
            setIsResendCodeLoading(false);
            const kind = classifyPhoneAuthError(error);
            if (kind === 'cancelled') return;
            setError(kind);
            setCodeError(null);
            setCode('');
            setCountdownEndTime(null);
            setAutoValidateCodeTriggered(false);
            setCurrentStep(PhoneFormStepsEnum.phone);
            setShowSocialLogins(true);
        });
        return () => {
            unsubscribeSent();
            unsubscribeCompleted();
            unsubscribeFailed();
            adapter.cleanup?.();
        };
    }, [adapter]);

    const resetForm = () => {
        adapter.cleanup?.();
        setCurrentStep(PhoneFormStepsEnum.phone);
        setPhone('');
        setCode('');
        setError(null);
        setCodeError(null);
        setErrors({});
        setIsVerifyLocked(false);
        failedAttemptsRef.current = 0;
        setCountdownEndTime(null);
        setAutoValidateCodeTriggered(false);
        setIsLoading(false);
        setIsResendCodeLoading(false);
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
        presentToast(m['login.phone.smsSent'](), {
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
                    void adapter.sendPhoneOtp(phone).catch(error => {
                        log.error('Phone code request failed', error);
                        handleSendError(error, resendCode);
                    });
                } else {
                    // web sms auth
                    sendSmsAuthCode(
                        phone,
                        () => {
                            setIsLoading(false);
                            setIsResendCodeLoading(false);
                            showSuccessToast();
                            startVerificationSession();
                        },
                        (err: unknown) => handleSendError(err, resendCode)
                    );
                }
            }
        } else if (currentStep === PhoneFormStepsEnum.verification) {
            if (isVerifyLocked) {
                setIsLoading(false);
                return;
            }
            // Same as the email server limit: the attempt after the 5th failure is rejected.
            if (failedAttemptsRef.current >= MAX_PHONE_CODE_ATTEMPTS) {
                setIsLoading(false);
                setIsVerifyLocked(true);
                setCodeError('tooManyAttempts');
                return;
            }
            if (validateCode()) {
                setCodeError(null);
                if (Capacitor.isNativePlatform()) {
                    // native sms code  verification
                    await verifySmsAuthCodeOnNative(
                        code,
                        () => {
                            setIsLoading(false);
                        },
                        handleVerifyError
                    );
                } else {
                    // web sms code  verification
                    verifySmsAuthCode(
                        code,
                        () => {
                            setIsLoading(false);
                        },
                        handleVerifyError
                    );
                }
            }
        }
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
    const resendCodeButtonText: string = isResendCodeLoading
        ? m['common.sendingCode']()
        : m['common.resendCode']();

    const phoneErrorMessage = errors?.phone?.[0] ?? (error ? getPhoneAuthErrorMessage(error) : '');
    const verificationError =
        errors?.code?.[0] ?? (codeError ? getPhoneAuthErrorMessage(codeError) : '');
    const activeError =
        currentStep === PhoneFormStepsEnum.phone ? phoneErrorMessage : verificationError;
    const activeErrorId =
        currentStep === PhoneFormStepsEnum.phone ? 'login-phone-error' : 'login-phone-code-error';

    let disabled = isLoading;
    if (currentStep === PhoneFormStepsEnum.phone) {
        formTitle = null;

        activeStep = (
            <IonCol size="12" className="ion-no-padding">
                <label htmlFor="login-phone" className="sr-only">
                    {m['login.phone.placeholder']()}
                </label>
                <PhoneInput
                    id="login-phone"
                    aria-invalid={Boolean(phoneErrorMessage)}
                    aria-describedby={phoneErrorMessage ? 'login-phone-error' : undefined}
                    placeholder={m['login.phone.placeholder']()}
                    countryOptionsOrder={['US', 'CA', 'AU', '|', '...']}
                    defaultCountry="US"
                    value={phone}
                    onChange={value => {
                        setPhone(value ?? '');
                        setError(null);
                    }}
                    className={`login-phone-input ${phoneInputClassNameOverride ?? ''}`}
                />
            </IonCol>
        );
        buttonTitle = isLoading ? m['common.loading']() : m['login.phone.button']();
        disabled = !phone || isLoading;
    } else if (currentStep === PhoneFormStepsEnum.verification) {
        formTitle = (
            <TransP
                m={m['common.enterVerificationCode']}
                components={[
                    <button
                        key="0"
                        type="button"
                        aria-label="Start over"
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
                <AccessibleCodeInput
                    key={codeInputKey}
                    name="phoneVerification"
                    label={m['common.enterVerificationCode']()}
                    errorId={verificationError ? 'login-phone-code-error' : undefined}
                    isValid={!verificationError}
                    inputMode="numeric"
                    fields={6}
                    type="text"
                    onChange={e => setCode(e)}
                    className={`react-code-input ${smallVerificationInput ? 'small' : ''} ${
                        verificationCodeInputClassName ?? ''
                    }`}
                />
            </IonCol>
        );
        buttonTitle = isLoading ? m['common.verifying']() : m['common.verify']();
        disabled = code?.length < 6 || isLoading || isVerifyLocked;
    }

    return (
        <form onSubmit={e => handleOnClick(e)} className="w-full !margin-0 !padding-0">
            {formTitle && (
                <IonCol size="12">
                    <p className={formTitleClassNameOverride ?? ''}>{formTitle}</p>
                </IonCol>
            )}
            {activeStep}
            {activeError && (
                <LoginErrorMessage
                    id={activeErrorId}
                    message={activeError}
                    className={currentStep === PhoneFormStepsEnum.phone ? 'mt-4' : 'mt-2.5'}
                />
            )}
            <div className="flex items-center justify-center mt-[20px] pb-[20px]">
                <button
                    type="submit"
                    onClick={handleOnClick}
                    className={`ion-padding w-full font-bold rounded-[15px] disabled:opacity-50 ${
                        !loginButtonBgColor ? 'bg-grayscale-900' : ''
                    } ${!loginButtonTextColor ? 'text-white' : ''} ${buttonClassName}`}
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
                        key={countdownEndTime ?? 0}
                        date={countdownEndTime ?? Date.now()}
                        renderer={({ seconds, completed }) =>
                            completed || !countdownEndTime ? (
                                <button
                                    type="button"
                                    disabled={isResendCodeLoading}
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleOnClick(e, true);
                                    }}
                                    className={
                                        resendCodeButtonClassNameOverride ??
                                        'text-white font-bold mt-4 border-b-white border-solid border-b'
                                    }
                                >
                                    {resendCodeButtonText}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className={
                                        resendCodeButtonClassNameOverride ??
                                        'text-white font-bold mt-4 border-b-white border-solid border-b'
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

export default PhoneForm;
