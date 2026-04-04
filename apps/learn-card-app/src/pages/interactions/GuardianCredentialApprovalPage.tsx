import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonSpinner, IonButton } from '@ionic/react';
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

type PageState = 'loading' | 'ready' | 'approving' | 'rejecting' | 'approved' | 'rejected' | 'error';

const getNetworkInitOverrides = () => ({
    network: true as const,
});

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

    useEffect(() => {
        if (!token) {
            setError('Missing approval token.');
            setState('error');
            return;
        }

        const fetchInfo = async () => {
            try {
                const wallet = await initLearnCard({
                    seed: 'a',
                    ...getNetworkInitOverrides(),
                    didkit,
                    allowRemoteContexts: true,
                });

                type LCNOpenInvoke = {
                    getGuardianPendingCredential: (token: string) => Promise<CredentialInfo>;
                };

                const info = await (wallet.invoke as unknown as LCNOpenInvoke).getGuardianPendingCredential(token);
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

        fetchInfo();
    }, [token]);

    const handleApprove = async () => {
        if (!token) return;
        setState('approving');
        try {
            const wallet = await initLearnCard({
                seed: 'a',
                ...getNetworkInitOverrides(),
                didkit,
                allowRemoteContexts: true,
            });

            type LCNOpenInvoke = {
                approveGuardianCredential: (token: string) => Promise<{ message: string }>;
            };

            const res = await (wallet.invoke as unknown as LCNOpenInvoke).approveGuardianCredential(token);
            setResultMessage(res.message ?? 'Credential approved.');
            setState('approved');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const handleReject = async () => {
        if (!token) return;
        setState('rejecting');
        try {
            const wallet = await initLearnCard({
                seed: 'a',
                ...getNetworkInitOverrides(),
                didkit,
                allowRemoteContexts: true,
            });

            type LCNOpenInvoke = {
                rejectGuardianCredential: (token: string) => Promise<{ message: string }>;
            };

            const res = await (wallet.invoke as unknown as LCNOpenInvoke).rejectGuardianCredential(token);
            setResultMessage(res.message ?? 'Credential rejected.');
            setState('rejected');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const isProcessing = state === 'approving' || state === 'rejecting';

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

                    {state === 'ready' && credentialInfo && (
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

                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                <IonButton
                                    expand="block"
                                    color="light"
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                >
                                    {state === 'approving' ? <IonSpinner name="crescent" /> : 'Approve'}
                                </IonButton>
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    color="light"
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                >
                                    {state === 'rejecting' ? <IonSpinner name="crescent" /> : 'Reject'}
                                </IonButton>
                            </div>
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
