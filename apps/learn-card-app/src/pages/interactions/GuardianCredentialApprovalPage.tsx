// NOTE: Guardian credential approval (LC-1729/1730/1731) is not feature complete.
// Guardian child accounts are full independent accounts with a guardian — not the same
// as family child accounts. Part of a larger goal of making child accounts independent
// of parent accounts.

import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage, IonSpinner, IonButton } from '@ionic/react';
import ReactCodeInput from 'react-code-input';
import { useParams } from 'react-router-dom';

import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';
import LearnCardTextLogo from '../../assets/images/learncard-text-logo.svg';
import LearnCardBrandMark from '../../assets/images/lca-brandmark.png';

type CredentialInfo = {
    inboxCredentialId: string;
    guardianStatus: string;
    issuer: { displayName: string; profileId: string };
    credentialName?: string;
    createdAt: string;
    expiresAt: string;
    canApproveInApp: boolean;
};

type PageState =
    | 'loading'
    | 'ready'
    | 'sending_code'
    | 'code_sent'
    | 'approving'
    | 'rejecting'
    | 'approved'
    | 'already_linked'
    | 'rejected'
    | 'error';

type LCNOpenInvoke = {
    getGuardianPendingCredential: (token: string) => Promise<CredentialInfo>;
    sendGuardianChallenge: (token: string) => Promise<{ message: string }>;
    approveGuardianCredential: (token: string, otpCode: string) => Promise<{ message: string; alreadyLinked: boolean }>;
    rejectGuardianCredential: (token: string, otpCode: string) => Promise<{ message: string }>;
    approveGuardianCredentialInApp: (inboxCredentialId: string) => Promise<{ success: boolean }>;
    rejectGuardianCredentialInApp: (inboxCredentialId: string) => Promise<{ success: boolean }>;
};

const toErrorMessage = (err: unknown): string =>
    err instanceof Error
        ? err.message
        : 'Something went wrong. The approval link may be invalid or expired.';

const getNetworkUrl = (): string => {
    const config = getResolvedTenantConfig();
    return config.apis?.brainService ?? 'https://network.learncard.com/trpc';
};

const GuardianCredentialApprovalPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();

    const [state, setState] = useState<PageState>('loading');
    const [credentialInfo, setCredentialInfo] = useState<CredentialInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [resultMessage, setResultMessage] = useState<string>('');
    const [otpCode, setOtpCode] = useState<string>('');
    const [canSkipOtp, setCanSkipOtp] = useState<boolean>(false);


    // Initialize wallet once
    const invokeRef = useRef<LCNOpenInvoke | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Missing approval token.');
            setState('error');
            return;
        }

        const init = async () => {
            try {
                const wallet = await initLearnCard({
                    seed: 'a',
                    network: getNetworkUrl(),
                    didkit,
                    allowRemoteContexts: true,
                });
                invokeRef.current = wallet.invoke as unknown as LCNOpenInvoke;

                const info = await invokeRef.current.getGuardianPendingCredential(token);
                setCredentialInfo(info);
                setCanSkipOtp(info.canApproveInApp);

                if (info.guardianStatus === 'GUARDIAN_APPROVED') {
                    setResultMessage('You have already approved this credential.');
                    setState('approved');
                } else if (info.guardianStatus === 'GUARDIAN_REJECTED') {
                    setResultMessage('You have already rejected this credential.');
                    setState('rejected');
                } else {
                    setState('ready');
                }
            } catch (e: unknown) {
                setError(toErrorMessage(e));
                setState('error');
            }
        };

        init();
    }, [token]);

    const handleSendCode = async () => {
        if (!token || !invokeRef.current) return;
        setState('sending_code');
        try {
            await invokeRef.current.sendGuardianChallenge(token);
            setState('code_sent');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const handleApprove = async () => {
        if (!token || !invokeRef.current || !otpCode) return;
        setState('approving');
        try {
            const res = await invokeRef.current.approveGuardianCredential(token, otpCode);
            setResultMessage(res.message ?? 'Credential approved.');
            setState(res.alreadyLinked ? 'already_linked' : 'approved');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const handleReject = async () => {
        if (!token || !invokeRef.current || !otpCode) return;
        setState('rejecting');
        try {
            const res = await invokeRef.current.rejectGuardianCredential(token, otpCode);
            setResultMessage(res.message ?? 'Credential rejected.');
            setState('rejected');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const handleApproveInApp = async () => {
        if (!invokeRef.current || !credentialInfo?.inboxCredentialId) return;
        setState('approving');
        try {
            await invokeRef.current.approveGuardianCredentialInApp(credentialInfo.inboxCredentialId);
            setResultMessage('Credential approved.');
            setState('approved');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const handleRejectInApp = async () => {
        if (!invokeRef.current || !credentialInfo?.inboxCredentialId) return;
        setState('rejecting');
        try {
            await invokeRef.current.rejectGuardianCredentialInApp(credentialInfo.inboxCredentialId);
            setResultMessage('Credential rejected.');
            setState('rejected');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const isProcessing = state === 'approving' || state === 'rejecting' || state === 'sending_code';

    return (
        <IonPage>
            <IonContent fullscreen color="emerald-700" className="flex flex-col flex-grow bg-emerald-700">
                <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center text-white">
                    <a href="/login" className="flex flex-col items-center justify-center w-full mb-8">
                        <img
                            src={LearnCardBrandMark}
                            alt="Learn Card brand mark"
                            className="w-[64px] h-[64px] mb-3"
                        />
                        <img src={LearnCardTextLogo} alt="Learn Card text logo" className="h-4" />
                    </a>

                    {state === 'loading' && (
                        <div className="flex flex-col items-center gap-3">
                            <IonSpinner color="light" />
                            <p className="font-semibold text-lg">Loading credential details…</p>
                        </div>
                    )}

                    {(state === 'ready' || state === 'sending_code' || state === 'code_sent') && credentialInfo && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Guardian Approval Required</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-6">
                                <strong>{credentialInfo.issuer.displayName}</strong> wants to issue a
                                credential to one of your students.
                            </p>

                            <div className="bg-white/10 rounded-2xl px-6 py-5 mb-8 w-full max-w-md text-left">
                                {credentialInfo.credentialName && (
                                    <div className="mb-3">
                                        <p className="text-emerald-200 text-xs uppercase tracking-wider mb-1">Credential</p>
                                        <p className="text-white font-semibold text-lg">{credentialInfo.credentialName}</p>
                                    </div>
                                )}
                                <div className="mb-1">
                                    <p className="text-emerald-200 text-xs uppercase tracking-wider mb-1">Issued by</p>
                                    <p className="text-white">{credentialInfo.issuer.displayName}</p>
                                </div>
                            </div>

                            {state === 'ready' && !canSkipOtp && (
                                <div className="w-full max-w-sm">
                                    <p className="text-emerald-100 text-sm mb-4">
                                        To approve or reject, we'll send a verification code to your email.
                                    </p>
                                    <p className="text-emerald-200 text-xs mb-4 leading-relaxed">
                                        By approving, your account will be linked with the student's account
                                        and you'll be able to manage their future credential approvals directly
                                        from your notifications.
                                    </p>
                                    <IonButton
                                        expand="block"
                                        color="light"
                                        onClick={handleSendCode}
                                        disabled={isProcessing}
                                    >
                                        Send Verification Code
                                    </IonButton>
                                </div>
                            )}

                            {state === 'ready' && canSkipOtp && (
                                <div className="w-full max-w-sm">
                                    <p className="text-emerald-100 text-sm mb-4">
                                        You have a guardian relationship with this student.
                                        You can approve or reject this credential directly.
                                    </p>
                                    <IonButton
                                        expand="block"
                                        color="light"
                                        onClick={handleApproveInApp}
                                        disabled={isProcessing}
                                    >
                                        Approve
                                    </IonButton>
                                    <IonButton
                                        expand="block"
                                        fill="outline"
                                        color="light"
                                        onClick={handleRejectInApp}
                                        disabled={isProcessing}
                                        className="mt-2"
                                    >
                                        Reject
                                    </IonButton>
                                </div>
                            )}

                            {state === 'sending_code' && (
                                <div className="flex flex-col items-center gap-3">
                                    <IonSpinner color="light" />
                                    <p className="font-semibold text-lg">Sending code…</p>
                                </div>
                            )}

                            {state === 'code_sent' && (
                                <div className="flex flex-col gap-3 w-full max-w-sm">
                                    <p className="text-emerald-100 text-sm mb-2">
                                        Enter the 6-digit code we sent to your email.
                                    </p>
                                    <ReactCodeInput
                                        name="guardianOtp"
                                        inputMode="numeric"
                                        fields={6}
                                        type="text"
                                        onChange={setOtpCode}
                                        className="react-code-input"
                                    />
                                    <IonButton
                                        expand="block"
                                        color="light"
                                        onClick={handleApprove}
                                        disabled={isProcessing || otpCode.length !== 6}
                                    >
                                        Approve
                                    </IonButton>
                                    <IonButton
                                        expand="block"
                                        fill="outline"
                                        color="light"
                                        onClick={handleReject}
                                        disabled={isProcessing || otpCode.length !== 6}
                                    >
                                        Reject
                                    </IonButton>
                                    <button
                                        className="text-emerald-200 text-sm underline mt-2 bg-transparent border-none cursor-pointer"
                                        onClick={() => { setOtpCode(''); setState('ready'); }}
                                    >
                                        Resend code
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {(state === 'approving' || state === 'rejecting') && (
                        <div className="flex flex-col items-center gap-3">
                            <IonSpinner color="light" />
                            <p className="font-semibold text-lg">
                                {state === 'approving' ? 'Approving…' : 'Rejecting…'}
                            </p>
                        </div>
                    )}

                    {state === 'approved' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Credential Approved</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-6">
                                {resultMessage || 'The credential has been approved. The recipient can now claim it.'}
                            </p>
                            <p className="text-emerald-100 text-sm max-w-[420px] mb-4">
                                Sign in or create a LearnCard account with this email to manage future approvals directly in the app.
                            </p>
                            <a
                                href="/login"
                                className="text-white font-semibold underline underline-offset-2 text-sm"
                            >
                                Log in / Sign up →
                            </a>
                        </>
                    )}

                    {state === 'already_linked' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Credential Approved</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-6">
                                The credential has been approved. Your LearnCard account has been linked to
                                this profile.
                            </p>
                            <a
                                href="/login"
                                className="text-white font-semibold underline underline-offset-2 text-sm"
                            >
                                Log in to LearnCard
                            </a>
                        </>
                    )}



                    {state === 'rejected' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Credential Rejected</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-4">
                                {resultMessage || 'The credential has been rejected and will not be issued.'}
                            </p>
                        </>
                    )}

                    {state === 'error' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-4">{error}</p>
                        </>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default GuardianCredentialApprovalPage;
