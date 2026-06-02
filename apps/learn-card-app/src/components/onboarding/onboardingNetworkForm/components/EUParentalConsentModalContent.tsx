import React, { useState } from 'react';
import * as m from '../../../../../paraglide/messages.js';
import { renderParts } from '../../../../../i18n';
import { IonInput } from '@ionic/react';
import { useWallet } from 'learn-card-base';
import WarningCircle from '../../../svgs/WarningCircle';

// Basic email validation via native input + simple regex handled via UI
const EMAIL_REGEX = /[^@\s]+@[^@\s]+\.[^@\s]+/;

export type EUParentalConsentModalContentProps = {
    name?: string | null;
    dob?: string | null | undefined;
    country?: string | undefined;
    onClose: () => void;
};

const EUParentalConsentModalContent: React.FC<EUParentalConsentModalContentProps> = ({
    name,
    dob,
    country,
    onClose,
}) => {
    const { initWallet } = useWallet();

    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [sent, setSent] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSend = async () => {
        if (!EMAIL_REGEX.test(email.trim())) {
            setError(m['onboarding.consent.eu.error.invalidEmail']());
            return;
        }

        setError('');
        setLoading(true);
        try {
            const wallet = await initWallet();
            if (!wallet) throw new Error('Wallet not initialized');

            const response = await wallet.invoke.sendGuardianApprovalEmail({
                guardianEmail: email.trim(),
            });

            const payload = {
                email: email.trim(),
                name: name ?? '',
                dob: dob ?? '',
                country: country ?? '',
                createdAt: new Date().toISOString(),
                approvalUrl: response?.approvalUrl,
            };

            localStorage.setItem('eu_parental_consent_request', JSON.stringify(payload));
            setSent(true);
        } catch (e) {
            console.error('Failed to send guardian approval email:', e);
            setError(m['onboarding.consent.eu.error.sendFailed']());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-[10px] items-center w-full h-full justify-center px-[20px]">
            <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center max-w-[600px]">
                <div className="mx-auto mb-4 h-[60px] w-[60px] flex items-center justify-center">
                    <div className="flex items-center justify-center h-[60px] w-[60px]">
                        <WarningCircle className="h-full w-full" />
                    </div>
                </div>
                {!sent ? (
                    <>
                        <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                            {m['onboarding.consent.eu.heading']()}
                        </h2>
                        <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                            {m['onboarding.consent.eu.description']()}
                        </p>
                        <div className="mt-3">
                            <IonInput
                                type="email"
                                placeholder={m['onboarding.consent.eu.placeholder']()}
                                value={email}
                                onIonInput={e => {
                                    setError('');
                                    setEmail(e.detail.value ?? '');
                                }}
                                className={`bg-grayscale-100 text-grayscale-800 rounded-[12px] ion-padding font-medium tracking-wider text-base ${
                                    error ? 'login-input-email-error' : ''
                                }`}
                                aria-label="Parent Email"
                            />
                            {error && (
                                <p className="p-0 m-0 w-full text-left mt-1 text-red-600 text-xs">
                                    {error}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                            {m['onboarding.consent.eu.sent.heading']()}
                        </h2>
                        <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                            {m['onboarding.consent.eu.sent.description']({email})}
                        </p>
                    </>
                )}
            </div>
            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className=" shadow-button-bottom flex-1 py-[10px] text-[17px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                    >
                        {m['onboarding.back']()}
                    </button>
                    {!sent ? (
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={loading}
                            className=" shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                        >
                            {loading ? m['onboarding.consent.eu.sending']() : m['onboarding.consent.eu.sendRequest']()}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className=" shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                        >
                            {m['onboarding.consent.eu.done']()}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EUParentalConsentModalContent;
