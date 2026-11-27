import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getLogger } from 'learn-card-base';
const log = getLogger('approve-account');

import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

import { usePathQuery } from 'learn-card-base';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { getTenantHeaders } from '../../config/bootstrapTenantConfig';
import { AppButton } from 'learn-card-base/ui/controls/AppButton';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';

const ApproveAccount: React.FC = () => {
    const { textLogo, brandMarkLight } = useTenantBrandingAssets();
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

    const navigate = useNavigate();
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
                    extraHeaders: getTenantHeaders(),
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
                log.error('approve-account error', e);
                setError(toErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoHome = () => navigate('/', { replace: true });
    const handleGoLogin = () => navigate('/login', { replace: true });

    return (
        <AppPage color="emerald-700">
            <AppContent
                fullscreen
                color="emerald-700"
                className="flex flex-col grow bg-emerald-700"
            >
                <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center text-white">
                    <div className="flex flex-col items-center justify-center w-full mb-6">
                        <img
                            src={brandMarkLight}
                            alt="Brand mark"
                            className="w-[64px] h-[64px] mb-3"
                        />
                        <img src={textLogo} alt="Logo" className="h-4" />
                    </div>
                    {loading && (
                        <div className="flex flex-col items-center justify-center gap-3">
                            <AppSpinner color="light" />
                            <p className="font-semibold text-lg text-white">Approving…</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <h1 className="text-xl font-bold text-white mb-2">Account Approved</h1>
                            <p className="text-emerald-50 max-w-[520px] mb-4">
                                {message || 'Profile approved successfully.'}
                            </p>
                            <AppButton color="light" onClick={handleGoLogin}>
                                Open LearnCard Login
                            </AppButton>
                        </>
                    )}

                    {!loading && error && (
                        <>
                            <h1 className="text-xl font-bold text-white mb-2">Unable to Approve</h1>
                            <p className="text-emerald-50 max-w-[520px] mb-4">{error}</p>
                            <AppButton color="light" onClick={handleGoLogin}>
                                Go to Login
                            </AppButton>
                        </>
                    )}

                    {/* {!loading && (
                        <p className="mt-6 text-emerald-50">
                            Or <a href="/login" className="underline text-white">go to login</a>
                        </p>
                    )} */}
                </div>
            </AppContent>
        </AppPage>
    );
};

export default ApproveAccount;
