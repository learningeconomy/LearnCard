import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonSpinner, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';

import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

import { usePathQuery } from 'learn-card-base';
import LearnCardTextLogo from '../../assets/images/learncard-text-logo.svg';
import LearnCardBrandMark from '../../assets/images/lca-brandmark.png';

const ApproveAccount: React.FC = () => {
    const isLocalHost = false;
    //if running dockerized then uncomment the below and replace the explicit false value for isLocalHost
    //  typeof window !== 'undefined' &&
    // ['localhost', '127.0.0.1', '::1'].includes(window?.location?.hostname);

    const getNetworkInitOverrides = () =>
        isLocalHost
            ? {
                  // Point to dockerized local services when running the app on localhost
                  network: 'http://localhost:4000/trpc' as const,
                  cloud: { url: 'http://localhost:4100/trpc', automaticallyAssociateDids: true },
              }
            : {
                  // In non-localhost (e.g., production), use default hosted endpoints
                  network: true as const,
              };

    const toErrorMessage = (err: unknown): string =>
        err instanceof Error
            ? err.message
            : 'We could not approve this account. The approval link may be invalid or expired.';

    const history = useHistory();
    const query = usePathQuery();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const run = async () => {
            const token = query.get('token');
            if (!token) {
                setError('Missing approval token.');
                return;
            }

            setLoading(true);
            setError('');
            setMessage('');
            try {
                // Create a minimal LearnCard Network wallet (no auth required for this route)
                const wallet = await initLearnCard({
                    seed: 'a',
                    ...getNetworkInitOverrides(),
                    didkit,
                    allowRemoteContexts: true,
                });

                type LCNOpenInvoke = {
                    approveGuardianRequest: (token: string) => Promise<{ message: string }>;
                };

                const res = await (
                    wallet.invoke as unknown as LCNOpenInvoke
                ).approveGuardianRequest(token);

                if (res?.message) setMessage(res.message);
                else setMessage('Profile approved successfully.');
            } catch (e: unknown) {
                console.error('approve-account error', e);
                setError(toErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoHome = () => history.replace('/');
    const handleGoLogin = () => history.replace('/login');

    return (
        <IonPage color="emerald-700">
            <IonContent
                fullscreen
                color="emerald-700"
                className="flex flex-col flex-grow bg-emerald-700"
            >
                <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center text-white">
                    <div className="flex flex-col items-center justify-center w-full mb-6">
                        <img
                            src={LearnCardBrandMark}
                            alt="Learn Card brand mark"
                            className="w-[64px] h-[64px] mb-3"
                        />
                        <img src={LearnCardTextLogo} alt="Learn Card text logo" className="h-4" />
                    </div>
                    {loading && (
                        <div className="flex flex-col items-center justify-center gap-3">
                            <IonSpinner color="light" />
                            <p className="font-semibold text-lg text-white">Approving…</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <h1 className="text-xl font-bold text-white mb-2">Account Approved</h1>
                            <p className="text-emerald-50 max-w-[520px] mb-4">
                                {message || 'Profile approved successfully.'}
                            </p>
                            <IonButton color="light" onClick={handleGoLogin}>
                                Open LearnCard Login
                            </IonButton>
                        </>
                    )}

                    {!loading && error && (
                        <>
                            <h1 className="text-xl font-bold text-white mb-2">Unable to Approve</h1>
                            <p className="text-emerald-50 max-w-[520px] mb-4">{error}</p>
                            <IonButton color="light" onClick={handleGoLogin}>
                                Go to Login
                            </IonButton>
                        </>
                    )}

                    {/* {!loading && (
                        <p className="mt-6 text-emerald-50">
                            Or <a href="/login" className="underline text-white">go to login</a>
                        </p>
                    )} */}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ApproveAccount;
