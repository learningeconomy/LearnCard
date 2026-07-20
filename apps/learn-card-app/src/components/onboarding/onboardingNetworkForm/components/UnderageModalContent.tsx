import React from 'react';
import * as m from '../../../../paraglide/messages.js';
import { IonInput, IonSpinner } from '@ionic/react';
import { ToastTypeEnum, useToast } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import WarningCircle from '../../../svgs/WarningCircle';
import LoggingOutPanel from './LoggingOutPanel';

export type UnderageModalContentProps = {
    onBack: () => void;
    onAdult: () => void;
    isLoggingOut: boolean;
    schoolCodes?: string[];
    onBypass: (code: string) => void;
    familyInviteUrl?: string;
};

const UnderageModalContent: React.FC<UnderageModalContentProps> = ({
    onBack,
    onAdult,
    isLoggingOut,
    schoolCodes = [],
    onBypass,
    familyInviteUrl,
}) => {
    const { presentToast } = useToast();
    const [view, setView] = React.useState<'adult' | 'school'>('adult');
    const [code, setCode] = React.useState('');
    const [error, setError] = React.useState('');
    const [isValidating, setIsValidating] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const handleVerifyCode = () => {
        if (!code) return;
        setIsValidating(true);
        setError('');

        setTimeout(() => {
            if (schoolCodes.includes(code.trim().toUpperCase())) {
                void onBypass(code.trim().toUpperCase());
            } else {
                setError(m['onboarding.consent.underage.schoolCode.error']());
            }
            setIsValidating(false);
        }, 800);
    };

    const isSchoolView = view === 'school';

    return (
        <div className="flex flex-col gap-[10px] items-center w-full h-full justify-center px-[20px] ">
            <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center max-w-[500px]">
                <div className="mx-auto mb-4 h-[60px] w-[60px] flex items-center justify-center">
                    <div className="flex items-center justify-center h-[60px] w-[60px]">
                        {isSchoolView ? (
                            <span className="text-[50px] leading-none">🎓</span>
                        ) : (
                            <WarningCircle className="h-full w-full" />
                        )}
                    </div>
                </div>
                <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                    {isSchoolView
                        ? m['onboarding.consent.underage.schoolCode.heading']()
                        : m['onboarding.consent.underage.heading']()}
                </h2>
                <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                    {isSchoolView
                        ? m['onboarding.consent.underage.schoolCode.description']()
                        : m['onboarding.consent.underage.description']()}
                </p>

                {!isSchoolView && familyInviteUrl && (
                    <div className="mt-5 p-4 rounded-[20px] bg-grayscale-10 border border-grayscale-200 flex flex-col items-center gap-3">
                        <p className="text-sm text-grayscale-700 leading-relaxed">
                            {m['onboarding.consent.underage.shareLink']()}
                        </p>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(familyInviteUrl);
                                    setCopied(true);
                                    window.setTimeout(() => setCopied(false), 2000);
                                } catch {
                                    setCopied(false);
                                    presentToast(m['onboarding.consent.underage.copyFailed'](), {
                                        type: ToastTypeEnum.Error,
                                        hasDismissButton: true,
                                    });
                                }
                            }}
                            className="w-full max-w-[320px] py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            {copied
                                ? m['onboarding.consent.underage.linkCopied']()
                                : m['onboarding.consent.underage.copyLink']()}
                        </button>
                    </div>
                )}

                {!isSchoolView ? (
                    schoolCodes.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-grayscale-100 w-full flex flex-col items-center gap-3">
                            <p className="text-grayscale-400 text-xs font-semibold uppercase tracking-widest">
                                {m['onboarding.consent.underage.or']()}
                            </p>
                            <button
                                type="button"
                                onClick={() => setView('school')}
                                className="text-emerald-700 font-semibold text-[15px] flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <span className="text-[18px]">🎓</span>{' '}
                                {m['onboarding.consent.underage.schoolCode.cta']()}
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-3 mt-6">
                        <div className="relative w-full">
                            <IonInput
                                value={code}
                                onIonInput={e => {
                                    setCode(e.detail.value ?? '');
                                    setError('');
                                }}
                                placeholder={m[
                                    'onboarding.consent.underage.schoolCode.placeholder'
                                ]()}
                                className={`bg-grayscale-100 rounded-[12px] px-4 py-2 text-grayscale-900 font-medium tracking-widest text-center ${
                                    error ? 'border-red-500 border' : ''
                                }`}
                            />
                            {code && !isValidating && error && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="w-5 h-5 text-red-500" />
                                </div>
                            )}
                        </div>
                        {error && <p className="text-red-600 text-[13px] mt-1">{error}</p>}
                    </div>
                )}
            </div>
            <LoggingOutPanel isLoggingOut={isLoggingOut} />
            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={isSchoolView ? () => setView('adult') : onBack}
                        className=" shadow-button-bottom flex-1 py-[10px] text-[17px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                    >
                        {m['onboarding.back']()}
                    </button>
                    <button
                        type="button"
                        onClick={isSchoolView ? handleVerifyCode : onAdult}
                        disabled={isSchoolView && (!code || isValidating)}
                        className=" shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom flex items-center justify-center min-h-[46px]"
                    >
                        {isSchoolView ? (
                            isValidating ? (
                                <IonSpinner name="crescent" className="h-5 w-5" />
                            ) : (
                                m['common.verify']()
                            )
                        ) : (
                            m['onboarding.consent.underage.adultButton']()
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnderageModalContent;
