import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage, IonSpinner, IonButton, IonInput, IonItem } from '@ionic/react';
import { useParams } from 'react-router-dom';

import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

import LearnCardTextLogo from '../../assets/images/learncard-text-logo.svg';
import LearnCardBrandMark from '../../assets/images/lca-brandmark.png';

type CredentialInfo = {
    inboxCredentialId: string;
    guardianStatus: string;
    issuer: { displayName: string; profileId: string };
    credentialName?: string;
    createdAt: string;
    expiresAt: string;
};

type PageState =
    | 'loading'
    | 'ready'
    | 'sending_code'
    | 'code_sent'
    | 'approving'
    | 'rejecting'
    | 'approved'
    | 'rejected'
    | 'upgrade_prompt'
    | 'registering'
    | 'registered'
    | 'error';

type LCNOpenInvoke = {
    getGuardianPendingCredential: (token: string) => Promise<CredentialInfo>;
    sendGuardianChallenge: (token: string) => Promise<{ message: string }>;
    approveGuardianCredential: (token: string, otpCode: string) => Promise<{ message: string }>;
    rejectGuardianCredential: (token: string, otpCode: string) => Promise<{ message: string }>;
    registerGuardianAsManager: (
        token: string,
        displayName: string,
        profileId: string
    ) => Promise<{
        message: string;
        guardianProfileId: string;
        childProfileId: string;
        managerId: string | null;
    }>;
};

const toErrorMessage = (err: unknown): string =>
    err instanceof Error
        ? err.message
        : 'Something went wrong. The approval link may be invalid or expired.';

const GuardianCredentialApprovalPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();

    const [state, setState] = useState<PageState>('loading');
    const [credentialInfo, setCredentialInfo] = useState<CredentialInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [resultMessage, setResultMessage] = useState<string>('');
    const [otpCode, setOtpCode] = useState<string>('');
    const [upgradeDisplayName, setUpgradeDisplayName] = useState('');
    const [upgradeHandle, setUpgradeHandle] = useState('');
    const [upgradeError, setUpgradeError] = useState('');

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
                    network: true as const,
                    didkit,
                    allowRemoteContexts: true,
                });
                invokeRef.current = wallet.invoke as unknown as LCNOpenInvoke;

                const info = await invokeRef.current.getGuardianPendingCredential(token);
                setCredentialInfo(info);

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
            setState('approved');
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

    const handleUpgrade = async () => {
        if (!token || !invokeRef.current || !upgradeDisplayName.trim() || !upgradeHandle.trim()) return;
        setState('registering');
        setUpgradeError('');
        try {
            await invokeRef.current.registerGuardianAsManager(token, upgradeDisplayName.trim(), upgradeHandle.trim());
            setState('registered');
        } catch (e: unknown) {
            setUpgradeError(toErrorMessage(e));
            setState('upgrade_prompt');
        }
    };

    const isProcessing = state === 'approving' || state === 'rejecting' || state === 'sending_code';

    return (
        <IonPage>
            <IonContent fullscreen color="emerald-700" className="flex flex-col flex-grow bg-emerald-700">
                <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center text-white">
                    <div className="flex flex-col items-center justify-center w-full mb-8">
                        <img
                            src={LearnCardBrandMark}
                            alt="Learn Card brand mark"
                            className="w-[64px] h-[64px] mb-3"
                        />
                        <img src={LearnCardTextLogo} alt="Learn Card text logo" className="h-4" />
                    </div>

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
                                credential to a student in your care.
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

                            {state === 'ready' && (
                                <div className="w-full max-w-sm">
                                    <p className="text-emerald-100 text-sm mb-4">
                                        To approve or reject, we'll send a verification code to your email.
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
                                    <IonItem color="light" className="rounded-xl mb-2">
                                        <IonInput
                                            type="number"
                                            inputmode="numeric"
                                            maxlength={6}
                                            placeholder="000000"
                                            value={otpCode}
                                            onIonInput={e => setOtpCode(String(e.detail.value ?? ''))}
                                        />
                                    </IonItem>
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
                            <p className="text-emerald-100 max-w-[520px] mb-4">
                                {resultMessage || 'The credential has been approved. The recipient can now claim it.'}
                            </p>
                            <div className="w-full max-w-sm mt-2">
                                <p className="text-emerald-100 text-sm mb-4">
                                    Want to manage future approvals without email verification each time?
                                </p>
                                <IonButton
                                    expand="block"
                                    color="light"
                                    onClick={() => setState('upgrade_prompt')}
                                >
                                    Create a LearnCard Account
                                </IonButton>
                            </div>
                        </>
                    )}

                    {state === 'upgrade_prompt' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-6">
                                Set up your account to manage future credential approvals directly in the app.
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                <IonItem color="light" className="rounded-xl">
                                    <IonInput
                                        placeholder="Display Name"
                                        value={upgradeDisplayName}
                                        onIonInput={e => setUpgradeDisplayName(String(e.detail.value ?? ''))}
                                    />
                                </IonItem>
                                <IonItem color="light" className="rounded-xl">
                                    <IonInput
                                        placeholder="Username (e.g. jsmith)"
                                        value={upgradeHandle}
                                        onIonInput={e => setUpgradeHandle(String(e.detail.value ?? ''))}
                                    />
                                </IonItem>
                                {upgradeError && (
                                    <p className="text-red-300 text-sm">{upgradeError}</p>
                                )}
                                <IonButton
                                    expand="block"
                                    color="light"
                                    onClick={handleUpgrade}
                                    disabled={!upgradeDisplayName.trim() || !upgradeHandle.trim()}
                                >
                                    Create Account
                                </IonButton>
                                <button
                                    className="text-emerald-200 text-sm underline mt-2 bg-transparent border-none cursor-pointer"
                                    onClick={() => setState('approved')}
                                >
                                    Skip for now
                                </button>
                            </div>
                        </>
                    )}

                    {state === 'registering' && (
                        <div className="flex flex-col items-center gap-3">
                            <IonSpinner color="light" />
                            <p className="font-semibold text-lg">Creating your account…</p>
                        </div>
                    )}

                    {state === 'registered' && (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
                            <p className="text-emerald-100 max-w-[520px] mb-4">
                                Your account has been set up and linked to this student. Download the LearnCard
                                app to manage their credentials going forward.
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
                                <IonButton
                                    expand="block"
                                    color="light"
                                    href="https://apps.apple.com/app/learncard/id6447611416"
                                    target="_blank"
                                >
                                    Download on the App Store
                                </IonButton>
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    color="light"
                                    href="https://play.google.com/store/apps/details?id=com.learningeconomy.learncard"
                                    target="_blank"
                                >
                                    Get it on Google Play
                                </IonButton>
                            </div>
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
